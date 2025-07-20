# 微信公众号文章发布工具测试

![项目封面](../cover.png)

这是一篇用于测试微信公众号文章发布工具的标准文章。

## 功能特性

本工具支持以下核心功能：

### Markdown 转换
- 支持标准 Markdown 语法
- 自动转换为微信公众号兼容格式
- 保持良好的排版效果

### 图片处理
- 自动上传本地图片到微信素材库
- 支持网络图片URL自动下载和上传
- 智能图片格式转换和压缩

工具功能展示

### 多公众号管理
- 按AppID区分token缓存
- 避免不同公众号之间的token冲突
- 简化的多账号切换机制

## 代码示例

```javascript
import { WeChatPublisher } from 'wechat-official-publisher';

const publisher = new WeChatPublisher({
  appId: 'your_app_id',
  appSecret: 'your_app_secret',
  debug: true
});

// 发布文章
const result = await publisher.publish('./article.md', {
  title: '文章标题',
  author: '作者',
  digest: '文章摘要',
  coverImage: 'https://example.com/cover.jpg',
  draft: true
});

console.log('发布结果:', result);
```

## 使用说明

### 基本用法

```bash
# 发布文章到草稿箱
npx wechat-official-publisher publish article.md

# 使用网络封面图片
npx wechat-official-publisher publish article.md \
  --title "我的文章" \
  --cover "https://example.com/cover.jpg"

# 预览文章效果
npx wechat-official-publisher preview article.md
```

### MCP 集成

本工具支持 Model Context Protocol，可以与 AI 助手无缝集成：

```json
{
  "mcpServers": {
    "wechat-official-publisher": {
      "command": "npx",
      "args": ["wechat-official-publisher", "mcp-server"]
    }
  }
}
```

## 注意事项

1. 确保设置了正确的微信公众号配置
2. 网络图片会自动下载并上传到微信服务器
3. 所有临时文件会自动清理
4. 支持多种主题样式

## 总结

微信公众号文章发布工具提供了完整的文章发布解决方案，支持从 Markdown 到微信公众号的一键发布，大大提升了内容创作和发布的效率。

通过本工具，你可以：
- 快速将Markdown文章转换为微信公众号格式
- 自动处理文章中的图片上传
- 管理多个公众号的发布需求
- 与AI助手无缝集成

---

*本文档由微信公众号文章发布工具自动生成*