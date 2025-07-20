#!/usr/bin/env node

import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import { WeChatPublisher } from './index';
import { logger } from './utils/logger';
import { PublisherError } from './utils/errors';
import open from 'open';
import { readFileSync } from 'fs';
import { join } from 'path';
import { startMCPServer } from './mcp/index';

/**
 * CLI 入口函数
 */
export async function runCli() {
  const cli = yargs(hideBin(process.argv))
    .scriptName('wechat-official-publisher')
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
        .option('theme', {
          describe: '使用指定主题',
          type: 'string'
        })
        .option('compatible', {
          describe: '自动使用兼容主题（推荐用于微信发布）',
          type: 'boolean',
          default: true
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
        .option('stable-token', {
          describe: '使用微信 stable_token 接口获取 Access Token',
          type: 'boolean',
          default: false
        });
    },
    async (argv) => {
      try {
        const themeName = argv.theme;

        const publisher = new WeChatPublisher({
          debug: argv.debug,
          publishToDraft: argv.draft,
          theme: themeName,
          useStableToken: argv.stableToken
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
        .option('theme', {
          describe: '使用指定主题',
          type: 'string'
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
        const themeName = argv.theme;

        const publisher = new WeChatPublisher({
          debug: argv.debug,
          theme: themeName
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
    () => { },
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

  // 主题命令
  cli.command(
    'themes',
    '显示可用的主题列表',
    (yargs) => {
      return yargs
        ;
    },
    async (argv) => {
      try {
        const { listAllThemes } = await import('./themes');

        const allThemes = listAllThemes();
        logger.info('🎨 可用主题:');

        allThemes.forEach((theme: any) => {
          logger.info(`  - ${theme.name}: ${theme.description}`);
        });

        logger.info('\n💡 提示: 所有主题均已针对微信公众号进行优化');
      } catch (error) {
        logger.error('获取主题列表失败:', error as Error);
      }
    }
  );

  // MCP服务器命令
  cli.command(
    'mcp-server',
    '启动MCP服务器',
    (yargs) => {
      return yargs
        .option('port', {
          alias: 'p',
          describe: 'MCP服务器端口（仅SSE模式有效）',
          type: 'number',
          default: 3000
        })
        .option('transport', {
          alias: 't',
          describe: '传输协议类型',
          type: 'string',
          choices: ['stdio', 'sse'],
          default: 'stdio'
        })
        .option('host', {
          describe: '服务器主机地址（仅SSE模式有效）',
          type: 'string',
          default: 'localhost'
        })
        .option('debug', {
          describe: '启用调试模式',
          type: 'boolean',
          default: false
        });
    },
    async (argv) => {
      try {
        // 设置调试模式
        if (argv.debug) {
          process.env.DEBUG = 'true';
        }

        // 显示详细的启动信息
        const packageJson = JSON.parse(readFileSync(join(__dirname, '../package.json'), 'utf-8'));

        logger.info('🚀 WeChat Official Publisher MCP Server');
        logger.info(`📦 版本: ${packageJson.version}`);
        logger.info(`👤 作者: ${packageJson.author}`);
        logger.info('');

        // 检查环境变量
        const hasAppId = !!process.env.WECHAT_APP_ID;
        const hasAppSecret = !!process.env.WECHAT_APP_SECRET;

        logger.info('📋 环境检查:');
        logger.info(`  WECHAT_APP_ID: ${hasAppId ? '✓ 已设置' : '✗ 未设置'}`);
        logger.info(`  WECHAT_APP_SECRET: ${hasAppSecret ? '✓ 已设置' : '✗ 未设置'}`);
        logger.info(`  NODE_ENV: ${process.env.NODE_ENV || 'development'}`);
        logger.info('');

        if (!hasAppId || !hasAppSecret) {
          logger.warn('⚠️  警告: 微信API配置不完整');
          logger.info('   请在 .env 文件中设置 WECHAT_APP_ID 和 WECHAT_APP_SECRET');
          logger.info('   或通过环境变量设置这些值');
          logger.info('');
        }

        logger.info('🎯 可用工具:');
        logger.info('  • publish_article - 发布文章到微信公众号');
        logger.info('  • preview_article - 预览文章效果');
        logger.info('  • list_themes - 获取可用主题列表');
        logger.info('  • process_content - 处理文章内容');
        logger.info('  • get_config - 获取配置信息');
        logger.info('');

        if (argv.transport === 'sse') {
          logger.info('🔗 传输协议: SSE (Server-Sent Events)');
          logger.info(`   服务器地址: http://${argv.host}:${argv.port}`);
          logger.info(`   事件流: http://${argv.host}:${argv.port}/mcp/events`);
          logger.info(`   工具调用: http://${argv.host}:${argv.port}/mcp/call`);
          logger.info(`   测试页面: http://${argv.host}:${argv.port}`);
          logger.info('');

          logger.info('🚀 启动SSE MCP服务器...');

          // 导入并启动SSE MCP服务器
          const { startSSEMCPServer } = await import('./mcp/sse-server');
          await startSSEMCPServer({
            port: argv.port,
            host: argv.host,
            cors: true
          });
        } else {
          logger.info('🔗 传输协议: stdio');
          logger.info('   服务器通过标准输入输出与客户端通信');
          logger.info('');

          logger.info('🚀 启动stdio MCP服务器...');

          // 启动stdio MCP服务器
          await startMCPServer();
        }

      } catch (error) {
        handleError(error);
      }
    }
  );

  // MCP服务器信息命令
  cli.command(
    'mcp-info',
    '显示MCP服务器信息',
    () => { },
    async () => {
      try {
        const packageJson = JSON.parse(readFileSync(join(__dirname, '../package.json'), 'utf-8'));

        logger.info('🔧 MCP服务器信息:');
        logger.info(`📦 名称: ${packageJson.name}`);
        logger.info(`🔖 版本: ${packageJson.version}`);
        logger.info(`👤 作者: ${packageJson.author}`);
        logger.info(`📄 描述: ${packageJson.description}`);
        logger.info('');

        logger.info('🎯 可用工具:');
        logger.info('  • publish_article - 发布文章到微信公众号');
        logger.info('  • preview_article - 预览文章效果');
        logger.info('  • list_themes - 获取可用主题列表');
        logger.info('  • process_content - 处理文章内容');
        logger.info('  • get_config - 获取配置信息');
        logger.info('');

        logger.info('🔗 传输协议: stdio');
        logger.info('📋 配置要求:');
        logger.info('  • WECHAT_APP_ID - 微信公众号AppID');
        logger.info('  • WECHAT_APP_SECRET - 微信公众号AppSecret');
        logger.info('');

        logger.info('💡 使用方法:');
        logger.info('  npm run mcp-server');
        logger.info('  或');
        logger.info('  wechat-official-publisher mcp-server');

      } catch (error) {
        handleError(error);
      }
    }
  );

  // 清空缓存命令
  cli.command(
    'clear-cache',
    '清空Access Token缓存',
    (yargs) => {
      return yargs
        .option('appId', {
          describe: '指定要清空缓存的公众号AppID',
          type: 'string'
        })
        .option('all', {
          describe: '清空所有公众号的缓存',
          type: 'boolean',
          default: false
        });
    },
    async (argv) => {
      try {
        if (argv.all) {
          WeChatPublisher.clearAllTokenCache();
          logger.success('✅ 所有公众号的Access Token缓存已清空。');
        } else if (argv.appId) {
          WeChatPublisher.clearTokenCache(argv.appId);
          logger.success(`✅ 公众号 ${argv.appId} 的Access Token缓存已清空。`);
        } else {
          // 清空当前环境变量配置的公众号缓存
          const appId = process.env.WECHAT_APP_ID;
          if (appId) {
            WeChatPublisher.clearTokenCache(appId);
            logger.success('✅ 当前公众号的Access Token缓存已清空。');
          } else {
            logger.error('❌ 未找到公众号配置，请指定 --appId 参数');
          }
        }
      } catch (error) {
        handleError(error);
      }
    }
  );



  // 微信兼容性检查命令
  cli.command(
    'check <file>',
    '检查文件的微信公众号兼容性',
    (yargs) => {
      return yargs
        .positional('file', {
          describe: '要检查的文件路径',
          type: 'string',
          demandOption: true
        })
        .option('fix', {
          alias: 'f',
          describe: '自动修复兼容性问题',
          type: 'boolean',
          default: false
        })
        .option('output', {
          alias: 'o',
          describe: '修复后的输出文件路径',
          type: 'string'
        })
        .option('theme', {
          describe: '使用指定主题',
          type: 'string'
        });
    },
    async (argv) => {
      try {
        const { readFileSync, writeFileSync } = await import('fs');
        const { wechatCompatibilityPlugin, generateCompatibilityReport } = await import('./plugins/wechat-compatibility');
        const { WeChatPublisher } = await import('./index');

        // 读取文件内容
        const content = readFileSync(argv.file, 'utf-8');

        // 创建发布器实例来处理Markdown
        const publisher = new WeChatPublisher({
          theme: argv.theme
        });

        // 生成HTML内容
        const htmlContent = await publisher.processContent(content);

        // 生成兼容性报告
        const report = generateCompatibilityReport(htmlContent);
        logger.info('🔍 微信兼容性检查结果:');
        console.log(report);

        if (argv.fix) {
          // 应用兼容性修复
          const fixedContent = await wechatCompatibilityPlugin(htmlContent, {
            filePath: argv.file,
            config: {
              appId: process.env.WECHAT_APP_ID || '',
              appSecret: process.env.WECHAT_APP_SECRET || '',
              theme: argv.theme
            },
            accessToken: ''
          });

          // 确定输出文件路径
          const outputPath = argv.output || argv.file.replace(/\.(md|html)$/, '-wechat-compatible.html');

          // 写入修复后的内容
          writeFileSync(outputPath, fixedContent, 'utf-8');

          logger.success('✅ 兼容性问题已修复!');
          logger.info(`📄 修复后的文件: ${outputPath}`);

          // 再次检查修复后的内容
          const fixedReport = generateCompatibilityReport(fixedContent);
          logger.info('🔍 修复后的兼容性检查:');
          console.log(fixedReport);
        }
      } catch (error) {
        handleError(error);
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