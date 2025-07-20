// 测试npx调用MCP服务器
const { spawn } = require('child_process');

console.log('🚀 测试npx调用MCP服务器...');

// 模拟MCP客户端调用
const mcpProcess = spawn('npx', ['wechat-official-publisher', 'mcp-server', '--debug'], {
  stdio: ['pipe', 'pipe', 'pipe'],
  shell: true
});

let output = '';
let hasStarted = false;
let hasError = false;

// 监听输出
mcpProcess.stdout.on('data', (data) => {
  const text = data.toString();
  output += text;
  console.log('📤 输出:', text.trim());
  
  if (text.includes('WeChat Publisher MCP Server started') || text.includes('MCP服务器')) {
    hasStarted = true;
    console.log('✅ MCP服务器通过npx启动成功！');
    setTimeout(() => {
      mcpProcess.kill();
    }, 1000);
  }
});

mcpProcess.stderr.on('data', (data) => {
  const text = data.toString();
  console.log('❌ 错误:', text.trim());
  hasError = true;
});

mcpProcess.on('close', (code) => {
  console.log(`📋 进程退出，代码: ${code}`);
  if (hasStarted && !hasError) {
    console.log('🎉 npx MCP服务器测试通过！');
  } else {
    console.log('⚠️ npx MCP服务器测试失败');
    console.log('完整输出:', output);
  }
});

// 10秒后强制退出
setTimeout(() => {
  if (!hasStarted) {
    console.log('⏰ 超时，强制退出测试');
    mcpProcess.kill();
  }
}, 10000);