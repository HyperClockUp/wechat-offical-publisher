/**
 * 简化的Token管理器
 * 主要目的：防止不同公众号之间的token缓存冲突
 */

import { cache } from './cache';
import { logger } from './logger';

/**
 * Token管理器
 * 根据AppID区分不同公众号的token，避免冲突
 */
export class TokenManager {
    /**
     * 获取token缓存键
     */
    static getTokenCacheKey(appId: string): string {
        return `wechat_access_token_${appId}`;
    }

    /**
     * 获取缓存的token
     */
    static getCachedToken(appId: string): { token: string; expiresAt: number } | null {
        const cacheKey = this.getTokenCacheKey(appId);
        const cachedToken = cache.get<{ token: string; expiresAt: number }>(cacheKey);

        if (cachedToken && cachedToken.expiresAt > Date.now()) {
            return cachedToken;
        }

        return null;
    }

    /**
     * 缓存token
     */
    static cacheToken(appId: string, token: string, expiresIn: number): void {
        const cacheKey = this.getTokenCacheKey(appId);
        const expiresAt = Date.now() + (expiresIn - 300) * 1000; // 提前5分钟过期

        cache.set(cacheKey, { token, expiresAt }, expiresIn * 1000);

        logger.debug(`Token已缓存: ${appId.substring(0, 8)}... (过期时间: ${new Date(expiresAt).toISOString()})`);
    }

    /**
     * 清空指定公众号的token缓存
     */
    static clearTokenCache(appId: string): void {
        const cacheKey = this.getTokenCacheKey(appId);
        cache.delete(cacheKey);
        logger.info(`已清空公众号 ${appId.substring(0, 8)}... 的token缓存`);
    }

    /**
     * 清空所有token缓存
     */
    static clearAllTokenCache(): void {
        // 这里简化实现，实际项目中可能需要更精确的缓存键管理
        cache.clear();
        logger.info('已清空所有token缓存');
    }
}