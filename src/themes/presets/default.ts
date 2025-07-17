import { ThemeConfig } from '../types';

/**
 * 默认主题 - GitHub 风格（微信兼容）
 */
export const defaultTheme: ThemeConfig = {
  name: 'default',
  description: 'GitHub风格的默认主题，专为微信公众号优化',
  author: 'WeChat Publisher',
  version: '2.0.0',
  
  container: {
    fontFamily: '"PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", "WenQuanYi Micro Hei", "Helvetica Neue", Arial, sans-serif',
    lineHeight: '1.7',
    color: '#333333',
    maxWidth: '100%',
    backgroundColor: '#ffffff',
    padding: '20px',
    margin: '0 auto'
  },
  
  headings: {
    h1: {
      fontSize: '24px',
      fontWeight: 'bold',
      margin: '24px 0 16px 0',
      lineHeight: '1.4',
      color: '#2c3e50',
      padding: '12px 0',
      borderBottom: '2px solid #3498db'
    },
    h2: {
      fontSize: '22px',
      fontWeight: 'bold',
      margin: '20px 0 12px 0',
      lineHeight: '1.4',
      color: '#34495e',
      padding: '8px 0',
      borderBottom: '1px solid #bdc3c7'
    },
    h3: {
      fontSize: '20px',
      fontWeight: 'bold',
      margin: '18px 0 10px 0',
      lineHeight: '1.4',
      color: '#2c3e50'
    },
    h4: {
      fontSize: '18px',
      fontWeight: 'bold',
      margin: '16px 0 8px 0',
      lineHeight: '1.4',
      color: '#34495e'
    },
    h5: {
      fontSize: '16px',
      fontWeight: 'bold',
      margin: '14px 0 6px 0',
      lineHeight: '1.4',
      color: '#34495e'
    },
    h6: {
      fontSize: '14px',
      fontWeight: 'bold',
      margin: '12px 0 4px 0',
      lineHeight: '1.4',
      color: '#7f8c8d'
    }
  },
  
  paragraph: {
    margin: '16px 0',
    lineHeight: '1.8',
    fontSize: '16px',
    color: '#333333',
    letterSpacing: '0.5px'
  },
  
  link: {
    color: '#576b95',
    textDecoration: 'none',
    fontWeight: '500'
  },
  
  image: {
    maxWidth: '100%',
    margin: '16px 0',
    display: 'block'
  },
  
  codeBlock: {
    container: {
      backgroundColor: '#f8f9fa',
      padding: '16px',
      margin: '16px 0',
      border: '1px solid #e9ecef'
    },
    code: {
      fontFamily: '"SF Mono", Monaco, "Cascadia Code", "Roboto Mono", Consolas, "Courier New", monospace',
      fontSize: '14px',
      color: '#24292e',
      lineHeight: '1.6'
    }
  },
  
  inlineCode: {
    backgroundColor: '#f1f3f4',
    color: '#d73a49',
    padding: '2px 4px',
    fontFamily: '"SF Mono", Monaco, Consolas, monospace',
    fontSize: '14px'
  },
  
  blockquote: {
    borderLeft: '4px solid #dfe2e5',
    padding: '0 16px',
    margin: '16px 0',
    color: '#6a737d',
    backgroundColor: '#f8f9fa'
  },
  
  list: {
    ordered: {
      margin: '16px 0',
      padding: '0 0 0 24px'
    },
    unordered: {
      margin: '16px 0',
      padding: '0 0 0 24px'
    },
    item: {
      margin: '8px 0',
      lineHeight: '1.7'
    }
  },
  
  table: {
    table: {
      borderCollapse: 'collapse',
      width: '100%',
      margin: '16px 0'
    },
    row: {},
    header: {
      border: '1px solid #dfe2e5',
      padding: '12px',
      backgroundColor: '#f6f8fa',
      fontWeight: 'bold',
      textAlign: 'left'
    },
    cell: {
      border: '1px solid #dfe2e5',
      padding: '12px',
      textAlign: 'left'
    }
  }
};