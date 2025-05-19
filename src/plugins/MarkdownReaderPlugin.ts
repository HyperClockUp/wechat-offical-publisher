import { readFile } from 'node:fs/promises';
import { marked } from 'marked';
import { Plugin, PluginContext } from '../core/types';

/**
 * Markdown 文件读取插件
 */
export class MarkdownReaderPlugin implements Plugin {
  name = 'MarkdownReaderPlugin';

  async execute(ctx: PluginContext): Promise<PluginContext> {
    // 如果不是 Markdown 文件，直接返回
    if (!ctx.input.endsWith('.md') && !ctx.input.endsWith('.markdown')) {
      return ctx;
    }

    try {
      // 读取文件内容
      const content = await readFile(ctx.input, 'utf-8');
      
      // 提取标题（第一行作为标题）
      const lines = content.split('\n');
      let title = '无标题';
      let markdownContent = content;
      
      if (lines.length > 0) {
        // 移除可能的 # 号
        title = lines[0].replace(/^#\s*/, '').trim();
        // 如果第一行是标题，则从内容中移除
        if (title !== lines[0]) {
          markdownContent = lines.slice(1).join('\n');
        }
      }
      
      // 转换 Markdown 为 HTML
      const htmlContent = marked(markdownContent);
      
      // 更新上下文
      ctx.article = {
        title,
        content: htmlContent,
        showCoverPic: true,
        needOpenComment: true
      };
      
      return ctx;
    } catch (error) {
      console.error(`[${this.name}] 读取 Markdown 文件失败:`, error);
      throw error;
    }
  }
}
