// 发布测试脚本
const { WeChatPublisher } = require('../dist/index');

async function main() {
  try {
    // 创建发布器实例
    const publisher = new WeChatPublisher();
    
    // 发布文章
    console.log('开始发布文章...');
    const result = await publisher.publish('./examples/test-network-images.md', {
      title: '好好享受周末',
      author: '萌漫星球',
      coverImage: 'https://p26-aiop-sign.byteimg.com/tos-cn-i-vuqhorh59i/20250718215220FE89B18E53BE27CD3960-2443-0~tplv-vuqhorh59i-image.image?rk3s=7f9e702d&x-expires=1752933148&x-signature=Zod0mGuepcX1Rux8Xl3hTQCwQIQ%3D',
      draft: true
    });
    
    console.log('✅ 发布成功!');
    console.log('文章标题:', result.title);
    console.log('媒体ID:', result.mediaId);
    console.log('状态:', result.message);
  } catch (error) {
    console.error('❌ 发布失败:', error);
  }
}

// 运行脚本
main();