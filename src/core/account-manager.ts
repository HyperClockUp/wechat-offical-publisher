/**
 * 多账号管理器
 * 支持多个微信公众号账号的token管理和切换
 */

import { Config } from '../types';
import { WeChatApi } from '../utils/wechat-api';
import { cache } from '../utils/cache';
import { logger } from '../utils/logger';
import { ConfigError } from '../utils/errors';

export interface AccountConfig {
  appId: string;
  appSecret: string;
  name?: string;
  description?: string;
  useStableToken?: boolean;
  debug?: boolean;
}

export interface AccountInfo extends AccountConfig {
  isActive: boolean;
  lastUsed?: Date;
  tokenStatus?: 'valid' | 'expired' | 'invalid' | 'unknown';
  tokenExpiresAt?: Date;
}

/**
 * 多账号管理器
 */
export class AccountManager {
  private accounts: Map<string, AccountConfig> = new Map();
  private activeAccountId: string | null = null;
  private apiInstances: Map<string, WeChatApi> = new Map();

  constructor() {
    this.loadAccountsFromEnv();
  }

  /**
   * 从环境变量加载账号配置
   */
  private loadAccountsFromEnv(): void {
    // 加载默认账号
    const defaultAppId = process.env.WECHAT_APP_ID;
    const defaultAppSecret = process.env.WECHAT_APP_SECRET;
    
    if (defaultAppId && defaultAppSecret) {
      this.addAccount('default', {
        appId: defaultAppId,
        appSecret: defaultAppSecret,
        name: '默认账号',
        useStableToken: process.env.WECHAT_USE_STABLE_TOKEN === 'true',
        debug: process.env.NODE_ENV === 'development'
      });
      this.setActiveAccount('default');
    }

    // 加载多账号配置
    // 支持格式：WECHAT_ACCOUNTS=account1:appid1:secret1,account2:appid2:secret2
    const accountsEnv = process.env.WECHAT_ACCOUNTS;
    if (accountsEnv) {
      const accountConfigs = accountsEnv.split(',');
      for (const configStr of accountConfigs) {
        const [id, appId, appSecret, name] = configStr.split(':');
        if (id && appId && appSecret) {
          this.addAccount(id.trim(), {
            appId: appId.trim(),
            appSecret: appSecret.trim(),
            name: name?.trim() || id.trim(),
            useStableToken: process.env.WECHAT_USE_STABLE_TOKEN === 'true',
            debug: process.env.NODE_ENV === 'development'
          });
        }
      }
    }
  }

  /**
   * 添加账号
   */
  addAccount(id: string, config: AccountConfig): void {
    if (this.accounts.has(id)) {
      throw new ConfigError(`账号ID已存在: ${id}`);
    }

    // 验证配置
    if (!config.appId || !config.appSecret) {
      throw new ConfigError(`账号配置无效: ${id}`);
    }

    this.accounts.set(id, config);
    logger.info(`添加账号: ${id} (${config.name || config.appId})`);

    // 如果是第一个账号，设为活跃账号
    if (this.accounts.size === 1) {
      this.setActiveAccount(id);
    }
  }

  /**
   * 移除账号
   */
  removeAccount(id: string): boolean {
    if (!this.accounts.has(id)) {
      return false;
    }

    // 清理相关资源
    this.clearAccountCache(id);
    this.apiInstances.delete(id);
    this.accounts.delete(id);

    // 如果移除的是活跃账号，切换到其他账号
    if (this.activeAccountId === id) {
      const remainingAccounts = Array.from(this.accounts.keys());
      this.activeAccountId = remainingAccounts.length > 0 ? remainingAccounts[0] : null;
    }

    logger.info(`移除账号: ${id}`);
    return true;
  }

  /**
   * 设置活跃账号
   */
  setActiveAccount(id: string): void {
    if (!this.accounts.has(id)) {
      throw new ConfigError(`账号不存在: ${id}`);
    }

    this.activeAccountId = id;
    logger.info(`切换到账号: ${id}`);
  }

  /**
   * 获取活跃账号
   */
  getActiveAccount(): AccountConfig | null {
    if (!this.activeAccountId) {
      return null;
    }
    return this.accounts.get(this.activeAccountId) || null;
  }

  /**
   * 获取活跃账号ID
   */
  getActiveAccountId(): string | null {
    return this.activeAccountId;
  }

  /**
   * 获取账号配置
   */
  getAccount(id: string): AccountConfig | null {
    return this.accounts.get(id) || null;
  }

