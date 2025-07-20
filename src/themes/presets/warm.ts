import { ThemeConfig } from '../types';

/**
 * 温暖主题 - 温馨舒适风格（微信兼容）
 */
export const warmTheme: ThemeConfig = {
  name: 'warm',
  description: '温暖舒适的设计风格，专为微信公众号优化',
  author: 'WeChat Publisher',
  version: '2.0.0',
  
  container: {
    fontFamily: '"PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", "WenQuanYi Micro Hei", "Helvetica Neue", Arial, sans-serif',
    lineHeight: '1.8',
    color: '#5d4037',
    maxWidth: '100%',
    backgroundColor: '#fefefe',
    padding: '24px',
    margin: '0 auto'
  },
  
  headings: {
    h1: {
      fontSize: '26px',
      fontWeight: '500',
      margin: '28px 0 18px 0',
      lineHeight: '1.3',
      color: '#d84315',
      borderBottom: '2px solid #ffab91',
      paddingBottom: '12px'
    },
    h2: {
      fontSize: '22px',
      fontWeight: '500',
      margin: '24px 0 14px 0',
      lineHeight: '1.4',
      color: '#bf360c',
      borderLeft: '4px solid #ff8a65',
      paddingLeft: '16px'
    },
    h3: {
      fontSize: '20px',
      fontWeight: '500',
      margin: '20px 0 12px 0',
      lineHeight: '1.4',
      color: '#8d6e63'
    },
    h4: {
      fontSize: '18px',
      fontWeight: '500',
      margin: '18px 0 10px 0',
      lineHeight: '1.4',
      color: '#795548'
    },
    h5: {
      fontSize: '16px',
      fontWeight: '600',
      margin: '16px 0 8px 0',
      lineHeight: '1.4',
      color: '#6d4c41'
    },
    h6: {
      fontSize: '14px',
      fontWeight: '600',
      margin: '14px 0 6px 0',
      lineHeight: '1.4',
      color: '#5d4037'
    }
  },
  
  paragraph: {
    margin: '18px 0',
    lineHeight: '1.8',
    fontSize: '16px',
    color: '#5d4037',
    letterSpacing: '0.5px'
  },
  
  link: {
    color: '#d84315',
    textDecoration: 'none',
    backgroundColor: '#ffecb3',
    padding: '2px 6px',
    borderRadius: '6px',
    border: '1px solid #ffcc02'
  },
  
  image: {
    maxWidth: '100%',
    margin: '20px 0',
    display: 'block'
  },
  
  codeBlock: {
    container: {
      backgroundColor: '#fff8f0',
      padding: '18px',
      border: '1px solid #ffcc02',
      margin: '18px 0'
    },
    code: {
      fontFamily: '"SF Mono", Monaco, "Cascadia Code", "Roboto Mono", Consolas, "Courier New", monospace',
      fontSize: '14px',
      color: '#e65100',
      lineHeight: '1.6'
    }
  },
  
  inlineCode: {
    backgroundColor: '#fff3e0',
    color: '#bf360c',
    padding: '3px 6px',
    fontFamily: '"SF Mono", Monaco, Consolas, monospace',
    fontSize: '14px'
  },
  
  blockquote: {
    borderLeft: '4px solid #ff8a65',
    backgroundColor: '#fbe9e7',
    padding: '0 20px',
    margin: '20px 0',
    color: '#d84315'
  },
  
  list: {
    ordered: {
      margin: '16px 0',
      padding: '0 0 0 32px'
    },
    unordered: {
      margin: '16px 0',
      padding: '0 0 0 32px'
    },
    item: {
      margin: '8px 0',
      lineHeight: '1.8',
      color: '#5d4037'
    }
  },
  
  table: {
    table: {
      borderCollapse: 'collapse',
      width: '100%',
      margin: '20px 0',
      borderRadius: '12px',
      overflow: 'hidden',
      border: '2px solid #ffcc02'
    },
    row: {},
    header: {
      border: '1px solid #ffcc02',
      padding: '16px',
      backgroundColor: '#ff9800',
      color: '#ffffff',
      fontWeight: '600',
      textAlign: 'left'
    },
    cell: {
      border: '1px solid #ffcc02',
      padding: '12px 16px',
      textAlign: 'left',
      color: '#5d4037',
      backgroundColor: '#fffde7'
    }
  }
};