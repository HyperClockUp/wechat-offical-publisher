/**
 * 缓存系统
 * 提供内存缓存和文件缓存功能，提升应用性能
 */

import { existsSync, mkdirSync, readFileSync, writeFileSync, unlinkSync, readdirSync, statSync } from 'fs';
import { join, extname } from 'path';
import { createHash } from 'crypto';
import { config } from '../config/index';
import { logger } from './logger';

export interface CacheEntry<T = any> {
  key: string;
  value: T;
  timestamp: number;
  ttl?: number; // Time to live in milliseconds
  size?: number; // Size in bytes
}

export interface CacheStats {
  hits: number;
  misses: number;
  sets: number;
  deletes: number;
  evictions: number;
  memoryUsage: number;
  diskUsage: number;
}

/**
 * 内存缓存
 */
export class MemoryCache {
  private cache = new Map<string, CacheEntry>();
  private stats: CacheStats = {
    hits: 0,
    misses: 0,
    sets: 0,
    deletes: 0,
    evictions: 0,
    memoryUsage: 0,
    diskUsage: 0
  };
  private maxSize: number;
  private defaultTTL: number;

  constructor(maxSize: number = 100, defaultTTL: number = 3600000) { // 1 hour default
    this.maxSize = maxSize;
    this.defaultTTL = defaultTTL;
  }

  /**
   * 生成缓存键
   */
  private generateKey(key: string): string {
    return createHash('md5').update(key).digest('hex');
  }

  /**
   * 检查条目是否过期
   */
  private isExpired(entry: CacheEntry): boolean {
    if (!entry.ttl) return false;
    return Date.now() - entry.timestamp > entry.ttl;
  }

  /**
   * 清理过期条目
   */
  private cleanup(): void {
    const now = Date.now();
    const toDelete: string[] = [];

    for (const [key, entry] of this.cache.entries()) {
      if (this.isExpired(entry)) {
        toDelete.push(key);
      }
    }

    toDelete.forEach(key => {
      this.cache.delete(key);
      this.stats.evictions++;
    });
  }

  /**
   * 驱逐最旧的条目
   */
  private evictOldest(): void {
    if (this.cache.size === 0) return;

    let oldestKey = '';
    let oldestTime = Date.now();

    for (const [key, entry] of this.cache.entries()) {
      if (entry.timestamp < oldestTime) {
        oldestTime = entry.timestamp;
        oldestKey = key;
      }
    }

    if (oldestKey) {
      this.cache.delete(oldestKey);
      this.stats.evictions++;
    }
  }

  /**
   * 获取缓存值
   */
  get<T>(key: string): T | null {
    const hashedKey = this.generateKey(key);
    const entry = this.cache.get(hashedKey);

    if (!entry) {
      this.stats.misses++;
      return null;
    }

    if (this.isExpired(entry)) {
      this.cache.delete(hashedKey);
      this.stats.misses++;
      this.stats.evictions++;
      return null;
    }

    this.stats.hits++;
    return entry.value as T;
  }

  /**
   * 设置缓存值
   */
  set<T>(key: string, value: T, ttl?: number): void {
    const hashedKey = this.generateKey(key);
    
    // 清理过期条目
    this.cleanup();

    // 如果缓存已满，驱逐最旧的条目
    if (this.cache.size >= this.maxSize) {
      this.evictOldest();
    }

    const entry: CacheEntry<T> = {
      key: hashedKey,
      value,
      timestamp: Date.now(),
      ttl: ttl || this.defaultTTL,
      size: this.estimateSize(value)
    };

    this.cache.set(hashedKey, entry);
    this.stats.sets++;
    this.updateMemoryUsage();
  }

  /**
   * 删除缓存值
   */
  delete(key: string): boolean {
    const hashedKey = this.generateKey(key);
    const deleted = this.cache.delete(hashedKey);
    
    if (deleted) {
      this.stats.deletes++;
      this.updateMemoryUsage();
    }
    
    return deleted;
  }

