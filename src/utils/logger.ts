import chalk from 'chalk';
import { writeFileSync, appendFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';

export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
  FATAL = 4
}

export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  context?: Record<string, any>;
  error?: Error;
}

/**
 * 增强的日志工具
 */
export class Logger {
  private debugMode: boolean;
  private logLevel: LogLevel;
  private enableFile: boolean;
  private logDir: string;
  private logFile?: string;

  constructor(
    debug: boolean = false, 
    options: {
      logLevel?: LogLevel;
      enableFile?: boolean;
      logDir?: string;
    } = {}
  ) {
    this.debugMode = debug;
    this.logLevel = options.logLevel ?? (debug ? LogLevel.DEBUG : LogLevel.INFO);
    this.enableFile = options.enableFile ?? false;
    this.logDir = options.logDir ?? 'logs';
    
    if (this.enableFile) {
      this.setupLogFile();
    }
  }

  private setupLogFile(): void {
    if (!existsSync(this.logDir)) {
      mkdirSync(this.logDir, { recursive: true });
    }
    
    const date = new Date().toISOString().split('T')[0];
    this.logFile = join(this.logDir, `app-${date}.log`);
  }

  private writeToFile(entry: LogEntry): void {
    if (!this.enableFile || !this.logFile) return;
    
    const logMessage = `[${entry.timestamp}] [${LogLevel[entry.level]}] ${entry.message}`;
    const contextStr = entry.context ? ` ${JSON.stringify(entry.context)}` : '';
    const errorStr = entry.error ? `\nError: ${entry.error.message}\nStack: ${entry.error.stack}` : '';
    
    try {
      appendFileSync(this.logFile, logMessage + contextStr + errorStr + '\n');
    } catch (error) {
      console.error('Failed to write log to file:', error);
    }
  }

  public log(level: LogLevel, message: string, data?: any, error?: Error): void {
    if (level < this.logLevel) return;
    
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      context: data,
      error
    };
    
    this.writeToFile(entry);
  }

  info(message: string, data?: any): void {
    this.log(LogLevel.INFO, message, data);
    console.log(chalk.blue('ℹ'), message);
    if (data && this.debugMode) {
      console.log(chalk.gray(JSON.stringify(data, null, 2)));
    }
  }

  success(message: string, data?: any): void {
    this.log(LogLevel.INFO, `SUCCESS: ${message}`, data);
    console.log(chalk.green('✓'), message);
    if (data && this.debugMode) {
      console.log(chalk.gray(JSON.stringify(data, null, 2)));
    }
  }

  warn(message: string, data?: any): void {
    this.log(LogLevel.WARN, message, data);
    console.log(chalk.yellow('⚠'), message);
    if (data && this.debugMode) {
      console.log(chalk.gray(JSON.stringify(data, null, 2)));
    }
  }

  error(message: string, error?: Error, data?: any): void {
    this.log(LogLevel.ERROR, message, data, error);
    console.log(chalk.red('✗'), message);
    if (error && this.debugMode) {
      console.log(chalk.red(error.stack || error.message));
    }
  }

  debug(message: string, data?: any): void {
    this.log(LogLevel.DEBUG, message, data);
    if (this.debugMode) {
      console.log(chalk.gray('🔍'), chalk.gray(message));
      if (data) {
        console.log(chalk.gray(JSON.stringify(data, null, 2)));
      }
    }
  }

  fatal(message: string, error?: Error, data?: any): void {
    this.log(LogLevel.FATAL, message, data, error);
    console.log(chalk.red.bold('💀'), chalk.red.bold(message));
    if (error) {
      console.log(chalk.red(error.stack || error.message));
    }
  }

  // 性能监控相关方法
  time(label: string): void {
    console.time(label);
    this.debug(`Timer started: ${label}`);
  }

  timeEnd(label: string): void {
    console.timeEnd(label);
    this.debug(`Timer ended: ${label}`);
  }

  // 创建子日志器
  child(context: Record<string, any>): Logger {
    const childLogger = new Logger(this.debugMode, {
      logLevel: this.logLevel,
      enableFile: this.enableFile,
      logDir: this.logDir
    });
    
    // 重写log方法以包含固定上下文
    const originalLog = childLogger.log.bind(childLogger);
    childLogger.log = (level: LogLevel, message: string, data?: any, error?: Error) => {
      const mergedData = { ...context, ...data };
      originalLog(level, message, mergedData, error);
    };
    
    return childLogger;
  }
}

