import dotenv from 'dotenv';
import { PublisherConfig } from '../core/types';
import { defaultConfig } from './default';
import { logger } from '../core/logger';

// 加载环境变量
dotenv.config();

/**
 * 加载配置
 */
export function loadConfig(overrides: Partial<PublisherConfig> = {}): PublisherConfig {
  const envConfig: Partial<PublisherConfig> = {
    appId: process.env.WECHAT_APP_ID,
    appSecret: process.env.WECHAT_APP_SECRET,
  };

  // 合并配置：默认配置 < 环境变量 < 覆盖配置
  const config: PublisherConfig = {
    ...defaultConfig,
    ...envConfig,
    ...overrides,
    publishToDraft: Boolean(overrides.publishToDraft ?? defaultConfig.publishToDraft),
    appId: envConfig.appId || '',
    appSecret: envConfig.appSecret || '',
  };

  // 如果没有提供必要的配置，启用调试模式
  if (!config.appId || !config.appSecret) {
    const warningMessage = [
      '未检测到有效的微信公众平台配置',
      '要实际发布到微信公众号，请设置 WECHAT_APP_ID 和 WECHAT_APP_SECRET 环境变量'
    ].join('\n');
    logger.warn(warningMessage);
    config.debug = true;
  } else {
    // 如果提供了有效的配置，确保不是调试模式
    config.debug = false;
  }

  return config;
}
