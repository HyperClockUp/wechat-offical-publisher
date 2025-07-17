/**
 * 插件导出
 */

export { markdownPlugin } from './markdown';
export { imagePlugin, uploadCoverImage } from './image';
export { wechatCompatibilityPlugin } from './wechat-compatibility';
export type { Plugin } from '../types';

/**
 * 默认插件列表
 */
import { markdownPlugin } from './markdown';
import { imagePlugin } from './image';
import { wechatCompatibilityPlugin } from './wechat-compatibility';

export const defaultPlugins = [
  imagePlugin,  // 先处理图片，将本地图片上传并替换为微信URL
  markdownPlugin,  // 再将Markdown转换为HTML
  wechatCompatibilityPlugin  // 最后处理微信兼容性，移除不兼容的HTML和CSS
];
