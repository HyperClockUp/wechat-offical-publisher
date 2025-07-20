import { ThemeConfig } from '../types';

/**
 * 优雅主题 - 简约商务风格（微信兼容）
 */
export const elegantTheme: ThemeConfig = {
  name: 'elegant',
  description: '简约优雅的商务风格主题，专为微信公众号优化',
  author: 'WeChat Publisher',
  version: '2.0.0',
  
  container: {
    fontFamily: '"PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", "WenQuanYi Micro Hei", "Helvetica Neue", Arial, sans-serif',
    lineHeight: '1.8',
    color: '#2c3e50',
    maxWidth: '100%',
    backgroundColor: '#ffffff',
    padding: '24px',
    margin: '0 auto'
  },
  
  headings: {
    h1: {
      fontSize: '26px',
      fontWeight: '400',
      margin: '32px 0 20px 0',
      lineHeight: '1.3',
      color: '#1a1a1a',
      borderBottom: '2px solid #e8e8e8',
      paddingBottom: '12px'
    },
    h2: {
      fontSize: '22px',
      fontWeight: '500',
      margin: '28px 0 16px 0',
      lineHeight: '1.4',
      color: '#2c3e50'
    },
    h3: {
      fontSize: '20px',
      fontWeight: '500',
      margin: '24px 0 14px 0',
      lineHeight: '1.4',
      color: '#34495e'
    },
    h4: {
      fontSize: '18px',
      fontWeight: '500',
      margin: '20px 0 12px 0',
      lineHeight: '1.4',
      color: '#34495e'
    },
    h5: {
      fontSize: '16px',
      fontWeight: '600',
      margin: '18px 0 10px 0',
      lineHeight: '1.4',
      color: '#7f8c8d'
    },
    h6: {
      fontSize: '14px',
      fontWeight: '600',
      margin: '16px 0 8px 0',
      lineHeight: '1.4',
      color: '#95a5a6'
    }
  },
  
  paragraph: {
    margin: '18px 0',
    lineHeight: '1.8',
    fontSize: '16px',
    color: '#2c3e50',
    letterSpacing: '0.5px'
  },
  
  link: {
    color: '#3498db',
    textDecoration: 'none',
    borderLeft: '2px solid #3498db',
    padding: '0 0 0 8px'
  },
  
  image: {
    maxWidth: '100%',
    margin: '20px 0',
    display: 'block'
  },
  
  codeBlock: {
    container: {
      backgroundColor: '#f8f9fa',
      padding: '20px',
      overflowX: 'auto',
      border: '1px solid #e9ecef',
      margin: '20px 0'
    },
    code: {
      fontFamily: '"SF Mono", Monaco, "Cascadia Code", "Roboto Mono", Consolas, "Courier New", monospace',
      fontSize: '14px',
      color: '#2d3748',
      lineHeight: '1.6'
    }
  },
  
  inlineCode: {
    backgroundColor: '#f1f3f4',
    color: '#c7254e',
    padding: '3px 6px',
    fontFamily: '"SF Mono", Monaco, Consolas, monospace',
    fontSize: '14px'
  },
  
  blockquote: {
    borderLeft: '4px solid #3498db',
    padding: '0 20px',
    margin: '20px 0',
    color: '#7f8c8d',
    backgroundColor: '#f8f9fa'
  },
  
  list: {
    ordered: {
      margin: '20px 0',
      padding: '0 0 0 40px'
    },
    unordered: {
      margin: '20px 0',
      padding: '0 0 0 40px'
    },
    item: {
      margin: '10px 0',
      lineHeight: '1.8',
      color: '#2c3e50'
    }
  },
  
  table: {
    table: {
      borderCollapse: 'collapse',
      width: '100%',
      margin: '20px 0',
      borderRadius: '8px',
      overflow: 'hidden',
      border: '1px solid #bdc3c7'
    },
    row: {
      borderLeft: '1px solid #ecf0f1'
    },
    header: {
      border: '1px solid #bdc3c7',
      padding: '15px',
      backgroundColor: '#34495e',
      color: '#ffffff',
      fontWeight: '600',
      textAlign: 'left'
    },
    cell: {
      border: '1px solid #ecf0f1',
      padding: '12px 15px',
      textAlign: 'left',
      color: '#2c3e50'
    }
  }
};