/**
 * 错误处理工具类
 */
export class ErrorHandler {
  private logger: Logger;
  private errorCounts: Map<string, number> = new Map();

  constructor(logger: Logger) {
    this.logger = logger;
  }

  handle(error: Error, context?: Record<string, any>): void {
    const errorKey = `${error.name}:${error.message}`;
    const count = this.errorCounts.get(errorKey) || 0;
    this.errorCounts.set(errorKey, count + 1);

    this.logger.error(
      `Error occurred (count: ${count + 1})`,
      error,
      {
        ...context,
        errorName: error.name,
        errorCount: count + 1
      }
    );
  }

  async wrap<T>(
    fn: () => Promise<T>,
    context?: Record<string, any>
  ): Promise<T | null> {
    try {
      return await fn();
    } catch (error) {
      this.handle(error as Error, context);
      return null;
    }
  }

  getErrorStats(): Array<{ error: string; count: number }> {
    return Array.from(this.errorCounts.entries())
      .map(([error, count]) => ({ error, count }))
      .sort((a, b) => b.count - a.count);
  }

  clearStats(): void {
    this.errorCounts.clear();
  }
}

/**
 * 自定义错误类
 */
export class WeChatPublisherError extends Error {
  public readonly code: string;
  public readonly context?: Record<string, any>;

  constructor(
    message: string,
    code: string = 'UNKNOWN_ERROR',
    context?: Record<string, any>
  ) {
    super(message);
    this.name = 'WeChatPublisherError';
    this.code = code;
    this.context = context;
  }
}

/**
 * 错误代码常量
 */
export const ErrorCodes = {
  FILE_NOT_FOUND: 'FILE_NOT_FOUND',
  INVALID_MARKDOWN: 'INVALID_MARKDOWN',
  THEME_NOT_FOUND: 'THEME_NOT_FOUND',
  PLUGIN_ERROR: 'PLUGIN_ERROR',
  RENDER_ERROR: 'RENDER_ERROR',
  COMPATIBILITY_ERROR: 'COMPATIBILITY_ERROR',
  NETWORK_ERROR: 'NETWORK_ERROR',
  PERMISSION_ERROR: 'PERMISSION_ERROR'
} as const;

/**
 * 日志装饰器
 */
export function logMethod(level: LogLevel = LogLevel.DEBUG) {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;
    const className = target.constructor.name;

    descriptor.value = async function (...args: any[]) {
      const methodName = `${className}.${propertyKey}`;
      const logger = new Logger(true);
      
      logger.log(level, `Calling ${methodName}`, {
        args: args.length,
        method: methodName
      });

      try {
        const result = await originalMethod.apply(this, args);
        logger.log(level, `${methodName} completed successfully`);
        return result;
      } catch (error) {
        logger.error(`${methodName} failed`, error as Error, {
          method: methodName,
          args: args.length
        });
        throw error;
      }
    };

    return descriptor;
  };
}

// 默认日志实例
export const logger = new Logger(
  process.env.NODE_ENV === 'development',
  {
    enableFile: process.env.NODE_ENV === 'production',
    logDir: 'logs'
  }
);

// 全局错误处理器
export const errorHandler = new ErrorHandler(logger);

// 便捷函数
export const log = {
  debug: (message: string, data?: any) => logger.debug(message, data),
  info: (message: string, data?: any) => logger.info(message, data),
  warn: (message: string, data?: any) => logger.warn(message, data),
  error: (message: string, error?: Error, data?: any) => logger.error(message, error, data),
  fatal: (message: string, error?: Error, data?: any) => logger.fatal(message, error, data),
  success: (message: string, data?: any) => logger.success(message, data)
};