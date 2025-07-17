#!/usr/bin/env node

import * as fs from 'node:fs';
import * as path from 'node:path';
import { Config, PublishOptions, PublishResult, PluginContext, Article, Plugin } from './types';
import { loadConfig } from './config';
import { WeChatApi } from './utils/wechat-api';
import { Logger, logger } from './utils/logger';
import { PublisherError, ConfigError, FileError } from './utils/errors';
import { defaultPlugins, uploadCoverImage } from './plugins';
import { themeManager } from './themes';

/**
 * 微信文章发布器 - 简化版
 */
export class WeChatPublisher {
  private config: Config;
  private api: WeChatApi;
  private logger: Logger;

  constructor(userConfig: Partial<Config> = {}) {
    try {
      this.config = loadConfig(userConfig);
      this.api = new WeChatApi(this.config);
      this.logger = new Logger(this.config.debug);
      
      this.logger.info('微信发布器初始化成功', {
        appId: this.config.appId.substring(0, 8) + '...',
        debug: this.config.debug,
        publishToDraft: this.config.publishToDraft,
        theme: this.config.theme || 'default'
      });
    } catch (error) {
      throw new ConfigError('初始化失败', error as Error);
    }
  }

  /**
   * 发布文章
   */
  async publish(filePath: string, options: PublishOptions = {}): Promise<PublishResult> {
    try {
      this.logger.info(`开始发布文章: ${filePath}`);
      
      // 验证文件
      if (!fs.existsSync(filePath)) {
        throw new FileError(`文件不存在: ${filePath}`);
      }

      // 创建插件上下文
      const context: PluginContext = {
        filePath,
        config: this.config,
        accessToken: await this.api.getAccessToken()
      };

      // 读取文件内容
      let content = fs.readFileSync(filePath, 'utf-8');
      
      // 应用插件处理内容
      for (const plugin of defaultPlugins) {
        content = await plugin(content, context);
      }
    
    if (this.config.debug) {
      console.log('插件处理后的最终内容:');
      console.log('内容长度:', content.length);
      console.log('内容预览:', content.substring(0, 500));
    }

      // 提取标题
      const title = this.extractTitle(content, filePath, options.title);
      
      // 处理封面图片
      let thumbMediaId = '';
      if (options.coverImage) {
        thumbMediaId = await uploadCoverImage(options.coverImage, context);
      } else {
        // 自动查找封面图片
        const autoCover = this.findCoverImage(filePath);
        if (autoCover) {
          thumbMediaId = await uploadCoverImage(autoCover, context);
        } else {
          // 如果没有找到封面图片，使用默认封面
          // 微信草稿接口要求必须有 thumb_media_id
          const defaultCoverPath = path.join(__dirname, '..', 'assets', 'default-cover.svg');
          if (fs.existsSync(defaultCoverPath)) {
            thumbMediaId = await uploadCoverImage(defaultCoverPath, context);
            this.logger.info('使用默认封面图片');
          }
        }
      }

      // 构建文章数据
      const article: Article = {
        title,
        content,
        author: options.author || '',
        digest: options.digest || '',
        thumbMediaId,
        showCoverPic: !!thumbMediaId
      };

      // 发布到微信
      const result = await this.publishToWeChat(article, options.draft);
      
      this.logger.success('文章发布成功', {
        title: result.title,
        mediaId: result.mediaId
      });

      return result;
    } catch (error) {
      const errorMsg = `发布失败: ${error instanceof Error ? error.message : String(error)}`;
      this.logger.error(errorMsg, error as Error);
      throw new PublisherError(errorMsg, error as Error);
    }
  }

  /**
   * 处理内容（用于兼容性检查）
   */
  async processContent(content: string): Promise<string> {
    try {
      // 使用主题渲染器处理内容
      const themeName = this.config.theme || 'default';
      const theme = themeManager.getTheme(themeName);
      if (!theme) {
        this.logger.warn(`主题 '${themeName}' 不存在，使用默认主题`);
      }
      
      const { ThemeRenderer } = await import('./themes/renderer');
      const renderer = new ThemeRenderer(theme || themeManager.getTheme('default')!);
      return renderer.render(content);
    } catch (error) {
      const errorMsg = `内容处理失败: ${error instanceof Error ? error.message : String(error)}`;
      this.logger.error(errorMsg, error as Error);
      throw new PublisherError(errorMsg, error as Error);
    }
  }

  /**
   * 预览文章
   */
  async preview(filePath: string): Promise<string> {
    try {
      this.logger.info(`生成预览: ${filePath}`);
      
      if (!fs.existsSync(filePath)) {
        throw new FileError(`文件不存在: ${filePath}`);
      }

      // 创建插件上下文（预览模式不需要访问令牌）
      const context: PluginContext = {
        filePath,
        config: this.config,
        accessToken: ''
      };

      // 读取并处理内容
      let content = fs.readFileSync(filePath, 'utf-8');
      
      // 应用插件处理内容（包括微信兼容性插件）
      for (const plugin of defaultPlugins) {
        content = await plugin(content, context);
      }
      
      if (this.config.debug) {
        console.log('预览模式 - 插件处理后的内容:');
        console.log('内容长度:', content.length);
        console.log('内容预览:', content.substring(0, 500));
      }
      
      // 使用主题渲染器进行预览
      const themeName = this.config.theme || 'default';
      const theme = themeManager.getTheme(themeName);
      if (!theme) {
        this.logger.warn(`主题 '${themeName}' 不存在，使用默认主题`);
      }
      
      const { ThemeRenderer } = await import('./themes/renderer');
      const renderer = new ThemeRenderer(theme || themeManager.getTheme('default')!);
      content = renderer.render(content);

      // 生成完整的 HTML 页面
      const title = this.extractTitle(content, filePath);
      const htmlPage = this.generatePreviewHtml(title, content);
      
      // 保存预览文件
      const previewDir = path.join(process.cwd(), 'preview');
      if (!fs.existsSync(previewDir)) {
        fs.mkdirSync(previewDir, { recursive: true });
      }
      
      const previewFile = path.join(previewDir, `${Date.now()}.html`);
      fs.writeFileSync(previewFile, htmlPage, 'utf-8');
      
      this.logger.success(`预览文件已生成: ${previewFile}`);
      return previewFile;
    } catch (error) {
      const errorMsg = `预览生成失败: ${error instanceof Error ? error.message : String(error)}`;
      this.logger.error(errorMsg, error as Error);
      throw new PublisherError(errorMsg, error as Error);
    }
  }

