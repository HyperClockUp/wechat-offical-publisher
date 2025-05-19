/**
 * 文章内容类型
 */
export interface ArticleContent {
  title: string;
  content: string;
  digest?: string;
  thumbMediaId?: string;
  mediaId?: string; // 草稿箱文章的 media_id
  url?: string;     // 直接发布时的文章链接
  author?: string;
  showCoverPic?: boolean;
  sourceUrl?: string;
  needOpenComment?: boolean;
  onlyFansCanComment?: boolean;
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
