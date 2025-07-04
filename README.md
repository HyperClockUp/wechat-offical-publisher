# 微信公众号文章发布工具

一个简洁易用的微信公众号文章自动发布工具，支持 Markdown 格式文章的自动转换和发布。

## 功能特性

- 📝 **支持 Markdown**: 自动将 Markdown 文件转换为微信公众号格式
- 🖼️ **图片自动处理**: 自动上传本地图片到微信素材库
- 🔄 **自动令牌管理**: 自动获取和刷新微信 access_token
- 📊 **草稿和发布**: 支持创建草稿或直接发布文章
- 🎨 **预览功能**: 本地预览文章效果
- 🛠️ **命令行工具**: 简单的 CLI 界面
- 🔌 **插件系统**: 可扩展的函数式插件

## 快速开始

### 1. 安装依赖

```bash
npm install
# 或
pnpm install
```

### 2. 配置环境变量

创建 `.env` 文件：

```env
WECHAT_APP_ID=your_app_id
WECHAT_APP_SECRET=your_app_secret
```

### 3. 使用

#### 预览文章

```bash
npm run preview example/demo-article.md
```

#### 发布文章

```bash
npm run publish-article example/demo-article.md --title "我的文章" --author "作者名" --cover ./cover.jpg
```

#### 使用 CLI

```bash
npm run cli publish example/demo-article.md --title "我的文章"
npm run cli preview example/demo-article.md
npm run cli config
```

## 命令行选项

### 发布命令

```bash
npm run publish-article <file> [options]
# 或
npm run cli publish <file> [options]
```

**选项：**
- `--title, -t`: 文章标题（可选，默认从文件提取）
- `--author, -a`: 作者（可选）
- `--digest, -d`: 摘要（可选）
- `--cover, -c`: 封面图片路径（可选）
- `--draft`: 仅创建草稿，不发布（可选）
- `--debug`: 启用调试模式（可选）

### 预览命令

```bash
npm run preview <file> [options]
# 或
npm run cli preview <file> [options]
```

**选项：**
- `--open, -o`: 自动在浏览器中打开（默认：true）
- `--debug`: 启用调试模式（可选）

## 项目结构

```
src/
├── index.ts        # 主入口和核心类
├── cli.ts          # 命令行界面
├── types.ts        # 类型定义
├── config.ts       # 配置管理
├── utils/          # 工具函数
│   ├── errors.ts       # 错误处理
│   ├── logger.ts       # 日志工具
│   └── wechat-api.ts   # 微信 API 封装
└── plugins/        # 插件系统
    ├── index.ts        # 插件导出
    ├── markdown.ts     # Markdown 处理
    └── image.ts        # 图片处理

scripts/           # 脚本文件
├── publish.ts     # 发布脚本
└── preview.ts     # 预览脚本

example/           # 示例文件
└── demo-article.md
```

## 插件开发

### 创建自定义插件

```typescript
import { Plugin } from './src/types';

// 函数式插件
export const myPlugin: Plugin = async (article, context) => {
  // 自定义处理逻辑
  article.content = article.content.replace(/old/g, 'new');
  return article;
};
```

### 使用插件

```typescript
import { WeChatPublisher } from './src/index';
import { myPlugin } from './my-plugin';

const publisher = new WeChatPublisher();

// 发布时使用插件
await publisher.publish('article.md', {
  plugins: [myPlugin]
});
```

## API 文档

### WeChatPublisher

主要的发布器类，提供文章发布功能。

#### 方法

- `publish(filePath, options)`: 发布文章
- `preview(filePath)`: 生成预览
- `uploadImage(imagePath)`: 上传图片

#### 选项

```typescript
interface PublishOptions {
  title?: string;      // 文章标题
  author?: string;     // 作者
  digest?: string;     // 摘要
  coverImage?: string; // 封面图片路径
  isDraft?: boolean;   // 是否为草稿
  plugins?: Plugin[];  // 自定义插件
}
```

## 许可证

ISC