  /**
   * 清空缓存
   */
  clear(): void {
    this.cache.clear();
    this.stats.memoryUsage = 0;
  }

  /**
   * 获取缓存大小
   */
  size(): number {
    return this.cache.size;
  }

  /**
   * 估算值的大小
   */
  private estimateSize(value: any): number {
    if (typeof value === 'string') {
      return value.length * 2; // UTF-16
    }
    if (typeof value === 'object') {
      return JSON.stringify(value).length * 2;
    }
    return 8; // 基本类型大约8字节
  }

  /**
   * 更新内存使用统计
   */
  private updateMemoryUsage(): void {
    let totalSize = 0;
    for (const entry of this.cache.values()) {
      totalSize += entry.size || 0;
    }
    this.stats.memoryUsage = totalSize;
  }

  /**
   * 获取缓存统计
   */
  getStats(): CacheStats {
    this.cleanup(); // 清理过期条目后再统计
    return { ...this.stats };
  }

  /**
   * 获取命中率
   */
  getHitRate(): number {
    const total = this.stats.hits + this.stats.misses;
    return total > 0 ? this.stats.hits / total : 0;
  }
}

/**
 * 文件缓存
 */
export class FileCache {
  private cacheDir: string;
  private maxSize: number;
  private defaultTTL: number;
  private stats: CacheStats = {
    hits: 0,
    misses: 0,
    sets: 0,
    deletes: 0,
    evictions: 0,
    memoryUsage: 0,
    diskUsage: 0
  };

  constructor(
    cacheDir: string = config.get('publisher').cacheDir,
    maxSize: number = config.get('publisher').maxCacheSize,
    defaultTTL: number = 24 * 60 * 60 * 1000 // 24 hours
  ) {
    this.cacheDir = cacheDir;
    this.maxSize = maxSize;
    this.defaultTTL = defaultTTL;
    this.ensureCacheDir();
  }

  /**
   * 确保缓存目录存在
   */
  private ensureCacheDir(): void {
    if (!existsSync(this.cacheDir)) {
      mkdirSync(this.cacheDir, { recursive: true });
    }
  }

  /**
   * 生成缓存文件路径
   */
  private getCacheFilePath(key: string): string {
    const hashedKey = createHash('md5').update(key).digest('hex');
    return join(this.cacheDir, `${hashedKey}.cache`);
  }

  /**
   * 生成元数据文件路径
   */
  private getMetaFilePath(key: string): string {
    const hashedKey = createHash('md5').update(key).digest('hex');
    return join(this.cacheDir, `${hashedKey}.meta`);
  }

  /**
   * 检查文件是否过期
   */
  private isExpired(metaPath: string): boolean {
    try {
      const meta = JSON.parse(readFileSync(metaPath, 'utf-8'));
      if (!meta.ttl) return false;
      return Date.now() - meta.timestamp > meta.ttl;
    } catch {
      return true;
    }
  }

  /**
   * 清理过期文件
   */
  private cleanup(): void {
    try {
      const files = readdirSync(this.cacheDir);
      const metaFiles = files.filter(f => f.endsWith('.meta'));

      for (const metaFile of metaFiles) {
        const metaPath = join(this.cacheDir, metaFile);
        if (this.isExpired(metaPath)) {
          const cacheFile = metaFile.replace('.meta', '.cache');
          const cachePath = join(this.cacheDir, cacheFile);
          
          try {
            unlinkSync(metaPath);
            if (existsSync(cachePath)) {
              unlinkSync(cachePath);
            }
            this.stats.evictions++;
          } catch (error) {
            logger.warn('Failed to delete expired cache file', { error, file: metaFile });
          }
        }
      }
    } catch (error) {
      logger.error('Failed to cleanup cache', error as Error);
    }
  }

  /**
   * 获取磁盘使用量
   */
  private getDiskUsage(): number {
    try {
      const files = readdirSync(this.cacheDir);
      let totalSize = 0;

      for (const file of files) {
        const filePath = join(this.cacheDir, file);
        const stats = statSync(filePath);
        totalSize += stats.size;
      }

      return totalSize;
    } catch {
      return 0;
    }
  }

