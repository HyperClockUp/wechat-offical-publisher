/**
 * 简化的类型定义
 */

/**
 * 配置接口
 */
export interface Config {
  appId: string;
  appSecret: string;
  debug?: boolean;
  publishToDraft?: boolean;
  theme?: string; // 主题名称
  useStableToken?: boolean; // 是否使用 stable_token 接口
}

/**
 * 发布选项
 */
export interface PublishOptions {
  title?: string;
  author?: string;
  digest?: string;
  coverImage?: string;
  draft?: boolean;
}

/**
 * 发布结果
 */
export interface PublishResult {
  success: boolean;
  mediaId?: string;
  title: string;
  content: string;
  message: string;
  url?: string;
}

/**
 * 插件上下文
 */
export interface PluginContext {
  filePath: string;
  config: Config;
  [key: string]: any;
}

/**
 * 插件接口
 */
export interface PluginInterface {
  name: string;
  description: string;
  process(content: string, context?: PluginContext): Promise<string>;
}

/**
 * 插件函数类型（向后兼容）
 */
export type Plugin = (content: string, context: PluginContext) => Promise<string>;

/**
 * 统一插件类型
 */
export type UnifiedPlugin = Plugin | PluginInterface;

/**
 * 微信 API 响应
 */
export interface WeChatApiResponse {
  errcode?: number;
  errmsg?: string;
  access_token?: string;
  expires_in?: number;
  media_id?: string;
  thumb_media_id?: string;
  url?: string;
  // 发布相关字段
  publish_id?: string;
  publishId?: string;
  msg_data_id?: string;
  msgDataId?: string;
}

/**
 * 文章数据
 */
export interface Article {
  title: string;
  content: string;
  author?: string;
  digest?: string;
  thumbMediaId?: string;
  showCoverPic?: boolean;
}