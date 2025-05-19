#!/usr/bin/env node
import { WeChatPublisher } from '../src/core/Publisher';
import { MarkdownReaderPlugin } from '../src/plugins/MarkdownReaderPlugin';
import { ImageUploaderPlugin } from '../src/plugins/ImageUploaderPlugin';
import { loadConfig } from '../src/config/config';
import chalk from 'chalk';

async function publishArticle(articlePath: string) {
  // 解析命令行参数
  const args = process.argv.slice(2);
  const publishToDraft = args.includes('--publishToDraft=false') ? false : true;

  try {
    // 加载配置
    const config = loadConfig({
      publishToDraft: publishToDraft
    });

    // 创建发布器实例
    const publisher = new WeChatPublisher({
      ...config,
      plugins: [
        new MarkdownReaderPlugin()
      ],
    });

    // 添加图片上传插件
    publisher.use(new ImageUploaderPlugin(publisher));

    // 根据发布模式更新输出信息
    const mode = publishToDraft ? '草稿箱' : '直接发布';
    console.log(chalk.blue(`🚀 开始发布文章到微信公众号 (${mode})...`));

    // 发布文章
    const result = await publisher.publish(articlePath);

    // 根据发布模式显示结果
    if (publishToDraft) {
      console.log(chalk.green('✅ 发布到草稿箱成功！'));
      console.log(chalk.blue('📝 文章标题:'), result.article.title);
      if (result.article.mediaId) {
        console.log(chalk.blue('🆔 草稿ID:'), result.article.mediaId);
        console.log(chalk.blue('🔗 草稿链接:'), `https://mp.weixin.qq.com/cgi-bin/appmsg?t=media/appmsg_edit_v2&action=edit&isNew=1&type=10&token=${publisher.getAccessToken()}&lang=zh_CN#${result.article.mediaId}`);
      }
    } else {
      console.log(chalk.green('✅ 发布成功！'));
      console.log(chalk.blue('📝 文章标题:'), result.article.title);
    }

    console.log(chalk.blue('📋 内容预览:'), result.article.content.substring(0, 100) + '...');

    return { success: true, result };
  } catch (error) {
    console.error(chalk.red('❌ 发布失败:'), error instanceof Error ? error.message : String(error));
    return {
      success: false,
      error: error instanceof Error ? error : new Error(String(error))
    };
  }
}

// 从命令行参数获取文件路径
const articlePath = process.argv[2];
if (!articlePath) {
  console.error(chalk.red('请指定要发布的文章文件路径'));
  console.log(chalk.blue('\n使用方法:'), 'pnpm publish:wechat <markdown文件路径>');
  process.exit(1);
}

// 执行发布
publishArticle(articlePath)
  .then(({ success }) => {
    process.exit(success ? 0 : 1);
  })
  .catch(error => {
    console.error(chalk.red('❌ 发生未捕获的错误:'), error);
    process.exit(1);
  });
