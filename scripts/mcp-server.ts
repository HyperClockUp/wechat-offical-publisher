#!/usr/bin/env node

/**
 * MCP Server 启动脚本
 * 用于启动微信公众号发布工具的MCP服务器
 */

import { startMCPServer } from '../src/mcp';
import { logger } from '../src/utils/logger';
import chalk from 'chalk';
import { readFileSync } from 'fs';
import { join } from 'path';

/**
 * 显示启动信息
 */
function showStartupInfo(): void {
  const packageJson = JSON.parse(readFileSync(join(__dirname, '../package.json'), 'utf-8'));
  
  console.log(chalk.cyan('🚀 WeChat Official Publisher MCP Server'));
  console.log(chalk.gray(`Version: ${packageJson.version}`));
  console.log(chalk.gray(`Author: ${packageJson.author}`));
  console.log('');
  
  // 检查环境变量
  const hasAppId = !!process.env.WECHAT_APP_ID;
  const hasAppSecret = !!process.env.WECHAT_APP_SECRET;
  
  console.log(chalk.yellow('📋 环境检查:'));
  console.log(`  WECHAT_APP_ID: ${hasAppId ? chalk.green('✓ 已设置') : chalk.red('✗ 未设置')}`);
  console.log(`  WECHAT_APP_SECRET: ${hasAppSecret ? chalk.green('✓ 已设置') : chalk.red('✗ 未设置')}`);
  console.log(`  NODE_ENV: ${process.env.NODE_ENV || 'development'}`);
  console.log('');
  
  if (!hasAppId || !hasAppSecret) {
    console.log(chalk.yellow('⚠️  警告: 微信API配置不完整'));
    console.log(chalk.gray('   请在 .env 文件中设置 WECHAT_APP_ID 和 WECHAT_APP_SECRET'));
    console.log(chalk.gray('   或通过环境变量设置这些值'));
    console.log('');
  }
  
  console.log(chalk.green('🎯 可用工具:'));
  console.log('  • publish_article - 发布文章到微信公众号');
  console.log('  • preview_article - 预览文章效果');
  console.log('  • list_themes - 获取可用主题列表');
  console.log('  • process_content - 处理文章内容');
  console.log('  • get_config - 获取配置信息');
  console.log('');
  
  console.log(chalk.blue('🔗 传输协议: stdio'));
  console.log(chalk.gray('   服务器通过标准输入输出与客户端通信'));
  console.log('');
}

/**
 * 主函数
 */
async function main(): Promise<void> {
  try {
    // 显示启动信息
    showStartupInfo();
    
    // 启动MCP服务器
    console.log(chalk.cyan('🚀 启动MCP服务器...'));
    await startMCPServer();
    
  } catch (error) {
    logger.error('Failed to start MCP server', error as Error);
    console.error(chalk.red('❌ MCP服务器启动失败:'));
    console.error(chalk.red(error instanceof Error ? error.message : String(error)));
    process.exit(1);
  }
}

// 处理进程信号
process.on('SIGINT', () => {
  console.log(chalk.yellow('\n🛑 收到中断信号，正在关闭服务器...'));
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log(chalk.yellow('\n🛑 收到终止信号，正在关闭服务器...'));
  process.exit(0);
});

// 处理未捕获的异常
process.on('uncaughtException', (error) => {
  logger.error('Uncaught exception in MCP server', error);
  console.error(chalk.red('❌ 未捕获的异常:'), error.message);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled rejection in MCP server', reason as Error);
  console.error(chalk.red('❌ 未处理的Promise拒绝:'), reason);
  process.exit(1);
});

// 启动服务器
if (require.main === module) {
  main();
}

export { main as startMCPServerScript };