import axios, { AxiosInstance } from 'axios';
import fs from 'fs';
import path from 'path';
import FormData from 'form-data';
import { Config, WeChatApiResponse } from '../types';
import { ApiError } from './errors';
import { logger } from './logger';

const WECHAT_API_BASE = 'https://api.weixin.qq.com/cgi-bin';
const TOKEN_CACHE_FILE = path.join(process.cwd(), '.cache', 'access_token.json');

/**
 * 微信API封装
 */
export class WeChatApi {
  private http: AxiosInstance;
  private accessToken: string = '';
  private tokenExpiresAt: number = 0;

  constructor(private config: Config) {
    this.http = axios.create({
      baseURL: WECHAT_API_BASE,
      timeout: 30000
    });
  }

  /**
   * 获取访问令牌
   */
  async getAccessToken(): Promise<string> {
    // 检查缓存的令牌是否有效
    if (this.accessToken && this.tokenExpiresAt > Date.now()) {
      return this.accessToken;
    }

    // 尝试从文件加载缓存的令牌
    await this.loadTokenFromCache();
    if (this.accessToken && this.tokenExpiresAt > Date.now()) {
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
      const response = await this.http.get<WeChatApiResponse>('/token', {
        params: {
          grant_type: 'client_credential',
          appid: this.config.appId,
          secret: this.config.appSecret
        }
      });

      if (response.data.errcode) {
        throw new ApiError(`获取访问令牌失败: ${response.data.errmsg}`, response.data.errcode);
      }

      this.accessToken = response.data.access_token!;
      this.tokenExpiresAt = Date.now() + (response.data.expires_in! - 300) * 1000; // 提前5分钟过期

      // 保存到缓存文件
      await this.saveTokenToCache();
      
      if (this.config.debug) {
        console.log('访问令牌刷新成功:', {
          token: this.accessToken.substring(0, 10) + '...',
          expiresAt: new Date(this.tokenExpiresAt).toISOString()
        });
      }
    } catch (error) {
      if (this.config.debug) {
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
  async uploadImageForArticle(filePath: string): Promise<{ url: string }> {
    const accessToken = await this.getAccessToken();
    
    // 检查文件是否存在
    if (!fs.existsSync(filePath)) {
      throw new ApiError(`文件不存在: ${filePath}`, 0);
    }

    // 检查文件大小（微信限制1MB）
    const stats = fs.statSync(filePath);
    if (stats.size > 1024 * 1024) {
      throw new ApiError(`文件过大: ${(stats.size / 1024 / 1024).toFixed(2)}MB，超过1MB限制`, 0);
    }

    // 检查文件格式（仅支持jpg/png）
    const ext = path.extname(filePath).toLowerCase();
    if (!['.jpg', '.jpeg', '.png'].includes(ext)) {
      throw new ApiError(`不支持的文件格式: ${ext}，仅支持jpg/png格式`, 0);
    }

    const form = new FormData();
    const fileStream = fs.createReadStream(filePath);
    
    // 根据文件扩展名设置正确的 MIME 类型
    let contentType = 'application/octet-stream';
    if (ext === '.jpg' || ext === '.jpeg') {
      contentType = 'image/jpeg';
    } else if (ext === '.png') {
      contentType = 'image/png';
    }
    
    form.append('media', fileStream, {
      filename: path.basename(filePath),
      contentType: contentType
    });

    try {
      if (this.config.debug) {
        console.log('上传图文消息图片:', {
          filePath,
          fileSize: `${(stats.size / 1024).toFixed(2)}KB`,
          contentType,
          extension: ext
        });
      }

      const response = await axios.post<WeChatApiResponse>(
        `${WECHAT_API_BASE}/media/uploadimg?access_token=${accessToken}`,
        form,
        {
          headers: {
            ...form.getHeaders(),
            'User-Agent': 'WeChat Publisher'
          },
          timeout: 60000,
          maxContentLength: 10 * 1024 * 1024, // 10MB
          maxBodyLength: 10 * 1024 * 1024
        }
      );

      if (this.config.debug) {
        console.log('微信API响应:', response.data);
        console.log('响应中的 url:', response.data.url);
      }

      if (response.data.errcode && response.data.errcode !== 0) {
        throw new ApiError(`上传图文消息图片失败: ${response.data.errmsg} (错误码: ${response.data.errcode})`, response.data.errcode);
      }

      // 图文消息图片接口返回的是 url
      const url = response.data.url!;

      // 检查 url 是否存在
      if (!url) {
        throw new ApiError(`上传图文消息图片成功但未返回 url，响应: ${JSON.stringify(response.data)}`, 0);
      }

      return { url };
    } catch (error) {
      if (this.config.debug) {
        console.error('上传图文消息图片失败，详细错误信息:', error);
        
        if (axios.isAxiosError(error)) {
          console.error('Axios错误详情:', {
            status: error.response?.status,
            statusText: error.response?.statusText,
            data: error.response?.data,
            headers: error.response?.headers,
            config: {
              url: error.config?.url,
              method: error.config?.method,
              headers: error.config?.headers
            }
          });
        }
      }
      
      if (axios.isAxiosError(error)) {
        const errorMsg = error.response?.data?.errmsg || error.message;
        const errorCode = error.response?.data?.errcode || 0;
        throw new ApiError(`上传图文消息图片失败: ${errorMsg} (HTTP状态: ${error.response?.status || 'unknown'})`, errorCode, error);
      }
      throw new ApiError(`上传图文消息图片失败: ${error instanceof Error ? error.message : String(error)}`, 0, error as Error);
    }
  }

  /**
   * 上传永久素材
   */
  async uploadPermanentMedia(filePath: string, type: 'image' | 'thumb' = 'image'): Promise<{ mediaId: string; url?: string }> {
    const accessToken = await this.getAccessToken();
    
    // 检查文件是否存在
    if (!fs.existsSync(filePath)) {
      throw new ApiError(`文件不存在: ${filePath}`, 0);
    }

    // 检查文件大小（微信限制2MB）
    const stats = fs.statSync(filePath);
    if (stats.size > 2 * 1024 * 1024) {
      throw new ApiError(`文件过大: ${(stats.size / 1024 / 1024).toFixed(2)}MB，超过2MB限制`, 0);
    }

    const form = new FormData();
    const fileStream = fs.createReadStream(filePath);
    
    // 根据文件扩展名设置正确的 MIME 类型
    const ext = path.extname(filePath).toLowerCase();
    let contentType = 'application/octet-stream';
    if (ext === '.jpg' || ext === '.jpeg') {
      contentType = 'image/jpeg';
    } else if (ext === '.png') {
      contentType = 'image/png';
    }
    
    form.append('media', fileStream, {
      filename: path.basename(filePath),
      contentType: contentType
    });

    try {
      if (this.config.debug) {
        console.log('上传永久素材:', {
          filePath,
          type,
          fileSize: `${(stats.size / 1024).toFixed(2)}KB`,
          contentType
        });
      }

      const response = await axios.post<WeChatApiResponse>(
        `${WECHAT_API_BASE}/material/add_material?access_token=${accessToken}&type=${type}`,
        form,
        {
          headers: {
            ...form.getHeaders(),
            'User-Agent': 'WeChat Publisher'
          },
          timeout: 60000,
          maxContentLength: 10 * 1024 * 1024, // 10MB
          maxBodyLength: 10 * 1024 * 1024
        }
      );

      if (this.config.debug) {
        console.log('微信API响应:', response.data);
        console.log('响应中的 media_id:', response.data.media_id);
        console.log('响应中的 thumb_media_id:', response.data.thumb_media_id);
        console.log('响应的所有字段:', Object.keys(response.data));
        console.log('上传类型:', type);
      }

      if (response.data.errcode && response.data.errcode !== 0) {
        throw new ApiError(`上传永久素材失败: ${response.data.errmsg} (错误码: ${response.data.errcode})`, response.data.errcode);
      }

      // 永久素材返回的是 media_id
      const mediaId = response.data.media_id!;

      // 检查 media_id 是否存在
      if (!mediaId) {
        throw new ApiError(`上传永久素材成功但未返回 media_id，响应: ${JSON.stringify(response.data)}`, 0);
      }

      return {
        mediaId: mediaId,
        url: response.data.url
      };
    } catch (error) {
      if (this.config.debug) {
        console.error('上传永久素材失败，详细错误信息:', error);
        
        if (axios.isAxiosError(error)) {
          console.error('Axios错误详情:', {
            status: error.response?.status,
            statusText: error.response?.statusText,
            data: error.response?.data,
            headers: error.response?.headers,
            config: {
              url: error.config?.url,
              method: error.config?.method,
              headers: error.config?.headers
            }
          });
        }
      }
      
      if (axios.isAxiosError(error)) {
        const errorMsg = error.response?.data?.errmsg || error.message;
        const errorCode = error.response?.data?.errcode || 0;
        throw new ApiError(`上传永久素材失败: ${errorMsg} (HTTP状态: ${error.response?.status || 'unknown'})`, errorCode, error);
      }
      throw new ApiError(`上传永久素材失败: ${error instanceof Error ? error.message : String(error)}`, 0, error as Error);
    }
  }

  /**
   * 上传临时素材
   */
  async uploadMedia(filePath: string, type: 'image' | 'thumb' = 'image'): Promise<{ mediaId: string; url?: string }> {
    const accessToken = await this.getAccessToken();
    
    // 检查文件是否存在
    if (!fs.existsSync(filePath)) {
      throw new ApiError(`文件不存在: ${filePath}`, 0);
    }

    // 检查文件大小（微信限制2MB）
    const stats = fs.statSync(filePath);
    if (stats.size > 2 * 1024 * 1024) {
      throw new ApiError(`文件过大: ${(stats.size / 1024 / 1024).toFixed(2)}MB，超过2MB限制`, 0);
    }

    const form = new FormData();
    const fileStream = fs.createReadStream(filePath);
    
    // 根据文件扩展名设置正确的 MIME 类型
    const ext = path.extname(filePath).toLowerCase();
    let contentType = 'application/octet-stream';
    if (ext === '.jpg' || ext === '.jpeg') {
      contentType = 'image/jpeg';
    } else if (ext === '.png') {
      contentType = 'image/png';
    }
    
    form.append('media', fileStream, {
      filename: path.basename(filePath),
      contentType: contentType
    });

    try {
      if (this.config.debug) {
        console.log('上传素材:', {
          filePath,
          type,
          fileSize: `${(stats.size / 1024).toFixed(2)}KB`,
          contentType
        });
      }

      const response = await axios.post<WeChatApiResponse>(
        `${WECHAT_API_BASE}/media/upload?access_token=${accessToken}&type=${type}`,
        form,
        {
          headers: {
            ...form.getHeaders(),
            'User-Agent': 'WeChat Publisher'
          },
          timeout: 60000,
          maxContentLength: 10 * 1024 * 1024, // 10MB
          maxBodyLength: 10 * 1024 * 1024
        }
      );

      if (this.config.debug) {
        console.log('微信API响应:', response.data);
        console.log('响应中的 media_id:', response.data.media_id);
        console.log('响应中的 thumb_media_id:', response.data.thumb_media_id);
        console.log('响应的所有字段:', Object.keys(response.data));
        console.log('上传类型:', type);
      }

      if (response.data.errcode && response.data.errcode !== 0) {
        throw new ApiError(`上传素材失败: ${response.data.errmsg} (错误码: ${response.data.errcode})`, response.data.errcode);
      }

      // 临时素材上传接口统一返回 media_id 字段
      // 无论是 image 还是 thumb 类型，都使用 media_id
      const mediaId = response.data.media_id!;

      // 检查 media_id 是否存在
      if (!mediaId) {
        throw new ApiError(`上传素材成功但未返回 media_id，响应: ${JSON.stringify(response.data)}`, 0);
      }

      return {
        mediaId: mediaId,
        url: response.data.url
      };
    } catch (error) {
      if (this.config.debug) {
        console.error('上传素材失败，详细错误信息:', error);
        
        if (axios.isAxiosError(error)) {
          console.error('Axios错误详情:', {
            status: error.response?.status,
            statusText: error.response?.statusText,
            data: error.response?.data,
            headers: error.response?.headers,
            config: {
              url: error.config?.url,
              method: error.config?.method,
              headers: error.config?.headers
            }
          });
        }
      }
      
      if (axios.isAxiosError(error)) {
        const errorMsg = error.response?.data?.errmsg || error.message;
        const errorCode = error.response?.data?.errcode || 0;
        throw new ApiError(`上传素材失败: ${errorMsg} (HTTP状态: ${error.response?.status || 'unknown'})`, errorCode, error);
      }
      throw new ApiError(`上传素材失败: ${error instanceof Error ? error.message : String(error)}`, 0, error as Error);
    }
  }

  /**
   * 新增草稿
   */
  async addDraft(articles: any[]): Promise<{ mediaId: string }> {
    const accessToken = await this.getAccessToken();

    try {
      if (this.config.debug) {
        console.log('添加草稿请求数据:', JSON.stringify({ articles }, null, 2));
      }

      const response = await this.http.post<WeChatApiResponse>(
        `/draft/add?access_token=${accessToken}`,
        { articles }
      );

      if (this.config.debug) {
        console.log('添加草稿响应:', response.data);
      }

      if (response.data.errcode && response.data.errcode !== 0) {
        throw new ApiError(`添加草稿失败: ${response.data.errmsg} (错误码: ${response.data.errcode})`, response.data.errcode);
      }

      return { mediaId: response.data.media_id! };
    } catch (error) {
      if (this.config.debug) {
        console.error('添加草稿失败详情:', error);
        if (axios.isAxiosError(error)) {
          console.error('添加草稿 Axios错误详情:', {
            status: error.response?.status,
            statusText: error.response?.statusText,
            data: error.response?.data
          });
        }
      }
      
      if (axios.isAxiosError(error)) {
        const errorMsg = error.response?.data?.errmsg || error.message;
        const errorCode = error.response?.data?.errcode || 0;
        throw new ApiError(`添加草稿失败: ${errorMsg} (HTTP状态: ${error.response?.status || 'unknown'})`, errorCode, error);
      }
      throw new ApiError(`添加草稿失败: ${error instanceof Error ? error.message : String(error)}`, 0, error as Error);
    }
  }

  /**
   * 发布文章
   */
  async publishArticle(mediaId: string): Promise<{ publishId: string }> {
    const accessToken = await this.getAccessToken();

    try {
      const response = await this.http.post<WeChatApiResponse>(
        `/freepublish/submit?access_token=${accessToken}`,
        { media_id: mediaId }
      );

      if (response.data.errcode) {
        throw new ApiError(`发布文章失败: ${response.data.errmsg}`, response.data.errcode);
      }

      return { publishId: response.data.media_id! };
    } catch (error) {
      throw new ApiError('发布文章失败', 0, error as Error);
    }
  }

  /**
   * 从缓存文件加载令牌
   */
  private async loadTokenFromCache(): Promise<void> {
    try {
      if (fs.existsSync(TOKEN_CACHE_FILE)) {
        const cache = JSON.parse(fs.readFileSync(TOKEN_CACHE_FILE, 'utf-8'));
        this.accessToken = cache.token || '';
        this.tokenExpiresAt = cache.expiresAt || 0;
      }
    } catch (error) {
      if (this.config.debug) {
        console.log('加载令牌缓存失败:', error);
      }
    }
  }

  /**
   * 保存令牌到缓存文件
   */
  private async saveTokenToCache(): Promise<void> {
    try {
      const cacheDir = path.dirname(TOKEN_CACHE_FILE);
      if (!fs.existsSync(cacheDir)) {
        fs.mkdirSync(cacheDir, { recursive: true });
      }

      const cache = {
        token: this.accessToken,
        expiresAt: this.tokenExpiresAt
      };

      fs.writeFileSync(TOKEN_CACHE_FILE, JSON.stringify(cache, null, 2));
    } catch (error) {
      if (this.config.debug) {
        console.log('保存令牌缓存失败:', error);
      }
    }
  }
}