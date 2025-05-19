import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

/**
 * 访问令牌缓存类
 */
export class AccessTokenCache {
  private static cachePath: string;
  private static cacheFile: string;

  static init() {
    // 获取当前模块的目录
    const __dirname = fileURLToPath(import.meta.url);
    // 使用 path 模块处理路径
    this.cachePath = join(__dirname, '..', '.cache');
    this.cacheFile = join(this.cachePath, 'access_token.json');

    // 创建缓存目录（如果不存在）
    if (!existsSync(this.cachePath)) {
      mkdirSync(this.cachePath, { recursive: true });
    }
  }

  /**
   * 保存访问令牌到缓存
   */
  static save(token: string, expiresAt: number) {
    const data = {
      token,
      expiresAt
    };
    writeFileSync(this.cacheFile, JSON.stringify(data, null, 2));
  }

  /**
   * 从缓存读取访问令牌
   */
  static load(): { token: string; expiresAt: number } | null {
    if (!existsSync(this.cacheFile)) {
      return null;
    }

    try {
      const data = JSON.parse(readFileSync(this.cacheFile, 'utf-8'));
      return data;
    } catch (error) {
      console.error('[AccessTokenCache] 读取缓存失败:', error);
      return null;
    }
  }

  /**
   * 清除缓存
   */
  static clear() {
    if (existsSync(this.cacheFile)) {
      writeFileSync(this.cacheFile, '');
    }
  }
}
