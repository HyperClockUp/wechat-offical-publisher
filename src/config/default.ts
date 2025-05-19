import { PublisherConfig } from '../core/types';

/**
 * 默认配置
 */
export const defaultConfig: Partial<PublisherConfig> = {
  debug: process.env.NODE_ENV !== 'production',
  publishToDraft: true, // 默认发布到草稿箱
};
