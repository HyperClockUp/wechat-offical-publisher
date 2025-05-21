import { logger } from "./logger.js";

export class PublisherError extends Error {
  code: ErrorCode;
  details?: Record<string, any>;
  stackTrace?: string;
  severity: 'low' | 'medium' | 'high';

  constructor(
    code: ErrorCode,
    message: string,
    details?: Record<string, any>,
    severity: 'low' | 'medium' | 'high' = 'medium'
  ) {
    super(message);
    this.code = code;
    this.details = details;
    this.name = 'PublisherError';
    this.severity = severity;
    this.stackTrace = new Error().stack;
    Object.setPrototypeOf(this, PublisherError.prototype);
  }
}

export class ConfigurationError extends PublisherError {
  constructor(
    message: string,
    details?: Record<string, any>
  ) {
    super('CONFIG_ERROR', message, details);
  }
}

export class APIError extends PublisherError {
  constructor(
    message: string,
    details?: Record<string, any>
  ) {
    super('API_ERROR', message, details);
  }
}

export class PluginError extends PublisherError {
  constructor(message: string, details?: any) {
    super('PLUGIN_ERROR', message, details);
  }
}

export class FileError extends PublisherError {
  constructor(message: string, details?: any) {
    super('FILE_ERROR', message, details);
  }
}

export const errorCodes = {
  CONFIG_ERROR: 'CONFIG_ERROR',
  API_ERROR: 'API_ERROR',
  PLUGIN_ERROR: 'PLUGIN_ERROR',
  FILE_ERROR: 'FILE_ERROR',
  UNKNOWN_ERROR: 'UNKNOWN_ERROR'
} as const;

export type ErrorCode = typeof errorCodes[keyof typeof errorCodes];

export function handleError(error: Error): never {
  if (error instanceof PublisherError) {
    logger.error('Publisher错误:', error);
    throw error;
  }
  
  logger.error('意外错误:', error);
  throw new PublisherError(
    'UNKNOWN_ERROR',
    `未知错误: ${error.message}`,
    { originalError: error },
    'high'
  );
}
