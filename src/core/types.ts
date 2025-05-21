/**
 * 文章内容类型
 */
export interface ArticleContent {
  title: string;
  content: string;
  mediaId: string;
  thumbMediaId: string;
  author?: string;
  digest?: string;
  showCoverPic?: boolean;
  url?: string;
  sourceUrl?: string;
  msg: string;
  needOpenComment?: boolean;
  onlyFansCanComment?: boolean;
  /** 封面图片本地路径 */
  coverImage?: string;
  /** 封面图片URL */
  coverUrl?: string;
}

/**
 * 插件上下文
 */
export interface PluginContext {
  /** 原始输入路径 */
  input: string;
  /** 处理后的文章内容 */
  article: ArticleContent | null;
  /** 自定义数据存储 */
  [key: string]: any;
}

/**
 * 插件接口
 */
export interface Plugin {
  /** 插件名称 */
  name: string;
  
  /**
   * 执行插件逻辑
   * @param ctx 插件上下文
   * @returns 处理后的上下文
   */
  execute(ctx: PluginContext): Promise<PluginContext>;
}

/**
 * 发布器配置
 */
export interface PublisherConfig {
  appId: string;
  appSecret: string;
  plugins?: Plugin[];
  debug?: boolean;
  publishToDraft: boolean; // 是否发布到草稿箱，默认为true
}
