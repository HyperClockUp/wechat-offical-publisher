import { Plugin, PluginContext, ArticleContent } from '../core/types';
import axios from 'axios';
import { WeChatPublisher } from '../core/Publisher';
import * as fs from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import FormData from 'form-data';
import { Buffer } from 'node:buffer';

const __dirname = fileURLToPath(import.meta.url);

/**
 * 图片上传插件
 */
export class ImageUploaderPlugin implements Plugin {
  name = 'ImageUploaderPlugin';

  constructor(private readonly publisher: WeChatPublisher) { }

  async execute(ctx: PluginContext): Promise<PluginContext> {
    try {
      if (!ctx.article?.thumbMediaId) {
        // 如果没有封面图片，使用本地默认图片
        const defaultImageUrl = 'file://' + join(__dirname, '../../', 'assets', 'default_cover.png');
        const mediaId = await this.uploadImage(defaultImageUrl);
        // 确保 article 存在
        if (!ctx.article) {
          throw new Error('文章内容不存在');
        }
        ctx.article = {
          ...ctx.article,
          thumbMediaId: mediaId
        };
      }
      console.log({
        ctx
      });
      return ctx;
    } catch (error) {
      console.error(`[${this.name}] 上传图片失败:`, error);
      throw error;
    }
  }

  private async uploadImage(imageUrl: string): Promise<string> {
    try {
      // 获取访问令牌
      await this.publisher.ensureAccessToken();

      // 读取图片数据
      let imageData: Buffer;
      if (imageUrl.startsWith('file://')) {
        // 本地文件
        const filePath = imageUrl.replace('file://', '');
        imageData = await fs.promises.readFile(filePath);
      } else {
        // 远程图片
        const response = await axios.get(imageUrl, {
          responseType: 'arraybuffer'
        });
        imageData = response.data;
      }

      // 上传到微信
      const formData = new FormData();
      formData.append('media', Buffer.from(imageData), {
        filename: 'image.png',
        contentType: 'image/png'
      });

      const uploadResponse = await axios.post(
        `https://api.weixin.qq.com/cgi-bin/material/add_material`,
        formData,
        {
          params: {
            access_token: this.publisher.getAccessToken(),
            type: 'image'
          },
          headers: formData.getHeaders()
        }
      );

      if (uploadResponse.data.errcode) {
        throw new Error(`上传图片失败: ${uploadResponse.data.errmsg}`);
      }

      return uploadResponse.data.media_id;
    } catch (error) {
      console.error(`[${this.name}] 上传图片失败:`, error);
      throw error;
    }
  }
}
