/**
 * 主题系统入口文件
 */

// 导出类型定义
export type { ThemeConfig, ThemeManager, StyleConfig, StyleGenerator } from './types';

// 导出工具函数
export { generateStyle, mergeStyles, createStyledElement, validateThemeConfig } from './utils';

// 导出主题管理器
export { themeManager, ThemeManagerImpl } from './manager';

// 导出渲染器
export { ThemeRenderer, createThemeRenderer } from './renderer';

// 导出预设主题
export { defaultTheme } from './presets/default';
export { elegantTheme } from './presets/elegant';
export { modernTheme } from './presets/modern';
export { warmTheme } from './presets/warm';
export { cuteTheme } from './presets/cute';

// 导出主题集合
export { allThemes, getThemeByName } from './presets';

// 便捷函数
export function getAvailableThemes(): string[] {
  const { themeManager } = require('./manager');
  return themeManager.getThemeNames();
}

export function getThemeInfo(name: string) {
  const { themeManager } = require('./manager');
  return themeManager.getThemeInfo(name);
}

export function listAllThemes() {
  const { themeManager } = require('./manager');
  return themeManager.listThemes();
}