import { WeChatPublisher } from '../core/Publisher.js';
import type { PublisherConfig, ArticleContent } from '../core/types.js';
import { MarkdownReaderPlugin } from '../plugins/MarkdownReaderPlugin.js';
import { PlainTextReaderPlugin } from '../plugins/PlainTextReaderPlugin.js';
import { ImageUploaderPlugin } from '../plugins/ImageUploaderPlugin.js';
import { ConfigurationError, APIError } from '../core/errors.js';
import { logger } from '../core/logger.js';
import * as fs from 'node:fs/promises';
import * as os from 'node:os';
import * as path from 'node:path';

/**
 * 微信文章发布SDK
 * 提供文章发布、批量发布、配置管理等功能
 */
export class WeChatPublisherSDK {
  private publisher: WeChatPublisher | null = null;
  private _initialized = false;
  private _initializationPromise: Promise<void> | null = null;
  private config: PublisherConfig & { plugins?: any[] } = {
    appId: '',
    appSecret: '',
    debug: false,
    publishToDraft: true,
    plugins: []
  };

  /**
   * 创建并初始化SDK实例（推荐使用）
   * @param config 配置对象
   * @returns 初始化后的SDK实例
   */
  static async create(config: Partial<PublisherConfig> = {}): Promise<WeChatPublisherSDK> {
    const sdk = new WeChatPublisherSDK(config);
    await sdk.initialize();
    return sdk;
  }

  /**
   * 创建SDK实例
   * 注意：需要手动调用initialize()方法进行初始化
   * @param config 配置对象
   */
  constructor(config: Partial<PublisherConfig> = {}) {
    // 合并配置
    this.config = {
      ...this.config,
      ...config,
      // 从环境变量中读取配置
      appId: config.appId || process.env.WECHAT_APP_ID || '',
      appSecret: config.appSecret || process.env.WECHAT_APP_SECRET || '',
      debug: config.debug ?? process.env.NODE_ENV === 'development',
      publishToDraft: config.publishToDraft ?? true,
      plugins: config.plugins || []
    };
  }

  /**
   * 初始化SDK
   * 如果已经初始化，则直接返回
   * 如果正在初始化中，则等待初始化完成
   * @returns Promise<void>
   */
  async initialize(): Promise<void> {
    if (this._initialized) {
      logger.debug('SDK 已经初始化');
      return;
    }

    // 如果正在初始化中，返回同一个Promise
    if (this._initializationPromise) {
      logger.debug('SDK 正在初始化中，等待完成...');
      await this._initializationPromise;
      return;
    }

    // 设置初始化中状态
    this._initializationPromise = (async () => {
      try {
        logger.debug('开始初始化 SDK...');

        // 验证配置
        logger.debug('验证配置...');
        try {
          this.validateConfig();
          logger.debug('配置验证通过');
        } catch (error: unknown) {
          const err = error instanceof Error ? error : new Error(String(error));
          logger.error('配置验证失败:', err);
          throw err;
        }

        // 先初始化基础插件
        logger.debug('初始化基础插件...');

        // 创建默认插件集合
        const defaultPlugins = [
          new MarkdownReaderPlugin(),
          new PlainTextReaderPlugin()
        ];

        // 获取自定义插件，过滤掉已存在的插件
        const customPlugins = (this.config.plugins || []).filter(plugin =>
          !defaultPlugins.some(p => p.name === plugin.name)
        );

        // 合并插件
        const basePlugins = [...defaultPlugins, ...customPlugins];
        logger.debug(`加载了 ${basePlugins.length} 个基础插件: ${basePlugins.map(p => p.name).join(', ')}`);

        // 初始化发布器
        logger.debug('开始初始化 WeChatPublisher...');
        try {
          this.publisher = await WeChatPublisher.init({
            appId: this.config.appId!,
            appSecret: this.config.appSecret!,
            debug: this.config.debug,
            publishToDraft: this.config.publishToDraft,
            plugins: basePlugins
          });
          logger.debug('WeChatPublisher 初始化成功');
        } catch (error: unknown) {
          const err = error instanceof Error ? error : new Error(String(error));
          logger.error('WeChatPublisher 初始化失败:', err);
          throw new Error(`Publisher初始化失败: ${err.message}`);
        }

        // 初始化需要发布器实例的插件
        logger.debug('初始化 ImageUploaderPlugin...');
        try {
          const imageUploaderPlugin = new ImageUploaderPlugin(this.publisher!);

          // 更新插件列表，添加 ImageUploaderPlugin
          const updatedPlugins = [...basePlugins, imageUploaderPlugin];
          logger.debug('更新插件配置...');
          await this.publisher.updateConfig({
            plugins: updatedPlugins
          });
          logger.debug('插件配置更新完成');
        } catch (error: unknown) {
          const err = error instanceof Error ? error : new Error(String(error));
          logger.error('初始化 ImageUploaderPlugin 失败:', err);
          // 继续执行，因为这不是致命错误
        }

        // 确保发布器已初始化
        if (!this.publisher) {
          const error = new Error('发布器实例不存在');
          logger.error('发布器初始化失败:', error);
          throw error;
        }
        this._initialized = true;
        logger.debug('SDK 初始化完成');
      } catch (error) {
        const err = error as Error;
        logger.error(`SDK 初始化失败: ${err.message}`);
        this._initialized = false;
        this._initializationPromise = null;
        throw new ConfigurationError(`SDK 初始化失败: ${err.message}`, { cause: error });
      } finally {
        this._initializationPromise = null;
      }
    })();

    await this._initializationPromise;
  }

