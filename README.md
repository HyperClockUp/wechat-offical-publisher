# 微信文章自动发布工具

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.2.2-blue.svg)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-18.x-green.svg)](https://nodejs.org/)

一个基于 TypeScript 的微信文章自动发布工具，支持 Markdown 和纯文本格式。

> 🚀 现在支持零配置快速开始，无需构建步骤！

## ✨ 功能特性

- 📝 支持 Markdown 和纯文本格式的文章
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
# 发布文章到微信公众号
pnpm publish:wechat example/demo-article.md

# 或者发布其他 Markdown 文件
pnpm publish:wechat path/to/your/article.md
```

> 注意：发布前请确保已正确配置 `.env` 文件中的 `WECHAT_APP_ID` 和 `WECHAT_APP_SECRET`。

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
const publisher = new WeChatPublisher({
  // ... 其他配置 ...
  plugins: [
    new MarkdownReaderPlugin(),
    new MyPlugin()
  ]
});
```

## ⚙️ 配置项

可以在 `.env` 文件中配置以下选项：

| 变量名 | 描述 | 默认值 |
|--------|------|--------|
| WECHAT_APP_ID | 微信公众号 AppID | 无 |
| WECHAT_APP_SECRET | 微信公众号 AppSecret | 无 |
| NODE_ENV | 环境模式 (development/production) | development |

## 🐛 调试

在开发模式下，工具会输出详细的调试信息。要启用调试模式，设置 `NODE_ENV=development`。

```bash
# 启用调试模式
export NODE_ENV=development

# 或者直接运行
export NODE_ENV=development && npm start -- example/article.md
```

## 🤝 贡献

欢迎提交 Issue 和 Pull Request。

## 📄 许可证

MIT
