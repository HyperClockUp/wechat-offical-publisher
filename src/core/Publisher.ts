import * as fs from 'node:fs';
import * as path from 'node:path';
import { join, dirname, basename } from 'node:path';
import { fileURLToPath } from 'node:url';
import { Readable } from 'node:stream';
import { promises as fsp } from 'node:fs';
import axios, { AxiosInstance } from 'axios';
import FormData from 'form-data';
import { APIError, PluginError, ConfigurationError } from './errors.js';
import type { Plugin, PluginContext, ArticleContent, PublisherConfig } from './types.js';
import { AccessTokenCache } from './AccessTokenCache.js';
import { logger } from './logger.js';

const WECHAT_API_BASE_URL = 'https://api.weixin.qq.com/cgi-bin';

// 获取当前模块的目录 (ESM 方式)
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// 缓存文件路径
const cachePath = join(__dirname, '..', '..', '.cache');
const cacheFile = join(cachePath, 'access_token.json');

// 初始化函数
const initialize = async () => {
  // 确保缓存目录存在
  if (!fs.existsSync(cachePath)) {
    await fsp.mkdir(cachePath, { recursive: true });
  }

  // 确保缓存文件存在
  if (!fs.existsSync(cacheFile)) {
    await fsp.writeFile(cacheFile, JSON.stringify({ token: '', expiresAt: 0 }), 'utf8');
  }

  // 初始化访问令牌缓存
  AccessTokenCache.init();
};

// 执行初始化
initialize().catch(err => {
  console.error('初始化失败:', err);
  process.exit(1);
});

/**
 * 微信文章发布器
 */
export class WeChatPublisher {
  private config: Required<PublisherConfig>;
  private accessToken: string = '';
  private tokenExpiresAt: number = 0;
  private readonly http: AxiosInstance;
  private readonly plugins: Plugin[];
  private initialized: boolean = false;

  /**
   * 获取配置
   */
  getConfig(): Required<PublisherConfig> {
    return { ...this.config };
  }

  /**
   * 更新配置
   * @param update 配置更新
   */
  async updateConfig(update: Partial<PublisherConfig>): Promise<void> {
    // 合并配置
    this.config = {
      ...this.config,
      ...update,
      // 确保必要的配置项不会被覆盖为undefined
      appId: update.appId ?? this.config.appId,
      appSecret: update.appSecret ?? this.config.appSecret,
      // 处理publishToDraft的特殊逻辑
      publishToDraft: update.publishToDraft ?? this.config.publishToDraft
    };

    // 如果更新了appId或appSecret，需要重新初始化
    if (update.appId || update.appSecret) {
      this.initialized = false;
      await this.initialize();
    }

    logger.info('配置已更新', {
      publishToDraft: this.config.publishToDraft,
      debug: this.config.debug
    });
  }

  /**
   * 获取插件列表
   */
  getPlugins(): Plugin[] {
    return [...this.plugins];
  }

  /**
   * 等待SDK初始化完成
   * @returns 初始化状态
   */
  async waitForInitialization(): Promise<boolean> {
    return this.initialized;
  }

