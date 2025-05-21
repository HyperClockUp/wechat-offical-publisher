#!/usr/bin/env node
import * as path from 'node:path';
import * as fs from 'node:fs';
import chalk from 'chalk';
import { WeChatPublisherSDK } from '../src/sdk';
import { MarkdownReaderPlugin } from '../src/plugins/MarkdownReaderPlugin';
import { PlainTextReaderPlugin } from '../src/plugins/PlainTextReaderPlugin';
import { ImageUploaderPlugin } from '../src/plugins/ImageUploaderPlugin';
import { loadConfig } from '../src/config/config';
import { ConfigurationError, APIError } from '../src/core/errors';

/**
 * 处理并显示错误信息
 * @param error 错误对象
 * @param exitOnError 是否在显示错误后退出进程
 * @returns 是否处理了错误
 */
function handleError(error: unknown, exitOnError: boolean = true): boolean {
  if (error instanceof ConfigurationError) {
    console.error(chalk.red('配置错误:'), error.message);
  } else if (error instanceof APIError) {
    console.error(chalk.red('API错误:'), error.message);
  } else if (error instanceof Error) {
    console.error(chalk.red('发布失败:'), error.message);
  } else {
    console.error(chalk.red('发布失败:'), String(error));
  }

  if (exitOnError) {
    process.exit(1);
  }
  return true;
}

interface PublishOptions {
  title?: string;
  author?: string;
  digest?: string;
  draft?: boolean;
  coverImage: string;
  publishToDraft?: boolean; // 为了向后兼容
}

interface PublishResult {
  success: boolean;
  result?: any;
  error?: Error;
}

/**
 * 发布文章
 * @param articlePath 文章文件路径
 * @param options 发布选项
 * @returns 发布结果
 */
async function publishArticle(articlePath: string, options: PublishOptions): Promise<PublishResult> {
  const { draft = true } = options;
  const mode = draft ? '草稿箱' : '直接发布';
  
  // 解析为绝对路径
  const resolvedArticlePath = path.resolve(articlePath);
  
  // 获取文章所在目录
  const articleDir = path.dirname(resolvedArticlePath);
  
  console.log(chalk.blue('📄 处理文章文件:'), resolvedArticlePath);
  
  // 确保文件存在
  if (!fs.existsSync(resolvedArticlePath)) {
    throw new Error(`文件不存在: ${resolvedArticlePath}`);
  }
  
  // 处理封面图片路径
  let finalCoverImagePath: string;
  
  if (options.coverImage) {
    // 如果指定了封面图片路径，则使用指定的路径
    if (path.isAbsolute(options.coverImage)) {
      finalCoverImagePath = options.coverImage;
    } else {
      // 检查是否是相对路径（以 ./ 或 ../ 开头）
      if (options.coverImage.startsWith('./') || options.coverImage.startsWith('../')) {
        finalCoverImagePath = path.resolve(process.cwd(), options.coverImage);
      } else {
        // 如果不是相对路径，则认为是相对于文章所在目录
        finalCoverImagePath = path.resolve(articleDir, options.coverImage);
      }
    }
  } else {
    // 否则查找默认的封面图片（cover.jpg 或 cover.png）
    const defaultCoverPaths = [
      path.join(articleDir, 'cover.jpg'),
      path.join(articleDir, 'cover.png'),
    ];
    
    const foundCover = defaultCoverPaths.find(p => fs.existsSync(p));
    
    if (!foundCover) {
      throw new Error('未找到封面图片，请在文章同目录下添加 cover.jpg 或 cover.png 文件，或通过 --cover 参数指定封面图片路径');
    }
    
    finalCoverImagePath = foundCover;
  }
  
  // 确保封面图片文件存在
  if (!fs.existsSync(finalCoverImagePath)) {
    throw new Error(`封面图片不存在: ${finalCoverImagePath}`);
  }
  
  console.log(chalk.blue(`🖼️  使用封面图片: ${finalCoverImagePath}`));
  
  // 准备文章选项
  const articleOptions = {
    title: options.title || path.basename(articlePath, path.extname(articlePath)),
    author: options.author || '',
    digest: options.digest || '',
    draft: options.draft ?? true, // 默认为草稿模式
    coverImage: finalCoverImagePath // 使用找到的封面图片路径
  };
  try {
    // 加载配置
    const config = loadConfig({
      publishToDraft: draft,
      debug: process.env.DEBUG === 'true'
    });

    // 创建SDK实例
    console.log('创建SDK实例...');
    const sdk = new WeChatPublisherSDK({
      appId: process.env.WECHAT_APP_ID,
      appSecret: process.env.WECHAT_APP_SECRET,
      debug: config.debug,
      publishToDraft: draft,
      plugins: [
        new MarkdownReaderPlugin(),
        new PlainTextReaderPlugin()
      ]
    });

    console.log('等待SDK初始化...');
    try {
      await sdk.initialize();
      console.log('SDK初始化成功');
      
      // 添加需要发布器实例的插件
      if (sdk['publisher']) {
        console.log('添加ImageUploaderPlugin...');
        const publisher = sdk['publisher'];
        const config = publisher.getConfig();
        if (!config.plugins) {
          config.plugins = [];
        }
        // 检查是否已经添加过ImageUploaderPlugin
        const hasImageUploader = config.plugins.some(
          (plugin: any) => plugin.name === 'ImageUploaderPlugin'
        );
        if (!hasImageUploader) {
          config.plugins.push(new ImageUploaderPlugin(publisher));
          console.log('ImageUploaderPlugin添加成功');
        } else {
          console.log('ImageUploaderPlugin已存在，跳过添加');
        }
      } else {
        console.warn('发布器实例不存在，无法添加ImageUploaderPlugin');
      }
    } catch (error) {
      console.error('SDK初始化失败:');
      handleError(error, false);
      throw error;
    }

    // 根据发布模式更新输出信息
    const mode = draft ? '草稿箱' : '直接发布';
    console.log(chalk.blue(`🚀 开始发布文章到微信公众号 (${mode})...`));
    
    // 准备发布参数
    const publishOptions = {
      title: articleOptions.title,
      author: articleOptions.author,
      digest: articleOptions.digest,
      draft: articleOptions.draft,
      coverImage: finalCoverImagePath
    };

    console.log(finalCoverImagePath)
    
    console.log('发布文章选项:', {
      title: articleOptions.title,
      author: articleOptions.author,
      digest: articleOptions.digest ? `${articleOptions.digest.substring(0, 30)}...` : '未设置',
      draft: articleOptions.draft,
      coverImage: finalCoverImagePath ? `已设置 (${path.basename(finalCoverImagePath)})` : '未设置'
    });

    console.log('发布参数:', {
      ...publishOptions,
      coverImage: publishOptions.coverImage ? '已设置' : '未设置'
    });

    try {
      // 发布文章
      const result = await sdk.publishArticle(articlePath, publishOptions);
      
      // 获取访问令牌（仅在需要时）
      const token = draft ? await sdk.getAccessToken() : '';
      const publishMode = draft ? '草稿' : '正式';

      // 显示结果
      console.log(chalk.green(`✅ 发布${publishMode}文章成功！`));
      
      // 确保 result 有 title 属性
      const articleTitle = result.title || '未命名文章';
      console.log(chalk.blue('📝 文章标题:'), articleTitle);
      
      // 如果是草稿箱发布，显示草稿链接
      if (draft && 'mediaId' in result && result.mediaId) {
        console.log(chalk.blue('🆔 草稿ID:'), result.mediaId);
        console.log(chalk.blue('🔗 草稿链接:'), `https://mp.weixin.qq.com/cgi-bin/appmsg?t=media/appmsg_edit_v2&action=edit&isNew=1&type=10&token=${token}&lang=zh_CN#${result.mediaId}`);
      }

      // 显示内容预览
      if ('content' in result) {
        console.log(chalk.blue('📋 内容预览:'), result.content.substring(0, 100) + '...');
      }

      // 如果是调试模式，显示调试信息
      if (config.debug) {
        console.log(chalk.yellow('调试信息:'));
        console.log(chalk.yellow('  - 发布模式:'), publishMode);
        if (config.appId) {
          console.log(chalk.yellow('  - AppID:'), config.appId.substring(0, 8) + '...');
        }
      }
      
      return { success: true, result };
    } catch (error) {
      console.error(chalk.red('处理发布结果时出错:'));
      const errorObj = error instanceof Error ? error : new Error(String(error));
      handleError(errorObj, false);
      return { success: false, error: errorObj };
    }
  } catch (error) {
    // 传递错误对象和 exitOnError 参数
    const errorObj = error instanceof Error ? error : new Error(String(error));
    handleError(errorObj, false);
    return {
      success: false,
      error: errorObj
    };
  }
}

