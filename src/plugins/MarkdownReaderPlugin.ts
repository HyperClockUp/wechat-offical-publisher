import * as fs from 'node:fs/promises';
import { access } from 'node:fs/promises';
import { marked } from 'marked';

// 配置 marked 选项
marked.setOptions({
  mangle: false,       // 禁用 mangle 以避免弃用警告
  headerIds: false     // 禁用 headerIds 以避免弃用警告
});
import { Plugin, PluginContext } from '../core/types.js';
import { PluginError } from '../core/errors.js';
import { logger } from '../core/logger.js';

/**
 * Markdown 文件读取插件
 */
export class MarkdownReaderPlugin implements Plugin {
  name = 'MarkdownReaderPlugin';

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
      
      // 转换为HTML
      let htmlContent = '';
      try {
        htmlContent = marked.parse(markdownContent);
      } catch (parseError) {
        const errorMessage = parseError instanceof Error ? parseError.message : String(parseError);
        logger.error('Markdown解析失败: ' + errorMessage);
        throw new Error('Markdown格式错误，请检查文件内容: ' + errorMessage);
      }
      
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
}
