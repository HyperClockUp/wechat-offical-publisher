import { Plugin, PluginContext, ArticleContent } from '../core/types';
import axios from 'axios';
import { WeChatPublisher } from '../core/Publisher';
import * as fs from 'fs';
import { join, basename } from 'path';
import FormData from 'form-data';
import { Buffer } from 'buffer';
import { PluginError } from '../core/errors';
import { logger } from '../core/logger';

// 使用 process.cwd() 获取当前工作目录
const __dirname = process.cwd();

/**
 * 图片上传插件
 */
export class ImageUploaderPlugin implements Plugin {
  name = 'ImageUploaderPlugin';
  private readonly logger = logger;

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
        this.logger.info(`上传封面图片: ${ctx.article.coverImage}`);
        
        // 确保访问令牌有效
        await this.publisher['ensureAccessToken']();
        const accessToken = this.publisher.getAccessToken();
        
        // 准备上传图片
        const form = new FormData();
        form.append('media', fs.createReadStream(ctx.article.coverImage), {
          filename: basename(ctx.article.coverImage),
          contentType: 'image/jpeg'
        });
        
        let mediaInfo;
        try {
          // 使用 publisher 上传永久素材到封面分组
          mediaInfo = await this.publisher.uploadPermanentMaterial(
            ctx.article.coverImage,
            'image',  // 指定素材类型为图片
            'cover'   // 上传到封面分组
          );
          
          if (!mediaInfo.media_id) {
            throw new Error('上传封面图片失败：未获取到 media_id');
          }
          
          // 更新文章上下文中的封面信息
          ctx.article.thumbMediaId = mediaInfo.media_id;
          ctx.article.coverUrl = mediaInfo.url || '';
          ctx.article.coverGroup = 'cover';
          ctx.article.showCoverPic = true;
          
          this.logger.info(`封面图片上传成功，media_id: ${mediaInfo.media_id}`);
          if (mediaInfo.url) {
            this.logger.info(`封面图片URL: ${mediaInfo.url}`);
          }
        } catch (error) {
          this.logger.error('上传封面图片失败', error);
          throw error;
        }
      } else if (ctx.article.coverImage) {
        this.logger.warn(`封面图片不存在: ${ctx.article.coverImage}`);
        // 如果指定了封面图片但不存在，清除coverImage字段
        ctx.article.coverImage = '';
        ctx.article.showCoverPic = false;
      } else {
        // 如果没有提供封面图片，不记录日志，因为这是正常情况
        ctx.article.showCoverPic = false;
      }
      
      return ctx;
    } catch (error) {
      throw new PluginError('图片上传失败', {
        message: error instanceof Error ? error.message : String(error)
      });
    }
  }

  private async uploadImage(imagePath: string): Promise<string> {
    // 确保访问令牌有效
    await this.publisher['ensureAccessToken']();
    const accessToken = this.publisher.getAccessToken();
    
    // 准备上传图片
    const form = new FormData();
    form.append('media', fs.createReadStream(imagePath), {
      filename: basename(imagePath),
      contentType: 'image/jpeg'
    });
    
    let mediaInfo;
    try {
      // 使用 publisher 上传永久素材到封面分组
      mediaInfo = await this.publisher.uploadPermanentMaterial(
        imagePath,
        'image',  // 指定素材类型为图片
        'cover'   // 上传到封面分组
      );
      
      if (!mediaInfo.media_id) {
        throw new Error('上传封面图片失败：未获取到 media_id');
      }
      
      return mediaInfo.media_id;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error(`上传封面图片失败: ${errorMessage}`);
      throw new Error(`上传封面图片失败: ${errorMessage}`);
    }
  }

  private async getImageUrl(mediaId: string): Promise<string> {
    // 获取图片URL
    try {
      const response = await axios.get(`https://api.weixin.qq.com/cgi-bin/media/get?access_token=${this.publisher.getAccessToken()}&media_id=${mediaId}`);
      if (response.status === 200) {
        return response.data.url;
      } else {
        throw new Error(`获取图片URL失败，状态码：${response.status}`);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error(`获取图片URL失败: ${errorMessage}`);
      throw new Error(`获取图片URL失败: ${errorMessage}`);
    }
  }
}
