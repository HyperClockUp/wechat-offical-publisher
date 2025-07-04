#!/usr/bin/env node

import path from 'path';
import fs from 'fs';
import chalk from 'chalk';
import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import open from 'open';

import { WeChatPublisher } from '../src/index';
import { PublisherError } from '../src/utils/errors';

/**
 * 预览脚本 - 简化版
 */
async function main() {
  const argv = await yargs(hideBin(process.argv))
    .usage('Usage: $0 <file> [options]')
    .positional('file', {
      describe: '要预览的文章文件路径',
      type: 'string',
      demandOption: true
    })
    .option('open', {
      alias: 'o',
      describe: '自动在浏览器中打开预览',
      type: 'boolean',
      default: true
    })
    .option('debug', {
      describe: '启用调试模式',
      type: 'boolean',
      default: false
    })
    .help()
    .alias('h', 'help')
    .parse();

  try {
    const filePath = argv._[0] as string;
    
    if (!filePath) {
      throw new Error('请指定要预览的文章文件路径');
    }

    // 解析文件路径
    const resolvedPath = path.resolve(filePath);
    
    if (!fs.existsSync(resolvedPath)) {
      throw new Error(`文件不存在: ${resolvedPath}`);
    }

    console.log(chalk.blue('🔍 生成文章预览...'));
    console.log(chalk.gray(`文件: ${resolvedPath}`));

    // 创建发布器（预览模式不需要微信配置）
    const publisher = new WeChatPublisher({
      debug: argv.debug,
      // 预览模式使用空配置
      appId: 'preview',
      appSecret: 'preview'
    });

    // 生成预览
    const previewFile = await publisher.preview(resolvedPath);

    // 显示结果
    console.log();
    console.log(chalk.green('✅ 预览生成成功!'));
    console.log(chalk.blue(`📄 预览文件: ${previewFile}`));
    
    if (argv.open) {
      try {
        console.log(chalk.blue('🌐 正在打开浏览器...'));
        await open(previewFile);
        console.log(chalk.green('✅ 已在浏览器中打开预览'));
      } catch (error) {
        console.log(chalk.yellow('⚠️  无法自动打开浏览器，请手动打开预览文件'));
        console.log(chalk.gray(`   文件路径: ${previewFile}`));
      }
    } else {
      console.log(chalk.gray('💡 使用 --open 参数可自动在浏览器中打开预览'));
    }
    
  } catch (error) {
    console.log();
    
    if (error instanceof PublisherError) {
      console.log(chalk.red(`❌ ${error.message}`));
      if (error.cause && argv.debug) {
        console.log(chalk.gray('详细错误信息:'));
        console.log(chalk.gray(error.cause.stack || error.cause.message));
      }
    } else if (error instanceof Error) {
      console.log(chalk.red(`❌ 预览生成失败: ${error.message}`));
      if (argv.debug) {
        console.log(chalk.gray('错误堆栈:'));
        console.log(chalk.gray(error.stack || error.message));
      }
    } else {
      console.log(chalk.red(`❌ 未知错误: ${String(error)}`));
    }
    
    process.exit(1);
  }
}

// 运行主函数
if (require.main === module) {
  main().catch(error => {
    console.error(chalk.red('脚本执行失败:'), error);
    process.exit(1);
  });
}

export { main as previewScript };
