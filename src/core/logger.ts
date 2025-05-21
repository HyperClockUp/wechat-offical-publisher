import { existsSync, mkdirSync, appendFileSync } from 'node:fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import chalk from 'chalk';

// Use ESM __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * 日志级别
 */
export enum LogLevel {
  DEBUG = 'debug',
  INFO = 'info',
  WARN = 'warn',
  ERROR = 'error'
}

/**
 * 日志记录器
 */
export class Logger {
  private static instance: Logger;
  private readonly logPath: string;
  private readonly logFile: string;
  private readonly colors: Record<LogLevel, (str: string) => string>;

  private constructor() {
    this.logPath = join(__dirname, '..', '..', 'logs');
    this.logFile = join(this.logPath, 'wechat-publisher.log');
    
    // 确保日志目录存在
    if (!existsSync(this.logPath)) {
      mkdirSync(this.logPath, { recursive: true });
    }

    this.colors = {
      [LogLevel.DEBUG]: chalk.gray,
      [LogLevel.INFO]: chalk.blue,
      [LogLevel.WARN]: chalk.yellow,
      [LogLevel.ERROR]: chalk.red
    };
  }

  /**
   * 获取单例实例
   */
  public static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger();
    }
    return Logger.instance;
  }

  /**
   * 记录日志
   */
  private log(level: LogLevel, message: string, error?: Error, ...args: any[]): void {
    const timestamp = new Date().toISOString();
    const coloredMessage = this.colors[level](message);
    const logMessage = `[${timestamp}] [${level.toUpperCase()}] ${message}`;

    // 控制台输出
    if (error) {
      console[level === LogLevel.ERROR ? 'error' : 'log'](coloredMessage, error, ...args);
    } else {
      console[level === LogLevel.ERROR ? 'error' : 'log'](coloredMessage, ...args);
    }

    // 文件输出
    try {
      appendFileSync(this.logFile, `${logMessage}\n`, 'utf-8');
    } catch (error) {
      console.error('[Logger] 无法写入日志文件:', error);
    }
  }

  /**
   * 调试日志
   */
  public debug(message: string, ...args: any[]): void {
    this.log(LogLevel.DEBUG, message, ...args);
  }

  /**
   * 信息日志
   */
  public info(message: string, ...args: any[]): void {
    this.log(LogLevel.INFO, message, ...args);
  }

  /**
   * 警告日志
   */
  public warn(message: string, ...args: any[]): void {
    this.log(LogLevel.WARN, message, ...args);
  }

  /**
   * 错误日志
   */
  public error(message: string | Error, error?: Error, ...args: any[]): void {
    if (message instanceof Error) {
      error = message;
      message = error.message;
    }
    this.log(LogLevel.ERROR, message, error, ...args);
  }
}

export const logger = Logger.getInstance();
