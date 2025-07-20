import { ThemeConfig } from '../types';

/**
 * 可爱哲学主题 - 基于微信公众号「生活需要一点可爱哲学」的设计风格
 * 特点：温暖橙色调、可爱插图、圆角设计、温馨背景
 */
export const cuteTheme: ThemeConfig = {
  name: 'cute',
  description: '温暖可爱的设计风格，适合生活感悟、心灵鸡汤类文章',
  
  // 容器样式
   container: {
     maxWidth: '750px',
     margin: '0 auto',
     padding: '20px',
     backgroundColor: '#FFF8E7', // 温暖的米黄色背景
     borderRadius: '12px',
     fontFamily: 'PingFangSC-Regular, "PingFang SC", "Helvetica Neue", Helvetica, Arial, sans-serif',
     fontSize: '16px',
     lineHeight: '1.6',
     color: '#333333'
   },

  // 标题样式
  headings: {
    h1: {
      fontSize: '28px',
      fontWeight: 'bold',
      color: '#5D7A80', // 温和的蓝灰色
      textAlign: 'center',
      margin: '0 0 24px 0',
      padding: '16px 20px',
      backgroundColor: '#FCF2E0', // 浅橙色背景
      borderRadius: '12px',
      borderLeft: '4px solid #F29F85', // 橙色左边框
      fontFamily: 'PingFangSC-Semibold, "PingFang SC"'
    },
    h2: {
       fontSize: '22px',
       fontWeight: 'bold',
       color: '#F29F85', // 主题橙色
       margin: '32px 0 16px 0',
       padding: '12px 20px',
       backgroundColor: '#FFFFFF',
       borderRadius: '20px',
       textAlign: 'center',
       border: '2px solid #F7C9C2' // 浅橙色边框
     },
    h3: {
      fontSize: '18px',
      fontWeight: 'bold',
      color: '#5D7A80',
      margin: '24px 0 12px 0',
      padding: '8px 16px',
      backgroundColor: '#F7C9C2',
      borderRadius: '8px',
      borderLeft: '3px solid #F29F85'
    },
    h4: {
      fontSize: '16px',
      fontWeight: 'bold',
      color: '#F29F85',
      margin: '20px 0 10px 0',
      padding: '6px 12px',
      backgroundColor: '#FCF2E0',
      borderRadius: '6px'
    },
    h5: {
      fontSize: '15px',
      fontWeight: 'bold',
      color: '#5D7A80',
      margin: '16px 0 8px 0',
      padding: '4px 8px'
    },
    h6: {
      fontSize: '14px',
      fontWeight: 'bold',
      color: '#F29F85',
      margin: '12px 0 6px 0',
      padding: '2px 4px'
    }
  },

  // 段落样式
  paragraph: {
    fontSize: '16px',
    lineHeight: '1.8',
    color: '#333333',
    margin: '16px 0',
    padding: '0'
  },

  // 链接样式
  link: {
    color: '#F29F85',
    textDecoration: 'none',
    borderBottom: '1px solid #F7C9C2',
    fontWeight: 'bold'
  },

  // 图片样式
   image: {
     maxWidth: '750px',
     height: 'auto',
     borderRadius: '8px',
     margin: '16px 0',
     border: '3px solid #F7C9C2'
   },

  // 代码块样式
  codeBlock: {
    container: {
      fontSize: '14px',
      fontFamily: 'Monaco, Consolas, "Courier New", monospace',
      color: '#333333',
      backgroundColor: '#FFF8E7',
      margin: '16px 0',
      padding: '16px',
      borderRadius: '8px',
      border: '1px solid #F7C9C2',
      overflow: 'auto'
    },
    code: {
      fontSize: '14px',
      fontFamily: 'Monaco, Consolas, "Courier New", monospace',
      color: '#333333'
    }
  },

  // 行内代码样式
  inlineCode: {
    fontSize: '14px',
    fontFamily: 'Monaco, Consolas, "Courier New", monospace',
    color: '#F29F85',
    backgroundColor: '#FFF8E7',
    padding: '2px 6px',
    borderRadius: '4px',
    border: '1px solid #F7C9C2'
  },

  // 引用样式
   blockquote: {
     fontSize: '16px',
     fontStyle: 'normal',
     color: '#FFFFFF',
     backgroundColor: '#F29F85',
     margin: '24px 0',
     padding: '20px 24px',
     borderRadius: '12px',
     border: '2px solid #FFFFFF',
     fontWeight: 'bold'
   },

  // 列表样式
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
       fontSize: '16px',
       lineHeight: '1.8',
       color: '#333333',
       margin: '8px 0',
       listStyleType: 'none',
       padding: '0 0 0 20px'
     }
  },

  // 表格样式
  table: {
    table: {
       width: '750px',
       borderCollapse: 'collapse',
       margin: '16px 0',
       backgroundColor: '#FFFFFF',
       borderRadius: '8px',
       overflow: 'hidden',
       border: '2px solid #F7C9C2'
     },
    row: {
      borderBottom: '1px solid #F7C9C2'
    },
    header: {
      fontSize: '16px',
      fontWeight: 'bold',
      color: '#FFFFFF',
      backgroundColor: '#F29F85',
      padding: '12px 16px',
      textAlign: 'left',
      borderBottom: '2px solid #F7C9C2'
    },
    cell: {
      fontSize: '16px',
      color: '#333333',
      padding: '12px 16px',
      borderBottom: '1px solid #F7C9C2'
    }
  }
};

export default cuteTheme;