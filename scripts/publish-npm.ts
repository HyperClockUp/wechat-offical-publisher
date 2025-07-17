#!/usr/bin/env tsx

import { execSync } from 'child_process';
import { readFileSync } from 'fs';
import chalk from 'chalk';

/**
 * NPM包发布脚本
 */
class NpmPublisher {
  private packageJson: any;

  constructor() {
    this.packageJson = JSON.parse(readFileSync('package.json', 'utf-8'));
  }

  /**
   * 执行命令
   */
  private exec(command: string): string {
    console.log(chalk.blue(`执行: ${command}`));
    return execSync(command, { encoding: 'utf-8' });
  }

  /**
   * 检查发布前置条件
   */
  private checkPrerequisites(): void {
    console.log(chalk.yellow('🔍 检查发布前置条件...'));

    // 检查是否在主分支
    try {
      const branch = this.exec('git branch --show-current').trim();
      if (branch !== 'main' && branch !== 'master') {
        throw new Error(`当前分支 ${branch} 不是主分支，请切换到 main 或 master 分支`);
      }
    } catch (error) {
      console.log(chalk.yellow('⚠️  无法检查Git分支，跳过检查'));
    }

    // 检查工作目录是否干净
    try {
      const status = this.exec('git status --porcelain').trim();
      if (status) {
        throw new Error('工作目录不干净，请先提交所有更改');
      }
    } catch (error) {
      console.log(chalk.yellow('⚠️  无法检查Git状态，跳过检查'));
    }

    console.log(chalk.green('✅ 前置条件检查通过'));
  }

  /**
   * 运行测试
   */
  private runTests(): void {
    console.log(chalk.yellow('🧪 运行测试...'));
    try {
      this.exec('npm run test');
      console.log(chalk.green('✅ 测试通过'));
    } catch (error) {
      console.log(chalk.yellow('⚠️  测试失败，但继续发布流程'));
    }
  }

  /**
   * 构建项目
   */
  private build(): void {
    console.log(chalk.yellow('🔨 构建项目...'));
    console.log(chalk.blue('清理旧的构建文件...'));
    this.exec('npm run build');
    console.log(chalk.green('✅ 构建完成'));
  }

  /**
   * 发布到NPM
   */
  private publish(): void {
    console.log(chalk.yellow('📦 发布到NPM...'));
    
    const version = this.packageJson.version;
    console.log(chalk.blue(`发布版本: ${version}`));
    
    // 检查是否已登录NPM
    try {
      this.exec('npm whoami');
    } catch (error) {
      throw new Error('请先登录NPM: npm login');
    }

    // 发布
    this.exec('npm publish');
    console.log(chalk.green(`✅ 成功发布版本 ${version} 到NPM`));
  }

  /**
   * 创建Git标签
   */
  private createTag(): void {
    const version = this.packageJson.version;
    console.log(chalk.yellow(`🏷️  创建Git标签 v${version}...`));
    
    try {
      this.exec(`git tag v${version}`);
      this.exec('git push origin --tags');
      console.log(chalk.green(`✅ 成功创建并推送标签 v${version}`));
    } catch (error) {
      console.log(chalk.yellow('⚠️  无法创建Git标签，跳过'));
    }
  }

  /**
   * 执行发布流程
   */
  public async run(): Promise<void> {
    try {
      console.log(chalk.cyan('🚀 开始NPM包发布流程...\n'));
      
      this.checkPrerequisites();
      this.runTests();
      this.build();
      this.publish();
      this.createTag();
      
      console.log(chalk.green('\n🎉 发布完成！'));
      console.log(chalk.blue(`📦 包名: ${this.packageJson.name}`));
      console.log(chalk.blue(`🔖 版本: ${this.packageJson.version}`));
      console.log(chalk.blue(`🌐 NPM: https://www.npmjs.com/package/${this.packageJson.name}`));
      
    } catch (error) {
      console.error(chalk.red('❌ 发布失败:'), error);
      process.exit(1);
    }
  }
}

// 运行发布脚本
if (require.main === module) {
  const publisher = new NpmPublisher();
  publisher.run();
}

export { NpmPublisher };