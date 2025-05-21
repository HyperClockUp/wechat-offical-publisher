import { PublisherConfig, Plugin } from '../core/types.js';
import { ConfigurationError } from '../core/errors.js';
import { existsSync, readFileSync, writeFileSync } from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import * as dotenv from 'dotenv';

// Use ESM __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * 配置管理器
 */
export class ConfigManager {
  private static instance: ConfigManager;
  private readonly defaultConfig: Required<PublisherConfig>;
  private readonly configPath: string;
  private config: Required<PublisherConfig>;
  private readonly plugins: Plugin[];

  private constructor(defaultConfig: Required<PublisherConfig>, configPath: string) {
    this.defaultConfig = defaultConfig;
    this.configPath = configPath;
    this.plugins = [...defaultConfig.plugins];
    this.config = { ...defaultConfig };
    this.loadConfig();
  }

  /**
   * 获取单例实例
   */
  public static getInstance(): ConfigManager {
    if (!ConfigManager.instance) {
      ConfigManager.instance = new ConfigManager({
        appId: '',
        appSecret: '',
        debug: process.env.NODE_ENV !== 'production',
        publishToDraft: true,
        plugins: []
      }, path.join(__dirname, '..', '..', '.wechat-publisher.json'));
    }
    return ConfigManager.instance;
  }

  /**
   * 加载配置
   */
  private loadConfig(): void {
    try {
      // 1. 加载环境变量
      dotenv.config();
      
      // 2. 加载配置文件
      let fileConfig: Partial<PublisherConfig> = {};
      if (existsSync(this.configPath)) {
        try {
          fileConfig = JSON.parse(readFileSync(this.configPath, 'utf-8'));
        } catch (error: unknown) {
          throw new ConfigurationError('加载配置文件失败', {
            message: error instanceof Error ? error.message : String(error),
            path: this.configPath
          });
        }
      }

      // 3. 合并配置：默认配置 < 环境变量 < 配置文件
      this.config = {
        appId: process.env.WECHAT_APP_ID || fileConfig.appId || this.defaultConfig.appId,
        appSecret: process.env.WECHAT_APP_SECRET || fileConfig.appSecret || this.defaultConfig.appSecret,
        debug: Boolean(fileConfig.debug ?? this.defaultConfig.debug),
        publishToDraft: Boolean(fileConfig.publishToDraft ?? this.defaultConfig.publishToDraft),
        plugins: [...(fileConfig.plugins || this.defaultConfig.plugins)]
      };
    } catch (error: unknown) {
      throw new ConfigurationError('配置加载失败', {
        message: error instanceof Error ? error.message : String(error),
        path: this.configPath
      });
    }

    // 如果没有配置必要的凭据，启用调试模式
    if (!this.config.appId || !this.config.appSecret) {
      console.warn('[ConfigManager] 未检测到有效的微信公众平台配置');
      console.warn('[ConfigManager] 要实际发布到微信公众号，请设置 WECHAT_APP_ID 和 WECHAT_APP_SECRET');
      this.config.debug = true;
    }
  }

  /**
   * 获取配置
   */
  public getConfig(): PublisherConfig {
    return { ...this.config };
  }

  /**
   * 更新配置
   */
  public updateConfig(update: Partial<PublisherConfig>): void {
    Object.assign(this.config, update);
  }

  /**
   * 保存配置到文件
   */
  public saveConfig(): void {
    try {
      const configToSave = {
        appId: this.config.appId,
        appSecret: this.config.appSecret,
        debug: this.config.debug,
        publishToDraft: this.config.publishToDraft,
        plugins: this.config.plugins
      };
      
      const configJson = JSON.stringify(configToSave, null, 2);
      writeFileSync(this.configPath, configJson, 'utf-8');
    } catch (error) {
      console.error('[ConfigManager] 保存配置失败:', error);
    }
  }

  /**
   * 验证配置
   */
  public validateConfig(): boolean {
    if (!this.config.appId) {
      throw new Error('AppID is required');
    }
    if (!this.config.appSecret) {
      throw new Error('AppSecret is required');
    }
    return true;
  }
}

export const configManager = ConfigManager.getInstance();
