/**
 * 简化的错误处理
 */

export class PublisherError extends Error {
  constructor(message: string, public cause?: Error) {
    super(message);
    this.name = 'PublisherError';
  }
}

export class ConfigError extends PublisherError {
  constructor(message: string, cause?: Error) {
    super(`配置错误: ${message}`, cause);
    this.name = 'ConfigError';
  }
}

export class ApiError extends PublisherError {
  constructor(message: string, public code?: number, cause?: Error) {
    super(`API错误: ${message}`, cause);
    this.name = 'ApiError';
  }
}

export class FileError extends PublisherError {
  constructor(message: string, cause?: Error) {
    super(`文件错误: ${message}`, cause);
    this.name = 'FileError';
  }
}