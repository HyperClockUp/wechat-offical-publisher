/**
 * MCP Server for WeChat Official Publisher
 * 为微信公众号发布工具提供MCP服务器功能
 */
import { WeChatPublisher } from '../index';
import { logger } from '../utils/logger';
import { Config } from '../types';
import { existsSync } from 'fs';
import { join } from 'path';

/**
 * MCP工具定义
 */
const TOOLS = [
  {
    name: 'publish_article',
    description: '发布文章到微信公众号',
    inputSchema: {
      type: 'object',
      properties: {
        filePath: {
          type: 'string',
          description: '要发布的文章文件路径'
        },
        title: {
          type: 'string',
          description: '文章标题（可选）'
        },
        author: {
          type: 'string',
          description: '文章作者（可选）'
        },
        digest: {
          type: 'string',
          description: '文章摘要（可选）'
        },
        coverImage: {
          type: 'string',
          description: '封面图片路径（可选）'
        },
        draft: {
          type: 'boolean',
          description: '是否保存为草稿（默认true）',
          default: true
        },
        theme: {
          type: 'string',
          description: '使用的主题名称（可选）'
        },
        appId: {
          type: 'string',
          description: '微信公众号AppID（可选，优先于环境变量）'
        },
        appSecret: {
          type: 'string',
          description: '微信公众号AppSecret（可选，优先于环境变量）'
        }
      },
      required: ['filePath']
    }
  },
  {
    name: 'preview_article',
    description: '预览文章效果',
    inputSchema: {
      type: 'object',
      properties: {
        filePath: {
          type: 'string',
          description: '要预览的文章文件路径'
        },
        theme: {
          type: 'string',
          description: '使用的主题名称（可选）'
        }
      },
      required: ['filePath']
    }
  },
  {
    name: 'list_themes',
    description: '获取可用的主题列表',
    inputSchema: {
      type: 'object',
      properties: {},
      additionalProperties: false
    }
  },
  {
    name: 'process_content',
    description: '处理文章内容（应用主题和插件）',
    inputSchema: {
      type: 'object',
      properties: {
        content: {
          type: 'string',
          description: '要处理的文章内容'
        },
        theme: {
          type: 'string',
          description: '使用的主题名称（可选）'
        }
      },
      required: ['content']
    }
  },
  {
    name: 'get_config',
    description: '获取当前配置信息',
    inputSchema: {
      type: 'object',
      properties: {},
      additionalProperties: false
    }
  }
];

/**
 * WeChat Publisher MCP Server
 */
class WeChatPublisherMCPServer {
  private server: any;
  private publisher: any | null = null;
  private mcpModules: any = {};

