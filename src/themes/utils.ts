import { StyleConfig } from './types';

/**
 * 将样式配置转换为CSS字符串
 */
export function generateStyle(config: StyleConfig): string {
  const styles: string[] = [];
  
  // 遍历所有样式属性
  Object.entries(config).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      // 将驼峰命名转换为CSS属性名
      const cssProperty = key.replace(/([A-Z])/g, '-$1').toLowerCase();
      styles.push(`${cssProperty}: ${value}`);
    }
  });
  
  return styles.join('; ');
}

/**
 * 合并多个样式配置
 */
export function mergeStyles(...configs: Partial<StyleConfig>[]): StyleConfig {
  return configs.reduce((merged, config) => {
    return { ...merged, ...config };
  }, {} as StyleConfig);
}

/**
 * 创建带样式的HTML元素
 */
export function createStyledElement(
  tag: string,
  content: string,
  styles: StyleConfig,
  attributes: Record<string, string> = {}
): string {
  const styleString = generateStyle(styles);
  const attrString = Object.entries(attributes)
    .map(([key, value]) => `${key}="${value}"`)
    .join(' ');
  
  const openTag = `<${tag}${styleString ? ` style="${styleString}"` : ''}${attrString ? ` ${attrString}` : ''}>`;
  const closeTag = `</${tag}>`;
  
  return `${openTag}${content}${closeTag}`;
}

/**
 * 验证主题配置的完整性
 */
export function validateThemeConfig(theme: any): boolean {
  const requiredFields = [
    'name',
    'container',
    'headings',
    'paragraph',
    'link',
    'image',
    'codeBlock',
    'inlineCode',
    'blockquote',
    'list',
    'table'
  ];

  for (const field of requiredFields) {
    if (!theme[field]) {
      if (process.env.DEBUG === 'true') {
        console.warn(`主题配置缺少必需字段: ${field}`);
      }
      return false;
    }
  }

  // 检查headings是否包含h1-h6
  const headingLevels = ['h1', 'h2', 'h3', 'h4', 'h5', 'h6'];
  for (const level of headingLevels) {
    if (!theme.headings[level]) {
      if (process.env.DEBUG === 'true') {
        console.warn(`主题配置缺少标题样式: ${level}`);
      }
      return false;
    }
  }

  return true;
}