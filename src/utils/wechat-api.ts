import axios, { AxiosInstance } from 'axios';
import fs from 'fs';
import path from 'path';
import FormData from 'form-data';
import { Config, WeChatApiResponse } from '../types';
import { ApiError } from './errors';
import { logger } from './logger';
import { TokenManager } from './token-manager';

const WECHAT_API_BASE = 'https://api.weixin.qq.com/cgi-bin';

/**
 * 微信API封装
 */
export class WeChatApi {
  private http: AxiosInstance;
  private accessToken: string = '';
  private tokenExpiresAt: number = 0;

  constructor(private appId: string, private appSecret: string, private debug: boolean = false, private useStableToken: boolean = false) {
    this.http = axios.create({
      baseURL: WECHAT_API_BASE,
      timeout: 30000
    });
  }

  /**
   * 获取访问令牌
   */
  async getAccessToken(): Promise<string> {
    // 检查内存缓存的令牌是否有效
    if (this.accessToken && this.tokenExpiresAt > Date.now()) {
      return this.accessToken;
    }

    // 尝试从缓存加载令牌（按AppID区分）
    const cachedToken = TokenManager.getCachedToken(this.appId);
    if (cachedToken) {
      this.accessToken = cachedToken.token;
      this.tokenExpiresAt = cachedToken.expiresAt;
      return this.accessToken;
    }

    // 获取新的访问令牌
    await this.refreshAccessToken();
    return this.accessToken;
  }

  /**
   * 刷新访问令牌
   */
  private async refreshAccessToken(): Promise<void> {
    try {
      let response;
      if (this.useStableToken) {
        // 使用 stable_token 接口
        logger.info('正在使用 stable_token 接口获取 Access Token...');
        response = await this.http.post<WeChatApiResponse>('/stable_token', {
          grant_type: 'client_credential',
          appid: this.appId,
          secret: this.appSecret,
          force_refresh: false // 默认不强制刷新
        });
      } else {
        // 使用普通 token 接口
        logger.info('正在使用普通 token 接口获取 Access Token...');
        response = await this.http.get<WeChatApiResponse>('/token', {
          params: {
            grant_type: 'client_credential',
            appid: this.appId,
            secret: this.appSecret
          }
        });
      }

      if (response.data.errcode) {
        throw new ApiError(`获取访问令牌失败: ${response.data.errmsg}`, response.data.errcode);
      }

      this.accessToken = response.data.access_token!;
      this.tokenExpiresAt = Date.now() + (response.data.expires_in! - 300) * 1000; // 提前5分钟过期

      // 保存到缓存（按AppID区分）
      TokenManager.cacheToken(this.appId, this.accessToken, response.data.expires_in!);
      
      if (this.debug) {
        console.log('访问令牌刷新成功:', {
          token: this.accessToken.substring(0, 10) + '...',
          expiresAt: new Date(this.tokenExpiresAt).toISOString()
        });
      }
    } catch (error) {
      if (this.debug) {
        console.error('刷新访问令牌失败详情:', error);
        if (axios.isAxiosError(error)) {
          console.error('Axios错误详情:', {
            status: error.response?.status,
            data: error.response?.data,
            message: error.message
          });
        }
      }
      throw new ApiError('刷新访问令牌失败', 0, error as Error);
    }
  }

