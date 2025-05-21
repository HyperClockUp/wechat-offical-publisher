#!/usr/bin/env node

import * as path from 'node:path';
import * as fs from 'node:fs';
import { WeChatPublisherSDK } from './sdk';
import { logger } from './core/logger';
import { ConfigurationError } from './core/errors';
import yargs from 'yargs';

/**
 * CLI配置
 */
const cli = yargs() as yargs.Argv<{
  debug?: boolean;
  draft?: boolean;
  file?: string;
}>;

cli
  .scriptName('wechat-publisher')
  .usage('Usage: $0 <command> [options]')
  .option('debug', {
    describe: '启用调试模式',
    type: 'boolean'
  })
  .option('draft', {
    describe: '发布到草稿箱',
    type: 'boolean'
  })
  .option('file', {
    describe: '要发布的文件路径',
    type: 'string'
  })
  .command('publish [file]', '发布文章')
  .command('version', '显示版本信息')
  .command('help', '显示帮助信息')
  .help()
  .version();

/**
 * 主函数
 */
async function main() {
  try {
    const argv = await cli.parse() as yargs.Arguments;
    
    // 创建SDK实例
    const sdk = new WeChatPublisherSDK({
      debug: Boolean(argv.debug),
      publishToDraft: Boolean(argv.draft)
    });

    // 处理不同命令
    switch (argv._[0]) {
      case 'publish':
        if (!argv.file) {
          throw new Error('必须指定要发布的文件路径');
        }
        await handlePublish(sdk, argv.file as string);
        break;
      case 'version':
        logger.info(`WeChat Publisher v${require('../package.json').version}`);
        break;
      case 'help':
        cli.showHelp();
        break;
      default:
        throw new Error('未知命令');
    }
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    if (error instanceof ConfigurationError) {
      logger.error('配置错误:', new Error(errorMessage));
      process.exit(1);
    }
    logger.error('执行失败:', new Error(errorMessage));
    process.exit(1);
  }
}

/**
 * 处理发布命令
 */
async function handlePublish(sdk: WeChatPublisherSDK, filePath: string) {
  try {
    // 获取文章所在目录
    const articleDir = path.dirname(filePath);
    // 查找封面图片（cover.jpg 或 cover.png）
    const coverImagePath = [
      path.join(articleDir, 'cover.jpg'),
      path.join(articleDir, 'cover.png'),
    ].find(p => fs.existsSync(p));

    if (!coverImagePath) {
      throw new Error('未找到封面图片，请在文章同目录下添加 cover.jpg 或 cover.png 文件');
    }

    const result = await sdk.publishArticle(filePath, {
      title: path.basename(filePath, path.extname(filePath)),
      author: '',
      digest: '',
      draft: true,
      coverImage: coverImagePath
    });
    const status = sdk.getStatus();
    const logMessage = [
      '✅ 发布成功！',
      `📝 文章标题: ${result.title}`,
      `🆔 草稿ID: ${result.mediaId || '无'}`,
      `📋 内容预览: ${result.content.substring(0, 100)}...`,
      ...(result.mediaId ? [
        `🔗 草稿链接: https://mp.weixin.qq.com/cgi-bin/appmsg?t=media/appmsg_edit_v2&action=edit&isNew=1&type=10&token=${status.isDebug ? 'DEBUG_TOKEN' : 'VALID_TOKEN'}&lang=zh_CN#${result.mediaId}`
      ] : [])
    ].join('\n');
    
    logger.info(logMessage);
  } catch (error: unknown) {
    logger.error('发布失败:', error instanceof Error ? error : new Error(String(error)));
    throw error instanceof Error ? error : new Error(String(error));
  }
}

// 执行主函数
main().catch(error => {
  const errorMessage = error instanceof Error ? error.message : String(error);
  logger.error(`程序执行出错: ${errorMessage}`);
  process.exit(1);
});
