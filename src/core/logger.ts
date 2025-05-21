import { existsSync, mkdirSync, appendFileSync } from 'node:fs';
import { join } from 'path';
import chalk from 'chalk';
import * as dotenv from 'dotenv';

// 加载环境变量
dotenv.config();

// 日志级别类型
type LogLevelType = 'debug' | 'info' | 'warn' | 'error';

// 获取环境变量中的日志级别，默认为 'info'
const getLogLevel = (): LogLevelType => {
  const env = process.env.NODE_ENV || 'development';
  const level = (process.env.LOG_LEVEL || (env === 'production' ? 'info' : 'debug')).toLowerCase() as LogLevelType;
  return ['debug', 'info', 'warn', 'error'].includes(level) ? level as LogLevelType : 'info';
};

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

  private readonly logLevel: LogLevelType;
  private readonly logLevels: Record<LogLevelType, number> = {
    error: 0,
    warn: 1,
    info: 2,
    debug: 3
  };

  private constructor() {
    this.logPath = join(process.cwd(), 'logs');
    this.logFile = join(this.logPath, 'wechat-publisher.log');
    this.logLevel = getLogLevel();
    
    // 确保日志目录存在
    if (!existsSync(this.logPath)) {
      mkdirSync(this.logPath, { recursive: true });
    }

    this.colors = {
      [LogLevel.DEBUG]: chalk.hex('#757575'),    // 深灰色 - 调试信息
      [LogLevel.INFO]: chalk.hex('#2196F3'),    // 蓝色 - 普通信息
      [LogLevel.WARN]: chalk.hex('#FF9800'),    // 橙色 - 警告信息
      [LogLevel.ERROR]: chalk.hex('#E91E63')    // 粉红色 - 错误信息
    };

    // 记录当前日志级别
    this.info(`Logger initialized with level: ${this.logLevel}`);
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
   * 判断是否应该记录该级别的日志
   */
  private shouldLog(level: LogLevel): boolean {
    const levelValue = this.logLevels[level];
    const currentLevelValue = this.logLevels[this.logLevel];
    return levelValue >= currentLevelValue;
  }

  /**
   * 记录日志
   */
  private log(level: LogLevel, message: string, error?: Error, ...args: any[]): void {
    // 如果当前日志级别高于要记录的级别，则不记录
    if (!this.shouldLog(level)) {
      return;
    }

    const timestamp = new Date().toLocaleString('zh-CN', { 
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    });
    
    // 为不同级别的日志添加不同的前缀符号
    const levelIcons = {
      [LogLevel.DEBUG]: '🐞',  // 虫子图标表示调试
      [LogLevel.INFO]: 'ℹ️',  // 信息图标
      [LogLevel.WARN]: '⚠️',  // 警告图标
      [LogLevel.ERROR]: '❌'   // 错误图标
    };
    
    const levelText = level.toUpperCase().padEnd(5);
    const coloredMessage = this.colors[level](`${levelIcons[level]} [${levelText}] ${message}`);
    const logMessage = `[${timestamp}] ${levelIcons[level]} [${levelText}] ${message}`;

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

// 定义 Logger 接口
export interface ILogger {
  debug(message: string, ...args: any[]): void;
  info(message: string, ...args: any[]): void;
  warn(message: string, ...args: any[]): void;
  error(message: string | Error, error?: Error, ...args: any[]): void;
}

// 导出默认的logger实例
export const logger: ILogger = Logger.getInstance();

// 导出日志级别类型
export type { LogLevelType };
