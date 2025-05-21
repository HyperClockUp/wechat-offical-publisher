import * as fs from 'node:fs/promises';
import { constants } from 'node:fs';
import { access } from 'node:fs/promises';
import { join, dirname, isAbsolute } from 'node:path';
import { fileURLToPath } from 'node:url';
import { marked } from 'marked';
// 不再需要额外的 smartypants 和 xhtml 包
import type { Plugin, PluginContext } from '../core/types';
import { PluginError } from '../core/errors';
import { logger } from '../core/logger';

// 配置 marked 选项
// 配置 marked 选项
marked.use({
  mangle: false,       // 禁用 mangle 以避免弃用警告
  headerIds: false,    // 禁用 headerIds 以避免弃用警告
  gfm: true,           // 启用 GitHub Flavored Markdown
  breaks: true,        // 将 \n 转换为 <br>
  // 注意：smartLists 选项在 marked 5.x 中已移除
  // 如果需要类似功能，可以考虑使用 https://www.npmjs.com/package/marked-gfm-list 或自定义渲染器
  // smartLists: true, // 已移除
  
  // 使用内置的 smartypants 和 xhtml 选项
  smartypants: true,   // 使用更智能的标点符号（不推荐但可用）
  xhtml: true         // 生成自闭合标签（不推荐但可用）
} as any); // 使用类型断言避免类型错误

// 添加自定义渲染器
const renderer = new marked.Renderer();

// 自定义标题渲染
renderer.heading = (text, level) => {
  const fontSize = {
    1: '22px',
    2: '20px',
    3: '18px',
    4: '16px',
    5: '14px',
    6: '12px'
  }[level] || '16px';

  return `<h${level} style="font-size: ${fontSize}; font-weight: bold; margin: 20px 0 10px 0; line-height: 1.4;">${text}</h${level}>`;
};

// 自定义段落渲染
renderer.paragraph = (text) => {
  return `<p style="margin: 15px 0; line-height: 1.8; font-size: 16px; color: #333;">${text}</p>`;
};

// 自定义链接渲染
renderer.link = (href, title, text) => {
  return `<a href="${href}" target="_blank" rel="noopener" style="color: #576b95; text-decoration: none;">${text}</a>`;
};

// 自定义图片渲染
renderer.image = (href, title, text) => {
  return `<img src="${href}" alt="${text || ''}" style="max-width: 100%; border-radius: 4px; margin: 10px 0; display: block;" />`;
};



interface MarkdownReaderPluginOptions {
  /**
   * CSS 文件路径或 CSS 内容
   * 可以是绝对路径、相对于当前工作目录的路径，或直接的 CSS 内容
   */
  cssTheme?: string;
  /**
   * 是否内联 CSS 样式
   * 默认: true
   */
  inlineCss?: boolean;
}

/**
 * Markdown 文件读取插件
 */
export class MarkdownReaderPlugin implements Plugin {
  name = 'MarkdownReaderPlugin';
  description = 'Markdown 文件读取和解析插件';
  filename = __filename;
  private publisher: any; // 这里应该是 Publisher 类型，需要根据实际类型导入
  private options: MarkdownReaderPluginOptions;

  constructor(publisher: any, options: MarkdownReaderPluginOptions = {}) {
    this.publisher = publisher;
    this.options = {
      inlineCss: true,
      ...options
    };
  }

