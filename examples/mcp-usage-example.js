#!/usr/bin/env node

/**
 * MCP Server 使用示例
 * 展示如何在 Node.js 中使用 WeChat Official Publisher 的 MCP 功能
 */

const { spawn } = require('child_process');
const { writeFileSync, existsSync, unlinkSync } = require('fs');
const path = require('path');

// 示例文章内容
const sampleArticle = `# 使用 MCP 发布的文章

这是一篇通过 MCP (Model Context Protocol) 服务器发布的示例文章。

## 功能特性

- 🚀 **自动发布**: 通过 MCP 工具自动发布到微信公众号
- 🎨 **主题支持**: 支持多种精美主题
- 📝 **Markdown**: 完整支持 Markdown 语法
- 🖼️ **图片处理**: 自动上传和处理图片

## 代码示例

\`\`\`javascript
// 使用 MCP 工具发布文章
const result = await mcpClient.callTool('publish_article', {
  filePath: './my-article.md',
  title: '我的文章',
  theme: 'elegant',
  draft: true
});
\`\`\`

## 表格示例

| 工具名称 | 功能描述 | 参数 |
|---------|---------|------|
| publish_article | 发布文章 | filePath, title, theme 等 |
| preview_article | 预览文章 | filePath, theme |
| list_themes | 获取主题列表 | 无 |

> 💡 **提示**: 这篇文章是通过 MCP 服务器自动生成和发布的！

---

*本文由 WeChat Official Publisher MCP Server 生成*
`;

/**
 * 创建示例文章文件
 */
function createSampleArticle() {
  const articlePath = path.join(__dirname, 'sample-mcp-article.md');
  writeFileSync(articlePath, sampleArticle, 'utf-8');
  console.log(`✅ 示例文章已创建: ${articlePath}`);
  return articlePath;
}

/**
 * 启动 MCP 服务器
 */
function startMCPServer() {
  return new Promise((resolve, reject) => {
    console.log('🚀 启动 MCP 服务器...');
    
    const serverProcess = spawn('npx', ['wechat-official-publisher', 'mcp-server', '--debug'], {
      stdio: ['pipe', 'pipe', 'pipe'],
      env: {
        ...process.env,
        WECHAT_APP_ID: process.env.WECHAT_APP_ID || 'demo_app_id',
        WECHAT_APP_SECRET: process.env.WECHAT_APP_SECRET || 'demo_app_secret'
      }
    });

    let serverReady = false;

    serverProcess.stdout.on('data', (data) => {
      const output = data.toString();
      console.log('📡 MCP Server:', output.trim());
      
      if (output.includes('MCP Server started') || output.includes('启动MCP服务器')) {
        serverReady = true;
        resolve(serverProcess);
      }
    });

    serverProcess.stderr.on('data', (data) => {
      const error = data.toString();
      console.error('❌ MCP Server Error:', error.trim());
    });

    serverProcess.on('close', (code) => {
      console.log(`🛑 MCP 服务器已关闭，退出码: ${code}`);
      if (!serverReady) {
        reject(new Error(`MCP 服务器启动失败，退出码: ${code}`));
      }
    });

    serverProcess.on('error', (error) => {
      console.error('❌ 启动 MCP 服务器时出错:', error.message);
      reject(error);
    });

    // 超时处理
    setTimeout(() => {
      if (!serverReady) {
        serverProcess.kill();
        reject(new Error('MCP 服务器启动超时'));
      }
    }, 10000); // 10秒超时
  });
}

/**
 * 模拟 MCP 客户端调用
 */
function simulateMCPCall(tool, params) {
  return new Promise((resolve, reject) => {
    console.log(`🔧 模拟调用 MCP 工具: ${tool}`);
    console.log('📋 参数:', JSON.stringify(params, null, 2));
    
    // 这里只是模拟，实际的 MCP 客户端会通过 stdio 与服务器通信
    const mockResponse = {
      tool,
      params,
      result: {
        success: true,
        message: `模拟调用 ${tool} 成功`,
        timestamp: new Date().toISOString()
      }
    };
    
    setTimeout(() => {
      console.log('✅ MCP 调用结果:', JSON.stringify(mockResponse.result, null, 2));
      resolve(mockResponse);
    }, 1000);
  });
}

/**
 * 清理资源
 */
function cleanup(articlePath, serverProcess) {
  console.log('🧹 清理资源...');
  
  // 删除示例文章
  if (existsSync(articlePath)) {
    unlinkSync(articlePath);
    console.log('🗑️ 已删除示例文章');
  }
  
  // 关闭服务器进程
  if (serverProcess && !serverProcess.killed) {
    serverProcess.kill();
    console.log('🛑 已关闭 MCP 服务器');
  }
}

/**
 * 主函数
 */
async function main() {
  let articlePath;
  let serverProcess;
  
  try {
    console.log('🎯 WeChat Official Publisher MCP 使用示例\n');
    
    // 检查环境
    console.log('🔍 检查环境配置...');
    const hasConfig = process.env.WECHAT_APP_ID && process.env.WECHAT_APP_SECRET;
    if (!hasConfig) {
      console.log('⚠️ 未检测到微信配置，将使用演示模式');
      console.log('💡 要使用真实功能，请设置 WECHAT_APP_ID 和 WECHAT_APP_SECRET 环境变量');
    }
    
    // 创建示例文章
    articlePath = createSampleArticle();
    
    // 启动 MCP 服务器
    try {
      serverProcess = await startMCPServer();
      console.log('✅ MCP 服务器启动成功\n');
    } catch (error) {
      console.log('⚠️ MCP 服务器启动失败，继续演示模拟调用\n');
    }
    
    // 模拟各种 MCP 工具调用
    console.log('📡 开始模拟 MCP 工具调用...\n');
    
    // 1. 获取配置信息
    await simulateMCPCall('get_config', {});
    console.log('');
    
    // 2. 获取主题列表
    await simulateMCPCall('list_themes', {});
    console.log('');
    
    // 3. 处理文章内容
    await simulateMCPCall('process_content', {
      content: '# 测试标题\n\n这是测试内容。',
      theme: 'elegant'
    });
    console.log('');
    
    // 4. 预览文章
    await simulateMCPCall('preview_article', {
      filePath: articlePath,
      theme: 'modern'
    });
    console.log('');
    
    // 5. 发布文章（草稿模式）
    await simulateMCPCall('publish_article', {
      filePath: articlePath,
      title: '通过 MCP 发布的文章',
      author: 'MCP Demo',
      digest: '这是一篇通过 MCP 服务器发布的演示文章',
      theme: 'elegant',
      draft: true
    });
    
    console.log('\n🎉 MCP 使用示例演示完成！');
    console.log('\n📚 更多信息:');
    console.log('  • MCP 服务器文档: ./docs/MCP_SERVER.md');
    console.log('  • 客户端配置示例: ./examples/mcp-client-config.json');
    console.log('  • 项目主页: https://github.com/wechat-official-publisher');
    
  } catch (error) {
    console.error('❌ 示例运行失败:', error.message);
    process.exit(1);
  } finally {
    // 清理资源
    setTimeout(() => {
      cleanup(articlePath, serverProcess);
      process.exit(0);
    }, 2000);
  }
}

// 处理进程信号
process.on('SIGINT', () => {
  console.log('\n🛑 收到中断信号，正在清理...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n🛑 收到终止信号，正在清理...');
  process.exit(0);
});

// 运行示例
if (require.main === module) {
  main();
}

module.exports = {
  createSampleArticle,
  startMCPServer,
  simulateMCPCall,
  cleanup
};