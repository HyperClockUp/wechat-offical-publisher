import { ThemeConfig } from '../types';

/**
 * 现代主题 - 时尚现代风格（微信兼容）
 */
export const modernTheme: ThemeConfig = {
  name: 'modern',
  description: '现代时尚的设计风格，专为微信公众号优化',
  author: 'WeChat Publisher',
  version: '2.0.0',
  
  container: {
    fontFamily: '"PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", "WenQuanYi Micro Hei", "Helvetica Neue", Arial, sans-serif',
    lineHeight: '1.7',
    color: '#1a1a1a',
    maxWidth: '100%',
    backgroundColor: '#ffffff',
    padding: '20px',
    margin: '0 auto'
  },
  
  headings: {
    h1: {
      fontSize: '28px',
      fontWeight: '700',
      margin: '32px 0 20px 0',
      lineHeight: '1.3',
      color: '#0f172a',
      borderBottom: '3px solid #667eea',
      paddingBottom: '12px'
    },
    h2: {
      fontSize: '24px',
      fontWeight: '600',
      margin: '28px 0 16px 0',
      lineHeight: '1.3',
      color: '#1e293b',
      borderLeft: '4px solid #667eea',
      paddingLeft: '16px'
    },
    h3: {
      fontSize: '20px',
      fontWeight: '600',
      margin: '24px 0 12px 0',
      lineHeight: '1.4',
      color: '#334155'
    },
    h4: {
      fontSize: '18px',
      fontWeight: '500',
      margin: '20px 0 10px 0',
      lineHeight: '1.4',
      color: '#475569'
    },
    h5: {
      fontSize: '16px',
      fontWeight: '500',
      margin: '16px 0 8px 0',
      lineHeight: '1.4',
      color: '#64748b'
    },
    h6: {
      fontSize: '14px',
      fontWeight: '500',
      margin: '12px 0 6px 0',
      lineHeight: '1.4',
      color: '#94a3b8'
    }
  },
  
  paragraph: {
    margin: '16px 0',
    lineHeight: '1.7',
    fontSize: '16px',
    color: '#334155',
    letterSpacing: '0.3px'
  },
  
  link: {
    color: '#007bff',
    textDecoration: 'none',
    borderRadius: '4px',
    padding: '2px 4px',
    backgroundColor: 'rgba(0, 123, 255, 0.1)'
  },
  
  image: {
    maxWidth: '100%',
    margin: '24px 0',
    display: 'block'
  },
  
  codeBlock: {
    container: {
      backgroundColor: '#f8fafc',
      padding: '20px',
      margin: '20px 0',
      border: '1px solid #e2e8f0'
    },
    code: {
      fontFamily: '"SF Mono", Monaco, "Cascadia Code", "Roboto Mono", Consolas, "Courier New", monospace',
      fontSize: '14px',
      color: '#1e293b',
      lineHeight: '1.6'
    }
  },
  
  inlineCode: {
    backgroundColor: '#f1f5f9',
    color: '#e11d48',
    padding: '3px 6px',
    fontFamily: '"SF Mono", Monaco, Consolas, monospace',
    fontSize: '14px'
  },
  
  blockquote: {
    borderLeft: '4px solid #3b82f6',
    padding: '0 20px',
    margin: '20px 0',
    color: '#64748b',
    backgroundColor: '#f8fafc'
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
      lineHeight: '1.7',
      color: '#212529'
    }
  },
  
  table: {
    table: {
      borderCollapse: 'collapse',
      width: '100%',
      margin: '20px 0',
      borderRadius: '12px',
      overflow: 'hidden',
      border: '1px solid #dee2e6'
    },
    row: {},
    header: {
      border: '1px solid #dee2e6',
      padding: '16px',
      backgroundColor: '#007bff',
      color: '#ffffff',
      fontWeight: '600',
      textAlign: 'left'
    },
    cell: {
      border: '1px solid #dee2e6',
      padding: '12px 16px',
      textAlign: 'left',
      color: '#212529'
    }
  }
};