import { config as dotenvConfig } from 'dotenv';
import { Config } from './types';

// 加载环境变量
dotenvConfig();

/**
 * 默认配置
 */
const DEFAULT_CONFIG: Partial<Config> = {
  debug: process.env.NODE_ENV === 'development' || process.env.DEBUG === 'true',
  publishToDraft: true
};

/**
 * 加载和验证配置
 */
export function loadConfig(userConfig: Partial<Config> = {}): Config {
  const config: Config = {
    ...DEFAULT_CONFIG,
    appId: process.env.WECHAT_APP_ID || '',
    appSecret: process.env.WECHAT_APP_SECRET || '',
    ...userConfig
  };

  // 验证必要配置（预览模式除外）
  if ((!config.appId || !config.appSecret) && config.appId !== 'preview') {
    throw new Error('缺少必要配置：WECHAT_APP_ID 和 WECHAT_APP_SECRET');
  }

  return config;
}

/**
 * 获取默认配置
 */
export function getDefaultConfig(): Partial<Config> {
  return { ...DEFAULT_CONFIG };
}