  /**
   * 上传图文消息内的图片（获取URL）
   * 根据微信官方文档，此接口专门用于上传图文消息内的图片
   * 接口地址：https://api.weixin.qq.com/cgi-bin/media/uploadimg
   * 限制：仅支持jpg/png格式，大小必须在1MB以下
   * 优势：不占用公众号素材库中图片数量的100000个限制
   */
  async uploadImageForArticle(imagePath: string): Promise<{ url: string }> {
    const accessToken = await this.getAccessToken();
    
    if (!fs.existsSync(imagePath)) {
      throw new ApiError(`图片文件不存在: ${imagePath}`);
    }

    const form = new FormData();
    form.append('media', fs.createReadStream(imagePath));

    try {
      const response = await axios.post<WeChatApiResponse>(
        `${WECHAT_API_BASE}/media/uploadimg?access_token=${accessToken}`,
        form,
        {
          headers: {
            ...form.getHeaders(),
          },
          timeout: 30000
        }
      );

      if (response.data.errcode) {
        throw new ApiError(`上传图片失败: ${response.data.errmsg}`, response.data.errcode);
      }

      return { url: response.data.url! };
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new ApiError(`上传图片请求失败: ${error.message}`, 0, error);
      }
      throw error;
    }
  }

  /**
   * 上传永久素材（用于封面图片）
   * 接口地址：https://api.weixin.qq.com/cgi-bin/material/add_material
   */
  async uploadPermanentMedia(filePath: string, type: 'image' | 'thumb' | 'voice' | 'video' = 'thumb'): Promise<{ mediaId: string; url?: string }> {
    const accessToken = await this.getAccessToken();
    
    if (!fs.existsSync(filePath)) {
      throw new ApiError(`文件不存在: ${filePath}`);
    }

    const form = new FormData();
    form.append('media', fs.createReadStream(filePath));
    form.append('type', type);

    try {
      const response = await axios.post<WeChatApiResponse>(
        `${WECHAT_API_BASE}/material/add_material?access_token=${accessToken}&type=${type}`,
        form,
        {
          headers: {
            ...form.getHeaders(),
          },
          timeout: 30000
        }
      );

      if (response.data.errcode) {
        throw new ApiError(`上传永久素材失败: ${response.data.errmsg}`, response.data.errcode);
      }

      return { 
        mediaId: response.data.media_id!,
        url: response.data.url
      };
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new ApiError(`上传永久素材请求失败: ${error.message}`, 0, error);
      }
      throw error;
    }
  }

  /**
   * 新增草稿
   * 接口地址：https://api.weixin.qq.com/cgi-bin/draft/add
   */
  async addDraft(articles: any[]): Promise<{ mediaId: string }> {
    const accessToken = await this.getAccessToken();

    try {
      const response = await this.http.post<WeChatApiResponse>(
        `/draft/add?access_token=${accessToken}`,
        { articles }
      );

      if (response.data.errcode) {
        throw new ApiError(`创建草稿失败: ${response.data.errmsg}`, response.data.errcode);
      }

      return { mediaId: response.data.media_id! };
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new ApiError(`创建草稿请求失败: ${error.message}`, 0, error);
      }
      throw error;
    }
  }

  /**
   * 发布接口
   * 接口地址：https://api.weixin.qq.com/cgi-bin/freepublish/submit
   */
  async publishArticle(mediaId: string): Promise<{ publishId: string; msgDataId?: string }> {
    const accessToken = await this.getAccessToken();

    try {
      const response = await this.http.post<WeChatApiResponse>(
        `/freepublish/submit?access_token=${accessToken}`,
        { media_id: mediaId }
      );

      if (response.data.errcode) {
        throw new ApiError(`发布文章失败: ${response.data.errmsg}`, response.data.errcode);
      }

      // 处理响应数据，兼容不同的字段名称
      return { 
        publishId: response.data.publish_id || response.data.publishId || '',
        msgDataId: response.data.msg_data_id || response.data.msgDataId
      };
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new ApiError(`发布文章请求失败: ${error.message}`, 0, error);
      }
      throw error;
    }
  }

  /**
   * 上传网络图片到微信服务器
   * 支持通过URL上传图片
   */
  async uploadImageFromUrl(imageUrl: string): Promise<{ url: string }> {
    const accessToken = await this.getAccessToken();

    try {
      // 首先下载图片
      const imageResponse = await axios.get(imageUrl, {
        responseType: 'stream',
        timeout: 30000
      });

      // 创建FormData
      const form = new FormData();
      form.append('media', imageResponse.data);

      const response = await axios.post<WeChatApiResponse>(
        `${WECHAT_API_BASE}/media/uploadimg?access_token=${accessToken}`,
        form,
        {
          headers: {
            ...form.getHeaders(),
          },
          timeout: 30000
        }
      );

      if (response.data.errcode) {
        throw new ApiError(`上传网络图片失败: ${response.data.errmsg}`, response.data.errcode);
      }

      return { url: response.data.url! };
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new ApiError(`上传网络图片请求失败: ${error.message}`, 0, error);
      }
      throw error;
    }
  }

  /**
   * 清空当前公众号的Access Token缓存
   */
  clearAccessTokenCache(): void {
    TokenManager.clearTokenCache(this.appId);
    this.accessToken = '';
    this.tokenExpiresAt = 0;
  }
}