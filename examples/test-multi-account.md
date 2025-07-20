# 多账号功能测试文章

这是一篇用于测试多账号功能的示例文章。

## 功能测试

### 1. 多账号管理
- ✅ 支持多个微信公众号账号
- ✅ 账号间快速切换
- ✅ 独立的token缓存管理

### 2. 网络图片支持

#### 网络封面图片
使用命令：
```bash
npx wechat-official-publisher publish test-multi-account.md \
  --title "多账号测试" \
  --cover "https://via.placeholder.com/300x300.png?text=Cover"
```

#### 文章中的网络图片
![网络图片示例](https://via.placeholder.com/600x300.png?text=Network+Image)

#### 本地图片（对比）
![本地图片](../assets/test-image.png)

### 3. stable_token 接口
- ✅ 支持微信官方推荐的stable_token接口
- ✅ 向后兼容原有token接口
- ✅ 可通过配置选择使用方式

### 4. 增强的缓存管理
- ✅ 多账号独立缓存
- ✅ 精确的缓存清理
- ✅ 缓存状态监控

## 使用示例

### CLI 命令测试

```bash
# 1. 查看账号列表
npx wechat-official-publisher accounts list

# 2. 切换到测试账号
npx wechat-official-publisher accounts switch test

# 3. 发布文章
npx wechat-official-publisher publish test-multi-account.md \
  --title "多账号功能测试" \
  --author "测试用户" \
  --draft

# 4. 清空缓存
npx wechat-official-publisher clear-cache --account test
```

### MCP 工具测试

```json
{
  "tool": "list_accounts",
  "arguments": {}
}
```

```json
{
  "tool": "switch_account",
  "arguments": {
    "accountId": "test"
  }
}
```

```json
{
  "tool": "publish_article",
  "arguments": {
    "filePath": "./examples/test-multi-account.md",
    "title": "MCP多账号测试",
    "appId": "your_test_appid",
    "appSecret": "your_test_secret",
    "draft": true
  }
}
```

## 配置示例

### 环境变量配置
```env
# 多账号配置
WECHAT_ACCOUNTS=main:appid1:secret1:主账号,test:appid2:secret2:测试账号

# 功能配置
WECHAT_USE_STABLE_TOKEN=true
DEBUG=true
DEFAULT_THEME=elegant
```

### 配置文件
```javascript
module.exports = {
  debug: true,
  publishToDraft: true,
  theme: 'modern',
  
  plugins: [
    async (article, context) => {
      // 为测试账号添加标识
      if (context.activeAccount?.name?.includes('测试')) {
        article.content = `<div style="background: #fff3cd; padding: 10px; margin: 10px 0; border-left: 4px solid #ffc107;">
          <strong>🧪 测试环境</strong><br>
          此文章发布在测试账号上
        </div>\n${article.content}`;
      }
      return article;
    }
  ]
};
```

## 预期结果

1. **多账号管理**：能够正确列出、切换和验证多个账号
2. **网络图片**：网络图片能够正确下载、处理并上传到微信服务器
3. **stable_token**：使用stable_token接口获取访问令牌
4. **缓存管理**：每个账号的缓存独立管理，不会相互影响
5. **MCP工具**：新增的账号管理工具能够正常工作

## 测试检查清单

- [ ] 环境变量配置正确
- [ ] 多账号列表显示正常
- [ ] 账号切换功能正常
- [ ] 网络图片上传成功
- [ ] stable_token接口工作正常
- [ ] 缓存清理功能正常
- [ ] MCP工具响应正确
- [ ] 文章发布成功

---

*此文档用于测试多账号功能的完整性和正确性。*