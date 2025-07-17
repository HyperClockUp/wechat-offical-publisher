#!/usr/bin/env tsx

import { execSync } from 'child_process';
import { existsSync } from 'fs';
import chalk from 'chalk';

/**
 * 代码质量检查脚本
 * 运行完整的代码质量检查流程
 */

interface CheckResult {
  name: string;
  success: boolean;
  message: string;
  duration: number;
}

class QualityChecker {
  private results: CheckResult[] = [];

  async runCheck(name: string, command: string): Promise<CheckResult> {
    const startTime = Date.now();
    console.log(chalk.blue(`🔍 运行 ${name}...`));
    
    try {
      execSync(command, { stdio: 'pipe', encoding: 'utf-8' });
      const duration = Date.now() - startTime;
      const result = {
        name,
        success: true,
        message: '通过',
        duration
      };
      
      console.log(chalk.green(`✅ ${name} 通过 (${duration}ms)`));
      this.results.push(result);
      return result;
    } catch (error: any) {
      const duration = Date.now() - startTime;
      const result = {
        name,
        success: false,
        message: error.message || '失败',
        duration
      };
      
      console.log(chalk.red(`❌ ${name} 失败 (${duration}ms)`));
      console.log(chalk.red(error.stdout || error.message));
      this.results.push(result);
      return result;
    }
  }

  async runAllChecks(): Promise<void> {
    console.log(chalk.cyan('🚀 开始代码质量检查...\n'));

    // 1. TypeScript 类型检查
    await this.runCheck('TypeScript 类型检查', 'npx tsc --noEmit --skipLibCheck');

    // 2. ESLint 代码规范检查
    await this.runCheck('ESLint 代码规范', 'npx eslint src --ext .ts');

    // 3. Prettier 代码格式检查
    await this.runCheck('Prettier 格式检查', 'npx prettier --check src/**/*.ts');

    // 4. 单元测试
    if (existsSync('tests') || existsSync('src/__tests__')) {
      await this.runCheck('单元测试', 'npm test');
    } else {
      console.log(chalk.yellow('⚠️  未找到测试文件，跳过单元测试'));
    }

    // 5. 测试覆盖率检查
    if (existsSync('jest.config.js')) {
      await this.runCheck('测试覆盖率', 'npm run test:coverage');
    }

    // 6. 安全漏洞检查
    await this.runCheck('安全漏洞检查', 'npm audit --audit-level=moderate');

    // 7. 依赖检查
    try {
      await this.runCheck('依赖更新检查', 'npm outdated');
    } catch {
      // npm outdated 在有过期依赖时会返回非零退出码，这是正常的
      console.log(chalk.yellow('📦 发现可更新的依赖'));
    }

    // 8. 构建检查
    await this.runCheck('项目构建', 'npm run build');

    // 9. CLI 功能测试
    await this.runCheck('CLI 基本功能', 'npx tsx src/cli.ts --help');
    await this.runCheck('主题列表功能', 'npx tsx src/cli.ts themes');

    this.printSummary();
  }

  private printSummary(): void {
    console.log('\n' + chalk.cyan('📊 质量检查总结'));
    console.log('='.repeat(50));

    const passed = this.results.filter(r => r.success).length;
    const failed = this.results.filter(r => !r.success).length;
    const total = this.results.length;
    const totalTime = this.results.reduce((sum, r) => sum + r.duration, 0);

    console.log(`总检查项: ${total}`);
    console.log(chalk.green(`通过: ${passed}`));
    console.log(chalk.red(`失败: ${failed}`));
    console.log(`总耗时: ${totalTime}ms`);
    console.log('');

    // 详细结果
    this.results.forEach(result => {
      const icon = result.success ? '✅' : '❌';
      const color = result.success ? chalk.green : chalk.red;
      console.log(`${icon} ${color(result.name)}: ${result.message} (${result.duration}ms)`);
    });

    console.log('');

    if (failed === 0) {
      console.log(chalk.green.bold('🎉 所有质量检查都通过了！'));
      console.log(chalk.green('代码质量良好，可以安全提交。'));
    } else {
      console.log(chalk.red.bold('⚠️  发现质量问题，请修复后再提交。'));
      console.log(chalk.yellow('建议运行以下命令修复问题：'));
      console.log(chalk.yellow('  npm run lint:fix    # 自动修复代码规范问题'));
      console.log(chalk.yellow('  npm run test        # 运行测试查看详细错误'));
      process.exit(1);
    }
  }

  // 生成质量报告
  generateReport(): string {
    const passed = this.results.filter(r => r.success).length;
    const total = this.results.length;
    const score = Math.round((passed / total) * 100);
    
    let grade = 'F';
    if (score >= 90) grade = 'A';
    else if (score >= 80) grade = 'B';
    else if (score >= 70) grade = 'C';
    else if (score >= 60) grade = 'D';

    return `
# 代码质量报告

## 总体评分: ${grade} (${score}/100)

## 检查结果

${this.results.map(r => 
  `- ${r.success ? '✅' : '❌'} **${r.name}**: ${r.message} (${r.duration}ms)`
).join('\n')}

## 建议

${score < 100 ? `
### 需要改进的项目
${this.results.filter(r => !r.success).map(r => 
  `- ${r.name}: ${r.message}`
).join('\n')}
` : '代码质量优秀，继续保持！'}

---
生成时间: ${new Date().toISOString()}
`;
  }
}

// 主函数
async function main(): Promise<void> {
  const checker = new QualityChecker();
  
  try {
    await checker.runAllChecks();
    
    // 生成报告文件
    const report = checker.generateReport();
    const fs = await import('fs');
    fs.writeFileSync('quality-report.md', report);
    console.log(chalk.blue('📄 质量报告已生成: quality-report.md'));
    
  } catch (error) {
    console.error(chalk.red('质量检查过程中发生错误:'), error);
    process.exit(1);
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  main().catch(console.error);
}

export { QualityChecker };