import * as fs from 'node:fs/promises';
import { marked } from 'marked';
import { Plugin, PluginContext } from '../types';
import { FileError } from '../utils/errors';
import { logger } from '../utils/logger';
import { themeManager, createThemeRenderer } from '../themes';

// 注意：原有的静态渲染器配置已移至主题系统中
// 现在使用动态主题渲染器来处理Markdown转换

/**
 * Markdown 处理插件 - 支持主题系统
 */
export const markdownPlugin: Plugin = async (content: string, context: PluginContext): Promise<string> => {
  try {
    // 使用传入的content参数，而不是重新读取文件
    // 这样可以保留之前插件（如imagePlugin）的处理结果
    if (!content.trim()) {
      throw new FileError('内容为空');
    }

    // 获取主题配置
    const themeName = context.config.theme || 'default';
    const theme = themeManager.getTheme(themeName);
    
    if (!theme) {
      logger.warn(`主题 "${themeName}" 不存在，使用默认主题`);
      const defaultTheme = themeManager.getDefaultTheme();
      const renderer = createThemeRenderer(defaultTheme);
      return renderer.render(content);
    }

    if (context.config.debug) {
      console.log('处理 Markdown 内容:', {
        file: context.filePath,
        contentLength: content.length,
        theme: theme.name,
        themeDescription: theme.description
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

    // 使用主题渲染器转换为 HTML
    const renderer = createThemeRenderer(theme);
    const styledContent = renderer.render(processedContent);

    if (context.config.debug) {
       console.log('Markdown 转换完成:', {
         originalLength: content.length,
         htmlLength: styledContent.length,
         theme: theme.name
       });
     }

    return styledContent;
  } catch (error) {
    throw new FileError(`处理 Markdown 文件失败: ${error instanceof Error ? error.message : String(error)}`, error as Error);
  }
};