/**
 * 多账号配置示例
 * 展示如何配置多个微信公众号账号
 */

module.exports = {
  // 基础配置
  debug: process.env.NODE_ENV === 'development',
  publishToDraft: true,
  theme: 'elegant',
  
  // 多账号配置示例
  // 注意：实际使用时应该通过环境变量设置，不要在代码中硬编码敏感信息
  accounts: {
    // 主账号
    main: {
      appId: process.env.WECHAT_MAIN_APP_ID,
      appSecret: process.env.WECHAT_MAIN_APP_SECRET,
      name: '主公众号',
      description: '主要的微信公众号账号',
      useStableToken: true,
      debug: false
    },
    
    // 测试账号
    test: {
      appId: process.env.WECHAT_TEST_APP_ID,
      appSecret: process.env.WECHAT_TEST_APP_SECRET,
      name: '测试公众号',
      description: '用于测试的微信公众号账号',
      useStableToken: false,
      debug: true
    },
    
    // 备用账号
    backup: {
      appId: process.env.WECHAT_BACKUP_APP_ID,
      appSecret: process.env.WECHAT_BACKUP_APP_SECRET,
      name: '备用公众号',
      description: '备用的微信公众号账号',
      useStableToken: true,
      debug: false
    }
  },
  
  // 默认使用的账号
  defaultAccount: 'main',
  
  // 自定义插件
  plugins: [
    // 自定义处理函数
    async (article, context) => {
      // 根据不同账号应用不同的处理逻辑
      const activeAccount = context.activeAccount;
      
      if (activeAccount?.name === '测试公众号') {
        // 为测试账号添加特殊标记
        article.content = `<div style="color: red; font-weight: bold;">【测试环境】</div>\n${article.content}`;
      }
      
      return article;
    }
  ]
};