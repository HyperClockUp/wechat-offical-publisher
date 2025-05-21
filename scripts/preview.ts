#!/usr/bin/env node
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { marked } from 'marked';

// 配置 marked 选项
marked.setOptions({
  mangle: false,       // 禁用 mangle 以避免弃用警告
  headerIds: false     // 禁用 headerIds 以避免弃用警告
});
import chalk from 'chalk';
import open from 'open';

// 获取当前文件所在目录
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function convertMarkdownToHtml(markdownPath: string, outputDir: string = 'preview') {
  try {
    // 确保输出目录存在
    await mkdir(outputDir, { recursive: true });
    
    // 读取 Markdown 文件
    const content = await readFile(markdownPath, 'utf-8');
    
    // 提取标题（第一行）
    const lines = content.split('\n');
    let title = '无标题';
    let markdownContent = content;
    
    if (lines.length > 0) {
      title = lines[0].replace(/^#\s*/, '').trim();
      if (title !== lines[0]) {
        markdownContent = lines.slice(1).join('\n');
      }
    }
    
    // 转换 Markdown 为 HTML
    const htmlContent = marked(markdownContent);
    
    // 创建完整的 HTML 文档
    const fullHtml = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <style>
    body { 
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; 
      line-height: 1.8; 
      max-width: 800px; 
      margin: 0 auto; 
      padding: 2rem;
      color: #333;
    }
    h1 { 
      color: #1a1a1a;
      border-bottom: 1px solid #eaecef;
      padding-bottom: 0.3em;
    }
    h2 { 
      color: #24292e;
      border-bottom: 1px solid #eaecef;
      padding-bottom: 0.3em;
      margin-top: 1.5em;
    }
    pre { 
      background: #f6f8fa; 
      padding: 1em; 
      border-radius: 6px; 
      overflow-x: auto; 
      font-size: 0.9em;
    }
    code { 
      font-family: SFMono-Regular, Consolas, "Liberation Mono", Menlo, monospace; 
      background: rgba(175, 184, 193, 0.2);
      padding: 0.2em 0.4em;
      border-radius: 3px;
      font-size: 0.9em;
    }
    pre > code { 
      background: transparent;
      padding: 0;
    }
    blockquote {
      border-left: 4px solid #ddd;
      color: #666;
      padding: 0 1em;
      margin: 1em 0;
    }
    img {
      max-width: 100%;
      border-radius: 4px;
    }
    a {
      color: #0366d6;
      text-decoration: none;
    }
    a:hover {
      text-decoration: underline;
    }
    table {
      border-collapse: collapse;
      width: 100%;
      margin: 1em 0;
    }
    th, td {
      border: 1px solid #dfe2e5;
      padding: 0.5em 1em;
    }
    th {
      background-color: #f6f8fa;
    }
  </style>
</head>
<body>
  <article class="markdown-body">
    <h1>${title}</h1>
    ${htmlContent}
  </article>
</body>
</html>`;
    
    // 输出 HTML 到文件
    const outputPath = resolve(outputDir, `${Date.now()}.html`);
    await writeFile(outputPath, fullHtml, 'utf-8');
    
    return outputPath;
  } catch (error) {
    console.error(chalk.red('❌ 转换失败:'), error instanceof Error ? error.message : String(error));
    process.exit(1);
  }
}

// 从命令行参数获取文件路径
const markdownPath = process.argv[2];
if (!markdownPath) {
  console.error(chalk.red('请指定要预览的 Markdown 文件路径'));
  console.log(chalk.blue('\n使用方法:'), 'pnpm preview <markdown文件路径>');
  process.exit(1);
}

// 执行预览
convertMarkdownToHtml(markdownPath)
  .then(outputPath => {
    console.log(chalk.green('✅ 预览文件已生成:'), outputPath);
    console.log(chalk.blue('正在打开浏览器预览...'));
    return open(outputPath, { wait: false });
  })
  .catch(error => {
    console.error(chalk.red('❌ 预览失败:'), error);
    process.exit(1);
  });
