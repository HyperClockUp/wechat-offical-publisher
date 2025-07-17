/**
 * 配置管理系统
 * 统一管理应用配置，支持环境变量、配置文件和默认值
 */

import { existsSync, readFileSync } from 'fs';
import { join } from 'path';
import { LogLevel } from '../utils/logger';

export interface AppConfig {
  // 应用基础配置
  app: {
    name: string;
    version: string;
    environment: 'development' | 'production' | 'test';
    debug: boolean;
  };

  // 日志配置
  logging: {
    level: LogLevel;
    enableConsole: boolean;
    enableFile: boolean;
    logDir: string;
    maxFileSize: number;
    maxFiles: number;
  };

  // 微信发布器配置
  publisher: {
    defaultTheme: string;
    outputDir: string;
    previewDir: string;
    enableCache: boolean;
    cacheDir: string;
    maxCacheSize: number;
  };

  // 插件配置
  plugins: {
    enableWeChatCompatibility: boolean;
    enablePerformanceMonitoring: boolean;
    customPluginPaths: string[];
  };

  // 性能配置
  performance: {
    enableMonitoring: boolean;
    memoryThreshold: number; // MB
    slowOperationThreshold: number; // ms
    enableProfiling: boolean;
  };

  // 安全配置
  security: {
    enableSanitization: boolean;
    allowedTags: string[];
    allowedAttributes: string[];
    maxFileSize: number; // bytes
  };

  // 开发配置
  development: {
    enableHotReload: boolean;
    enableSourceMaps: boolean;
    enableVerboseLogging: boolean;
    mockData: boolean;
  };
}

/**
 * 默认配置
 */
const defaultConfig: AppConfig = {
  app: {
    name: 'WeChat Official Publisher',
    version: '1.0.0',
    environment: (process.env.NODE_ENV as any) || 'development',
    debug: process.env.NODE_ENV === 'development'
  },

  logging: {
    level: process.env.NODE_ENV === 'development' ? LogLevel.DEBUG : LogLevel.INFO,
    enableConsole: true,
    enableFile: process.env.NODE_ENV === 'production',
    logDir: 'logs',
    maxFileSize: 10 * 1024 * 1024, // 10MB
    maxFiles: 5
  },

  publisher: {
    defaultTheme: 'default',
    outputDir: 'dist',
    previewDir: 'preview',
    enableCache: true,
    cacheDir: '.cache',
    maxCacheSize: 100 * 1024 * 1024 // 100MB
  },

  plugins: {
    enableWeChatCompatibility: true,
    enablePerformanceMonitoring: process.env.NODE_ENV === 'development',
    customPluginPaths: []
  },

  performance: {
    enableMonitoring: process.env.NODE_ENV === 'development',
    memoryThreshold: 100, // 100MB
    slowOperationThreshold: 1000, // 1s
    enableProfiling: false
  },

  security: {
    enableSanitization: true,
    allowedTags: [
      'div', 'span', 'p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
      'strong', 'em', 'u', 'br', 'img', 'a', 'ul', 'ol', 'li',
      'blockquote', 'code', 'pre', 'table', 'tr', 'td', 'th'
    ],
    allowedAttributes: [
      'style', 'class', 'src', 'alt', 'href', 'title', 'width', 'height'
    ],
    maxFileSize: 10 * 1024 * 1024 // 10MB
  },

  development: {
    enableHotReload: false,
    enableSourceMaps: true,
    enableVerboseLogging: process.env.NODE_ENV === 'development',
    mockData: false
  }
};

/**
 * 配置管理器
 */
export class ConfigManager {
  private config: AppConfig;
  private configPaths: string[];

  constructor(configPaths: string[] = []) {
    this.configPaths = [
      'wechat-official-publisher.config.js',
      'wechat-official-publisher.config.json',
      '.wechat-official-publisher.json',
      ...configPaths
    ];
    
    this.config = this.loadConfig();
  }

  /**
   * 加载配置
   */
  private loadConfig(): AppConfig {
    let config = { ...defaultConfig };

    // 1. 加载配置文件
    const fileConfig = this.loadConfigFromFile();
    if (fileConfig) {
      config = this.mergeConfig(config, fileConfig);
    }

    // 2. 加载环境变量
    const envConfig = this.loadConfigFromEnv();
    config = this.mergeConfig(config, envConfig);

    // 3. 验证配置
    this.validateConfig(config);

    return config;
  }

  /**
   * 从文件加载配置
   */
  private loadConfigFromFile(): Partial<AppConfig> | null {
    for (const configPath of this.configPaths) {
      if (existsSync(configPath)) {
        try {
          if (configPath.endsWith('.js')) {
            // 动态导入 JS 配置文件
            delete require.cache[require.resolve(join(process.cwd(), configPath))];
            return require(join(process.cwd(), configPath));
          } else if (configPath.endsWith('.json')) {
            // 读取 JSON 配置文件
            const content = readFileSync(configPath, 'utf-8');
            return JSON.parse(content);
          }
        } catch (error) {
          console.warn(`Failed to load config from ${configPath}:`, error);
        }
      }
    }
    return null;
  }

