/**
 * SSE-based MCP Server for WeChat Official Publisher
 * 基于SSE的微信公众号发布工具MCP服务器
 */
import { SSEServerTransport, SSETransportOptions } from './sse-transport';
import { WeChatPublisher } from '../index';
import { logger } from '../utils/logger';
import { existsSync } from 'fs';
import { Config } from '../types';
import { ApiError } from '../utils/errors';

/**
 * MCP工具定义（与stdio版本保持一致）
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
 * MCP消息接口
 */
interface MCPMessage {
  jsonrpc: '2.0';
  id?: string | number;
  method?: string;
  params?: any;
  result?: any;
  error?: {
    code: number;
    message: string;
    data?: any;
  };
}

/**
 * SSE版本的WeChat Publisher MCP Server
 */
export class WeChatPublisherSSEMCPServer {
  private transport: SSEServerTransport;
  private publisher: WeChatPublisher | null = null;
  private isRunning = false;

  constructor(options?: SSETransportOptions) {
    this.transport = new SSEServerTransport(options);
    this.setupEventHandlers();
  }

  /**
   * 设置事件处理器
   */
  private setupEventHandlers(): void {
    // 处理新连接
    this.transport.on('connection', (connectionId: string) => {
      logger.info(`New MCP client connected: ${connectionId}`);
      
      // 发送服务器信息
      this.transport.sendToConnection(connectionId, {
        type: 'server_info',
        data: {
          name: 'wechat-official-publisher',
          version: '1.0.0',
          capabilities: {
            tools: true
          },
          tools: TOOLS.map(tool => ({
            name: tool.name,
            description: tool.description
          }))
        }
      });
    });

    // 处理连接断开
    this.transport.on('disconnect', (connectionId: string) => {
      logger.info(`MCP client disconnected: ${connectionId}`);
    });

    // 处理MCP请求
    this.transport.on('request', async (message: MCPMessage, respond: (response: MCPMessage) => void) => {
      try {
        const response = await this.handleMCPRequest(message);
        respond(response);
      } catch (error) {
        logger.error('MCP request error:', error as Error);
        respond({
          jsonrpc: '2.0',
          id: message.id,
          error: {
            code: -32603,
            message: 'Internal error',
            data: error instanceof Error ? error.message : String(error)
          }
        });
      }
    });
  }

  /**
   * 处理MCP请求
   */
  private async handleMCPRequest(message: MCPMessage): Promise<MCPMessage> {
    const { method, params, id } = message;

    switch (method) {
      case 'tools/list':
        return {
          jsonrpc: '2.0',
          id,
          result: {
            tools: TOOLS
          }
        };

      case 'tools/call':
        const { name, arguments: args } = params;
        const result = await this.handleToolCall(name, args);
        return {
          jsonrpc: '2.0',
          id,
          result
        };

      default:
        return {
          jsonrpc: '2.0',
          id,
          error: {
            code: -32601,
            message: `Method not found: ${method}`
          }
        };
    }
  }

  /**
   * 处理工具调用
   */
  private async handleToolCall(name: string, args: any): Promise<any> {
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
        throw new Error(`Unknown tool: ${name}`);
    }
  }

  /**
   * 获取或创建发布器实例
   */
  private getPublisher(config?: any): WeChatPublisher {
    if (!this.publisher || config) {
      this.publisher = new WeChatPublisher(config);
    }
    return this.publisher;
  }

  /**
   * 处理发布文章
   */
  private async handlePublishArticle(args: any): Promise<any> {
    const { filePath, title, author, digest, coverImage, draft = true, theme, appId, appSecret } = args;

    if (!existsSync(filePath)) {
      throw new Error(`文件不存在: ${filePath}`);
    }

    const config: Partial<Config> = { theme };
    if (appId) config.appId = appId;
    if (appSecret) config.appSecret = appSecret;

    try {
      const publisher = this.getPublisher(config);
      const result = await publisher.publish(filePath, {
        title,
        author,
        digest,
        coverImage,
        draft
      });

      // 广播完成事件
      this.transport.broadcast({
        type: 'tool_progress',
        data: {
          tool: 'publish_article',
          status: 'completed',
          message: '文章发布完成'
        }
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
    } catch (error) {
      let errorMessage = '未知错误';
      let errorDetails: { code?: number; cause?: string } = {};

      if (error instanceof Error) {
        errorMessage = error.message;
        if (error instanceof ApiError) {
          errorDetails = {
            code: error.code,
            cause: error.cause?.message
          };
        }
      } else {
        errorMessage = String(error);
      }

      // 广播错误事件
      this.transport.broadcast({
        type: 'tool_progress',
        data: {
          tool: 'publish_article',
          status: 'error',
          message: `发布失败: ${errorMessage}`,
          details: errorDetails
        }
      });

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              success: false,
              error: errorMessage,
              details: errorDetails
            }, null, 2)
          }
        ]
      };
    }
  }

  /**
   * 处理预览文章
   */
  private async handlePreviewArticle(args: any) {
    const { filePath, theme } = args;

    if (!existsSync(filePath)) {
      throw new Error(`文件不存在: ${filePath}`);
    }

    this.transport.broadcast({
      type: 'tool_progress',
      data: {
        tool: 'preview_article',
        status: 'started',
        message: '生成预览...'
      }
    });

    const publisher = this.getPublisher({ theme });
    const previewFile = await publisher.preview(filePath);

    this.transport.broadcast({
      type: 'tool_progress',
      data: {
        tool: 'preview_article',
        status: 'completed',
        message: '预览生成完成'
      }
    });

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

    this.transport.broadcast({
      type: 'tool_progress',
      data: {
        tool: 'process_content',
        status: 'started',
        message: '处理内容...'
      }
    });

    const publisher = this.getPublisher({ theme });
    const processedContent = await publisher.processContent(content);

    this.transport.broadcast({
      type: 'tool_progress',
      data: {
        tool: 'process_content',
        status: 'completed',
        message: '内容处理完成'
      }
    });

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
              isConfigured: hasAppId && hasAppSecret,
              transport: 'sse',
              serverStats: this.transport.getStats()
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
  public async start(): Promise<void> {
    if (this.isRunning) {
      throw new Error('Server is already running');
    }

    await this.transport.start();
    this.isRunning = true;
    logger.info('WeChat Publisher SSE MCP Server started');
  }

  /**
   * 停止服务器
   */
  public async stop(): Promise<void> {
    if (!this.isRunning) {
      return;
    }

    await this.transport.stop();
    this.isRunning = false;
    logger.info('WeChat Publisher SSE MCP Server stopped');
  }

  /**
   * 获取服务器状态
   */
  public getStatus() {
    return {
      isRunning: this.isRunning,
      transport: 'sse',
      ...this.transport.getStats()
    };
  }

  /**
   * 广播消息到所有客户端
   */
  public broadcast(data: any): void {
    this.transport.broadcast(data);
  }
}

/**
 * 启动SSE MCP服务器
 */
export async function startSSEMCPServer(options?: SSETransportOptions): Promise<WeChatPublisherSSEMCPServer> {
  const server = new WeChatPublisherSSEMCPServer(options);
  await server.start();
  return server;
}

/**
 * 创建SSE MCP服务器实例
 */
export function createSSEMCPServer(options?: SSETransportOptions): WeChatPublisherSSEMCPServer {
  return new WeChatPublisherSSEMCPServer(options);
}