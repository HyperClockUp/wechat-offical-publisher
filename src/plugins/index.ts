/**
 * 插件导出
 */

export { markdownPlugin } from './markdown';
export { imagePlugin, uploadCoverImage } from './image';
export type { Plugin } from '../types';

/**
 * 默认插件列表
 */
import { markdownPlugin } from './markdown';
import { imagePlugin } from './image';

export const defaultPlugins = [
  imagePlugin,  // 先处理图片，将本地图片上传并替换为微信URL
  markdownPlugin  // 再将Markdown转换为HTML
];