  async initialize() {
    // 动态导入MCP SDK模块
    const serverModule = await import('@modelcontextprotocol/sdk/server/index.js');
    const stdioModule = await import('@modelcontextprotocol/sdk/server/stdio.js');
    const typesModule = await import('@modelcontextprotocol/sdk/types.js');
    
    this.mcpModules = {
      Server: serverModule.Server,
      StdioServerTransport: stdioModule.StdioServerTransport,
      CallToolRequestSchema: typesModule.CallToolRequestSchema,
      ErrorCode: typesModule.ErrorCode,
      ListToolsRequestSchema: typesModule.ListToolsRequestSchema,
      McpError: typesModule.McpError,
    };

    this.server = new this.mcpModules.Server(
      {
        name: 'wechat-official-publisher',
        version: '1.0.0',
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    this.setupHandlers();
  }

  /**
   * 设置处理器
   */
  private setupHandlers(): void {
    // 列出可用工具
    this.server.setRequestHandler(this.mcpModules.ListToolsRequestSchema, async () => {
      return {
        tools: TOOLS,
      };
    });

    // 调用工具
    this.server.setRequestHandler(this.mcpModules.CallToolRequestSchema, async (request: any) => {
      const { name, arguments: args } = request.params;

      try {
        switch (name) {
          case 'publish_article':
            return await this.handlePublishArticle(args);
          case 'preview_article':
            return await this.handlePreviewArticle(args);
          case 'list_themes':
            return await this.handleListThemes();
          case 'process_content':
            return await this.handleProcessContent(args);
          case 'get_config':
            return await this.handleGetConfig();
          default:
            throw new this.mcpModules.McpError(
              this.mcpModules.ErrorCode.MethodNotFound,
              `Unknown tool: ${name}`
            );
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        logger.error(`MCP tool error: ${name}`, error as Error);
        throw new this.mcpModules.McpError(
          this.mcpModules.ErrorCode.InternalError,
          `Tool execution failed: ${errorMessage}`
        );
      }
    });
  }

  /**
   * 获取或创建发布器实例
   */
  private getPublisher(config?: any): any {
    if (!this.publisher || config) {
      this.publisher = new WeChatPublisher(config);
    }
    return this.publisher;
  }

  /**
   * 处理发布文章
   */
  private async handlePublishArticle(args: any) {
    const { filePath, title, author, digest, coverImage, draft = true, theme, appId, appSecret } = args;

    if (!existsSync(filePath)) {
      throw new Error(`文件不存在: ${filePath}`);
    }

    const config: Partial<Config> = { theme };
    if (appId) config.appId = appId;
    if (appSecret) config.appSecret = appSecret;

    const publisher = this.getPublisher(config);
    const result = await publisher.publish(filePath, {
      title,
      author,
      digest,
      coverImage,
      draft
    });

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            success: result.success,
            title: result.title,
            mediaId: result.mediaId,
            message: result.message,
            contentLength: result.content.length,
            isDraft: draft
          }, null, 2)
        }
      ]
    };
  }

  /**
   * 处理预览文章
   */
  private async handlePreviewArticle(args: any) {
    const { filePath, theme } = args;

    if (!existsSync(filePath)) {
      throw new Error(`文件不存在: ${filePath}`);
    }

    const publisher = this.getPublisher({ theme });
    const previewFile = await publisher.preview(filePath);

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            success: true,
            previewFile,
            message: '预览文件已生成'
          }, null, 2)
        }
      ]
    };
  }

  /**
   * 处理列出主题
   */
  private async handleListThemes() {
    try {
      const { listAllThemes } = await import('../themes');
      const themes = listAllThemes();

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              success: true,
              themes: themes.map((theme: any) => ({
                name: theme.name,
                description: theme.description,
                author: theme.author
              }))
            }, null, 2)
          }
        ]
      };
    } catch (error) {
      throw new Error(`获取主题列表失败: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * 处理内容处理
   */
  private async handleProcessContent(args: any) {
    const { content, theme } = args;

    const publisher = this.getPublisher({ theme });
    const processedContent = await publisher.processContent(content);

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            success: true,
            originalLength: content.length,
            processedLength: processedContent.length,
            processedContent
          }, null, 2)
        }
      ]
    };
  }

  /**
   * 处理获取配置
   */
  private async handleGetConfig() {
    const hasAppId = !!process.env.WECHAT_APP_ID;
    const hasAppSecret = !!process.env.WECHAT_APP_SECRET;
    const nodeEnv = process.env.NODE_ENV || 'development';

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            success: true,
            config: {
              hasAppId,
              hasAppSecret,
              nodeEnv,
              isConfigured: hasAppId && hasAppSecret
            },
            message: hasAppId && hasAppSecret 
              ? '配置完整，可以正常使用' 
              : '请设置 WECHAT_APP_ID 和 WECHAT_APP_SECRET 环境变量'
          }, null, 2)
        }
      ]
    };
  }
  /**
   * 启动服务器
   */
  async start(): Promise<void> {
    const transport = new this.mcpModules.StdioServerTransport();
    await this.server.connect(transport);
    logger.info('WeChat Publisher MCP Server started');
  }
}

/**
 * 启动MCP服务器
 */
export async function startMCPServer(): Promise<void> {
  const server = new WeChatPublisherMCPServer();
  await server.initialize();
  await server.start();
}

// 导出
module.exports = {
  WeChatPublisherMCPServer,
  startMCPServer
};

// 如果直接运行此文件，启动MCP服务器
if (require.main === module) {
  startMCPServer().catch((error) => {
    logger.error('Failed to start MCP server', error);
    process.exit(1);
  });
}