  /**
   * 驱逐最旧的文件
   */
  private evictOldest(): void {
    try {
      const files = readdirSync(this.cacheDir);
      const metaFiles = files.filter(f => f.endsWith('.meta'));
      
      if (metaFiles.length === 0) return;

      let oldestFile = '';
      let oldestTime = Date.now();

      for (const metaFile of metaFiles) {
        const metaPath = join(this.cacheDir, metaFile);
        try {
          const meta = JSON.parse(readFileSync(metaPath, 'utf-8'));
          if (meta.timestamp < oldestTime) {
            oldestTime = meta.timestamp;
            oldestFile = metaFile;
          }
        } catch {
          // 如果元数据文件损坏，删除它
          oldestFile = metaFile;
          break;
        }
      }

      if (oldestFile) {
        const metaPath = join(this.cacheDir, oldestFile);
        const cacheFile = oldestFile.replace('.meta', '.cache');
        const cachePath = join(this.cacheDir, cacheFile);
        
        try {
          unlinkSync(metaPath);
          if (existsSync(cachePath)) {
            unlinkSync(cachePath);
          }
          this.stats.evictions++;
        } catch (error) {
          logger.warn('Failed to evict oldest cache file', { error, file: oldestFile });
        }
      }
    } catch (error) {
      logger.error('Failed to evict oldest cache file', error as Error);
    }
  }

  /**
   * 获取缓存值
   */
  get<T>(key: string): T | null {
    const cacheFilePath = this.getCacheFilePath(key);
    const metaFilePath = this.getMetaFilePath(key);

    if (!existsSync(cacheFilePath) || !existsSync(metaFilePath)) {
      this.stats.misses++;
      return null;
    }

    if (this.isExpired(metaFilePath)) {
      try {
        unlinkSync(cacheFilePath);
        unlinkSync(metaFilePath);
      } catch {}
      this.stats.misses++;
      this.stats.evictions++;
      return null;
    }

    try {
      const content = readFileSync(cacheFilePath, 'utf-8');
      const value = JSON.parse(content);
      this.stats.hits++;
      return value as T;
    } catch (error) {
      logger.warn('Failed to read cache file', { error, key });
      this.stats.misses++;
      return null;
    }
  }

  /**
   * 设置缓存值
   */
  set<T>(key: string, value: T, ttl?: number): void {
    const cacheFilePath = this.getCacheFilePath(key);
    const metaFilePath = this.getMetaFilePath(key);

    // 清理过期文件
    this.cleanup();

    // 检查磁盘使用量
    const currentDiskUsage = this.getDiskUsage();
    if (currentDiskUsage > this.maxSize) {
      this.evictOldest();
    }

    try {
      // 写入缓存数据
      const content = JSON.stringify(value);
      writeFileSync(cacheFilePath, content, 'utf-8');

      // 写入元数据
      const meta = {
        key,
        timestamp: Date.now(),
        ttl: ttl || this.defaultTTL,
        size: content.length
      };
      writeFileSync(metaFilePath, JSON.stringify(meta), 'utf-8');

      this.stats.sets++;
    } catch (error) {
      logger.error('Failed to write cache file', error as Error, { key });
    }
  }

  /**
   * 删除缓存值
   */
  delete(key: string): boolean {
    const cacheFilePath = this.getCacheFilePath(key);
    const metaFilePath = this.getMetaFilePath(key);

    let deleted = false;

    try {
      if (existsSync(cacheFilePath)) {
        unlinkSync(cacheFilePath);
        deleted = true;
      }
      if (existsSync(metaFilePath)) {
        unlinkSync(metaFilePath);
        deleted = true;
      }
      
      if (deleted) {
        this.stats.deletes++;
      }
    } catch (error) {
      logger.warn('Failed to delete cache file', { error, key });
    }

    return deleted;
  }

