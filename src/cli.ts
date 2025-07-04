#!/usr/bin/env node

import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import { WeChatPublisher } from './index';
import { logger } from './utils/logger';
import { PublisherError } from './utils/errors';
import open from 'open';
import { readFileSync } from 'fs';
import { join } from 'path';

/**
 * CLI 入口函数
 */
export async function runCli() {
  const cli = yargs(hideBin(process.argv))
    .scriptName('wechat-publisher')
    .usage('Usage: $0 <command> [options]')
    .version(JSON.parse(readFileSync(join(__dirname, '../package.json'), 'utf-8')).version)
    .help()
    .alias('h', 'help')
    .alias('v', 'version');

  // 发布命令
  cli.command(
    'publish <file>',
    '发布文章到微信公众号',
    (yargs) => {
      return yargs
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
        });
    },
    async (argv) => {
      try {
        const publisher = new WeChatPublisher({
          debug: argv.debug,
          publishToDraft: argv.draft
        });

        const result = await publisher.publish(argv.file, {
          title: argv.title,
          author: argv.author,
          digest: argv.digest,
          coverImage: argv.cover,
          draft: argv.draft
        });

        // 显示发布结果
        logger.success('🎉 发布成功!');
        logger.info(`📝 标题: ${result.title}`);
        logger.info(`📄 内容长度: ${result.content.length} 字符`);
        if (result.mediaId) {
          logger.info(`🆔 媒体ID: ${result.mediaId}`);
        }
        logger.info(`📋 状态: ${result.message}`);
        
        if (argv.draft && result.mediaId) {
          logger.info('💡 提示: 你可以在微信公众平台的草稿箱中查看和编辑文章');
        }
      } catch (error) {
        handleError(error);
      }
    }
  );

  // 预览命令
  cli.command(
    'preview <file>',
    '预览文章效果',
    (yargs) => {
      return yargs
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
        });
    },
    async (argv) => {
      try {
        const publisher = new WeChatPublisher({
          debug: argv.debug
        });

        const previewFile = await publisher.preview(argv.file);
        
        logger.success('🎉 预览生成成功!');
        logger.info(`📄 预览文件: ${previewFile}`);
        
        if (argv.open) {
          try {
            await open(previewFile);
            logger.info('🌐 已在浏览器中打开预览');
          } catch (error) {
            logger.warn('无法自动打开浏览器，请手动打开预览文件');
          }
        }
      } catch (error) {
        handleError(error);
      }
    }
  );

  // 配置命令
  cli.command(
    'config',
    '显示当前配置信息',
    () => {},
    () => {
      logger.info('📋 当前配置:');
      logger.info(`WECHAT_APP_ID: ${process.env.WECHAT_APP_ID ? '已设置' : '未设置'}`);
      logger.info(`WECHAT_APP_SECRET: ${process.env.WECHAT_APP_SECRET ? '已设置' : '未设置'}`);
      logger.info(`NODE_ENV: ${process.env.NODE_ENV || 'development'}`);
      
      if (!process.env.WECHAT_APP_ID || !process.env.WECHAT_APP_SECRET) {
        logger.warn('⚠️  请设置 WECHAT_APP_ID 和 WECHAT_APP_SECRET 环境变量');
        logger.info('💡 你可以在 .env 文件中设置这些变量');
      }
    }
  );

  // 默认显示帮助
  cli.demandCommand(1, '请指定一个命令');
  
  // 解析命令行参数
  await cli.parse();
}

/**
 * 错误处理
 */
function handleError(error: unknown) {
  if (error instanceof PublisherError) {
    logger.error(`❌ ${error.message}`);
    if (error.cause && process.env.NODE_ENV === 'development') {
      logger.error('详细错误信息:', error.cause);
    }
  } else if (error instanceof Error) {
    logger.error(`❌ 未知错误: ${error.message}`);
    if (process.env.NODE_ENV === 'development') {
      logger.error('错误堆栈:', error);
    }
  } else {
    logger.error(`❌ 未知错误: ${String(error)}`);
  }
  
  process.exit(1);
}

// 如果直接运行此文件
if (require.main === module) {
  runCli().catch(handleError);
}