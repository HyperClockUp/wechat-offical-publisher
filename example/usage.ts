import { WeChatPublisher } from '../src/core/Publisher';
import { MarkdownReaderPlugin, PlainTextReaderPlugin } from '../src/plugins';
import { loadConfig } from '../src/config/config';

async function main() {
  try {
    // 加载配置
    const config = loadConfig();
    
    // 创建发布器实例
    const publisher = new WeChatPublisher({
      appId: config.appId,
      appSecret: config.appSecret,
      debug: config.debug,
      plugins: [
        new MarkdownReaderPlugin(),
        new PlainTextReaderPlugin(),
      ],
    });

    // 检查命令行参数
    const filePath = process.argv[2];
    if (!filePath) {
      console.error('请指定要发布的文件路径');
      console.log('用法: npm start -- <文件路径>');
      process.exit(1);
    }

    // 发布文章
    console.log(`正在发布文件: ${filePath}`);
    try {
      const result = await publisher.publish(filePath);
      
      console.log('发布成功:', result.msg);
      console.log('文章标题:', result.article.title);
      console.log('内容预览:', result.article.content.substring(0, 100) + '...');
    } catch (error) {
      console.error('发布过程中发生错误:', error instanceof Error ? error.message : String(error));
      process.exit(1);
    }
    
  } catch (error) {
    console.error('发布失败:', error instanceof Error ? error.message : String(error));
    process.exit(1);
  }
}

main().catch(console.error);