  /**
   * 清空缓存
   */
  clear(): void {
    try {
      const files = readdirSync(this.cacheDir);
      for (const file of files) {
        const filePath = join(this.cacheDir, file);
        unlinkSync(filePath);
      }
      this.stats = {
        hits: 0,
        misses: 0,
        sets: 0,
        deletes: 0,
        evictions: 0,
        memoryUsage: 0,
        diskUsage: 0
      };
    } catch (error) {
      logger.error('Failed to clear cache', error as Error);
    }
  }

  /**
   * 获取缓存统计
   */
  getStats(): CacheStats {
    this.cleanup(); // 清理过期文件后再统计
    this.stats.diskUsage = this.getDiskUsage();
    return { ...this.stats };
  }

  /**
   * 获取命中率
   */
  getHitRate(): number {
    const total = this.stats.hits + this.stats.misses;
    return total > 0 ? this.stats.hits / total : 0;
  }
}

/**
 * 多层缓存系统
 */
export class MultiLevelCache {
  private memoryCache: MemoryCache;
  private fileCache: FileCache;
  private enableFileCache: boolean;

  constructor(
    memoryMaxSize: number = 100,
    enableFileCache: boolean = config.get('publisher').enableCache
  ) {
    this.memoryCache = new MemoryCache(memoryMaxSize);
    this.fileCache = new FileCache();
    this.enableFileCache = enableFileCache;
  }

  /**
   * 获取缓存值
   */
  get<T>(key: string): T | null {
    // 首先尝试内存缓存
    let value = this.memoryCache.get<T>(key);
    if (value !== null) {
      return value;
    }

    // 然后尝试文件缓存
    if (this.enableFileCache) {
      value = this.fileCache.get<T>(key);
      if (value !== null) {
        // 将文件缓存的值提升到内存缓存
        this.memoryCache.set(key, value);
        return value;
      }
    }

    return null;
  }

  /**
   * 设置缓存值
   */
  set<T>(key: string, value: T, ttl?: number): void {
    // 设置内存缓存
    this.memoryCache.set(key, value, ttl);

    // 设置文件缓存
    if (this.enableFileCache) {
      this.fileCache.set(key, value, ttl);
    }
  }

  /**
   * 删除缓存值
   */
  delete(key: string): boolean {
    const memoryDeleted = this.memoryCache.delete(key);
    const fileDeleted = this.enableFileCache ? this.fileCache.delete(key) : false;
    return memoryDeleted || fileDeleted;
  }

  /**
   * 清空缓存
   */
  clear(): void {
    this.memoryCache.clear();
    if (this.enableFileCache) {
      this.fileCache.clear();
    }
  }

  /**
   * 获取综合统计
   */
  getStats(): { memory: CacheStats; file: CacheStats; combined: CacheStats } {
    const memoryStats = this.memoryCache.getStats();
    const fileStats = this.enableFileCache ? this.fileCache.getStats() : {
      hits: 0, misses: 0, sets: 0, deletes: 0, evictions: 0, memoryUsage: 0, diskUsage: 0
    };

    const combined: CacheStats = {
      hits: memoryStats.hits + fileStats.hits,
      misses: memoryStats.misses + fileStats.misses,
      sets: memoryStats.sets + fileStats.sets,
      deletes: memoryStats.deletes + fileStats.deletes,
      evictions: memoryStats.evictions + fileStats.evictions,
      memoryUsage: memoryStats.memoryUsage,
      diskUsage: fileStats.diskUsage
    };

    return { memory: memoryStats, file: fileStats, combined };
  }

  /**
   * 获取综合命中率
   */
  getHitRate(): number {
    const stats = this.getStats().combined;
    const total = stats.hits + stats.misses;
    return total > 0 ? stats.hits / total : 0;
  }
}

// 全局缓存实例
export const cache = new MultiLevelCache();

// 便捷函数
export const cacheGet = <T>(key: string): T | null => cache.get<T>(key);
export const cacheSet = <T>(key: string, value: T, ttl?: number): void => cache.set(key, value, ttl);
export const cacheDelete = (key: string): boolean => cache.delete(key);
export const cacheClear = (): void => cache.clear();
export const cacheStats = () => cache.getStats();