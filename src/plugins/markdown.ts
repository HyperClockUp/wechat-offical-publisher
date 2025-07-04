import * as fs from 'node:fs/promises';
import { marked } from 'marked';
import { Plugin, PluginContext } from '../types';
import { FileError } from '../utils/errors';
import { logger } from '../utils/logger';

// 配置 marked 选项
marked.setOptions({
  gfm: true,
  breaks: true
});

// 自定义渲染器
const renderer = new marked.Renderer();

// 标题样式
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

// 段落样式
renderer.paragraph = (text) => {
  return `<p style="margin: 15px 0; line-height: 1.8; font-size: 16px; color: #333;">${text}</p>`;
};

// 链接样式
renderer.link = (href, title, text) => {
  return `<a href="${href}" target="_blank" rel="noopener" style="color: #576b95; text-decoration: none;">${text}</a>`;
};

// 图片样式
renderer.image = (href, title, text) => {
  return `<img src="${href}" alt="${text || ''}" style="max-width: 100%; border-radius: 4px; margin: 10px 0; display: block;" />`;
};

// 代码块样式
renderer.code = (code, language) => {
  return `<pre style="background: #f6f8fa; padding: 16px; border-radius: 6px; overflow-x: auto; margin: 16px 0;"><code style="font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace; font-size: 14px; color: #24292e;">${code}</code></pre>`;
};

// 行内代码样式
renderer.codespan = (code) => {
  return `<code style="background: #f6f8fa; padding: 2px 4px; border-radius: 3px; font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace; font-size: 14px; color: #e36209;">${code}</code>`;
};

// 引用样式
renderer.blockquote = (quote) => {
  return `<blockquote style="border-left: 4px solid #dfe2e5; padding: 0 16px; margin: 16px 0; color: #6a737d;">${quote}</blockquote>`;
};

// 列表样式
renderer.list = (body, ordered) => {
  const tag = ordered ? 'ol' : 'ul';
  return `<${tag} style="margin: 16px 0; padding-left: 32px;">${body}</${tag}>`;
};

renderer.listitem = (text) => {
  return `<li style="margin: 8px 0; line-height: 1.6;">${text}</li>`;
};

// 表格样式
renderer.table = (header, body) => {
  return `<table style="border-collapse: collapse; width: 100%; margin: 16px 0;"><thead>${header}</thead><tbody>${body}</tbody></table>`;
};

renderer.tablerow = (content) => {
  return `<tr>${content}</tr>`;
};

renderer.tablecell = (content, flags) => {
  const tag = flags.header ? 'th' : 'td';
  const style = flags.header 
    ? 'border: 1px solid #dfe2e5; padding: 12px; background: #f6f8fa; font-weight: bold; text-align: left;'
    : 'border: 1px solid #dfe2e5; padding: 12px; text-align: left;';
  return `<${tag} style="${style}">${content}</${tag}>`;
};

marked.setOptions({ renderer });

/**
 * Markdown 处理插件
 */
export const markdownPlugin: Plugin = async (content: string, context: PluginContext): Promise<string> => {
  try {
    // 使用传入的content参数，而不是重新读取文件
    // 这样可以保留之前插件（如imagePlugin）的处理结果
    if (!content.trim()) {
      throw new FileError('内容为空');
    }

    if (context.config.debug) {
      console.log('处理 Markdown 内容:', {
        file: context.filePath,
        contentLength: content.length
      });
    }

    // 预处理内容
    let processedContent = content
      .replace(/\r\n/g, '\n')  // 统一换行符
      .trim();

    // 处理列表格式
    const lines = processedContent.split('\n');
    const processedLines: string[] = [];
    let inList = false;
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trimEnd();
      const isListItem = /^[\s]*[-*+]\s+/.test(line);
      const isEmpty = line.trim() === '';
      
      if (isListItem) {
        if (!inList) {
          inList = true;
          processedLines.push(''); // 列表前添加空行
        }
        processedLines.push(line);
      } else if (isEmpty) {
        if (inList) {
          // 检查下一行是否还是列表项
          if (i < lines.length - 1 && /^[\s]*[-*+]\s+/.test(lines[i + 1])) {
            processedLines.push('');
          } else {
            inList = false;
            processedLines.push('');
          }
        } else if (processedLines.length > 0 && processedLines[processedLines.length - 1] !== '') {
          processedLines.push('');
        }
      } else {
        if (inList) {
          inList = false;
          processedLines.push('');
        }
        processedLines.push(line);
      }
    }
    
    processedContent = processedLines.join('\n');

    // 转换为 HTML
    const htmlContent = marked(processedContent);
    
    // 添加基础样式
    const styledContent = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 100%;">
        ${htmlContent}
      </div>
    `;

    if (context.config.debug) {
       console.log('Markdown 转换完成:', {
         originalLength: content.length,
         htmlLength: styledContent.length
       });
     }

    return styledContent;
  } catch (error) {
    throw new FileError(`处理 Markdown 文件失败: ${error instanceof Error ? error.message : String(error)}`, error as Error);
  }
};