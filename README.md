# 微信文章自动发布工具

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.2.2-blue.svg)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-18.x-green.svg)](https://nodejs.org/)

一个基于 TypeScript 的微信文章自动发布工具，支持 Markdown 和纯文本格式。

> 🚀 现在支持零配置快速开始，无需构建步骤！

## ✨ 功能特性

- 📝 支持 Markdown 和纯文本格式的文章
  - 完整的 Markdown 语法支持
  - 智能处理列表、代码块等格式
  - 自动优化 HTML 输出格式
- 🔌 插件化架构，易于扩展
- ⚡ 自动处理微信访问令牌
- 🔒 环境变量管理敏感信息
- 🛠️ TypeScript 类型安全
- 🚀 开箱即用的命令行工具

## 🚀 快速开始

### 前置要求

- Node.js 16.0.0 或更高版本
- 微信公众号开发者账号

### 安装

```bash
# 克隆仓库
git clone https://github.com/your-username/wechat-publisher.git
cd wechat-publisher

# 安装依赖
npm install

# 复制示例环境变量文件
cp .env.example .env
```

### 配置

1. 编辑 `.env` 文件，填入你的微信公众号 AppID 和 AppSecret：

```env
WECHAT_APP_ID=your_app_id
WECHAT_APP_SECRET=your_app_secret
NODE_ENV=development  # 开发模式，设为 production 关闭调试输出
```

2. 创建你的第一篇文章（Markdown 格式）：

```markdown
# 我的第一篇文章

这是文章的摘要，会显示在文章列表中。

<!-- more -->

## 二级标题

这里是文章的详细内容...

- 列表项 1
- 列表项 2
```

### 使用

#### 1. 本地预览 Markdown 文章

```bash
# 预览 Markdown 文件
pnpm preview example/demo-article.md

# 或者指定其他 Markdown 文件
pnpm preview path/to/your/article.md
```

预览功能会将 Markdown 转换为美观的 HTML 并在浏览器中打开。

#### 2. 发布到微信公众号

```bash
# 基本用法：发布文章到微信公众号草稿箱
pnpm publish:wechat example/article.md

# 指定文章标题和作者
pnpm publish:wechat example/article.md --title="我的文章标题" --author="作者名"

# 指定文章摘要和封面图片
pnpm publish:wechat example/article.md --digest="这是文章的摘要内容..." --cover="path/to/cover.png"

# 直接发布（非草稿）
pnpm publish:wechat example/article.md --draft=false

# 组合使用
pnpm publish:wechat example/article.md \
  --title="我的文章标题" \
  --author="作者名" \
  --digest="这是文章的摘要内容..." \
  --cover="path/to/cover.png" \
  --draft=false
```

> 注意：发布前请确保已正确配置 `.env` 文件中的 `WECHAT_APP_ID` 和 `WECHAT_APP_SECRET`。

### 命令行选项

| 选项 | 描述 | 默认值 |
|------|------|--------|
| `--title` | 文章标题 | 默认为文件名 |
| `--author` | 文章作者 | 空 |
| `--digest` | 文章摘要 | 空 |
| `--cover` | 封面图片路径 | 自动检测同目录下的 cover.png |
| `--draft` | 是否发布到草稿箱 | true |
| `--help` | 显示帮助信息 | - |

#### 3. 开发模式

```bash
# 启动开发服务器
pnpm start
```

#### 4. 测试

```bash
# 运行测试
pnpm test

# 检查代码风格
pnpm lint
```

## 🏗️ 项目结构

```
.
├── src/                    # 源代码
│   ├── core/              # 核心逻辑
│   │   ├── Publisher.ts   # 发布器核心类
│   │   └── types.ts       # 类型定义
│   ├── plugins/           # 插件目录
│   │   ├── MarkdownReaderPlugin.ts
│   │   ├── PlainTextReaderPlugin.ts
│   │   └── index.ts
│   ├── config/            # 配置管理
│   │   ├── default.ts
│   │   └── config.ts
│   └── index.ts           # 入口文件
│
├── scripts/              # 实用脚本
│   ├── preview.ts        # Markdown 预览工具
│   └── publish.ts        # 发布工具
│
├── example/             # 示例文件
│   ├── demo-article.md   # 示例文章
│   └── article.md       # 另一个示例文章
│
├── .env                # 环境变量配置
└── package.json         # 项目配置
```

## 🔌 插件开发

1. 创建插件文件 `src/plugins/MyPlugin.ts`：

```typescript
import { Plugin, PluginContext } from '../core/types';

export class MyPlugin implements Plugin {
  name = 'my-plugin';
  
  async process(ctx: PluginContext): Promise<void> {
    // 处理文章内容
    ctx.article.content = ctx.article.content.replace(/foo/g, 'bar');
  }
}
```

2. 在 `src/plugins/index.ts` 中导出插件：

```typescript
export * from './MyPlugin';
```

3. 在创建发布器时使用插件：

```typescript
// 使用SDK发布文章
const sdk = new WeChatPublisherSDK({
  appId: 'your-app-id',
  appSecret: 'your-app-secret',
  plugins: [
    new MarkdownReaderPlugin(),
    new ImageUploaderPlugin()
  ]
});

// 发布单篇文章
await sdk.publishArticle('文章内容', {
  title: '文章标题',
  draft: true, // 是否发布到草稿箱
  coverImage: '封面图片路径'
});

// 批量发布文章
await sdk.publishArticles([
  {
    content: '文章1内容',
    title: '文章1标题',
    coverImage: '文章1封面'
  },
  {
    content: '文章2内容',
    title: '文章2标题',
    coverImage: '文章2封面'
  }
]);
```

## ⚙️ 配置项

可以在 `.env` 文件或直接在配置对象中设置以下选项：

| 变量名 | 描述 | 默认值 |
|--------|------|--------|
| WECHAT_APP_ID | 微信公众平台 AppID | - |
| WECHAT_APP_SECRET | 微信公众平台 AppSecret | - |
| PUBLISH_TO_DRAFT | 是否发布到草稿箱 | false |
| DEBUG | 是否启用调试模式 | false |
| PLUGIN_MARKDOWN | 是否启用Markdown插件 | true |
| PLUGIN_IMAGE | 是否启用图片上传插件 | true |
| NODE_ENV | 环境模式 (development/production) | development |

## 🐛 调试

在开发模式下，工具会输出详细的调试信息。要启用调试模式，设置 `NODE_ENV=development`。

```bash
# 启用调试模式
export NODE_ENV=development

# 或者直接运行
export NODE_ENV=development && npm start -- example/article.md

# 查看详细的调试日志
export DEBUG=wechat-publisher:* && pnpm publish:wechat example/article.md
```

### 常见问题

#### 1. Markdown 格式问题

- **列表显示不正常**：确保列表项前有适当的空行
- **代码块格式错误**：使用三个反引号包裹代码块，并指定语言
- **图片上传失败**：检查图片路径是否正确，确保图片大小符合微信要求

#### 2. 发布失败

- 检查网络连接
- 确认微信公众平台配置正确
- 查看日志中的错误信息
- 尝试重新获取 Access Token

#### 3. 图片上传问题

- 确保图片格式为 jpg/png
- 图片大小不超过 2MB
- 封面图片建议尺寸 900x500 像素

## 🤝 贡献

欢迎提交 Issue 和 Pull Request。

## 📄 许可证

MIT