  async execute(ctx: PluginContext): Promise<PluginContext> {
    try {
      // 检查文件是否存在
      try {
        await access(ctx.input);
      } catch (error) {
        throw new Error(`文件不存在: ${ctx.input}`);
      }

      // 读取文件内容
      const content = await fs.readFile(ctx.input, 'utf-8');
      
      if (!content.trim()) {
        throw new Error('文件内容为空');
      }

      const lines = content.split('\n');
      
      // 提取标题（如果第一行以#开头，则认为是标题）
      let title = '';
      let markdownContent = content;
      
      if (lines[0].startsWith('# ')) {
        title = lines[0].substring(2).trim();
        markdownContent = lines.slice(1).join('\n');
      } else {
        // 如果没有找到标题，使用文件名作为标题
        title = ctx.input.split(/[\\/]/).pop()?.replace(/\.\w+$/, '') || '未命名文章';
      }
      
      logger.info('正在处理Markdown文件', { 
        file: ctx.input,
        title,
        contentLength: markdownContent.length 
      });
      
      // 预处理 Markdown 内容
      let processedContent = markdownContent
        // 处理所有连续的空行，替换为单个换行符
        .replace(/\n{2,}/g, '\n\n')
        // 处理代码块
        .replace(/```(\w*)\n([\s\S]*?)\n```/g, (_match: string, lang: string, code: string) => {
          return `<pre style="background: #f6f8fa; padding: 15px; border-radius: 4px; overflow-x: auto; font-size: 14px; line-height: 1.5; margin: 15px 0;"><code>${code.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</code></pre>`;
        });

      // 转换为HTML
      let htmlContent = '';
      try {
        htmlContent = marked.parse(processedContent);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        throw new Error(`解析Markdown失败: ${errorMessage}`);
      }

      // 应用 CSS 主题
      if (this.options.cssTheme) {
        try {
          const cssContent = await this.loadCssContent(this.options.cssTheme);
          if (cssContent) {
            if (this.options.inlineCss) {
              // 内联样式
              const styleTag = `<style>\n${cssContent}\n</style>`;
              const styleRegex = /<style\s*[^>]*>([\s\S]*?)<\/style>/i;
              htmlContent = htmlContent.match(styleRegex)
                ? htmlContent.replace(styleRegex, `${styleTag}$&`)
                : `${styleTag}\n${htmlContent}`;
            } else {
              // 外链样式
              htmlContent = `
                <link rel="stylesheet" href="${this.options.cssTheme}">\n${htmlContent}`;
            }
          }
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : String(error);
          logger.warn(`加载CSS主题失败: ${errorMessage}`);
        }
      }

      // 添加微信文章容器样式
      htmlContent = `
      <div style="max-width: 100%; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; color: #333; line-height: 1.8; padding: 0 15px; box-sizing: border-box;">
        <h1 style="font-size: 22px; font-weight: bold; text-align: center; margin: 20px 0 15px 0; line-height: 1.4;">${title}</h1>
        ${htmlContent}
      </div>
      `;
      
      if (!htmlContent) {
        throw new Error('生成的HTML内容为空');
      }
      
      // 保存到上下文，保留已有的 article 属性
      ctx.article = {
        ...(ctx.article || {}),
        title: title || ctx.article?.title || '',
        content: htmlContent,
        showCoverPic: ctx.article?.showCoverPic ?? true,
        needOpenComment: ctx.article?.needOpenComment ?? true,
        mediaId: ctx.article?.mediaId || '',
        thumbMediaId: ctx.article?.thumbMediaId || '',
        msg: ctx.article?.msg || ''
      };
      
      logger.debug('Markdown处理完成', { 
        title,
        contentPreview: htmlContent.substring(0, 100) + '...' 
      });
      
      return ctx;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      const errorDetails = error instanceof Error ? {
        name: error.name,
        message: error.message,
        stack: error.stack
      } : {};
      
      logger.error(`处理Markdown文件失败: ${errorMessage} [${ctx.input}]`);
      
      throw new PluginError(
        `处理Markdown文件失败: ${errorMessage}`,
        errorDetails
      );
    }
  }

  /**
   * 加载 CSS 内容
   * @param cssSource CSS 文件路径或 CSS 内容
   * @returns 返回 CSS 内容
   */
  private async loadCssContent(cssSource: string): Promise<string | null> {
    try {
      // 检查是否是有效的文件路径
      const isFilePath = await this.isValidFilePath(cssSource);
      
      if (isFilePath) {
        // 读取文件内容
        return await fs.readFile(cssSource, 'utf-8');
      }
      
      // 如果不是文件路径，则假定它是 CSS 内容
      return cssSource.trim();
    } catch (error) {
      throw new Error(`加载CSS失败: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * 检查是否是有效的文件路径
   * @param path 路径
   * @returns 如果是有效路径返回 true
   */
  private async isValidFilePath(path: string): Promise<boolean> {
    try {
      // 检查路径是否可读
      await access(path, constants.R_OK);
      return true;
    } catch (error) {
      return false;
    }
  }
}
