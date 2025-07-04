#!/usr/bin/env node

import * as path from 'node:path';
import * as fs from 'node:fs';
import chalk from 'chalk';
import dotenv from 'dotenv';
import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';

// 加载环境变量
dotenv.config();

import { WeChatPublisher } from '../src/index';
import { PublisherError } from '../src/utils/errors';

/**
 * 发布脚本 - 简化版
 */
async function main() {
  const argv = await yargs(hideBin(process.argv))
    .usage('Usage: $0 <file> [options]')
    .positional('file', {
      describe: '要发布的文章文件路径',
      type: 'string',
      demandOption: true
    })
    .option('title', {
      alias: 't',
      describe: '文章标题',
      type: 'string'
    })
    .option('author', {
      alias: 'a', 
      describe: '文章作者',
      type: 'string'
    })
    .option('digest', {
      alias: 'd',
      describe: '文章摘要', 
      type: 'string'
    })
    .option('cover', {
      alias: 'c',
      describe: '封面图片路径',
      type: 'string'
    })
    .option('draft', {
      describe: '是否保存为草稿',
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
      throw new Error('请指定要发布的文章文件路径');
    }

    // 解析文件路径
    const resolvedPath = path.resolve(filePath);
    
    if (!fs.existsSync(resolvedPath)) {
      throw new Error(`文件不存在: ${resolvedPath}`);
    }

    console.log(chalk.blue('🚀 开始发布文章...'));
    console.log(chalk.gray(`文件: ${resolvedPath}`));
    
    // 处理封面图片
    let coverImage = argv.cover;
    if (!coverImage) {
      // 自动查找封面图片
      const articleDir = path.dirname(resolvedPath);
      const coverFiles = ['cover.jpg', 'cover.png', 'cover.jpeg'];
      
      for (const coverFile of coverFiles) {
        const coverPath = path.join(articleDir, coverFile);
        if (fs.existsSync(coverPath)) {
          coverImage = coverPath;
          break;
        }
      }
    }
    
    if (coverImage) {
      console.log(chalk.gray(`封面: ${coverImage}`));
    }

    // 创建发布器
    const publisher = new WeChatPublisher({
      debug: argv.debug,
      publishToDraft: argv.draft
    });

    // 发布文章
    const result = await publisher.publish(resolvedPath, {
      title: argv.title,
      author: argv.author,
      digest: argv.digest,
      coverImage,
      draft: argv.draft
    });

    // 显示结果
    console.log();
    console.log(chalk.green('✅ 发布成功!'));
    console.log(chalk.blue(`📝 标题: ${result.title}`));
    console.log(chalk.blue(`📄 内容长度: ${result.content.length} 字符`));
    
    if (result.mediaId) {
      console.log(chalk.blue(`🆔 媒体ID: ${result.mediaId}`));
    }
    
    console.log(chalk.blue(`📋 状态: ${result.message}`));
    
    if (argv.draft && result.mediaId) {
      console.log();
      console.log(chalk.yellow('💡 提示: 你可以在微信公众平台的草稿箱中查看和编辑文章'));
      console.log(chalk.gray('   草稿箱地址: https://mp.weixin.qq.com/'));
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
      console.log(chalk.red(`❌ 发布失败: ${error.message}`));
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

export { main as publishScript };
