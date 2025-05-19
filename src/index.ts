#!/usr/bin/env node

import { WeChatPublisher } from './core/Publisher';
import { MarkdownReaderPlugin, PlainTextReaderPlugin } from './plugins';
import { loadConfig } from './config/config';
import chalk from 'chalk';

/**
 * 主函数
 */
async function main() {
  // 获取命令行参数
  const [,, inputFile] = process.argv;

  if (!inputFile) {
    console.error('请指定要发布的文件路径');
    process.exit(1);
  }

  try {
    // 加载配置
    const config = loadConfig();
    
    // 创建发布器实例
    const publisher = new WeChatPublisher({
      ...config,
      plugins: [
        new MarkdownReaderPlugin(),
        new PlainTextReaderPlugin(),
        // 在这里添加更多插件...
      ],
    });

    // 发布文章到草稿箱
    console.log(`🚀 开始发布文件到草稿箱: ${inputFile}`);
    const result = await publisher.publish(inputFile);
    
    console.log(chalk.green('✅ 发布到草稿箱成功！'));
    console.log(chalk.blue('📝 文章标题:'), result.article.title);
    console.log(chalk.blue('🆔 草稿ID:'), result.article.mediaId || '无');
    console.log(chalk.blue('📋 内容预览:'), result.article.content.substring(0, 100) + '...');
    
    if (result.article.mediaId) {
      console.log(chalk.blue('🔗 草稿链接:'), `https://mp.weixin.qq.com/cgi-bin/appmsg?t=media/appmsg_edit_v2&action=edit&isNew=1&type=10&token=${publisher.getAccessToken()}&lang=zh_CN#${result.article.mediaId}`);
    }
  } catch (error) {
    console.error('发布失败:', error instanceof Error ? error.message : String(error));
    process.exit(1);
  }
}

// 执行主函数
main().catch(console.error);
