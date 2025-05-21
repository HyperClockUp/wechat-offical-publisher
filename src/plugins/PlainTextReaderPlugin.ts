import { readFile } from 'node:fs/promises';
import { Plugin, PluginContext } from '../core/types';
import { PluginError } from '../core/errors';

/**
 * 纯文本文件读取插件
 */
export class PlainTextReaderPlugin implements Plugin {
  name = 'PlainTextReaderPlugin';

  async execute(ctx: PluginContext): Promise<PluginContext> {
    // 如果已经有文章内容或不是文本文件，直接返回
    try {
      // 如果已经有文章内容或不是文本文件，直接返回
      if (ctx.article) {
        return ctx;
      }

      // 支持的文本文件扩展名
      const textExtensions = ['.txt', '.text', '.md', '.markdown'];
      const isTextFile = textExtensions.some(ext => ctx.input.endsWith(ext));
      
      if (!isTextFile) {
        return ctx;
      }

      // 读取文件内容
      const content = await readFile(ctx.input, 'utf-8');
      
      // 提取标题（第一行作为标题）
      const lines = content.split('\n');
      
      // 提取标题
      const title = lines[0].trim();
      
      // 移除标题行，将剩余内容转换为段落
      const textContent = lines.slice(1).join('\n');
      
      // 将纯文本转换为HTML
      const htmlContent = `<p>${textContent}</p>`;
      
      // 更新上下文
      ctx.article = {
        title,
        content: htmlContent,
        showCoverPic: true,
        needOpenComment: true,
        mediaId: '',
        thumbMediaId: '',
        msg: ''
      };
      
      return ctx;
    } catch (error) {
      throw new PluginError('处理纯文本文件失败', {
        message: error instanceof Error ? error.message : String(error)
      });
    }
  }
}