  /**
   * 从环境变量加载配置
   */
  private loadConfigFromEnv(): Partial<AppConfig> {
    const envConfig: any = {};

    // 应用配置
    if (process.env.WECHAT_PUBLISHER_DEBUG) {
      envConfig.app = { debug: process.env.WECHAT_PUBLISHER_DEBUG === 'true' };
    }

    // 日志配置
    if (process.env.WECHAT_PUBLISHER_LOG_LEVEL) {
      envConfig.logging = {
        level: parseInt(process.env.WECHAT_PUBLISHER_LOG_LEVEL) || LogLevel.INFO
      };
    }

    if (process.env.WECHAT_PUBLISHER_LOG_DIR) {
      envConfig.logging = {
        ...envConfig.logging,
        logDir: process.env.WECHAT_PUBLISHER_LOG_DIR
      };
    }

    // 发布器配置
    if (process.env.WECHAT_PUBLISHER_THEME) {
      envConfig.publisher = {
        defaultTheme: process.env.WECHAT_PUBLISHER_THEME
      };
    }

    if (process.env.WECHAT_PUBLISHER_OUTPUT_DIR) {
      envConfig.publisher = {
        ...envConfig.publisher,
        outputDir: process.env.WECHAT_PUBLISHER_OUTPUT_DIR
      };
    }

    // 性能配置
    if (process.env.WECHAT_PUBLISHER_ENABLE_MONITORING) {
      envConfig.performance = {
        enableMonitoring: process.env.WECHAT_PUBLISHER_ENABLE_MONITORING === 'true'
      };
    }

    return envConfig;
  }

  /**
   * 合并配置
   */
  private mergeConfig(base: AppConfig, override: Partial<AppConfig>): AppConfig {
    const merged = { ...base };

    for (const [key, value] of Object.entries(override)) {
      if (value && typeof value === 'object' && !Array.isArray(value)) {
        merged[key as keyof AppConfig] = {
          ...merged[key as keyof AppConfig],
          ...value
        } as any;
      } else {
        (merged as any)[key] = value;
      }
    }

    return merged;
  }

  /**
   * 验证配置
   */
  private validateConfig(config: AppConfig): void {
    // 验证必需的配置项
    if (!config.app.name) {
      throw new Error('App name is required');
    }

    if (!config.publisher.defaultTheme) {
      throw new Error('Default theme is required');
    }

    // 验证数值范围
    if (config.logging.maxFileSize <= 0) {
      throw new Error('Log max file size must be positive');
    }

    if (config.performance.memoryThreshold <= 0) {
      throw new Error('Memory threshold must be positive');
    }

    // 验证目录路径
    const paths = [
      config.logging.logDir,
      config.publisher.outputDir,
      config.publisher.previewDir,
      config.publisher.cacheDir
    ];

    for (const path of paths) {
      if (path.includes('..') || path.startsWith('/')) {
        throw new Error(`Invalid path: ${path}`);
      }
    }
  }

  /**
   * 获取配置
   */
  get<T extends keyof AppConfig>(section: T): AppConfig[T] {
    return this.config[section];
  }

  /**
   * 获取完整配置
   */
  getAll(): AppConfig {
    return { ...this.config };
  }

  /**
   * 更新配置
   */
  update<T extends keyof AppConfig>(section: T, updates: Partial<AppConfig[T]>): void {
    this.config[section] = {
      ...this.config[section],
      ...updates
    };
  }

  /**
   * 重新加载配置
   */
  reload(): void {
    this.config = this.loadConfig();
  }

  /**
   * 获取环境特定的配置
   */
  isDevelopment(): boolean {
    return this.config.app.environment === 'development';
  }

  isProduction(): boolean {
    return this.config.app.environment === 'production';
  }

  isTest(): boolean {
    return this.config.app.environment === 'test';
  }

  /**
   * 生成配置报告
   */
  generateReport(): string {
    const lines: string[] = [];
    
    lines.push('# 配置报告');
    lines.push('');
    lines.push(`应用名称: ${this.config.app.name}`);
    lines.push(`版本: ${this.config.app.version}`);
    lines.push(`环境: ${this.config.app.environment}`);
    lines.push(`调试模式: ${this.config.app.debug ? '启用' : '禁用'}`);
    lines.push('');
    
    lines.push('## 功能状态');
    lines.push(`微信兼容性: ${this.config.plugins.enableWeChatCompatibility ? '启用' : '禁用'}`);
    lines.push(`性能监控: ${this.config.performance.enableMonitoring ? '启用' : '禁用'}`);
    lines.push(`文件日志: ${this.config.logging.enableFile ? '启用' : '禁用'}`);
    lines.push(`缓存: ${this.config.publisher.enableCache ? '启用' : '禁用'}`);
    lines.push('');
    
    lines.push('## 路径配置');
    lines.push(`输出目录: ${this.config.publisher.outputDir}`);
    lines.push(`预览目录: ${this.config.publisher.previewDir}`);
    lines.push(`日志目录: ${this.config.logging.logDir}`);
    lines.push(`缓存目录: ${this.config.publisher.cacheDir}`);
    lines.push('');
    
    lines.push('## 性能配置');
    lines.push(`内存阈值: ${this.config.performance.memoryThreshold} MB`);
    lines.push(`慢操作阈值: ${this.config.performance.slowOperationThreshold} ms`);
    lines.push(`最大文件大小: ${Math.round(this.config.security.maxFileSize / 1024 / 1024)} MB`);
    
    return lines.join('\n');
  }
}

// 全局配置实例
export const config = new ConfigManager();

// 便捷函数
export const getConfig = <T extends keyof AppConfig>(section: T): AppConfig[T] => {
  return config.get(section);
};

export const isDevelopment = (): boolean => config.isDevelopment();
export const isProduction = (): boolean => config.isProduction();
export const isTest = (): boolean => config.isTest();