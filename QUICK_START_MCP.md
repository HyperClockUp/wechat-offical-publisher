# WeChat Official Publisher MCP Server 快速开始

本指南将帮助你快速设置和使用 WeChat Official Publisher 的 MCP (Model Context Protocol) 服务器功能。

## 🚀 快速安装

### 1. 安装工具

```bash
# 全局安装（推荐）
npm install -g wechat-official-publisher

# 或使用 npx（无需安装）
npx wechat-official-publisher --help
```

### 2. 配置环境

创建 `.env` 文件或设置环境变量：

```bash
# 必需配置
export WECHAT_APP_ID="your_wechat_app_id"
export WECHAT_APP_SECRET="your_wechat_app_secret"

# 可选配置
export NODE_ENV="development"
export DEBUG="true"
```

## 🔧 启动 MCP 服务器

### 传输协议选择

本工具支持两种传输协议：

- **stdio** - 标准输入输出（默认，适合 AI 客户端集成）
- **sse** - Server-Sent Events（适合 Web 应用和调试）

### 方法一：使用 CLI 命令

```bash
# 启动 stdio 服务器（默认）
npx wechat-official-publisher mcp-server

# 启动 SSE 服务器
npx wechat-official-publisher mcp-server --transport sse

# 自定义 SSE 服务器端口和主机
npx wechat-official-publisher mcp-server --transport sse --port 8080 --host 0.0.0.0

# 启用调试模式
npx wechat-official-publisher mcp-server --debug

# 查看服务器信息
npx wechat-official-publisher mcp-info
```

### 方法二：使用 npm 脚本

```bash
# 克隆项目后
git clone https://github.com/your-repo/wechat-official-publisher.git
cd wechat-official-publisher
npm install

# 启动 stdio MCP 服务器
npm run mcp-server:stdio

# 启动 SSE MCP 服务器
npm run mcp-server:sse

# 或使用原始命令
npm run mcp-server
```

## 🛠️ MCP 客户端配置

### Claude Desktop 配置（stdio）

在 Claude Desktop 的配置文件中添加：

```json
{
  "mcpServers": {
    "wechat-official-publisher": {
      "command": "npx",
      "args": ["wechat-official-publisher", "mcp-server"],
      "env": {
        "WECHAT_APP_ID": "your_app_id",
        "WECHAT_APP_SECRET": "your_app_secret"
      }
    }
  }
}
```

### SSE 客户端配置

对于 Web 应用或需要 HTTP 接口的场景：

```javascript
// 使用提供的 SSE 客户端
const client = new SSEMCPClient('http://localhost:3000');
await client.connect();

// 调用工具
const result = await client.callTool('list_themes');
console.log(result);
```

### SSE 服务器端点

启动 SSE 服务器后，可访问以下端点：

- `http://localhost:3000` - 测试页面
- `http://localhost:3000/mcp/events` - SSE 事件流
- `http://localhost:3000/mcp/call` - 工具调用 API
- `http://localhost:3000/mcp/info` - 服务器信息
- `http://localhost:3000/health` - 健康检查

### 其他 MCP 客户端

参考 `examples/mcp-client-config.json` 和 `examples/sse-client-example.js` 文件进行配置。

## 📝 基础使用示例

### 1. 创建测试文章

创建 `test-article.md` 文件：

```markdown
# 我的第一篇 MCP 文章

这是通过 MCP 服务器发布的测试文章。

## 功能特性

- ✅ 支持 Markdown
- ✅ 自动图片处理
- ✅ 多主题支持
- ✅ 微信兼容性

## 代码示例

```javascript
console.log('Hello WeChat MCP!');
```

> 这是一个引用块示例。
```

### 2. 使用 MCP 工具

在支持 MCP 的 AI 助手中使用以下工具：

#### 发布文章
```json
{
  "tool": "publish_article",
  "parameters": {
    "filePath": "./test-article.md",
    "title": "我的第一篇文章",
    "author": "作者名",
    "theme": "elegant",
    "draft": true,
    "appId": "your_app_id",
    "appSecret": "your_app_secret"
  }
}
```

**注意**: `appId` 和 `appSecret` 是可选参数，如果提供，将优先于环境变量使用。

#### 预览文章
```json
{
  "tool": "preview_article",
  "parameters": {
    "filePath": "./test-article.md",
    "theme": "modern"
  }
}
```

#### 获取主题列表
```json
{
  "tool": "list_themes",
  "parameters": {}
}
```

#### 处理内容
```json
{
  "tool": "process_content",
  "parameters": {
    "content": "# 标题\n\n内容...",
    "theme": "warm"
  }
}
```

#### 检查配置
```json
{
  "tool": "get_config",
  "parameters": {}
}
```

## 🎨 可用主题

- `default` - 默认主题
- `elegant` - 优雅主题
- `modern` - 现代主题
- `warm` - 温暖主题
- `cute` - 可爱主题

## 🔍 故障排除

### 常见问题

1. **服务器启动失败**
   ```bash
   # 检查 Node.js 版本
   node --version  # 需要 >= 16.0.0
   
   # 检查安装
   npm list -g wechat-official-publisher
   ```

2. **配置错误**
   ```bash
   # 检查环境变量
   echo $WECHAT_APP_ID
   echo $WECHAT_APP_SECRET
   
   # 使用配置检查工具
   npx wechat-official-publisher mcp-info
   ```

3. **文件路径问题**
   - 使用绝对路径
   - 确保文件存在
   - 检查文件权限

4. **网络问题**
   - 检查网络连接
   - 验证微信 API 访问权限
   - 查看防火墙设置

### 调试模式

```bash
# 启用详细日志
npx wechat-official-publisher mcp-server --debug

# 设置环境变量
export DEBUG=true
export NODE_ENV=development
```

## 📚 更多资源

- [完整文档](./docs/MCP_SERVER.md)
- [配置示例](./examples/mcp-client-config.json)
- [使用示例](./examples/mcp-usage-example.js)
- [项目主页](https://github.com/your-repo/wechat-official-publisher)

## 🤝 获取帮助

如果遇到问题：

1. 查看 [故障排除](#-故障排除) 部分
2. 启用调试模式获取详细信息
3. 检查 [Issues](https://github.com/your-repo/wechat-official-publisher/issues)
4. 提交新的 Issue

## 📄 许可证

MIT License - 详见 [LICENSE](./LICENSE) 文件。