  /**
   * 获取所有账号
   */
  getAllAccounts(): AccountInfo[] {
    const accounts: AccountInfo[] = [];
    
    for (const [id, config] of this.accounts.entries()) {
      const tokenCacheKey = `wechat_access_token_${config.appId}`;
      const cachedToken = cache.get<{ token: string; expiresAt: number }>(tokenCacheKey);
      
      accounts.push({
        ...config,
        isActive: id === this.activeAccountId,
        lastUsed: this.getLastUsedTime(id),
        tokenStatus: this.getTokenStatus(cachedToken),
        tokenExpiresAt: cachedToken ? new Date(cachedToken.expiresAt) : undefined
      });
    }

    return accounts;
  }

  /**
   * 获取微信API实例
   */
  getWeChatApi(accountId?: string): WeChatApi {
    const id = accountId || this.activeAccountId;
    if (!id) {
      throw new ConfigError('没有可用的账号');
    }

    const config = this.accounts.get(id);
    if (!config) {
      throw new ConfigError(`账号不存在: ${id}`);
    }

    // 复用API实例
    if (!this.apiInstances.has(id)) {
      const api = new WeChatApi(
        config.appId,
        config.appSecret,
        config.debug || false,
        config.useStableToken || false
      );
      this.apiInstances.set(id, api);
    }

    // 更新最后使用时间
    this.updateLastUsedTime(id);

    return this.apiInstances.get(id)!;
  }

  /**
   * 清空指定账号的token缓存
   */
  clearAccountCache(accountId: string): void {
    const config = this.accounts.get(accountId);
    if (!config) {
      throw new ConfigError(`账号不存在: ${accountId}`);
    }

    const tokenCacheKey = `wechat_access_token_${config.appId}`;
    cache.delete(tokenCacheKey);
    
    // 清理API实例
    const api = this.apiInstances.get(accountId);
    if (api) {
      api.clearAccessTokenCache();
    }

    logger.info(`已清空账号 ${accountId} 的token缓存`);
  }

  /**
   * 清空所有账号的token缓存
   */
  clearAllCache(): void {
    for (const [id] of this.accounts) {
      this.clearAccountCache(id);
    }
    logger.info('已清空所有账号的token缓存');
  }

  /**
   * 验证账号配置
   */
  async validateAccount(accountId: string): Promise<boolean> {
    try {
      const api = this.getWeChatApi(accountId);
      await api.getAccessToken();
      return true;
    } catch (error) {
      logger.error(`账号验证失败: ${accountId}`, error as Error);
      return false;
    }
  }

  /**
   * 批量验证所有账号
   */
  async validateAllAccounts(): Promise<{ [accountId: string]: boolean }> {
    const results: { [accountId: string]: boolean } = {};
    
    for (const [id] of this.accounts) {
      results[id] = await this.validateAccount(id);
    }

    return results;
  }

  /**
   * 获取账号统计信息
   */
  getStats(): {
    totalAccounts: number;
    activeAccount: string | null;
    validTokens: number;
    expiredTokens: number;
  } {
    const accounts = this.getAllAccounts();
    
    return {
      totalAccounts: accounts.length,
      activeAccount: this.activeAccountId,
      validTokens: accounts.filter(a => a.tokenStatus === 'valid').length,
      expiredTokens: accounts.filter(a => a.tokenStatus === 'expired').length
    };
  }

  /**
   * 导出账号配置（不包含敏感信息）
   */
  exportConfig(): { [accountId: string]: Omit<AccountConfig, 'appSecret'> } {
    const config: { [accountId: string]: Omit<AccountConfig, 'appSecret'> } = {};
    
    for (const [id, account] of this.accounts) {
      config[id] = {
        appId: account.appId,
        name: account.name,
        description: account.description,
        useStableToken: account.useStableToken,
        debug: account.debug
      };
    }

    return config;
  }

  /**
   * 获取token状态
   */
  private getTokenStatus(cachedToken: { token: string; expiresAt: number } | null): 'valid' | 'expired' | 'unknown' {
    if (!cachedToken) {
      return 'unknown';
    }
    
    return cachedToken.expiresAt > Date.now() ? 'valid' : 'expired';
  }

  /**
   * 获取最后使用时间
   */
  private getLastUsedTime(accountId: string): Date | undefined {
    const lastUsedKey = `account_last_used_${accountId}`;
    const timestamp = cache.get<number>(lastUsedKey);
    return timestamp ? new Date(timestamp) : undefined;
  }

  /**
   * 更新最后使用时间
   */
  private updateLastUsedTime(accountId: string): void {
    const lastUsedKey = `account_last_used_${accountId}`;
    cache.set(lastUsedKey, Date.now(), 7 * 24 * 60 * 60 * 1000); // 保存7天
  }
}

// 全局账号管理器实例
export const accountManager = new AccountManager();