  /**
   * 提取文章标题
   */
  private extractTitle(content: string, filePath: string, customTitle?: string): string {
    if (customTitle) {
      return customTitle;
    }
    
    // 从内容中提取第一个 h1 标题
    const h1Match = content.match(/<h1[^>]*>([^<]+)<\/h1>/);
    if (h1Match) {
      return h1Match[1].trim();
    }
    
    // 从 Markdown 中提取
    const mdMatch = content.match(/^#\s+(.+)$/m);
    if (mdMatch) {
      return mdMatch[1].trim();
    }
    
    // 使用文件名
    return path.basename(filePath, path.extname(filePath));
  }

  /**
   * 查找封面图片
   */
  private findCoverImage(filePath: string): string | null {
    const dir = path.dirname(filePath);
    const coverFiles = ['cover.jpg', 'cover.png', 'cover.jpeg'];
    
    for (const coverFile of coverFiles) {
      const coverPath = path.join(dir, coverFile);
      if (fs.existsSync(coverPath)) {
        return coverPath;
      }
    }
    
    return null;
  }

  /**
   * 发布到微信
   */
  private async publishToWeChat(article: Article, isDraft: boolean = true): Promise<PublishResult> {
    try {
      // 构建草稿数据
      const draftData: any = {
        title: article.title,
        author: article.author,
        digest: article.digest,
        content: article.content,
        need_open_comment: 1,
        only_fans_can_comment: 0
      };
      
      // 根据微信API文档，thumb_media_id是必须字段
      if (article.thumbMediaId) {
        draftData.thumb_media_id = article.thumbMediaId;
        draftData.show_cover_pic = article.showCoverPic ? 1 : 0;
      } else {
        // 如果没有封面图片，这种情况不应该发生，因为我们已经添加了默认封面逻辑
        throw new PublisherError('缺少封面图片，无法创建草稿');
      }
      
      if (this.config.debug) {
        console.log('发送给微信API的数据:');
        console.log('标题:', draftData.title);
        console.log('内容长度:', draftData.content.length);
        console.log('thumb_media_id:', draftData.thumb_media_id || '无');
        console.log('内容前300字符:', draftData.content.substring(0, 300));
      }
      
      // 添加草稿
      const draftResult = await this.api.addDraft([draftData]);

      const result: PublishResult = {
        success: true,
        mediaId: draftResult.mediaId,
        title: article.title,
        content: article.content,
        message: isDraft ? '文章已保存到草稿箱' : '文章发布成功'
      };

      // 如果不是草稿模式，直接发布
      if (!isDraft) {
        const publishResult = await this.api.publishArticle(draftResult.mediaId);
        result.message = '文章发布成功';
      }

      return result;
    } catch (error) {
      throw new PublisherError(`发布到微信失败: ${error instanceof Error ? error.message : String(error)}`, error as Error);
    }
  }

  /**
   * 生成预览 HTML
   */
  private generatePreviewHtml(title: string, content: string): string {
    return `
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title} - 预览</title>
    <style>
        body {
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Helvetica Neue', Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            background: #fff;
        }
        .header {
            text-align: center;
            padding: 20px 0;
            border-bottom: 1px solid #eee;
            margin-bottom: 30px;
        }
        .title {
            font-size: 28px;
            font-weight: bold;
            margin: 0;
            color: #2c3e50;
        }
        .content {
            max-width: 100%;
        }
        .footer {
            margin-top: 50px;
            padding-top: 20px;
            border-top: 1px solid #eee;
            text-align: center;
            color: #666;
            font-size: 14px;
        }
    </style>
</head>
<body>
    <div class="header">
        <h1 class="title">${title}</h1>
        <p style="color: #666; margin: 10px 0 0 0;">文章预览</p>
    </div>
    
    <div class="content">
        ${content}
    </div>
    
    <div class="footer">
        <p>本页面由微信文章发布工具生成</p>
        <p>生成时间: ${new Date().toLocaleString('zh-CN')}</p>
    </div>
</body>
</html>
    `.trim();
  }
}

// 导出默认实例创建函数
export function createPublisher(config?: Partial<Config>): WeChatPublisher {
  return new WeChatPublisher(config);
}

// 导出类型
export type { Config, PublishOptions, PublishResult } from './types';

// 如果直接运行此文件，启动 CLI
if (require.main === module) {
  // 动态导入 CLI 模块
  (async () => {
    try {
      const { runCli } = await import('./cli');
      await runCli();
    } catch (error) {
      console.error('CLI 运行失败:', error);
      process.exit(1);
    }
  })();
}
