import * as fs from 'node:fs';
import { join } from 'path';
import { existsSync, mkdirSync } from 'fs';
import axios from 'axios';
import { APIError } from './errors';

// 缓存文件路径
const cachePath = join(process.cwd(), '.cache');
const cacheFile = join(cachePath, 'access_token.json');

/**
 * 访问令牌缓存类
 */
export class AccessTokenCache {
  private static cachePath = cachePath;
  private static cacheFile = cacheFile;

  /**
   * 初始化缓存
   */
  static init(): void {
    try {
      // 确保缓存目录存在
      if (!existsSync(cachePath)) {
        mkdirSync(cachePath, { recursive: true });
      }
      // 确保缓存文件存在
      if (!existsSync(cacheFile)) {
        fs.writeFileSync(cacheFile, JSON.stringify({ token: '', expiresAt: 0 }));
      }
    } catch (error) {
      throw new APIError('初始化访问令牌缓存失败', {
        message: error instanceof Error ? error.message : String(error)
      });
    }
  }

  /**
   * 获取访问令牌
   */
  static async getAccessToken(appId: string, appSecret: string): Promise<{ token: string; expiresAt: number }> {
    try {
      // 确保缓存目录存在
      if (!existsSync(cachePath)) {
        mkdirSync(cachePath, { recursive: true });
      }

      // 检查缓存文件是否存在
      if (existsSync(cacheFile)) {
        const data = JSON.parse(fs.readFileSync(cacheFile, 'utf-8'));
        if (data.expiresAt > Date.now()) {
          return data;
        }
      }

      // 如果令牌过期或不存在，获取新令牌
      const response = await axios.get<{ 
        access_token: string;
        expires_in: number;
        errcode?: number;
        errmsg?: string;
      }>(`https://api.weixin.qq.com/cgi-bin/token`, {
        params: {
          grant_type: 'client_credential',
          appid: appId,
          secret: appSecret
        }
      });

      if (response.data.errcode) {
        throw new Error(`获取访问令牌失败: ${response.data.errmsg}`);
      }

      const tokenData = {
        token: response.data.access_token,
        // 提前5分钟过期，避免临界点问题
        expiresAt: Date.now() + (response.data.expires_in - 300) * 1000
      };

      // 保存到缓存
      fs.writeFileSync(cacheFile, JSON.stringify(tokenData));
      return tokenData;
    } catch (error) {
      throw new Error(`获取访问令牌失败: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * 清除缓存
   */
  static clear() {
    if (existsSync(cacheFile)) {
      fs.writeFileSync(cacheFile, JSON.stringify({ token: '', expiresAt: 0 }));
    }
  }
}
