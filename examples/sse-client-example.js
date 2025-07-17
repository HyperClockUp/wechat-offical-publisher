/**
 * SSE MCP Client Example
 * SSE版本MCP客户端使用示例
 */

class SSEMCPClient {
  constructor(baseUrl = 'http://localhost:3000') {
    this.baseUrl = baseUrl;
    this.eventSource = null;
    this.requestId = 0;
    this.pendingRequests = new Map();
  }

  /**
   * 连接到SSE事件流
   */
  async connect() {
    return new Promise((resolve, reject) => {
      try {
        this.eventSource = new EventSource(`${this.baseUrl}/mcp/events`);
        
        this.eventSource.onopen = () => {
          console.log('✅ Connected to MCP SSE server');
          resolve();
        };
        
        this.eventSource.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            this.handleServerMessage(data);
          } catch (error) {
            console.error('Failed to parse server message:', error);
          }
        };
        
        this.eventSource.onerror = (error) => {
          console.error('SSE connection error:', error);
          if (this.eventSource.readyState === EventSource.CLOSED) {
            reject(new Error('Connection failed'));
          }
        };
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * 处理服务器消息
   */
  handleServerMessage(data) {
    console.log('📨 Server message:', data);
    
    switch (data.type) {
      case 'connection':
        console.log(`🔗 Connection established: ${data.data.id}`);
        break;
      case 'server_info':
        console.log('ℹ️ Server info:', data.data);
        break;
      case 'tool_progress':
        console.log(`🔄 Tool progress: ${data.data.tool} - ${data.data.status}`);
        break;
      case 'heartbeat':
        console.log('💓 Heartbeat received');
        break;
      default:
        console.log('📦 Unknown message type:', data.type);
    }
  }

  /**
   * 调用MCP工具
   */
  async callTool(toolName, args = {}) {
    const requestId = ++this.requestId;
    
    const request = {
      jsonrpc: '2.0',
      id: requestId,
      method: 'tools/call',
      params: {
        name: toolName,
        arguments: args
      }
    };

    console.log(`🚀 Calling tool: ${toolName}`, args);

    try {
      const response = await fetch(`${this.baseUrl}/mcp/call`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(request)
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      
      if (result.error) {
        throw new Error(`Tool error: ${result.error.message}`);
      }

      console.log(`✅ Tool result:`, result.result);
      return result.result;
    } catch (error) {
      console.error(`❌ Tool call failed:`, error);
      throw error;
    }
  }

  /**
   * 获取可用工具列表
   */
  async listTools() {
    const request = {
      jsonrpc: '2.0',
      id: ++this.requestId,
      method: 'tools/list'
    };

    try {
      const response = await fetch(`${this.baseUrl}/mcp/call`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(request)
      });

      const result = await response.json();
      return result.result.tools;
    } catch (error) {
      console.error('Failed to list tools:', error);
      throw error;
    }
  }

  /**
   * 获取服务器信息
   */
  async getServerInfo() {
    try {
      const response = await fetch(`${this.baseUrl}/mcp/info`);
      return await response.json();
    } catch (error) {
      console.error('Failed to get server info:', error);
      throw error;
    }
  }

  /**
   * 断开连接
   */
  disconnect() {
    if (this.eventSource) {
      this.eventSource.close();
      this.eventSource = null;
      console.log('🔌 Disconnected from MCP SSE server');
    }
  }
}

// 使用示例
async function example() {
  const client = new SSEMCPClient('http://localhost:3000');
  
  try {
    // 连接到服务器
    await client.connect();
    
    // 获取服务器信息
    const serverInfo = await client.getServerInfo();
    console.log('🖥️ Server info:', serverInfo);
    
    // 获取可用工具
    const tools = await client.listTools();
    console.log('🛠️ Available tools:', tools.map(t => t.name));
    
    // 获取配置信息
    const config = await client.callTool('get_config');
    console.log('⚙️ Config:', config);
    
    // 获取主题列表
    const themes = await client.callTool('list_themes');
    console.log('🎨 Themes:', themes);
    
    // 处理内容示例
    const processResult = await client.callTool('process_content', {
      content: '# 测试文章\n\n这是一个测试文章的内容。',
      theme: 'default'
    });
    console.log('📝 Processed content:', processResult);
    
    // 保持连接一段时间以接收心跳
    console.log('⏳ Keeping connection alive for 30 seconds...');
    setTimeout(() => {
      client.disconnect();
      console.log('👋 Example completed');
    }, 30000);
    
  } catch (error) {
    console.error('❌ Example failed:', error);
    client.disconnect();
  }
}

// 如果在浏览器环境中运行
if (typeof window !== 'undefined') {
  window.SSEMCPClient = SSEMCPClient;
  window.runExample = example;
  console.log('🌐 SSE MCP Client loaded in browser');
  console.log('📝 Usage: const client = new SSEMCPClient(); await client.connect();');
  console.log('🚀 Run example: runExample();');
}

// 如果在Node.js环境中运行
if (typeof module !== 'undefined' && module.exports) {
  // 在Node.js中需要使用polyfill
  const fetch = require('node-fetch');
  const EventSource = require('eventsource');
  
  global.fetch = fetch;
  global.EventSource = EventSource;
  
  module.exports = {
    SSEMCPClient,
    example
  };
  
  // 如果直接运行此文件
  if (require.main === module) {
    console.log('🚀 Running SSE MCP Client example...');
    example().catch(console.error);
  }
}