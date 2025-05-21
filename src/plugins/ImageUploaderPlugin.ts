import { Plugin, PluginContext, ArticleContent } from '../core/types.js';
import axios from 'axios';
import { WeChatPublisher } from '../core/Publisher.js';
import * as fs from 'fs';
import { join, dirname, basename } from 'path';
import { fileURLToPath } from 'url';
import FormData from 'form-data';
import { Buffer } from 'buffer';
import { PluginError } from '../core/errors.js';

// Use ESM __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * 图片上传插件
 */
export class ImageUploaderPlugin implements Plugin {
  name = 'ImageUploaderPlugin';

  constructor(private readonly publisher: WeChatPublisher) { }

  async execute(ctx: PluginContext): Promise<PluginContext> {
    try {
      // 确保 article 存在
      if (!ctx.article) {
        ctx.article = {
          title: '',
          content: '',
          showCoverPic: false,
          needOpenComment: true,
          mediaId: '',
          thumbMediaId: '',
          msg: ''
        };
      }

      // 检查是否有封面图片需要上传
      if (ctx.article.coverImage && fs.existsSync(ctx.article.coverImage)) {
        console.log(`[INFO] 上传封面图片: ${ctx.article.coverImage}`);
        
        // 确保访问令牌有效
        await this.publisher['ensureAccessToken']();
        const accessToken = this.publisher.getAccessToken();
        
        // 准备上传图片
        const form = new FormData();
        form.append('media', fs.createReadStream(ctx.article.coverImage), {
          filename: basename(ctx.article.coverImage),
          contentType: 'image/jpeg'
        });
        
        // 使用 publisher 上传永久素材
        const mediaInfo = await this.publisher.uploadPermanentMaterial(
          ctx.article.coverImage,
          'image'  // 指定素材类型为图片
        );
        
        // 设置封面图片的 media_id 和 URL
        ctx.article.thumbMediaId = mediaInfo.media_id;
        ctx.article.coverUrl = mediaInfo.url || '';
        ctx.article.showCoverPic = true;
        
        console.log(`[INFO] 封面图片上传成功，media_id: ${mediaInfo.media_id}`);
      } else if (ctx.article.coverImage) {
        console.warn(`[WARN] 封面图片不存在: ${ctx.article.coverImage}`);
      } else {
        console.log('[INFO] 未提供封面图片，将不设置封面');
        ctx.article.showCoverPic = false;
      }
      
      return ctx;
    } catch (error) {
      throw new PluginError('图片上传失败', {
        message: error instanceof Error ? error.message : String(error)
      });
    }
  }
}
