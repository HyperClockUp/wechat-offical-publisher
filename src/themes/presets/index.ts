// 主题导入
import { defaultTheme } from './default';
import { elegantTheme } from './elegant';
import { modernTheme } from './modern';
import { warmTheme } from './warm';
import { cuteTheme } from './cute';

// 主题导出
export { defaultTheme } from './default';
export { elegantTheme } from './elegant';
export { modernTheme } from './modern';
export { warmTheme } from './warm';
export { cuteTheme } from './cute';

// 主题集合
export const allThemes = {
  default: defaultTheme,
  elegant: elegantTheme,
  modern: modernTheme,
  warm: warmTheme,
  cute: cuteTheme
};

// 获取主题的便捷函数
export function getThemeByName(name: string) {
  return allThemes[name as keyof typeof allThemes];
}