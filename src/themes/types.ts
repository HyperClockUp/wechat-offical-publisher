/**
 * 主题系统类型定义
 */

/**
 * 样式配置接口
 */
export interface StyleConfig {
  fontSize?: string;
  fontWeight?: string;
  fontStyle?: string;
  color?: string;
  backgroundColor?: string;
  margin?: string;
  padding?: string;
  paddingLeft?: string;
  paddingRight?: string;
  paddingTop?: string;
  paddingBottom?: string;
  marginLeft?: string;
  marginRight?: string;
  marginTop?: string;
  marginBottom?: string;
  lineHeight?: string;
  borderRadius?: string;
  border?: string;
  borderTop?: string;
  borderBottom?: string;
  borderLeft?: string;
  borderRight?: string;
  textAlign?: string;
  fontFamily?: string;
  textDecoration?: string;
  display?: string;
  maxWidth?: string;
  overflow?: string;
  overflowX?: string;
  borderCollapse?: string;
  width?: string;
  letterSpacing?: string;
  position?: string;
  height?: string;
  listStyleType?: string;
  textOverflow?: string;
  whiteSpace?: string;
  wordWrap?: string;
}

/**
 * 主题配置接口
 */
export interface ThemeConfig {
  name: string;
  description: string;
  author?: string;
  version?: string;
  
  // 容器样式
  container: StyleConfig;
  
  // 标题样式 (h1-h6)
  headings: {
    h1: StyleConfig;
    h2: StyleConfig;
    h3: StyleConfig;
    h4: StyleConfig;
    h5: StyleConfig;
    h6: StyleConfig;
  };
  
  // 段落样式
  paragraph: StyleConfig;
  
  // 链接样式
  link: StyleConfig;
  
  // 图片样式
  image: StyleConfig;
  
  // 代码块样式
  codeBlock: {
    container: StyleConfig;
    code: StyleConfig;
  };
  
  // 行内代码样式
  inlineCode: StyleConfig;
  
  // 引用样式
  blockquote: StyleConfig;
  
  // 列表样式
  list: {
    ordered: StyleConfig;
    unordered: StyleConfig;
    item: StyleConfig;
  };
  
  // 表格样式
  table: {
    table: StyleConfig;
    row: StyleConfig;
    header: StyleConfig;
    cell: StyleConfig;
  };
}

/**
 * 主题管理器接口
 */
export interface ThemeManager {
  getTheme(name: string): ThemeConfig | undefined;
  getAllThemes(): ThemeConfig[];
  getThemeNames(): string[];
  registerTheme(theme: ThemeConfig): void;
  setDefaultTheme(name: string): void;
  getDefaultTheme(): ThemeConfig;
}

/**
 * 样式生成器函数类型
 */
export type StyleGenerator = (config: StyleConfig) => string;