/**
 * 主函数
 */
async function main() {
  console.log('Starting publish script...');
  try {
    // 解析命令行参数
    const args = process.argv.slice(2);
    const draft = !args.includes('--draft=false');
    let articlePath = args.find(arg => !arg.startsWith('--'));

    // 检查文件路径
    if (!articlePath) {
      console.error(chalk.red('请指定要发布的文章文件路径'));
      console.log(chalk.blue('\n使用方法:'), 'pnpm publish:wechat <markdown文件路径> [--publishToDraft=false]');
      console.log(chalk.blue('\n选项:'));
      console.log('  --publishToDraft=false  直接发布文章（默认为true，发布到草稿箱）');
      process.exit(1);
    }

    // 检查文件是否存在
    try {
      await fs.promises.access(articlePath);
    } catch (error) {
      console.error(chalk.red('错误:'), `文件不存在或无法访问: ${articlePath}`);
      process.exit(1);
    }

    // 确保articlePath是绝对路径
    articlePath = path.resolve(articlePath);

    // 准备文章选项
    const articleOptions: PublishOptions = {
      title: path.basename(articlePath, path.extname(articlePath)),
      author: '',
      digest: '',
      draft,
      coverImage: '', // 将在publishArticle中解析
      publishToDraft: draft // 为了向后兼容
    };
    
    console.log('文章选项:', {
      ...articleOptions,
      coverImage: '将在发布时解析'
    });

    // 发布文章
    const { success } = await publishArticle(articlePath, articleOptions);
    process.exit(success ? 0 : 1);
  } catch (error) {
    const errorObj = error instanceof Error ? error : new Error(String(error));
    handleError(errorObj, true);
  }
}



// Export the publishArticle function
export { publishArticle };

// Only run main if this file is being run directly
const isRunDirectly = process.argv[1] && process.argv[1].endsWith('publish.ts') || 
                     (process.argv[1] && process.argv[1].includes('publish.js'));

console.log('Checking if script is run directly...');
console.log('isRunDirectly:', isRunDirectly);

if (isRunDirectly) {
  console.log('Running main function...');
  main().catch((error) => {
    console.error('Error in main function:', error);
    const errorObj = error instanceof Error ? error : new Error(String(error));
    handleError(errorObj, true);
  });
} else {
  console.log('Script is being imported, not running main function');
}