  /**
   * 验证配置
   * @private
   */
  private validateConfig(): void {
    if (!this.config.appId || !this.config.appSecret) {
      const missing = [
        !this.config.appId ? 'appId' : '',
        !this.config.appSecret ? 'appSecret' : ''
      ].filter(Boolean);

      const errorMessage = `缺少必要的配置项: ${missing.join(', ')}`;
      logger.error(errorMessage);
      throw new ConfigurationError(errorMessage, { missing });
    }
  }
  /**
   * 获取发布器实例
   * @returns WeChatPublisher 实例
   */
  getPublisher(): WeChatPublisher {
    if (!this.publisher) {
      throw new ConfigurationError('SDK 未初始化，请先调用 initialize() 方法');
    }
    return this.publisher;
  }

  /**
   * 检查SDK是否已初始化
   * @returns 是否已初始化
   */
  isInitialized(): boolean {
    return this._initialized && this.publisher !== null;
  }

  /**
   * 获取访问令牌
   * @returns 访问令牌
   */
  async getAccessToken(): Promise<string> {
    if (!this.publisher) {
      throw new ConfigurationError('SDK 未初始化');
    }
    return this.publisher.getAccessToken();
  }

  /**
   * 发布单篇文章
   * @param filePath 文章文件路径
   * @param options 发布选项
   * @returns 发布结果
   */
  public async publishArticle(
    filePath: string,
    options: {
      title?: string;
      author?: string;
      digest?: string;
      draft?: boolean;
      coverImage?: string;
    } = {}
  ): Promise<ArticleContent> {
    try {
      await this.initialize();

      if (!this.publisher) {
        throw new Error('发布器未初始化');
      }

      logger.info(`🚀 开始发布文章到微信公众号 ${options.draft ? '(草稿箱)' : ''}...`);

      // 上传封面图片
      let mediaId: string | undefined;
      if (options.coverImage) {
        try {
          mediaId = await this.uploadImage(options.coverImage);
          logger.info(`封面图片上传成功，mediaId: ${mediaId}`);
        } catch (error) {
          logger.warn(`封面图片上传失败: ${(error as Error).message}`);
          // 如果封面图片上传失败，继续发布文章，但使用默认封面
        }
      }

      // 发布文章，传入封面图片的 mediaId
      const result = await this.publisher.publish(filePath, {
        thumbMediaId: mediaId,
        title: options.title,
        author: options.author,
        digest: options.digest,
        showCoverPic: !!mediaId // 如果有封面图片则显示封面
      });

      // 返回文章内容，包含封面图片信息
      const articleContent: ArticleContent = {
        title: result.article?.title || path.basename(filePath, path.extname(filePath)),
        content: result.article?.content || '',
        mediaId: result.article?.mediaId || '',
        thumbMediaId: mediaId || result.article?.thumbMediaId || '',
        author: options.author || result.article?.author || '',
        digest: options.digest || result.article?.digest || '未设置',
        showCoverPic: true,
        msg: result.msg,
        coverImage: options.coverImage,
        coverUrl: mediaId ? `wechat://${mediaId}` : undefined
      };

      logger.info(`文章发布成功: ${filePath}`);
      return articleContent;
    } catch (error) {
      const err = error as Error;
      logger.error(`文章发布失败: ${filePath}`, err);
      const errorWithCause = new Error(`文章发布失败: ${err.message}`);
      (errorWithCause as any).cause = error;
      throw errorWithCause;
    }
  }

  /**
   * 批量发布文章
   * @param filePaths 文章文件路径数组
   * @param options 发布选项
   * @returns 发布结果数组
   */
  async publishArticles(
    filePaths: string[],
    options: {
      draft?: boolean;
      coverImage?: string;
    } = {}
  ): Promise<ArticleContent[]> {
    if (!this._initialized || !this.publisher) {
      throw new ConfigurationError('SDK未初始化');
    }

    const results: ArticleContent[] = [];
    for (const filePath of filePaths) {
      try {
        logger.debug(`开始发布文章: ${filePath}`);
        const result = await this.publishArticle(filePath, options);
        results.push(result);
      } catch (error) {
        const err = error as Error;
        logger.error(`发布文章失败: ${filePath}`, err);
        // 创建一个包含错误信息的 ArticleContent 对象
        const errorArticle: ArticleContent = {
          title: `发布失败: ${filePath}`,
          content: `错误: ${err.message}`,
          mediaId: 'error',
          thumbMediaId: 'error',
          msg: `发布文章失败: ${err.message}`,
          // 可选字段
          author: '系统',
          digest: '文章发布过程中发生错误',
          showCoverPic: false
        };
        results.push(errorArticle);
      }
    }
    return results;
  }

  /**
   * 上传图片到微信服务器
   * @param imagePath 图片路径
   * @returns 图片media_id
   */
  async uploadImage(imagePath: string): Promise<string> {
    if (!this.publisher) {
      throw new Error('发布器未初始化');
    }

    try {
      logger.info(`开始上传图片: ${imagePath}`);
      const { media_id } = await this.publisher.uploadImage(imagePath);
      logger.info(`图片上传成功: ${imagePath} -> ${media_id}`);
      return media_id;
    } catch (error) {
      const err = error as Error;
      logger.error(`图片上传失败: ${imagePath}`, err);
      const errorWithCause = new Error(`图片上传失败: ${err.message}`);
      (errorWithCause as any).cause = error;
      throw errorWithCause;
    }
  }
}
