/**
 * SSE (Server-Sent Events) Transport for MCP Server
 * 为MCP服务器提供SSE传输层，支持HTTP协议通信
 */
import { EventEmitter } from 'events';
import express from 'express';
import cors from 'cors';
import { logger } from '../utils/logger';

/**
 * SSE传输层接口
 */
export interface SSETransportOptions {
  port?: number;
  host?: string;
  cors?: boolean;
  maxConnections?: number;
  heartbeatInterval?: number;
}

/**
 * SSE客户端连接
 */
interface SSEConnection {
  id: string;
  response: express.Response;
  lastActivity: number;
  isAlive: boolean;
}

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
 * SSE传输层实现
 */
export class SSEServerTransport extends EventEmitter {
  private app: express.Application;
  private server: any;
  private connections: Map<string, SSEConnection> = new Map();
  private options: Required<SSETransportOptions>;
  private heartbeatTimer?: NodeJS.Timeout;

  constructor(options: SSETransportOptions = {}) {
    super();
    
    this.options = {
      port: options.port || 3000,
      host: options.host || 'localhost',
      cors: options.cors !== false,
      maxConnections: options.maxConnections || 100,
      heartbeatInterval: options.heartbeatInterval || 30000
    };

    this.app = express();
    this.setupMiddleware();
    this.setupRoutes();
  }

  /**
   * 设置中间件
   */
  private setupMiddleware(): void {
    // 启用CORS
    if (this.options.cors) {
      this.app.use(cors({
        origin: true,
        credentials: true,
        methods: ['GET', 'POST', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization', 'Cache-Control']
      }));
    }

    // 解析JSON
    this.app.use(express.json({ limit: '10mb' }));
    
    // 静态文件服务（用于测试页面）
    this.app.use('/static', express.static('public'));

    // 请求日志
    this.app.use((req, res, next) => {
      logger.debug(`${req.method} ${req.path} from ${req.ip}`);
      next();
    });
  }

  /**
   * 设置路由
   */
  private setupRoutes(): void {
    // 健康检查
    this.app.get('/health', (req, res) => {
      res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        connections: this.connections.size,
        uptime: process.uptime()
      });
    });

    // MCP服务器信息
    this.app.get('/mcp/info', (req, res) => {
      res.json({
        name: 'wechat-official-publisher',
        version: '1.0.0',
        transport: 'sse',
        capabilities: {
          tools: true
        },
        endpoints: {
          events: '/mcp/events',
          call: '/mcp/call'
        }
      });
    });

    // SSE事件流
    this.app.get('/mcp/events', (req, res) => {
      this.handleSSEConnection(req, res);
    });

    // MCP工具调用
    this.app.post('/mcp/call', async (req, res) => {
      try {
        await this.handleToolCall(req, res);
      } catch (error) {
        logger.error('Tool call error:', error as Error);
        res.status(500).json({
          jsonrpc: '2.0',
          id: req.body.id,
          error: {
            code: -32603,
            message: 'Internal error',
            data: error instanceof Error ? error.message : String(error)
          }
        });
      }
    });

