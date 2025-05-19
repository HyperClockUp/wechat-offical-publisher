# 欢迎使用微信文章发布工具

这是通过微信文章发布工具发布的第一篇文章。

<!-- more -->

## 功能特点

- 支持 Markdown 格式
- 自动处理微信访问令牌
- 插件化架构，易于扩展
- 类型安全的 TypeScript 实现

## 使用方法

1. 安装依赖：`npm install`
2. 配置 `.env` 文件
3. 运行 `npm start -- example/article.md`

## 代码示例

```typescript
const publisher = new WeChatPublisher({
  appId: 'your_app_id',
  appSecret: 'your_app_secret',
  plugins: [new MarkdownReaderPlugin()]
});

await publisher.publish('path/to/article.md');
```

## 注意事项

- 请确保已正确配置微信公众号开发者权限
- 在发布前建议先使用调试模式测试
- 更多帮助请参考项目文档

---

*本文由微信文章发布工具自动生成*
