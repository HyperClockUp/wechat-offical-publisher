import { Plugin, PluginContext } from '../types';

/**
 * 微信公众号兼容性插件
 * 自动过滤和转换不兼容的CSS属性
 */
export const wechatCompatibilityPlugin: Plugin = async (content: string, context: PluginContext): Promise<string> => {
  try {
    if (context.config.debug) {
      console.log('微信兼容性插件开始处理，内容长度:', content.length);
    }
    
    // 1. 移除不兼容的CSS属性
    let processedContent = removeIncompatibleCSS(content);
    
    // 2. 转换复杂布局为简单布局
    processedContent = convertComplexLayouts(processedContent);
    
    // 3. 优化移动端显示
    processedContent = optimizeForMobile(processedContent);
    
    if (context.config.debug) {
      console.log('微信兼容性插件处理完成，内容长度:', processedContent.length);
    }
    
    return processedContent;
  } catch (error) {
    console.error('微信兼容性插件处理失败:', error);
    return content; // 出错时返回原内容
  }
};

/**
 * 移除微信不支持的HTML标签和CSS属性
 * 基于微信公众号白名单机制的严格过滤
 */
function removeIncompatibleCSS(html: string): string {
  let processedHtml = html;
  
  // 1. 移除被禁止的HTML标签
  const forbiddenTags = ['script', 'style', 'iframe', 'form', 'input', 'button', 'select', 'textarea', 'object', 'embed', 'applet', 'link', 'meta'];
  forbiddenTags.forEach(tag => {
    // 移除开始和结束标签及其内容（包括换行符）
    const regex = new RegExp(`<${tag}[^>]*>[\s\S]*?<\/${tag}>`, 'gim');
    processedHtml = processedHtml.replace(regex, '');
    // 移除自闭合标签
    const selfClosingRegex = new RegExp(`<${tag}[^>]*\s*\/>`, 'gim');
    processedHtml = processedHtml.replace(selfClosingRegex, '');
    // 移除没有结束标签的开始标签（如某些input标签）
    const openTagRegex = new RegExp(`<${tag}[^>]*>(?![\s\S]*<\/${tag}>)`, 'gim');
    processedHtml = processedHtml.replace(openTagRegex, '');
  });
  
  // 清理连续的空行
  processedHtml = processedHtml.replace(/\n\s*\n\s*\n/g, '\n\n');
  
  // 2. 移除被禁止的HTML属性
  const forbiddenAttrs = ['id', 'onclick', 'onmouseover', 'onmouseout', 'onload', 'onerror', 'onfocus', 'onblur', 'onchange', 'onsubmit'];
  forbiddenAttrs.forEach(attr => {
    const regex = new RegExp(`\\s${attr}\\s*=\\s*["'][^"']*["']`, 'gi');
    processedHtml = processedHtml.replace(regex, '');
  });
  
  // 3. 移除不兼容的CSS属性
  return processedHtml
    // 移除所有position属性（微信会完全删除）
    .replace(/position\s*:\s*[^;]+;?/gi, '')
    // 移除transform属性（虽然部分支持，但为了兼容性建议移除复杂变换）
    .replace(/transform\s*:\s*(?!rotate\(\d+deg\))[^;]+;?/gi, '')
    // 移除float属性（在某些布局中会导致问题）
    .replace(/float\s*:\s*[^;]+;?/gi, '')
    // 移除z-index（没有position时无意义）
    .replace(/z-index\s*:\s*[^;]+;?/gi, '')
    // 移除百分比单位的margin/padding（在微信中可能失效）
    .replace(/(margin|padding)(-[a-z]+)?\s*:\s*[^;]*%[^;]*;?/gi, '')
    // 移除CSS动画相关属性
    .replace(/@keyframes[^}]+}/gi, '')
    .replace(/animation\s*:\s*[^;]+;?/gi, '')
    .replace(/transition\s*:\s*[^;]+;?/gi, '')
    // 移除媒体查询（微信不支持）
    .replace(/@media[^{]+\{[^}]*\}/gi, '')
    // 移除伪类选择器（无法在内联样式中使用）
    .replace(/:[a-z-]+\s*\{[^}]*\}/gi, '')
    // 移除不安全的属性
    .replace(/javascript\s*:/gi, '')
    .replace(/expression\s*\(/gi, '')
    // 移除外部引用
    .replace(/@import[^;]+;/gi, '')
    .replace(/url\s*\([^)]*\)/gi, '')
    // 清理多余的分号和空格
    .replace(/;\s*;/g, ';')
    .replace(/style\s*=\s*["']\s*;?\s*["']/gi, '')
    // 移除空的style属性
    .replace(/\s+style\s*=\s*["']\s*["']/gi, '');
}

/**
 * 转换复杂布局为微信兼容的简单布局
 * 基于微信公众号布局限制的最佳实践
 */
function convertComplexLayouts(html: string): string {
  // 转换所有定位布局为Flexbox（微信完全禁止position）
  html = html.replace(
    /<div[^>]*style\s*=\s*["']([^"']*position\s*:\s*[^;]+[^"']*)["'][^>]*>/gi,
    (match, style) => {
      // 提取非定位相关的样式
      const cleanStyle = style
        .replace(/position\s*:\s*[^;]+;?/gi, '')
        .replace(/top\s*:\s*[^;]+;?/gi, '')
        .replace(/left\s*:\s*[^;]+;?/gi, '')
        .replace(/right\s*:\s*[^;]+;?/gi, '')
        .replace(/bottom\s*:\s*[^;]+;?/gi, '')
        .replace(/transform\s*:\s*[^;]+;?/gi, '');
      
      // 根据原始定位意图选择合适的Flexbox布局
      let flexStyle = 'display: block;';
      if (style.includes('text-align: center') || style.includes('left: 50%')) {
        flexStyle = 'display: flex; justify-content: center;';
      }
      
      return `<div style="${cleanStyle} ${flexStyle}">`;
    }
  );
  
  // 转换浮动布局为Flexbox或inline-block
  html = html.replace(
    /<div[^>]*style\s*=\s*["']([^"']*float\s*:\s*[^;]+[^"']*)["'][^>]*>/gi,
    (match, style) => {
      const cleanStyle = style.replace(/float\s*:\s*[^;]+;?/gi, '');
      const isFloatLeft = style.includes('float: left');
      const isFloatRight = style.includes('float: right');
      
      let newStyle = cleanStyle;
      if (isFloatLeft || isFloatRight) {
        newStyle += ' display: inline-block; vertical-align: top;';
        if (isFloatRight) {
          newStyle += ' float: right;'; // 保留简单的右浮动
        }
      }
      
      return `<div style="${newStyle}">`;
    }
  );
  
  // 转换复杂的Grid布局为简单的Flexbox
  html = html.replace(
    /display\s*:\s*grid[^;]*;?/gi,
    'display: flex; flex-wrap: wrap;'
  );
  
  // 转换CSS变量为具体值（微信不支持CSS变量）
  html = html.replace(
    /var\s*\([^)]+\)/gi,
    '#333333' // 默认颜色
  );
  
  // 转换复杂的背景渐变为简单颜色
  html = html.replace(
    /background\s*:\s*linear-gradient\([^;]+\);?/gi,
    (match) => {
      // 提取渐变中的第一个颜色作为背景色
      const colorMatch = match.match(/#[0-9a-fA-F]{3,6}|rgb\([^)]+\)|rgba\([^)]+\)/);
      return colorMatch ? `background-color: ${colorMatch[0]};` : 'background-color: #f5f5f5;';
    }
  );
  
  // 转换时间线布局为border-left样式
  html = html.replace(
    /<div[^>]*style\s*=\s*["']([^"']*)["'][^>]*>\s*<div[^>]*style\s*=\s*["']([^"']*width\s*:\s*[^;]+[^"']*)["'][^>]*><\/div>/gi,
    (match, parentStyle, lineStyle) => {
      const backgroundMatch = lineStyle.match(/background(?:-color)?\s*:\s*([^;]+)/i);
      const widthMatch = lineStyle.match(/width\s*:\s*([^;]+)/i);
      
      const borderColor = backgroundMatch ? backgroundMatch[1] : '#007bff';
      const borderWidth = widthMatch ? widthMatch[1] : '3px';
      
      const cleanParentStyle = parentStyle
        .replace(/position\s*:\s*[^;]+;?/gi, '')
        .replace(/padding-left\s*:\s*[^;]+;?/gi, '');
      
      return `<div style="${cleanParentStyle} border-left: ${borderWidth} solid ${borderColor}; padding-left: 20px;">`;
    }
  );
  
  // 移除复杂的CSS函数
  html = html.replace(
    /(calc|min|max|clamp)\s*\([^)]+\)/gi,
    (match) => {
      // 简化为固定值
      if (match.includes('px')) {
        const pxMatch = match.match(/(\d+)px/);
        return pxMatch ? `${pxMatch[1]}px` : '100px';
      }
      return '100px';
    }
  );
  
  return html;
}

/**
 * 优化移动端显示
 * 基于微信公众号移动端最佳实践
 */
function optimizeForMobile(html: string): string {
  // 添加响应式宽度（使用vw单位，微信推荐）
  html = html.replace(
    /style\s*=\s*["']([^"']*width\s*:\s*\d+px[^"']*)["']/gi,
    (match, style) => {
      const widthMatch = style.match(/width\s*:\s*(\d+)px/i);
      if (widthMatch) {
        const width = parseInt(widthMatch[1]);
        if (width > 320) {
          // 大宽度使用响应式
          const newStyle = style.replace(
            /width\s*:\s*\d+px/i,
            `width: min(${width}px, 90vw)`
          );
          return `style="${newStyle}"`;
        }
      }
      return match;
    }
  );
  
  // 优化字体大小（微信建议最小12px，推荐14px+）
  html = html.replace(
    /font-size\s*:\s*(\d+)px/gi,
    (match, size) => {
      const fontSize = parseInt(size);
      if (fontSize < 12) {
        return 'font-size: 12px'; // 微信最小字体12px
      }
      if (fontSize < 14) {
        return 'font-size: 14px'; // 推荐最小字体14px
      }
      if (fontSize > 28) {
        return `font-size: min(${size}px, 7vw)`; // 大字体响应式
      }
      return match;
    }
  );
  
  // 优化行高（微信推荐1.5-1.8倍）
  html = html.replace(
    /style\s*=\s*["']([^"']*)["']/gi,
    (match, style) => {
      if (!style.includes('line-height') && style.includes('font-size')) {
        return `style="${style} line-height: 1.6;"`;
      }
      return match;
    }
  );
  
  // 添加字间距优化（特别是英文和数字）
  html = html.replace(
    /style\s*=\s*["']([^"']*font-size[^"']*)["']/gi,
    (match, style) => {
      if (!style.includes('letter-spacing')) {
        return `style="${style} letter-spacing: 0.5px;"`;
      }
      return match;
    }
  );
  
  // 优化图片显示（微信自动限制max-width: 100%）
  html = html.replace(
    /<img([^>]*style\s*=\s*["']([^"']*)["'][^>]*)>/gi,
    (match, imgAttrs, style) => {
      if (!style.includes('max-width')) {
        const newStyle = style + ' max-width: 100%; height: auto;';
        return match.replace(style, newStyle);
      }
      return match;
    }
  );
  
  // 添加段落间距优化
  html = html.replace(
    /<p([^>]*style\s*=\s*["']([^"']*)["'][^>]*)>/gi,
    (match, pAttrs, style) => {
      if (!style.includes('margin')) {
        const newStyle = style + ' margin: 0 0 1em 0;';
        return match.replace(style, newStyle);
      }
      return match;
    }
  );
  
  return html;
}

/**
 * 验证CSS属性是否兼容微信
 * 基于微信公众号最新的白名单限制
 */
export function validateWeChatCompatibility(css: string): {
  isCompatible: boolean;
  issues: string[];
  suggestions: string[];
} {
  const issues: string[] = [];
  const suggestions: string[] = [];
  
  // 检查被微信完全禁止的属性
  const bannedProperties = [
    { prop: 'position', pattern: /position\s*:/gi, suggestion: '使用 display: flex 或 display: inline-block 进行布局' },
    { prop: 'float', pattern: /float\s*:/gi, suggestion: '使用 display: flex 或 display: inline-block' },
    { prop: 'z-index', pattern: /z-index\s*:/gi, suggestion: '调整HTML结构顺序来控制层级' },
    { prop: 'animation', pattern: /animation\s*:/gi, suggestion: '使用静态效果或GIF图片替代' },
    { prop: 'transition', pattern: /transition\s*:/gi, suggestion: '移除过渡效果，使用静态样式' },
    { prop: '@keyframes', pattern: /@keyframes/gi, suggestion: '微信不支持CSS动画，请使用静态效果' },
    { prop: '@media', pattern: /@media/gi, suggestion: '使用vw/vh单位或内联样式实现响应式' },
    { prop: 'transform (complex)', pattern: /transform\s*:\s*(?!rotate\(\d+deg\))[^;]+/gi, suggestion: '只使用简单的rotate()变换，或用margin/padding替代' },
    { prop: 'percentage units', pattern: /(margin|padding)(-[a-z]+)?\s*:\s*[^;]*%/gi, suggestion: '使用px或vw/vh单位替代百分比' },
  ];
  
  // 检查被微信过滤的HTML属性
  const bannedAttributes = [
    { attr: 'id', pattern: /\sid\s*=/gi, suggestion: '微信会自动删除id属性，使用class或内联样式' },
    { attr: 'onclick', pattern: /on[a-z]+\s*=/gi, suggestion: '微信不支持JavaScript事件，移除所有事件处理器' },
    { attr: 'javascript:', pattern: /javascript\s*:/gi, suggestion: '移除JavaScript代码，微信会过滤所有脚本' },
  ];
  
  // 检查不支持的HTML标签
  const bannedTags = [
    { tag: 'script', pattern: /<script[^>]*>/gi, suggestion: '微信完全禁止JavaScript，移除所有script标签' },
    { tag: 'style', pattern: /<style[^>]*>/gi, suggestion: '将CSS转换为内联样式（style属性）' },
    { tag: 'iframe', pattern: /<iframe[^>]*>/gi, suggestion: '使用图片或链接替代iframe嵌入' },
    { tag: 'object', pattern: /<object[^>]*>/gi, suggestion: '使用img标签或微信特定的媒体标签' },
    { tag: 'embed', pattern: /<embed[^>]*>/gi, suggestion: '使用img标签或微信特定的媒体标签' },
    { tag: 'form', pattern: /<form[^>]*>/gi, suggestion: '使用第三方表单服务或二维码跳转' },
    { tag: 'input', pattern: /<input[^>]*>/gi, suggestion: '微信不支持表单元素，使用外部链接' },
  ];
  
  // 检查CSS属性
  bannedProperties.forEach(({ prop, pattern, suggestion }) => {
    if (pattern.test(css)) {
      issues.push(`发现被禁止的CSS属性: ${prop}`);
      suggestions.push(suggestion);
    }
  });
  
  // 检查HTML属性
  bannedAttributes.forEach(({ attr, pattern, suggestion }) => {
    if (pattern.test(css)) {
      issues.push(`发现被禁止的HTML属性: ${attr}`);
      suggestions.push(suggestion);
    }
  });
  
  // 检查HTML标签
  bannedTags.forEach(({ tag, pattern, suggestion }) => {
    if (pattern.test(css)) {
      issues.push(`发现被禁止的HTML标签: ${tag}`);
      suggestions.push(suggestion);
    }
  });
  
  // 检查外部资源引用
  if (/url\s*\(/gi.test(css)) {
    issues.push('发现外部资源引用（url()）');
    suggestions.push('将图片上传到微信素材库，使用素材库链接');
  }
  
  // 检查复杂的CSS选择器（只在<style>标签内或CSS文件中检查）
  const styleTagRegex = /<style[^>]*>([\s\S]*?)<\/style>/gi;
  const styleMatches = css.match(styleTagRegex);
  if (styleMatches) {
    styleMatches.forEach(styleBlock => {
      if (/\.[a-zA-Z][a-zA-Z0-9_-]*\s*\{/gi.test(styleBlock)) {
        issues.push('发现CSS类选择器');
        suggestions.push('微信只支持内联样式，将CSS转换为style属性');
      }
    });
  }
  
  // 检查是否有独立的CSS类定义（不在代码块中）
  const codeBlockRegex = /<(pre|code)[^>]*>[\s\S]*?<\/(pre|code)>/gi;
  let cssWithoutCodeBlocks = css.replace(codeBlockRegex, '');
  if (/\.[a-zA-Z][a-zA-Z0-9_-]*\s*\{/gi.test(cssWithoutCodeBlocks)) {
    issues.push('发现CSS类选择器');
    suggestions.push('微信只支持内联样式，将CSS转换为style属性');
  }
  
  // 检查字体大小是否过小
  const fontSizeMatches = css.match(/font-size\s*:\s*(\d+)px/gi);
  if (fontSizeMatches) {
    fontSizeMatches.forEach(match => {
      const size = parseInt(match.match(/\d+/)?.[0] || '0');
      if (size < 12) {
        issues.push(`字体大小过小: ${size}px`);
        suggestions.push('微信建议最小字体12px，推荐14px以上');
      }
    });
  }
  
  return {
    isCompatible: issues.length === 0,
    issues,
    suggestions
  };
}

/**
 * 生成兼容性报告
 */
export function generateCompatibilityReport(html: string): string {
  const validation = validateWeChatCompatibility(html);
  
  if (validation.isCompatible) {
    return '✅ 内容完全兼容微信公众号！';
  }
  
  let report = '⚠️ 发现微信兼容性问题：\n\n';
  
  validation.issues.forEach((issue, index) => {
    report += `${index + 1}. ${issue}\n`;
    if (validation.suggestions[index]) {
      report += `   建议: ${validation.suggestions[index]}\n`;
    }
  });
  
  report += '\n💡 建议使用 wechat-compatibility 插件自动修复这些问题。';
  
  return report;
}