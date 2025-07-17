# MCP Server for WeChat Official Publisher

微信公众号发布工具的 MCP (Model Context Protocol) 服务器，为 AI 助手提供微信文章发布和管理功能。

## 功能特性

- 🚀 **文章发布**: 直接发布 Markdown 文章到微信公众号
- 👀 **文章预览**: 生成文章预览，支持多种主题
- 🎨 **主题管理**: 获取和应用不同的文章主题
- 🔧 **内容处理**: 应用插件和主题处理文章内容
- ⚙️ **配置管理**: 查看和验证配置信息

## 快速开始

### 1. 安装依赖

```bash
npm install
```

### 2. 配置环境变量

创建 `.env` 文件并设置微信公众号配置：

```env
WECHAT_APP_ID=your_app_id
WECHAT_APP_SECRET=your_app_secret
NODE_ENV=development
```

### 3. 启动 MCP 服务器

```bash
# 使用 npm 脚本
npm run mcp-server

# 或使用 CLI 命令
npx wechat-official-publisher mcp-server

# 启用调试模式
npx wechat-official-publisher mcp-server --debug
```

### 4. 查看服务器信息

```bash
npx wechat-official-publisher mcp-info
```

## 可用工具

### 1. publish_article

发布文章到微信公众号。

**参数:**
- `filePath` (必需): 文章文件路径
- `title` (可选): 文章标题
- `author` (可选): 文章作者
- `digest` (可选): 文章摘要
- `coverImage` (可选): 封面图片路径
- `draft` (可选): 是否保存为草稿，默认 `true`
- `theme` (可选): 使用的主题名称

**示例:**
```json
{
  "filePath": "./example/article.md",
  "title": "我的第一篇文章",
  "author": "作者名",
  "draft": true,
  "theme": "elegant"
}
```

### 2. preview_article

预览文章效果，生成 HTML 预览文件。

**参数:**
- `filePath` (必需): 文章文件路径
- `theme` (可选): 使用的主题名称

**示例:**
```json
{
  "filePath": "./example/article.md",
  "theme": "modern"
}
```

### 3. list_themes

获取所有可用的主题列表。

**参数:** 无

### 4. process_content

处理文章内容，应用主题和插件。

**参数:**
- `content` (必需): 要处理的文章内容
- `theme` (可选): 使用的主题名称

**示例:**
```json
{
  "content": "# 标题\n\n这是文章内容...",
  "theme": "warm"
}
```

### 5. get_config

获取当前配置信息和环境状态。

**参数:** 无

## 主题系统

支持多种内置主题：

- `default` - 默认主题
- `elegant` - 优雅主题
- `modern` - 现代主题
- `warm` - 温暖主题
- `cute` - 可爱主题

所有主题都针对微信公众号进行了优化，确保最佳的显示效果。

## 配置要求

### 必需环境变量

- `WECHAT_APP_ID`: 微信公众号的 AppID
- `WECHAT_APP_SECRET`: 微信公众号的 AppSecret

### 可选环境变量

- `NODE_ENV`: 运行环境 (development/production)
- `DEBUG`: 启用调试模式

## 传输协议

当前支持 **stdio** 传输协议，通过标准输入输出与客户端通信。这是 MCP 的标准传输方式，适用于大多数 AI 助手集成。

## 错误处理

服务器会返回详细的错误信息，包括：

- 配置错误（缺少必需的环境变量）
- 文件不存在错误
- 微信 API 调用错误
- 主题不存在错误
- 内容处理错误

## 开发和调试

### 启用调试模式

```bash
# 通过命令行参数
npx wechat-official-publisher mcp-server --debug

# 或设置环境变量
DEBUG=true npm run mcp-server
```

### 查看日志

调试模式下会输出详细的日志信息，包括：
- 工具调用详情
- 微信 API 请求和响应
- 内容处理过程
- 错误堆栈信息

## 集成示例

### 在 AI 助手中使用

1. 配置 MCP 客户端连接到服务器
2. 使用 `publish_article` 工具发布文章
3. 使用 `preview_article` 工具预览效果
4. 使用 `list_themes` 工具查看可用主题

### 批量处理

可以通过编程方式调用多个工具来实现批量处理：

1. 使用 `get_config` 验证配置
2. 使用 `list_themes` 获取主题列表
3. 对每篇文章使用 `preview_article` 预览
4. 使用 `publish_article` 批量发布

## 故障排除

### 常见问题

1. **配置错误**: 确保设置了正确的 `WECHAT_APP_ID` 和 `WECHAT_APP_SECRET`
2. **文件不存在**: 检查文件路径是否正确
3. **主题不存在**: 使用 `list_themes` 查看可用主题
4. **网络错误**: 检查网络连接和微信 API 访问权限

### 获取帮助

- 查看日志文件（如果启用了文件日志）
- 启用调试模式获取详细信息
- 检查环境变量配置
- 验证微信公众号权限

## 许可证

MIT License