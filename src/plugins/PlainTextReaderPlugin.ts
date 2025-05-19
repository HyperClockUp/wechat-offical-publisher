import { readFile } from 'node:fs/promises';
import { Plugin, PluginContext } from '../core/types';

/**
 * 纯文本文件读取插件
 */
export class PlainTextReaderPlugin implements Plugin {
  name = 'PlainTextReaderPlugin';

  async execute(ctx: PluginContext): Promise<PluginContext> {
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

    try {
      // 读取文件内容
      const content = await readFile(ctx.input, 'utf-8');
      
      // 提取标题（第一行作为标题）
      const lines = content.split('\n');
      let title = '无标题';
      let textContent = content;
      
      if (lines.length > 0) {
        title = lines[0].trim();
        // 如果第一行是标题，则从内容中移除
        if (title === lines[0]) {
          textContent = lines.slice(1).join('\n');
        }
      }
      
      // 将纯文本转换为HTML
      const htmlContent = textContent
        .split('\n')
        .map(paragraph => `<p>${paragraph}</p>`)
        .join('\n');
      
      // 更新上下文
      ctx.article = {
        title,
        content: htmlContent,
        showCoverPic: true,
        needOpenComment: true,
      };
      
      return ctx;
    } catch (error) {
      console.error(`[${this.name}] 读取文本文件失败:`, error);
      throw error;
    }
  }
}
