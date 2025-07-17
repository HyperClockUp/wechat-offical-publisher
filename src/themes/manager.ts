import { ThemeConfig, ThemeManager } from './types';
import { validateThemeConfig } from './utils';
import { logger } from '../utils/logger';
import { 
  defaultTheme, 
  elegantTheme, 
  modernTheme, 
  warmTheme,
  cuteTheme
} from './presets';

/**
 * 主题管理器实现
 */
class ThemeManagerImpl implements ThemeManager {
  private themes: Map<string, ThemeConfig> = new Map();
  private defaultThemeName: string = 'default';

  constructor() {
    // 注册所有内置主题
    this.registerTheme(defaultTheme);
    this.registerTheme(elegantTheme);
    this.registerTheme(modernTheme);
    this.registerTheme(warmTheme);
    this.registerTheme(cuteTheme);
  }

  /**
   * 获取指定主题
   */
  getTheme(name: string): ThemeConfig | undefined {
    const theme = this.themes.get(name);
    if (theme) {
      return theme;
    }
    // 如果找不到指定主题，返回默认主题
    return this.getDefaultTheme();
  }



  /**
   * 获取所有主题
   */
  getAllThemes(): ThemeConfig[] {
    return Array.from(this.themes.values());
  }

  /**
   * 获取所有主题名称
   */
  getThemeNames(): string[] {
    return Array.from(this.themes.keys());
  }

  /**
   * 注册新主题
   */
  registerTheme(theme: ThemeConfig): void {
    if (!validateThemeConfig(theme)) {
      throw new Error(`主题配置无效: ${theme.name}`);
    }

    if (this.themes.has(theme.name)) {
      // 主题已存在，将被覆盖（静默处理）
    }

    this.themes.set(theme.name, theme);
    // 主题注册成功（静默处理）
  }

  /**
   * 设置默认主题
   */
  setDefaultTheme(name: string): void {
    if (!this.themes.has(name)) {
      throw new Error(`主题 "${name}" 不存在`);
    }
    this.defaultThemeName = name;
  }

  /**
   * 获取默认主题
   */
  getDefaultTheme(): ThemeConfig {
    const theme = this.themes.get(this.defaultThemeName);
    if (!theme) {
      throw new Error(`默认主题 "${this.defaultThemeName}" 不存在`);
    }
    return theme;
  }

  /**
   * 移除主题
   */
  removeTheme(name: string): boolean {
    if (name === this.defaultThemeName) {
      throw new Error('不能删除默认主题');
    }
    return this.themes.delete(name);
  }

  /**
   * 检查主题是否存在
   */
  hasTheme(name: string): boolean {
    return this.themes.has(name);
  }

  /**
   * 获取主题信息
   */
  getThemeInfo(name: string): Partial<ThemeConfig> | undefined {
    const theme = this.themes.get(name);
    if (!theme) return undefined;

    return {
      name: theme.name,
      description: theme.description,
      author: theme.author,
      version: theme.version
    };
  }

  /**
   * 列出所有主题信息
   */
  listThemes(): ThemeConfig[] {
    return this.getAllThemes();
  }
}

// 导出单例实例
export const themeManager = new ThemeManagerImpl();

// 导出类型和工具函数
export { ThemeManagerImpl };
export type { ThemeConfig, ThemeManager };