  /**
   * 初始化Publisher
   */
  static async init(config: Partial<PublisherConfig>): Promise<WeChatPublisher> {
    const instance = new WeChatPublisher(config);
    try {
      await instance.initialize();
      instance.initialized = true;
      return instance;
    } catch (error) {
      throw new Error(`初始化发布器失败: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  private constructor(config: Partial<PublisherConfig>) {
    try {
      // 验证配置
      if (!config.appId || !config.appSecret) {
        throw new ConfigurationError('缺少必要的配置项', {
          missing: ['appId', 'appSecret'].filter(key => !config[key as keyof typeof config])
        });
      }

      this.config = {
        appId: config.appId,
        appSecret: config.appSecret,
        plugins: config.plugins || [],
        debug: Boolean(config.debug),
        publishToDraft: Boolean(config.publishToDraft)
      };

      // 验证插件
      this.validatePlugins();

      // 初始化插件
      this.plugins = this.config.plugins;

      // 创建 axios 实例
      this.http = axios.create({
        baseURL: WECHAT_API_BASE_URL,
        timeout: 10000, // 10秒超时
        headers: {
          'Content-Type': 'application/json'
        }
      });

      logger.info('Publisher初始化成功', {
        appId: this.config.appId.substring(0, 8) + '...',
        debug: this.config.debug,
        publishToDraft: this.config.publishToDraft
      });
    } catch (error) {
      throw new ConfigurationError('Publisher初始化失败', {
        details: error instanceof Error ? error.message : String(error)
      });
    }
  }

  /**
   * 异步初始化
   */
  public async initialize(): Promise<void> {
    try {
      // 初始化访问令牌
      const tokenData = await AccessTokenCache.getAccessToken(this.config.appId, this.config.appSecret);
      this.accessToken = tokenData.token;
      this.tokenExpiresAt = tokenData.expiresAt;

      // 如果令牌为空或已过期，刷新令牌
      if (!this.accessToken || this.tokenExpiresAt <= Date.now()) {
        await this.refreshAccessToken();
      }
    } catch (error) {
      throw new ConfigurationError('Publisher初始化失败', {
        details: error instanceof Error ? error.message : String(error)
      });
    }
  }

  /**
   * 验证插件配置
   */
  private validatePlugins(): void {
    const pluginNames = new Set<string>();
    for (const plugin of this.config.plugins) {
      if (!plugin.name) {
        throw new ConfigurationError('插件必须有名称');
      }
      if (pluginNames.has(plugin.name)) {
        throw new ConfigurationError(`重复的插件名称: ${plugin.name}`);
      }
      pluginNames.add(plugin.name);
    }
  }

  /**
   * 刷新访问令牌
   */
  private async refreshAccessToken(): Promise<void> {
    try {
      const { data } = await this.http.get<{
        access_token: string;
        expires_in: number;
        errcode?: number;
        errmsg?: string;
      }>(`/token`, {
        params: {
          grant_type: 'client_credential',
          appid: this.config.appId,
          secret: this.config.appSecret
        }
      });

      if (data.errcode) {
        throw new APIError('获取访问令牌失败', {
          code: data.errcode,
          message: data.errmsg
        });
      }

      if (!data.access_token) {
        throw new APIError('获取访问令牌失败', {
          message: '返回的令牌为空'
        });
      }

      this.accessToken = data.access_token;
      // 提前5分钟过期，避免临界点问题
      this.tokenExpiresAt = Date.now() + (data.expires_in - 300) * 1000;

      // 保存到缓存
      const tokenData = {
        token: this.accessToken,
        expiresAt: this.tokenExpiresAt
      };
      fs.writeFileSync(cacheFile, JSON.stringify(tokenData));
    } catch (error) {
      throw new APIError('刷新访问令牌失败', {
        message: error instanceof Error ? error.message : String(error)
      });
    }
  }

  /**
   * 确保访问令牌有效
   */
  public async ensureAccessToken(): Promise<void> {
    try {
      // 从缓存加载访问令牌
      const cachedToken = await AccessTokenCache.getAccessToken(this.config.appId, this.config.appSecret);
      this.accessToken = cachedToken.token;
      this.tokenExpiresAt = cachedToken.expiresAt;

      // 如果令牌有效，直接返回
      if (this.accessToken && this.tokenExpiresAt > Date.now()) {
        return;
      }

      // 刷新访问令牌
      await this.refreshAccessToken();
    } catch (error) {
      throw new APIError('获取访问令牌失败', {
        message: error instanceof Error ? error.message : String(error)
      });
    }
  }

  /**
   * 添加插件
   */
  use(plugin: Plugin): this {
    this.config.plugins.push(plugin);
    return this;
  }

  /**
   * 发布文章
   * @param input 文章文件路径
   * @param options 发布选项
   * @returns 返回发布结果，包含文章信息和状态
   */
  async publish(
    input: string,
    options: {
      thumbMediaId?: string;
      title?: string;
      author?: string;
      digest?: string;
      showCoverPic?: boolean;
    } = {}
  ): Promise<{ msg: string; article: ArticleContent }> {
    // 初始化上下文
    const ctx: PluginContext = {
      input,
      article: {
        title: options.title || '',
        content: '',
        mediaId: '',
        thumbMediaId: options.thumbMediaId || '',
        author: options.author || '',
        digest: options.digest || '',
        showCoverPic: options.showCoverPic ?? true,
        msg: ''
      },
    };

    try {
      // 执行插件链
      for (const plugin of this.config.plugins) {
        if (this.config.debug) {
          console.log(`[DEBUG] Executing plugin: ${plugin.name}`);
        }
        try {
          await plugin.execute(ctx);
        } catch (error) {
          // 插件执行失败，记录错误并立即停止执行
          const errorMessage = `插件 ${plugin.name} 执行失败: ${error instanceof Error ? error.message : String(error)}`;
          console.error(`[ERROR] ${errorMessage}`);
          throw new Error(errorMessage);
        }
      }

      if (!ctx.article) {
        throw new Error('No article content was generated by plugins');
      }

      // 获取访问令牌
      await this.ensureAccessToken();

      // 发布到微信并返回结果
      return await this.publishToWeChat(ctx.article);
    } catch (error) {
      const errorMessage = `发布失败: ${error instanceof Error ? error.message : String(error)}`;
      console.error(`[ERROR] ${errorMessage}`);
      throw new Error(errorMessage);
    }
  }

  /**
   * 获取当前访问令牌
   * @returns 当前访问令牌
   */
  public getAccessToken(): string {
    return this.accessToken;
  }

  /**
   * 上传临时素材
   * @param imagePath 图片路径
   * @param type 素材类型，默认为图片
   * @returns 包含 media_id 和可选的 url 的对象
   */
  async uploadTemporaryMaterial(
    imagePath: string, 
    type: 'image' | 'voice' | 'video' | 'thumb' = 'image'
  ): Promise<{ media_id: string; url?: string }> {
    return this.uploadMaterial(imagePath, 'temporary', type);
  }

  /**
   * 上传永久素材
   * @param imagePath 图片路径
   * @param type 素材类型，默认为图片
   * @returns 包含 media_id 和 url 的对象
   */
  async uploadPermanentMaterial(
    imagePath: string, 
    type: 'image' | 'voice' | 'video' | 'thumb' = 'image'
  ): Promise<{ media_id: string; url?: string }> {
    return this.uploadMaterial(imagePath, 'permanent', type);
  }

  /**
   * 上传素材到微信服务器
   * @param imagePath 图片路径
   * @param materialType 素材类型：temporary-临时，permanent-永久
   * @param fileType 文件类型
   * @returns 素材的media_id
   */
  private async uploadMaterial(
    imagePath: string, 
    materialType: 'temporary' | 'permanent',
    fileType: 'image' | 'voice' | 'video' | 'thumb' = 'image'
  ): Promise<{ media_id: string; url?: string }> {
    const isTemporary = materialType === 'temporary';
    console.log(`[DEBUG] 开始上传${isTemporary ? '临时' : '永久'}素材: ${imagePath}, 类型: ${fileType}`);

    try {
      await this.ensureAccessToken();
      
      // 读取文件
      const fileStream = fs.createReadStream(imagePath);
      const stats = fs.statSync(imagePath);
      const fileSize = stats.size;
      const extname = path.extname(imagePath).toLowerCase();
      
      // 确定内容类型
      let contentType: string;
      switch (extname) {
        case '.jpg':
        case '.jpeg':
          contentType = 'image/jpeg';
          break;
        case '.png':
          contentType = 'image/png';
          break;
        case '.gif':
          contentType = 'image/gif';
          break;
        default:
          contentType = 'application/octet-stream';
      }

      // 准备表单数据
      const form = new FormData();
      form.append('media', fileStream, {
        filename: path.basename(imagePath),
        contentType,
        knownLength: fileSize
      });

      // 设置请求头
      const headers = form.getHeaders();
      const contentLength = await new Promise<number>((resolve, reject) => {
        form.getLength((err, length) => {
          if (err) reject(err);
          else resolve(length);
        });
      });
      headers['content-length'] = contentLength.toString();

      // 构建请求URL
      const endpoint = isTemporary 
        ? 'media/upload' 
        : 'material/add_material';
      
      const params = new URLSearchParams({
        access_token: this.accessToken,
        type: fileType
      });

      // 确保 baseURL 和 endpoint 之间的斜杠正确
      const baseUrl = WECHAT_API_BASE_URL.endsWith('/') 
        ? WECHAT_API_BASE_URL 
        : `${WECHAT_API_BASE_URL}/`;
      const fullUrl = `${baseUrl}${endpoint}?${params.toString()}`;
      console.log(`[DEBUG] 上传URL: ${fullUrl}`);

      // 发送请求
      const { data } = await axios.post<{
        errcode?: number;
        errmsg?: string;
        media_id: string;
        url?: string;
        created_at?: number;
      }>(
        fullUrl,
        form,
        {
          headers: {
            ...headers,
            'Content-Length': contentLength.toString()
          },
          maxBodyLength: Infinity,
          maxContentLength: Infinity
        }
      );

      console.log('[DEBUG] 上传响应:', JSON.stringify(data, null, 2));

      if (data.errcode) {
        throw new Error(`上传${isTemporary ? '临时' : '永久'}素材失败[${data.errcode}]: ${data.errmsg || '未知错误'}`);
      }

      if (!data.media_id) {
        throw new Error(`上传${isTemporary ? '临时' : '永久'}素材失败: 未返回media_id`);
      }

      console.log(`[DEBUG] ${isTemporary ? '临时' : '永久'}素材上传成功，media_id: ${data.media_id}`);
      return {
        media_id: data.media_id,
        url: data.url
      };
    } catch (error) {
      console.error(`上传${isTemporary ? '临时' : '永久'}素材失败:`, error);
      throw new Error(`上传${isTemporary ? '临时' : '永久'}素材失败: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * 上传图片到微信服务器（兼容旧接口）
   * @param imagePath 图片路径
   * @deprecated 请使用 uploadTemporaryMaterial 或 uploadPermanentMaterial
   * @returns 包含 media_id 和可选的 url 的对象
   */
  async uploadImage(imagePath: string): Promise<{ media_id: string; url?: string }> {
    console.warn('uploadImage方法已弃用，请使用uploadPermanentMaterial或uploadTemporaryMaterial方法');
    return this.uploadPermanentMaterial(imagePath, 'image');
  }

  /**
   * 发布文章到微信
   * @param article 文章内容
   * @returns 发布结果
   */
  private async publishToWeChat(article: ArticleContent): Promise<{ msg: string; article: ArticleContent }> {
    // 模拟模式，不实际发布到微信
    if (this.config.debug) {
      console.log('[DEBUG] 模拟模式：跳过实际发布到微信');
      console.log('文章标题:', article.title);
      console.log('文章内容预览:', article.content.substring(0, 100) + '...');
      if (this.config.publishToDraft) {
        console.log('[DEBUG] 模拟模式：文章将发布到草稿箱');
        return {
          msg: '模拟发布到草稿箱成功',
          article: {
            ...article,
            content: article.content.substring(0, 100) + '...'
          }
        };
      } else {
        console.log('[DEBUG] 模拟模式：文章将直接发布');
        return {
          msg: '模拟直接发布成功',
          article: {
            ...article,
            content: article.content.substring(0, 100) + '...'
          }
        };
      }
    }

    try {
      // 确保访问令牌有效
      await this.ensureAccessToken();

      // 根据配置选择发布接口
      const endpoint = this.config.publishToDraft ? '/draft/add' : '/freepublish/submit';
      console.log(`正在${this.config.publishToDraft ? '发布到草稿箱' : '直接发布'}...`);

      // 处理封面图片
      const thumbMediaId = article.thumbMediaId;
      const showCoverPic = article.showCoverPic !== false && thumbMediaId ? 1 : 0; // 默认显示封面，除非显式设置为false

      console.log('[DEBUG] 开始处理封面图片...');
      console.log(`[DEBUG] 封面图片 media_id: ${thumbMediaId || '未设置'}`);
      console.log(`[DEBUG] 显示封面图片: ${showCoverPic === 1 ? '是' : '否'}`);

      if (thumbMediaId) {
        console.log(`[DEBUG] 使用已上传的封面图片，media_id: ${thumbMediaId}`);
      } else {
        console.log('[DEBUG] 未提供封面图片 media_id');
      }

      // 准备文章数据
      console.log('[DEBUG] 准备文章数据...');

      // 构建文章数据对象
      const articleData: any = {
        title: article.title,
        content: article.content,
        digest: article.digest || '',
        author: article.author || '',
        show_cover_pic: showCoverPic ? 1 : 0,
        content_source_url: article.sourceUrl || '',
        need_open_comment: article.needOpenComment ? 1 : 0,
        only_fans_can_comment: article.onlyFansCanComment ? 1 : 0
      };

      // 只要有 thumbMediaId 就设置，不管 showCoverPic 的值
      if (thumbMediaId) {
        console.log(`[DEBUG] 设置 thumb_media_id: ${thumbMediaId}`);
        articleData.thumb_media_id = thumbMediaId;
      } else {
        console.log('[DEBUG] 未设置 thumb_media_id');
        // 确保不包含 thumb_media_id 字段
        delete articleData.thumb_media_id;
      }

      // 打印详细的调试信息
      console.log('[DEBUG] 文章数据准备完成:', {
        title: articleData.title,
        has_thumb_media: !!articleData.thumb_media_id,
        thumb_media_id: articleData.thumb_media_id ? articleData.thumb_media_id : '未设置',
        show_cover_pic: articleData.show_cover_pic,
        content_length: articleData.content?.length || 0,
        digest_length: articleData.digest?.length || 0
      });

      // 完整的文章数据（隐藏敏感信息）
      const safeArticleData = { ...articleData };
      if (safeArticleData.content) {
        safeArticleData.content = `${safeArticleData.content.substring(0, 100)}...`;
      }
      console.log('[DEBUG] 完整文章数据:', safeArticleData);

      // 发送请求
      const { data } = await this.http.post<{
        errcode?: number;
        errmsg?: string;
        media_id?: string;
        [key: string]: any;
      }>(endpoint, {
        articles: [articleData]
      }, {
        params: { access_token: this.accessToken }
      });

      // 打印响应数据
      console.log('[DEBUG] 发布响应数据:', {
        errcode: data.errcode,
        errmsg: data.errmsg,
        media_id: data.media_id,
        url: data.url
      });

      // 检查错误码
      if (data.errcode && data.errcode !== 0) {
        // 处理封面图片相关的错误
        if (data.errmsg && (data.errmsg.includes('invalid media_id') || data.errmsg.includes('thumb_media'))) {
          console.log(`[INFO] 封面图片相关错误: ${data.errmsg}`);

          // 如果已经尝试过不设置封面图片，直接抛出错误
          if (article.thumbMediaId === '') {
            throw new Error(`微信API错误: 无法发布文章，请检查文章内容是否符合要求`);
          }

          // 重新发送请求，不包含封面图片
          console.log('[INFO] 尝试不设置封面图片重新发布...');
          const noCoverArticle = {
            ...article,
            coverImage: '',
            thumbMediaId: '',
            showCoverPic: false
          };

          return this.publishToWeChat(noCoverArticle);
        }

        // 其他错误直接抛出
        throw new Error(`微信API错误: ${data.errmsg || '未知错误'}`);
      }

      // 处理返回结果
      const result = {
        msg: this.config.publishToDraft ? '成功发布到草稿箱' : '发布成功',
        article: {
          ...article,
          content: article.content.substring(0, 100) + '...',
          // 确保 mediaId 和 url 被正确设置
          mediaId: data.media_id || article.mediaId || '',
          url: data.url || article.url || ''
        }
      };

      return result;
    } catch (error) {
      const errorMessage = this.config.publishToDraft
        ? '发布到微信草稿箱失败'
        : '发布到微信失败';
      console.error(`${errorMessage}:`, error);
      throw new Error(`${errorMessage}: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
}