    // 测试页面
    this.app.get('/', (req, res) => {
      res.send(this.generateTestPage());
    });
  }

  /**
   * 处理SSE连接
   */
  private handleSSEConnection(req: express.Request, res: express.Response): void {
    // 检查连接数限制
    if (this.connections.size >= this.options.maxConnections) {
      res.status(503).json({ error: 'Too many connections' });
      return;
    }

    const connectionId = this.generateConnectionId();
    
    // 设置SSE头
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Cache-Control'
    });

    // 创建连接对象
    const connection: SSEConnection = {
      id: connectionId,
      response: res,
      lastActivity: Date.now(),
      isAlive: true
    };

    this.connections.set(connectionId, connection);
    logger.info(`SSE connection established: ${connectionId}`);

    // 发送连接确认
    this.sendSSEMessage(connection, {
      type: 'connection',
      data: {
        id: connectionId,
        timestamp: new Date().toISOString()
      }
    });

    // 处理连接关闭
    req.on('close', () => {
      this.closeConnection(connectionId);
    });

    req.on('error', (error) => {
      logger.error(`SSE connection error: ${connectionId}`, error);
      this.closeConnection(connectionId);
    });

    // 触发连接事件
    this.emit('connection', connectionId);
  }

  /**
   * 处理工具调用
   */
  private async handleToolCall(req: express.Request, res: express.Response): Promise<void> {
    const message: MCPMessage = req.body;
    
    // 验证消息格式
    if (!message || message.jsonrpc !== '2.0') {
      res.status(400).json({
        jsonrpc: '2.0',
        id: message?.id,
        error: {
          code: -32600,
          message: 'Invalid Request'
        }
      });
      return;
    }

    // 触发请求事件
    this.emit('request', message, (response: MCPMessage) => {
      res.json(response);
    });
  }

  /**
   * 发送SSE消息
   */
  private sendSSEMessage(connection: SSEConnection, data: any): void {
    if (!connection.isAlive) return;

    try {
      const message = `data: ${JSON.stringify(data)}\n\n`;
      connection.response.write(message);
      connection.lastActivity = Date.now();
    } catch (error) {
      logger.error(`Failed to send SSE message to ${connection.id}:`, error as Error);
      this.closeConnection(connection.id);
    }
  }

  /**
   * 广播消息到所有连接
   */
  public broadcast(data: any): void {
    for (const connection of this.connections.values()) {
      this.sendSSEMessage(connection, data);
    }
  }

  /**
   * 发送消息到特定连接
   */
  public sendToConnection(connectionId: string, data: any): boolean {
    const connection = this.connections.get(connectionId);
    if (connection) {
      this.sendSSEMessage(connection, data);
      return true;
    }
    return false;
  }

  /**
   * 关闭连接
   */
  private closeConnection(connectionId: string): void {
    const connection = this.connections.get(connectionId);
    if (connection) {
      connection.isAlive = false;
      try {
        connection.response.end();
      } catch (error) {
        // 忽略关闭错误
      }
      this.connections.delete(connectionId);
      logger.info(`SSE connection closed: ${connectionId}`);
      this.emit('disconnect', connectionId);
    }
  }

  /**
   * 生成连接ID
   */
  private generateConnectionId(): string {
    return `conn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * 启动心跳检测
   */
  private startHeartbeat(): void {
    this.heartbeatTimer = setInterval(() => {
      const now = Date.now();
      const timeout = this.options.heartbeatInterval * 2;

      for (const [id, connection] of this.connections.entries()) {
        if (now - connection.lastActivity > timeout) {
          logger.warn(`Connection timeout: ${id}`);
          this.closeConnection(id);
        } else {
          // 发送心跳
          this.sendSSEMessage(connection, {
            type: 'heartbeat',
            timestamp: new Date().toISOString()
          });
        }
      }
    }, this.options.heartbeatInterval);
  }

  /**
   * 停止心跳检测
   */
  private stopHeartbeat(): void {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = undefined;
    }
  }

  /**
   * 启动服务器
   */
  public async start(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        this.server = this.app.listen(this.options.port, this.options.host, () => {
          logger.info(`MCP SSE Server started on http://${this.options.host}:${this.options.port}`);
          logger.info(`Events endpoint: http://${this.options.host}:${this.options.port}/mcp/events`);
          logger.info(`Call endpoint: http://${this.options.host}:${this.options.port}/mcp/call`);
          this.startHeartbeat();
          resolve();
        });

        this.server.on('error', (error: Error) => {
          logger.error('Server error:', error);
          reject(error);
        });
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * 停止服务器
   */
  public async stop(): Promise<void> {
    return new Promise((resolve) => {
      this.stopHeartbeat();
      
      // 关闭所有连接
      for (const connectionId of this.connections.keys()) {
        this.closeConnection(connectionId);
      }

      if (this.server) {
        this.server.close(() => {
          logger.info('MCP SSE Server stopped');
          resolve();
        });
      } else {
        resolve();
      }
    });
  }

  /**
   * 获取连接统计
   */
  public getStats() {
    return {
      connections: this.connections.size,
      maxConnections: this.options.maxConnections,
      uptime: process.uptime(),
      port: this.options.port,
      host: this.options.host
    };
  }

  /**
   * 生成测试页面
   */
  private generateTestPage(): string {
    return `
<!DOCTYPE html>
<html>
<head>
    <title>WeChat Publisher MCP Server - SSE Test</title>
    <meta charset="utf-8">
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .container { max-width: 800px; margin: 0 auto; }
        .status { padding: 10px; margin: 10px 0; border-radius: 4px; }
        .connected { background: #d4edda; color: #155724; }
        .disconnected { background: #f8d7da; color: #721c24; }
        .log { background: #f8f9fa; border: 1px solid #dee2e6; padding: 10px; height: 300px; overflow-y: auto; font-family: monospace; }
        button { padding: 8px 16px; margin: 5px; cursor: pointer; }
        input, textarea { width: 100%; padding: 8px; margin: 5px 0; }
        .tool-form { border: 1px solid #ccc; padding: 15px; margin: 10px 0; border-radius: 4px; }
    </style>
</head>
<body>
    <div class="container">
        <h1>WeChat Publisher MCP Server - SSE Test</h1>
        
        <div id="status" class="status disconnected">Disconnected</div>
        
        <div>
            <button onclick="connect()">Connect</button>
            <button onclick="disconnect()">Disconnect</button>
            <button onclick="clearLog()">Clear Log</button>
        </div>
        
        <div class="log" id="log"></div>
        
        <div class="tool-form">
            <h3>Test Tool Call</h3>
            <select id="toolSelect" onchange="updateToolForm()">
                <option value="list_themes">List Themes</option>
                <option value="get_config">Get Config</option>
                <option value="process_content">Process Content</option>
                <option value="preview_article">Preview Article</option>
                <option value="publish_article">Publish Article</option>
            </select>
            <div id="toolParams"></div>
            <button onclick="callTool()">Call Tool</button>
        </div>
    </div>

    <script>
        let eventSource = null;
        let connectionId = null;
        
        function log(message) {
            const logDiv = document.getElementById('log');
            const time = new Date().toLocaleTimeString();
            logDiv.innerHTML += \`[\${time}] \${message}\n\`;
            logDiv.scrollTop = logDiv.scrollHeight;
        }
        
        function updateStatus(connected) {
            const statusDiv = document.getElementById('status');
            if (connected) {
                statusDiv.className = 'status connected';
                statusDiv.textContent = \`Connected (ID: \${connectionId})\`;
            } else {
                statusDiv.className = 'status disconnected';
                statusDiv.textContent = 'Disconnected';
            }
        }
        
        function connect() {
            if (eventSource) {
                disconnect();
            }
            
            log('Connecting to SSE...');
            eventSource = new EventSource('/mcp/events');
            
            eventSource.onopen = function() {
                log('SSE connection opened');
            };
            
            eventSource.onmessage = function(event) {
                try {
                    const data = JSON.parse(event.data);
                    log(\`Received: \${JSON.stringify(data, null, 2)}\`);
                    
                    if (data.type === 'connection') {
                        connectionId = data.data.id;
                        updateStatus(true);
                    }
                } catch (e) {
                    log(\`Parse error: \${e.message}\`);
                }
            };
            
            eventSource.onerror = function(event) {
                log('SSE error occurred');
                updateStatus(false);
            };
        }
        
        function disconnect() {
            if (eventSource) {
                eventSource.close();
                eventSource = null;
                connectionId = null;
                updateStatus(false);
                log('Disconnected');
            }
        }
        
        function clearLog() {
            document.getElementById('log').innerHTML = '';
        }
        
        function updateToolForm() {
            const tool = document.getElementById('toolSelect').value;
            const paramsDiv = document.getElementById('toolParams');
            
            let html = '';
            switch (tool) {
                case 'process_content':
                    html = '<textarea id="content" placeholder="Enter content to process"></textarea>';
                    break;
                case 'preview_article':
                case 'publish_article':
                    html = '<input type="text" id="filePath" placeholder="File path" />';
                    if (tool === 'publish_article') {
                        html += '<input type="text" id="title" placeholder="Title (optional)" />';
                        html += '<input type="text" id="author" placeholder="Author (optional)" />';
                    }
                    break;
            }
            paramsDiv.innerHTML = html;
        }
        
        async function callTool() {
            const tool = document.getElementById('toolSelect').value;
            let params = {};
            
            // 收集参数
            switch (tool) {
                case 'process_content':
                    const content = document.getElementById('content')?.value;
                    if (content) params.content = content;
                    break;
                case 'preview_article':
                case 'publish_article':
                    const filePath = document.getElementById('filePath')?.value;
                    if (filePath) params.filePath = filePath;
                    if (tool === 'publish_article') {
                        const title = document.getElementById('title')?.value;
                        const author = document.getElementById('author')?.value;
                        if (title) params.title = title;
                        if (author) params.author = author;
                    }
                    break;
            }
            
            const request = {
                jsonrpc: '2.0',
                id: Date.now(),
                method: 'tools/call',
                params: {
                    name: tool,
                    arguments: params
                }
            };
            
            log(\`Calling tool: \${JSON.stringify(request, null, 2)}\`);
            
            try {
                const response = await fetch('/mcp/call', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(request)
                });
                
                const result = await response.json();
                log(\`Tool response: \${JSON.stringify(result, null, 2)}\`);
            } catch (error) {
                log(\`Tool call error: \${error.message}\`);
            }
        }
        
        // 初始化
        updateToolForm();
    </script>
</body>
</html>
    `;
  }
}

/**
 * 创建SSE传输层
 */
export function createSSETransport(options?: SSETransportOptions): SSEServerTransport {
  return new SSEServerTransport(options);
}