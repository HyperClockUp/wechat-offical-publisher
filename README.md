# 微信公众号文章发布工具

> 🤖 **AI 协助开发项目** - 本项目由 AI 协助完成开发，展示了 AI 在软件开发中的强大能力

一个简洁易用的微信公众号文章自动发布工具，支持 Markdown 格式文章的自动转换和发布。

[![npm version](https://badge.fury.io/js/wechat-publisher.svg)](https://badge.fury.io/js/wechat-publisher)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js Version](https://img.shields.io/badge/node-%3E%3D16.0.0-brightgreen.svg)](https://nodejs.org/)
[![AI Assisted](https://img.shields.io/badge/AI-Assisted-brightgreen.svg)](https://github.com/wechat-publisher/wechat-publisher)

## 功能特性

- 📝 **支持 Markdown**: 自动将 Markdown 文件转换为微信公众号格式
- 🖼️ **图片自动处理**: 自动上传本地图片到微信素材库
- 🔄 **自动令牌管理**: 自动获取和刷新微信 access_token
- 📊 **草稿和发布**: 支持创建草稿或直接发布文章
- 🎨 **预览功能**: 本地预览文章效果，支持多种主题
- 🛠️ **命令行工具**: 简单易用的 CLI 界面
- 🔌 **插件系统**: 可扩展的函数式插件架构
- 🎭 **多主题支持**: 内置5套精美主题（默认、优雅、现代、温暖、可爱）
- ✅ **兼容性检查**: 自动检查微信公众号样式兼容性
- 📦 **NPM 包**: 支持全局安装和 npx 直接使用
- 🤖 **MCP 服务器**: 支持 Model Context Protocol，为 AI 助手提供微信发布能力

## 安装

### 全局安装（推荐）

```bash
npm install -g wechat-official-publisher
```

### 使用 npx（无需安装）

```bash
npx wechat-official-publisher --help
```

### 项目依赖安装

```bash
npm install wechat-official-publisher
# 或
yarn add wechat-official-publisher
# 或
pnpm add wechat-official-publisher
```

## 快速开始

### 1. 配置环境变量

创建 `.env` 文件或设置环境变量：

```env
WECHAT_APP_ID=your_app_id
WECHAT_APP_SECRET=your_app_secret
```

### 2. 基础使用

#### 使用 npx（推荐）

```bash
# 预览文章
npx wechat-official-publisher preview article.md

# 发布文章
npx wechat-official-publisher publish article.md --title "我的文章"

# 检查兼容性
npx wechat-official-publisher check article.md
```

#### 全局安装后使用

```bash
# 预览文章
wechat-official-publisher preview article.md

# 发布文章
wechat-official-publisher publish article.md --title "我的文章"

# 检查兼容性
wechat-official-publisher check article.md
```

## 使用示例

### 基础示例

```bash
# 预览 Markdown 文章
npx wechat-official-publisher preview my-article.md

# 发布文章到草稿箱
npx wechat-official-publisher publish my-article.md --draft

# 发布文章并指定标题
npx wechat-official-publisher publish my-article.md --title "我的第一篇文章"

# 使用指定主题预览
npx wechat-official-publisher preview my-article.md --theme elegant
```

### 高级示例

```bash
# 发布文章并指定所有选项
npx wechat-official-publisher publish article.md \
  --title "深度解析 TypeScript" \
  --author "张三" \
  --digest "本文详细介绍了 TypeScript 的核心特性" \
  --cover ./cover.jpg \
  --theme modern

# 批量检查多个文件的兼容性
npx wechat-official-publisher check *.md

# 使用配置文件
npx wechat-official-publisher publish article.md --config ./wechat.config.js
```

### 主题示例

```bash
# 使用不同主题预览
npx wechat-official-publisher preview article.md --theme default   # 默认主题
npx wechat-official-publisher preview article.md --theme elegant   # 优雅主题
npx wechat-official-publisher preview article.md --theme modern    # 现代主题
npx wechat-official-publisher preview article.md --theme warm      # 温暖主题
npx wechat-official-publisher preview article.md --theme cute      # 可爱主题
```

### MCP 服务器使用

本工具支持 [Model Context Protocol (MCP)](https://modelcontextprotocol.io/)，为 AI 助手提供微信文章发布能力。

```bash
# 启动 MCP 服务器
npx wechat-official-publisher mcp-server

# 启用调试模式
npx wechat-official-publisher mcp-server --debug

# 查看 MCP 服务器信息
npx wechat-official-publisher mcp-info
```

**MCP 工具功能：**
- `publish_article` - 发布文章到微信公众号
- `preview_article` - 预览文章效果
- `list_themes` - 获取可用主题列表
- `process_content` - 处理文章内容
- `get_config` - 获取配置信息

### MCP 客户端配置

在 MCP 客户端（如 Claude Desktop）中配置此服务器，需要在配置文件中添加以下 JSON 配置：

```json
{
  "mcpServers": {
    "wechat-official-publisher": {
      "command": "npx",
      "args": [
        "wechat-official-publisher",
        "mcp-server"
      ],
      "env": {
        "WECHAT_APP_ID": "your_wechat_app_id",
        "WECHAT_APP_SECRET": "your_wechat_app_secret"
      }
    }
  }
}
```

**配置说明：**
- `command`: 使用 `npx` 来运行工具
- `args`: 传递给命令的参数，启动 MCP 服务器
- `env`: 环境变量配置
  - `WECHAT_APP_ID`: 你的微信公众号 AppID
  - `WECHAT_APP_SECRET`: 你的微信公众号 AppSecret

**Claude Desktop 配置位置：**
- **Windows**: `%APPDATA%\Claude\claude_desktop_config.json`
- **macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
- **Linux**: `~/.config/claude/claude_desktop_config.json`

配置完成后重启 Claude Desktop，即可在对话中使用微信公众号发布功能。

详细的 MCP 服务器使用说明请参考：[MCP Server 文档](./docs/MCP_SERVER.md)

## 命令行选项

### 发布命令 (publish)

```bash
npx wechat-official-publisher publish <file> [options]
```

**选项：**
- `--title, -t <title>`: 文章标题（可选，默认从文件提取）
- `--author, -a <author>`: 作者（可选）
- `--digest, -d <digest>`: 摘要（可选）
- `--cover, -c <path>`: 封面图片路径（可选）
- `--theme <theme>`: 使用的主题（default/elegant/modern/warm/cute）
- `--draft`: 仅创建草稿，不发布（可选）
- `--config <path>`: 配置文件路径（可选）
- `--debug`: 启用调试模式（可选）

### 预览命令 (preview)

```bash
npx wechat-official-publisher preview <file> [options]
```

**选项：**
- `--theme <theme>`: 使用的主题（default/elegant/modern/warm/cute）
- `--open, -o`: 自动在浏览器中打开（默认：true）
- `--output, -O <path>`: 指定输出文件路径（可选）
- `--debug`: 启用调试模式（可选）

### 兼容性检查命令 (check)

```bash
npx wechat-official-publisher check <file> [options]
```

**选项：**
- `--theme <theme>`: 检查指定主题的兼容性
- `--fix`: 自动修复兼容性问题（可选）
- `--output <path>`: 输出检查报告（可选）

### MCP 服务器命令

#### 启动 MCP 服务器 (mcp-server)

```bash
npx wechat-official-publisher mcp-server [options]
```

**选项：**
- `--debug`: 启用调试模式（可选）
- `--transport, -t <type>`: 传输协议类型（stdio/http，默认：stdio）
- `--port, -p <port>`: 服务器端口（仅HTTP模式有效）

#### 查看 MCP 服务器信息 (mcp-info)

```bash
npx wechat-official-publisher mcp-info
```

显示 MCP 服务器的详细信息，包括可用工具、配置要求和使用方法。

## 配置文件

### 环境变量配置

创建 `.env` 文件：

```env
# 微信公众号配置
WECHAT_APP_ID=your_app_id
WECHAT_APP_SECRET=your_app_secret

# 可选配置
DEBUG=false
DEFAULT_THEME=default
PUBLISH_TO_DRAFT=false
```

### 配置文件 (wechat.config.js)

```javascript
module.exports = {
  appId: process.env.WECHAT_APP_ID,
  appSecret: process.env.WECHAT_APP_SECRET,
  debug: false,
  publishToDraft: false,
  theme: 'elegant',
  
  // 自定义插件
  plugins: [
    // 自定义处理函数
    async (article, context) => {
      // 自定义逻辑
      return article;
    }
  ]
};
```

## Markdown 示例

创建一个示例文章 `my-article.md`：

```markdown
# 我的第一篇微信文章

这是一篇使用 **wechat-official-publisher** 发布的文章。

## 功能特性

- 支持 Markdown 语法
- 自动图片上传
- 多种主题选择

### 代码示例

\`\`\`javascript
console.log('Hello WeChat!');
\`\`\`

### 图片支持

![示例图片](./image.jpg)

> 这是一个引用块，用于突出重要内容。

## 表格支持

| 功能 | 支持 | 说明 |
|------|------|------|
| Markdown | ✅ | 完整支持 |
| 图片上传 | ✅ | 自动处理 |
| 主题切换 | ✅ | 5套主题 |
```

然后使用命令发布：

```bash
npx wechat-official-publisher publish my-article.md --theme elegant
```

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

## Node.js 编程使用

本项目完全支持通过 Node.js 编程方式引用和运行，提供了完整的 API 接口。

### 安装和导入

```bash
npm install wechat-official-publisher
```

```javascript
// CommonJS
const { WeChatPublisher, createPublisher } = require('wechat-official-publisher');

// ES Modules
import { WeChatPublisher, createPublisher } from 'wechat-official-publisher';
```

### 基础使用

```javascript
const { WeChatPublisher } = require('wechat-official-publisher');

// 创建发布器实例
const publisher = new WeChatPublisher({
  appId: process.env.WECHAT_APP_ID,
  appSecret: process.env.WECHAT_APP_SECRET,
  debug: false,
  publishToDraft: true, // 默认发布到草稿箱
  theme: 'elegant' // 使用优雅主题
});

// 发布文章
async function publishArticle() {
  try {
    const result = await publisher.publish('./my-article.md', {
      title: '我的第一篇文章',
      author: '张三',
      digest: '这是一篇关于技术分享的文章',
      coverImage: './cover.jpg',
      draft: false // 直接发布，不保存为草稿
    });
    
    console.log('发布成功:', result);
    // 输出: { success: true, mediaId: 'xxx', title: '...', message: '发布成功' }
  } catch (error) {
    console.error('发布失败:', error.message);
  }
}

publishArticle();
```

### 完整的 API 方法

#### 1. 发布文章 - `publish(filePath, options)`

```javascript
const result = await publisher.publish('./article.md', {
  title: '自定义标题',        // 可选，默认从 Markdown 文件提取
  author: '作者名',          // 可选
  digest: '文章摘要',        // 可选，默认自动生成
  coverImage: './cover.jpg', // 可选，封面图片路径
  draft: false              // 可选，true=草稿，false=直接发布
});

console.log(result);
// {
//   success: true,
//   mediaId: 'media_id_from_wechat',
//   title: '文章标题',
//   content: '处理后的HTML内容',
//   message: '发布成功',
//   url: 'https://mp.weixin.qq.com/...'
// }
```

#### 2. 预览文章 - `preview(filePath)`

```javascript
// 生成预览文件
const previewPath = await publisher.preview('./article.md');
console.log('预览文件路径:', previewPath);
// 输出: ./preview/1234567890.html

// 可以用浏览器打开预览文件
const open = require('open');
open(previewPath);
```

#### 3. 内容处理 - `processContent(content)`

```javascript
// 处理 Markdown 内容（应用主题和插件）
const markdownContent = '# 标题\n\n这是内容';
const processedHtml = await publisher.processContent(markdownContent);
console.log(processedHtml); // 输出处理后的 HTML
```

### 高级用法

#### 批量发布文章

```javascript
const fs = require('fs');
const path = require('path');
const { WeChatPublisher } = require('wechat-official-publisher');

const publisher = new WeChatPublisher({
  appId: process.env.WECHAT_APP_ID,
  appSecret: process.env.WECHAT_APP_SECRET,
  debug: true
});

async function batchPublish() {
  const articlesDir = './articles';
  const files = fs.readdirSync(articlesDir)
    .filter(file => file.endsWith('.md'));
  
  const results = [];
  
  for (const file of files) {
    try {
      console.log(`正在发布: ${file}`);
      
      const result = await publisher.publish(path.join(articlesDir, file), {
        draft: true, // 先发布到草稿箱
        author: '技术团队'
      });
      
      results.push({ file, success: true, result });
      console.log(`✅ ${file} 发布成功`);
      
      // 避免频率限制，添加延迟
      await new Promise(resolve => setTimeout(resolve, 2000));
      
    } catch (error) {
      results.push({ file, success: false, error: error.message });
      console.error(`❌ ${file} 发布失败:`, error.message);
    }
  }
  
  // 输出汇总报告
  console.log('\n📊 发布汇总:');
  console.log(`总计: ${results.length} 篇文章`);
  console.log(`成功: ${results.filter(r => r.success).length} 篇`);
  console.log(`失败: ${results.filter(r => !r.success).length} 篇`);
  
  return results;
}

batchPublish();
```

#### 自定义插件处理

```javascript
const { WeChatPublisher } = require('wechat-official-publisher');

// 创建带有自定义配置的发布器
const publisher = new WeChatPublisher({
  appId: process.env.WECHAT_APP_ID,
  appSecret: process.env.WECHAT_APP_SECRET,
  theme: 'modern'
});

// 自定义内容处理
async function customPublish() {
  const filePath = './article.md';
  
  // 1. 先处理内容（应用主题和插件）
  const fs = require('fs');
  const rawContent = fs.readFileSync(filePath, 'utf-8');
  const processedContent = await publisher.processContent(rawContent);
  
  // 2. 可以在这里添加自定义处理逻辑
  // 比如添加统计代码、修改样式等
  const customizedContent = processedContent
    .replace(/<\/body>/g, '<script>console.log("文章已加载");</script></body>');
  
  // 3. 直接发布处理后的内容
  const result = await publisher.publish(filePath, {
    title: '自定义处理的文章',
    digest: '这篇文章经过了自定义处理'
  });
  
  return result;
}
```

#### 错误处理和重试机制

```javascript
const { WeChatPublisher } = require('wechat-official-publisher');

class RobustPublisher {
  constructor(config) {
    this.publisher = new WeChatPublisher(config);
    this.maxRetries = 3;
    this.retryDelay = 5000; // 5秒
  }
  
  async publishWithRetry(filePath, options = {}) {
    let lastError;
    
    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      try {
        console.log(`尝试发布 (${attempt}/${this.maxRetries}): ${filePath}`);
        
        const result = await this.publisher.publish(filePath, options);
        console.log(`✅ 发布成功 (第${attempt}次尝试)`);
        return result;
        
      } catch (error) {
        lastError = error;
        console.error(`❌ 第${attempt}次尝试失败:`, error.message);
        
        if (attempt < this.maxRetries) {
          console.log(`⏳ ${this.retryDelay/1000}秒后重试...`);
          await new Promise(resolve => setTimeout(resolve, this.retryDelay));
        }
      }
    }
    
    throw new Error(`发布失败，已重试${this.maxRetries}次: ${lastError.message}`);
  }
}

// 使用示例
const robustPublisher = new RobustPublisher({
  appId: process.env.WECHAT_APP_ID,
  appSecret: process.env.WECHAT_APP_SECRET
});

robustPublisher.publishWithRetry('./important-article.md')
  .then(result => console.log('最终发布成功:', result))
  .catch(error => console.error('最终发布失败:', error));
```

### TypeScript 支持

```typescript
import { 
  WeChatPublisher, 
  PublishOptions, 
  PublishResult, 
  Config 
} from 'wechat-official-publisher';

// 类型安全的配置
const config: Config = {
  appId: process.env.WECHAT_APP_ID!,
  appSecret: process.env.WECHAT_APP_SECRET!,
  debug: false,
  publishToDraft: true,
  theme: 'elegant'
};

const publisher = new WeChatPublisher(config);

// 类型安全的发布选项
const options: PublishOptions = {
  title: '技术分享',
  author: '开发团队',
  digest: '深入探讨前端技术',
  coverImage: './cover.jpg',
  draft: false
};

// 类型安全的结果处理
async function typedPublish(): Promise<PublishResult> {
  try {
    const result: PublishResult = await publisher.publish('./article.md', options);
    
    if (result.success) {
      console.log(`发布成功: ${result.title}`);
      console.log(`媒体ID: ${result.mediaId}`);
      console.log(`访问链接: ${result.url}`);
    }
    
    return result;
  } catch (error) {
    console.error('发布失败:', error);
    throw error;
  }
}

typedPublish();
```

### 实际应用场景

#### 1. 集成到 Express 服务器

```javascript
const express = require('express');
const multer = require('multer');
const { WeChatPublisher } = require('wechat-official-publisher');

const app = express();
const upload = multer({ dest: 'uploads/' });

// 创建发布器实例
const publisher = new WeChatPublisher({
  appId: process.env.WECHAT_APP_ID,
  appSecret: process.env.WECHAT_APP_SECRET,
  debug: process.env.NODE_ENV === 'development'
});

// 发布文章接口
app.post('/api/publish', upload.single('markdown'), async (req, res) => {
  try {
    const { title, author, digest, theme = 'default' } = req.body;
    const filePath = req.file.path;
    
    // 发布文章
    const result = await publisher.publish(filePath, {
      title,
      author,
      digest,
      draft: true // 先发布到草稿箱
    });
    
    res.json({
      success: true,
      data: result,
      message: '文章发布成功'
    });
    
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// 预览文章接口
app.post('/api/preview', upload.single('markdown'), async (req, res) => {
  try {
    const filePath = req.file.path;
    const previewPath = await publisher.preview(filePath);
    
    res.json({
      success: true,
      previewUrl: `/preview/${path.basename(previewPath)}`
    });
    
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// 静态文件服务
app.use('/preview', express.static('preview'));

app.listen(3000, () => {
  console.log('微信发布服务器启动在端口 3000');
});
```

#### 2. 定时发布任务

```javascript
const cron = require('node-cron');
const fs = require('fs');
const path = require('path');
const { WeChatPublisher } = require('wechat-official-publisher');

const publisher = new WeChatPublisher({
  appId: process.env.WECHAT_APP_ID,
  appSecret: process.env.WECHAT_APP_SECRET
});

// 每天上午 9 点自动发布
cron.schedule('0 9 * * *', async () => {
  console.log('开始执行定时发布任务...');
  
  try {
    const scheduledDir = './scheduled-articles';
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    const todayFile = path.join(scheduledDir, `${today}.md`);
    
    if (fs.existsSync(todayFile)) {
      console.log(`发现今日文章: ${todayFile}`);
      
      const result = await publisher.publish(todayFile, {
        draft: false, // 直接发布
        author: '自动发布系统'
      });
      
      console.log('✅ 定时发布成功:', result.title);
      
      // 发布成功后移动文件到已发布目录
      const publishedDir = './published-articles';
      if (!fs.existsSync(publishedDir)) {
        fs.mkdirSync(publishedDir, { recursive: true });
      }
      
      fs.renameSync(todayFile, path.join(publishedDir, `${today}.md`));
      
    } else {
      console.log('今日无预定发布文章');
    }
    
  } catch (error) {
    console.error('❌ 定时发布失败:', error.message);
    
    // 可以在这里添加错误通知逻辑
    // 比如发送邮件、钉钉通知等
  }
});

console.log('定时发布任务已启动');
```

### 工厂函数使用

```javascript
const { createPublisher } = require('wechat-official-publisher');

// 使用工厂函数创建发布器
const publisher = createPublisher({
  appId: process.env.WECHAT_APP_ID,
  appSecret: process.env.WECHAT_APP_SECRET,
  theme: 'modern'
});

// 直接使用
publisher.publish('./article.md', { title: '快速发布' })
  .then(result => console.log('发布成功:', result))
  .catch(error => console.error('发布失败:', error));
```

### 快速开始示例

创建一个简单的 Node.js 脚本来发布文章：

```javascript
// publish-script.js
require('dotenv').config();
const { WeChatPublisher } = require('wechat-official-publisher');

async function main() {
  // 创建发布器
  const publisher = new WeChatPublisher({
    appId: process.env.WECHAT_APP_ID,
    appSecret: process.env.WECHAT_APP_SECRET,
    debug: true
  });
  
  try {
    // 发布文章
    console.log('开始发布文章...');
    const result = await publisher.publish('./my-article.md', {
      title: '我的第一篇文章',
      author: '作者名',
      draft: true // 先发布到草稿箱
    });
    
    console.log('✅ 发布成功!');
    console.log('文章标题:', result.title);
    console.log('媒体ID:', result.mediaId);
    
  } catch (error) {
    console.error('❌ 发布失败:', error.message);
  }
}

// 运行脚本
main();
```

然后运行：

```bash
node publish-script.js
```

## 总结

**本项目完全支持 Node.js 编程方式使用**，提供了以下核心功能：

- ✅ **完整的 API 接口**：`publish()`, `preview()`, `processContent()`
- ✅ **TypeScript 支持**：完整的类型定义
- ✅ **灵活的配置**：支持多种配置方式
- ✅ **错误处理**：详细的错误信息和异常处理
- ✅ **实际应用场景**：Web 服务器、定时任务、CMS 集成
- ✅ **批量处理**：支持批量发布和处理
- ✅ **主题系统**：5套内置主题，支持自定义

无论是简单的脚本使用，还是复杂的企业级应用集成，都能满足需求。

## 主题系统

### 内置主题

| 主题名称 | 描述 | 适用场景 |
|---------|------|----------|
| `default` | 默认主题 | 通用文章 |
| `elegant` | 优雅主题 | 商务、正式文章 |
| `modern` | 现代主题 | 科技、创新类文章 |
| `warm` | 温暖主题 | 生活、情感类文章 |
| `cute` | 可爱主题 | 轻松、有趣的内容 |

### 自定义主题

```javascript
const { ThemeManager } = require('wechat-official-publisher');

// 注册自定义主题
ThemeManager.registerTheme('my-theme', {
  name: 'my-theme',
  displayName: '我的主题',
  description: '自定义主题描述',
  styles: {
    body: {
      fontFamily: 'PingFang SC, Helvetica Neue, sans-serif',
      fontSize: '16px',
      lineHeight: '1.6',
      color: '#333333'
    },
    headings: {
      h1: { fontSize: '24px', color: '#2c3e50' },
      h2: { fontSize: '20px', color: '#34495e' },
      h3: { fontSize: '18px', color: '#7f8c8d' }
    },
    // ... 更多样式配置
  }
});

// 使用自定义主题
await publisher.publishArticle({
  filePath: './article.md',
  theme: 'my-theme'
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

## 故障排除

### 常见问题

#### 1. 认证失败

```
Error: 微信认证失败，请检查 AppID 和 AppSecret
```

**解决方案：**
- 检查 `.env` 文件中的 `WECHAT_APP_ID` 和 `WECHAT_APP_SECRET` 是否正确
- 确认微信公众号已开通相关权限
- 检查网络连接是否正常

#### 2. 图片上传失败

```
Error: 图片上传失败，文件格式不支持
```

**解决方案：**
- 确保图片格式为 JPG、PNG 或 GIF
- 检查图片文件大小不超过 10MB
- 确认图片文件路径正确

#### 3. 主题不存在

```
Error: 主题 'xxx' 不存在
```

**解决方案：**
- 使用 `npx wechat-official-publisher --list-themes` 查看可用主题
- 检查主题名称拼写是否正确
- 如果是自定义主题，确认已正确注册

### 调试模式

启用调试模式获取详细日志：

```bash
# 命令行启用调试
npx wechat-official-publisher publish article.md --debug

# 环境变量启用调试
DEBUG=true npx wechat-official-publisher publish article.md
```

## 开发

### 本地开发

```bash
# 克隆项目
git clone https://github.com/wechat-official-publisher/wechat-official-publisher.git
cd wechat-official-publisher

# 安装依赖
npm install

# 运行测试
npm test

# 测试覆盖率
npm run test:coverage

# 类型检查
npm run type-check

# 代码格式化
npm run format

# 构建项目
npm run build
```

### 开发规范

- 遵循现有的代码风格
- 添加适当的测试用例
- 更新相关文档
- 确保所有测试通过

## 更新日志

### [0.0.9] - 未发布

#### Added
- 支持通过工具参数传递 `appId` 和 `appSecret`（优先于环境变量）。
- 添加SSE传输协议的MCP服务器。
- 更新CLI以支持SSE模式。
- 添加SSE客户端示例和配置文件。
- 更新文档以包含SSE使用说明。

#### Fixed
- 修复配置类型错误。

### [0.0.8] - 2023-12-01

#### Added
- 初始版本，支持微信公众号文章发布。
- MCP服务器支持（stdio模式）。
- 主题和插件系统。
- 预览功能。

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

## Node.js 编程使用

本项目完全支持通过 Node.js 编程方式引用和运行，提供了完整的 API 接口。

### 安装和导入

```bash
npm install wechat-official-publisher
```

```javascript
// CommonJS
const { WeChatPublisher, createPublisher } = require('wechat-official-publisher');

// ES Modules
import { WeChatPublisher, createPublisher } from 'wechat-official-publisher';
```

### 基础使用

```javascript
const { WeChatPublisher } = require('wechat-official-publisher');

// 创建发布器实例
const publisher = new WeChatPublisher({
  appId: process.env.WECHAT_APP_ID,
  appSecret: process.env.WECHAT_APP_SECRET,
  debug: false,
  publishToDraft: true, // 默认发布到草稿箱
  theme: 'elegant' // 使用优雅主题
});

// 发布文章
async function publishArticle() {
  try {
    const result = await publisher.publish('./my-article.md', {
      title: '我的第一篇文章',
      author: '张三',
      digest: '这是一篇关于技术分享的文章',
      coverImage: './cover.jpg',
      draft: false // 直接发布，不保存为草稿
    });
    
    console.log('发布成功:', result);
    // 输出: { success: true, mediaId: 'xxx', title: '...', message: '发布成功' }
  } catch (error) {
    console.error('发布失败:', error.message);
  }
}

publishArticle();
```

### 完整的 API 方法

#### 1. 发布文章 - `publish(filePath, options)`

```javascript
const result = await publisher.publish('./article.md', {
  title: '自定义标题',        // 可选，默认从 Markdown 文件提取
  author: '作者名',          // 可选
  digest: '文章摘要',        // 可选，默认自动生成
  coverImage: './cover.jpg', // 可选，封面图片路径
  draft: false              // 可选，true=草稿，false=直接发布
});

console.log(result);
// {
//   success: true,
//   mediaId: 'media_id_from_wechat',
//   title: '文章标题',
//   content: '处理后的HTML内容',
//   message: '发布成功',
//   url: 'https://mp.weixin.qq.com/...'
// }
```

#### 2. 预览文章 - `preview(filePath)`

```javascript
// 生成预览文件
const previewPath = await publisher.preview('./article.md');
console.log('预览文件路径:', previewPath);
// 输出: ./preview/1234567890.html

// 可以用浏览器打开预览文件
const open = require('open');
open(previewPath);
```

#### 3. 内容处理 - `processContent(content)`

```javascript
// 处理 Markdown 内容（应用主题和插件）
const markdownContent = '# 标题\n\n这是内容';
const processedHtml = await publisher.processContent(markdownContent);
console.log(processedHtml); // 输出处理后的 HTML
```

### 高级用法

#### 批量发布文章

```javascript
const fs = require('fs');
const path = require('path');
const { WeChatPublisher } = require('wechat-official-publisher');

const publisher = new WeChatPublisher({
  appId: process.env.WECHAT_APP_ID,
  appSecret: process.env.WECHAT_APP_SECRET,
  debug: true
});

async function batchPublish() {
  const articlesDir = './articles';
  const files = fs.readdirSync(articlesDir)
    .filter(file => file.endsWith('.md'));
  
  const results = [];
  
  for (const file of files) {
    try {
      console.log(`正在发布: ${file}`);
      
      const result = await publisher.publish(path.join(articlesDir, file), {
        draft: true, // 先发布到草稿箱
        author: '技术团队'
      });
      
      results.push({ file, success: true, result });
      console.log(`✅ ${file} 发布成功`);
      
      // 避免频率限制，添加延迟
      await new Promise(resolve => setTimeout(resolve, 2000));
      
    } catch (error) {
      results.push({ file, success: false, error: error.message });
      console.error(`❌ ${file} 发布失败:`, error.message);
    }
  }
  
  // 输出汇总报告
  console.log('\n📊 发布汇总:');
  console.log(`总计: ${results.length} 篇文章`);
  console.log(`成功: ${results.filter(r => r.success).length} 篇`);
  console.log(`失败: ${results.filter(r => !r.success).length} 篇`);
  
  return results;
}

batchPublish();
```

#### 自定义插件处理

```javascript
const { WeChatPublisher } = require('wechat-official-publisher');

// 创建带有自定义配置的发布器
const publisher = new WeChatPublisher({
  appId: process.env.WECHAT_APP_ID,
  appSecret: process.env.WECHAT_APP_SECRET,
  theme: 'modern'
});

// 自定义内容处理
async function customPublish() {
  const filePath = './article.md';
  
  // 1. 先处理内容（应用主题和插件）
  const fs = require('fs');
  const rawContent = fs.readFileSync(filePath, 'utf-8');
  const processedContent = await publisher.processContent(rawContent);
  
  // 2. 可以在这里添加自定义处理逻辑
  // 比如添加统计代码、修改样式等
  const customizedContent = processedContent
    .replace(/<\/body>/g, '<script>console.log("文章已加载");</script></body>');
  
  // 3. 直接发布处理后的内容
  const result = await publisher.publish(filePath, {
    title: '自定义处理的文章',
    digest: '这篇文章经过了自定义处理'
  });
  
  return result;
}
```

#### 错误处理和重试机制

```javascript
const { WeChatPublisher } = require('wechat-official-publisher');

class RobustPublisher {
  constructor(config) {
    this.publisher = new WeChatPublisher(config);
    this.maxRetries = 3;
    this.retryDelay = 5000; // 5秒
  }
  
  async publishWithRetry(filePath, options = {}) {
    let lastError;
    
    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      try {
        console.log(`尝试发布 (${attempt}/${this.maxRetries}): ${filePath}`);
        
        const result = await this.publisher.publish(filePath, options);
        console.log(`✅ 发布成功 (第${attempt}次尝试)`);
        return result;
        
      } catch (error) {
        lastError = error;
        console.error(`❌ 第${attempt}次尝试失败:`, error.message);
        
        if (attempt < this.maxRetries) {
          console.log(`⏳ ${this.retryDelay/1000}秒后重试...`);
          await new Promise(resolve => setTimeout(resolve, this.retryDelay));
        }
      }
    }
    
    throw new Error(`发布失败，已重试${this.maxRetries}次: ${lastError.message}`);
  }
}

// 使用示例
const robustPublisher = new RobustPublisher({
  appId: process.env.WECHAT_APP_ID,
  appSecret: process.env.WECHAT_APP_SECRET
});

robustPublisher.publishWithRetry('./important-article.md')
  .then(result => console.log('最终发布成功:', result))
  .catch(error => console.error('最终发布失败:', error));
```

### TypeScript 支持

```typescript
import { 
  WeChatPublisher, 
  PublishOptions, 
  PublishResult, 
  Config 
} from 'wechat-official-publisher';

// 类型安全的配置
const config: Config = {
  appId: process.env.WECHAT_APP_ID!,
  appSecret: process.env.WECHAT_APP_SECRET!,
  debug: false,
  publishToDraft: true,
  theme: 'elegant'
};

const publisher = new WeChatPublisher(config);

// 类型安全的发布选项
const options: PublishOptions = {
  title: '技术分享',
  author: '开发团队',
  digest: '深入探讨前端技术',
  coverImage: './cover.jpg',
  draft: false
};

// 类型安全的结果处理
async function typedPublish(): Promise<PublishResult> {
  try {
    const result: PublishResult = await publisher.publish('./article.md', options);
    
    if (result.success) {
      console.log(`发布成功: ${result.title}`);
      console.log(`媒体ID: ${result.mediaId}`);
      console.log(`访问链接: ${result.url}`);
    }
    
    return result;
  } catch (error) {
    console.error('发布失败:', error);
    throw error;
  }
}

typedPublish();
```

### 实际应用场景

#### 1. 集成到 Express 服务器

```javascript
const express = require('express');
const multer = require('multer');
const { WeChatPublisher } = require('wechat-official-publisher');

const app = express();
const upload = multer({ dest: 'uploads/' });

// 创建发布器实例
const publisher = new WeChatPublisher({
  appId: process.env.WECHAT_APP_ID,
  appSecret: process.env.WECHAT_APP_SECRET,
  debug: process.env.NODE_ENV === 'development'
});

// 发布文章接口
app.post('/api/publish', upload.single('markdown'), async (req, res) => {
  try {
    const { title, author, digest, theme = 'default' } = req.body;
    const filePath = req.file.path;
    
    // 发布文章
    const result = await publisher.publish(filePath, {
      title,
      author,
      digest,
      draft: true // 先发布到草稿箱
    });
    
    res.json({
      success: true,
      data: result,
      message: '文章发布成功'
    });
    
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// 预览文章接口
app.post('/api/preview', upload.single('markdown'), async (req, res) => {
  try {
    const filePath = req.file.path;
    const previewPath = await publisher.preview(filePath);
    
    res.json({
      success: true,
      previewUrl: `/preview/${path.basename(previewPath)}`
    });
    
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// 静态文件服务
app.use('/preview', express.static('preview'));

app.listen(3000, () => {
  console.log('微信发布服务器启动在端口 3000');
});
```

#### 2. 定时发布任务

```javascript
const cron = require('node-cron');
const fs = require('fs');
const path = require('path');
const { WeChatPublisher } = require('wechat-official-publisher');

const publisher = new WeChatPublisher({
  appId: process.env.WECHAT_APP_ID,
  appSecret: process.env.WECHAT_APP_SECRET
});

// 每天上午 9 点自动发布
cron.schedule('0 9 * * *', async () => {
  console.log('开始执行定时发布任务...');
  
  try {
    const scheduledDir = './scheduled-articles';
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    const todayFile = path.join(scheduledDir, `${today}.md`);
    
    if (fs.existsSync(todayFile)) {
      console.log(`发现今日文章: ${todayFile}`);
      
      const result = await publisher.publish(todayFile, {
        draft: false, // 直接发布
        author: '自动发布系统'
      });
      
      console.log('✅ 定时发布成功:', result.title);
      
      // 发布成功后移动文件到已发布目录
      const publishedDir = './published-articles';
      if (!fs.existsSync(publishedDir)) {
        fs.mkdirSync(publishedDir, { recursive: true });
      }
      
      fs.renameSync(todayFile, path.join(publishedDir, `${today}.md`));
      
    } else {
      console.log('今日无预定发布文章');
    }
    
  } catch (error) {
    console.error('❌ 定时发布失败:', error.message);
    
    // 可以在这里添加错误通知逻辑
    // 比如发送邮件、钉钉通知等
  }
});

console.log('定时发布任务已启动');
```

### 工厂函数使用

```javascript
const { createPublisher } = require('wechat-official-publisher');

// 使用工厂函数创建发布器
const publisher = createPublisher({
  appId: process.env.WECHAT_APP_ID,
  appSecret: process.env.WECHAT_APP_SECRET,
  theme: 'modern'
});

// 直接使用
publisher.publish('./article.md', { title: '快速发布' })
  .then(result => console.log('发布成功:', result))
  .catch(error => console.error('发布失败:', error));
```

### 快速开始示例

创建一个简单的 Node.js 脚本来发布文章：

```javascript
// publish-script.js
require('dotenv').config();
const { WeChatPublisher } = require('wechat-official-publisher');

async function main() {
  // 创建发布器
  const publisher = new WeChatPublisher({
    appId: process.env.WECHAT_APP_ID,
    appSecret: process.env.WECHAT_APP_SECRET,
    debug: true
  });
  
  try {
    // 发布文章
    console.log('开始发布文章...');
    const result = await publisher.publish('./my-article.md', {
      title: '我的第一篇文章',
      author: '作者名',
      draft: true // 先发布到草稿箱
    });
    
    console.log('✅ 发布成功!');
    console.log('文章标题:', result.title);
    console.log('媒体ID:', result.mediaId);
    
  } catch (error) {
    console.error('❌ 发布失败:', error.message);
  }
}

// 运行脚本
main();
```

然后运行：

```bash
node publish-script.js
```

## 总结

**本项目完全支持 Node.js 编程方式使用**，提供了以下核心功能：

- ✅ **完整的 API 接口**：`publish()`, `preview()`, `processContent()`
- ✅ **TypeScript 支持**：完整的类型定义
- ✅ **灵活的配置**：支持多种配置方式
- ✅ **错误处理**：详细的错误信息和异常处理
- ✅ **实际应用场景**：Web 服务器、定时任务、CMS 集成
- ✅ **批量处理**：支持批量发布和处理
- ✅ **主题系统**：5套内置主题，支持自定义

无论是简单的脚本使用，还是复杂的企业级应用集成，都能满足需求。

## 主题系统

### 内置主题

| 主题名称 | 描述 | 适用场景 |
|---------|------|----------|
| `default` | 默认主题 | 通用文章 |
| `elegant` | 优雅主题 | 商务、正式文章 |
| `modern` | 现代主题 | 科技、创新类文章 |
| `warm` | 温暖主题 | 生活、情感类文章 |
| `cute` | 可爱主题 | 轻松、有趣的内容 |

### 自定义主题

```javascript
const { ThemeManager } = require('wechat-official-publisher');

// 注册自定义主题
ThemeManager.registerTheme('my-theme', {
  name: 'my-theme',
  displayName: '我的主题',
  description: '自定义主题描述',
  styles: {
    body: {
      fontFamily: 'PingFang SC, Helvetica Neue, sans-serif',
      fontSize: '16px',
      lineHeight: '1.6',
      color: '#333333'
    },
    headings: {
      h1: { fontSize: '24px', color: '#2c3e50' },
      h2: { fontSize: '20px', color: '#34495e' },
      h3: { fontSize: '18px', color: '#7f8c8d' }
    },
    // ... 更多样式配置
  }
});

// 使用自定义主题
await publisher.publishArticle({
  filePath: './article.md',
  theme: 'my-theme'
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

## 故障排除

### 常见问题

#### 1. 认证失败

```
Error: 微信认证失败，请检查 AppID 和 AppSecret
```

**解决方案：**
- 检查 `.env` 文件中的 `WECHAT_APP_ID` 和 `WECHAT_APP_SECRET` 是否正确
- 确认微信公众号已开通相关权限
- 检查网络连接是否正常

#### 2. 图片上传失败

```
Error: 图片上传失败，文件格式不支持
```

**解决方案：**
- 确保图片格式为 JPG、PNG 或 GIF
- 检查图片文件大小不超过 10MB
- 确认图片文件路径正确

#### 3. 主题不存在

```
Error: 主题 'xxx' 不存在
```

**解决方案：**
- 使用 `npx wechat-official-publisher --list-themes` 查看可用主题
- 检查主题名称拼写是否正确
- 如果是自定义主题，确认已正确注册

### 调试模式

启用调试模式获取详细日志：

```bash
# 命令行启用调试
npx wechat-official-publisher publish article.md --debug

# 环境变量启用调试
DEBUG=true npx wechat-official-publisher publish article.md
```

## 开发

### 本地开发

```bash
# 克隆项目
git clone https://github.com/wechat-official-publisher/wechat-official-publisher.git
cd wechat-official-publisher

# 安装依赖
npm install

# 运行测试
npm test

# 测试覆盖率
npm run test:coverage

# 类型检查
npm run type-check

# 代码格式化
npm run format

# 构建项目
npm run build
```

### 开发规范

- 遵循现有的代码风格
- 添加适当的测试用例
- 更新相关文档
- 确保所有测试通过

## 更新日志

查看 [CHANGELOG.md](CHANGELOG.md) 了解版本更新历史。

## 许可证

MIT License - 详见 [LICENSE](LICENSE) 文件。

## 支持

如果这个项目对你有帮助，请给我们一个 ⭐️！

### 联系我们

- 📧 **邮箱**：cfx_software@163.com

---

## 🤖 AI 协助开发说明

本项目是一个展示 AI 协助软件开发能力的完整案例，AI 在以下方面提供了重要贡献：

### 🔧 技术架构设计
- **模块化架构**：设计了清晰的插件系统和主题系统
- **TypeScript 类型系统**：完整的类型定义和接口设计
- **错误处理机制**：统一的错误处理和日志系统

### 💻 代码实现
- **核心功能开发**：微信 API 集成、Markdown 处理、图片上传等
- **主题系统**：5套精美主题的样式设计和实现
- **CLI 工具**：命令行界面和参数处理
- **测试用例**：完整的单元测试和集成测试

### 📚 文档编写
- **详细的 README**：包含安装、使用、API 文档等
- **代码注释**：清晰的函数和类注释
- **示例代码**：丰富的使用示例和最佳实践

### 🛠️ 工程化配置
- **构建配置**：TypeScript、Jest、ESLint 等工具配置
- **CI/CD 流程**：自动化测试和发布流程
- **包管理**：NPM 包配置和发布准备

### 🎯 项目特色
- **完整性**：从需求分析到代码实现到文档编写的全流程
- **专业性**：遵循最佳实践和行业标准
- **可维护性**：清晰的代码结构和完善的测试覆盖
- **易用性**：友好的 API 设计和详细的使用指南

这个项目证明了 AI 可以在软件开发的各个环节提供高质量的协助，从架构设计到代码实现，从测试编写到文档完善，展现了 AI 在现代软件开发中的巨大潜力。

---

**Made with ❤️ and 🤖 AI assistance by the WeChat Publisher Team**
