import chalk from 'chalk';

/**
 * 简化的日志工具
 */
export class Logger {
  private debugMode: boolean;

  constructor(debug: boolean = false) {
    this.debugMode = debug;
  }

  info(message: string, data?: any) {
    console.log(chalk.blue('ℹ'), message);
    if (data && this.debugMode) {
      console.log(chalk.gray(JSON.stringify(data, null, 2)));
    }
  }

  success(message: string, data?: any) {
    console.log(chalk.green('✓'), message);
    if (data && this.debugMode) {
      console.log(chalk.gray(JSON.stringify(data, null, 2)));
    }
  }

  warn(message: string, data?: any) {
    console.log(chalk.yellow('⚠'), message);
    if (data && this.debugMode) {
      console.log(chalk.gray(JSON.stringify(data, null, 2)));
    }
  }

  error(message: string, error?: Error) {
    console.log(chalk.red('✗'), message);
    if (error && this.debugMode) {
      console.log(chalk.red(error.stack || error.message));
    }
  }

  debug(message: string, data?: any) {
    if (this.debugMode) {
      console.log(chalk.gray('🔍'), chalk.gray(message));
      if (data) {
        console.log(chalk.gray(JSON.stringify(data, null, 2)));
      }
    }
  }
}

// 默认日志实例
export const logger = new Logger(process.env.NODE_ENV === 'development');