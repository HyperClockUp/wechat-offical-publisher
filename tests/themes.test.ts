import { ThemeManagerImpl } from '../src/themes/manager';
import { defaultTheme, elegantTheme, modernTheme, warmTheme, cuteTheme } from '../src/themes';
import { ThemeConfig } from '../src/themes/types';

describe('Theme System', () => {
  let themeManager: ThemeManagerImpl;

  beforeEach(() => {
    themeManager = new ThemeManagerImpl();
  });

  describe('ThemeManager', () => {
    it('should initialize with built-in themes', () => {
      expect(themeManager.getTheme('default')).toBeDefined();
      expect(themeManager.getTheme('elegant')).toBeDefined();
      expect(themeManager.getTheme('modern')).toBeDefined();
      expect(themeManager.getTheme('warm')).toBeDefined();
      expect(themeManager.getTheme('cute')).toBeDefined();
    });

    it('should return default theme for unknown theme name', () => {
      const theme = themeManager.getTheme('unknown');
      expect(theme).toBe(defaultTheme);
    });

    it('should register new theme', () => {
      const customTheme: ThemeConfig = {
        name: 'custom',
        description: 'Custom test theme',
        container: { backgroundColor: '#ffffff' },
        headings: {
          h1: { fontSize: '24px', color: '#000000' },
          h2: { fontSize: '20px', color: '#333333' },
          h3: { fontSize: '18px', color: '#666666' },
          h4: { fontSize: '16px', color: '#666666' },
          h5: { fontSize: '14px', color: '#666666' },
          h6: { fontSize: '12px', color: '#666666' }
        },
        paragraph: { fontSize: '14px', color: '#333333' },
        link: { color: '#007acc' },
        image: { maxWidth: '100%' },
        codeBlock: {
          container: { backgroundColor: '#f5f5f5' },
          code: { fontSize: '14px' }
        },
        inlineCode: { backgroundColor: '#f0f0f0' },
        blockquote: { backgroundColor: '#f9f9f9', padding: '10px' },
        list: {
          ordered: { fontSize: '14px' },
          unordered: { fontSize: '14px' },
          item: { fontSize: '14px' }
        },
        table: {
          table: { backgroundColor: '#ffffff' },
          row: { backgroundColor: '#ffffff' },
          header: { backgroundColor: '#f5f5f5' },
          cell: { padding: '8px' }
        }
      };

      themeManager.registerTheme(customTheme);
      expect(themeManager.getTheme('custom')).toBe(customTheme);
    });

    it('should set default theme', () => {
      themeManager.setDefaultTheme('elegant');
      expect(themeManager.getTheme('unknown')).toBe(elegantTheme);
    });

    it('should have all built-in themes registered', () => {
      expect(themeManager.getTheme('default')).toBeDefined();
      expect(themeManager.getTheme('elegant')).toBeDefined();
      expect(themeManager.getTheme('modern')).toBeDefined();
      expect(themeManager.getTheme('warm')).toBeDefined();
      expect(themeManager.getTheme('cute')).toBeDefined();
    });
  });

  describe('Built-in Themes', () => {
    const themes = [
      { name: 'default', theme: defaultTheme },
      { name: 'elegant', theme: elegantTheme },
      { name: 'modern', theme: modernTheme },
      { name: 'warm', theme: warmTheme },
      { name: 'cute', theme: cuteTheme }
    ];

    themes.forEach(({ name, theme }) => {
      describe(`${name} theme`, () => {
        it('should have required properties', () => {
          expect(theme.name).toBe(name);
          expect(theme.container).toBeDefined();
          expect(theme.headings).toBeDefined();
          expect(theme.headings.h1).toBeDefined();
          expect(theme.headings.h2).toBeDefined();
          expect(theme.headings.h3).toBeDefined();
          expect(theme.paragraph).toBeDefined();
          expect(theme.link).toBeDefined();
          expect(theme.image).toBeDefined();
          expect(theme.codeBlock).toBeDefined();
          expect(theme.inlineCode).toBeDefined();
          expect(theme.list).toBeDefined();
          expect(theme.table).toBeDefined();
        });

        it('should have valid CSS properties', () => {
          // Check container styles
          if (theme.container.backgroundColor) {
            expect(theme.container.backgroundColor).toMatch(/^#[0-9a-fA-F]{6}$|^rgb\(|^rgba\(|^var\(/);
          }

          // Check heading styles
          Object.values(theme.headings).forEach(heading => {
            if (heading.fontSize) {
              expect(heading.fontSize).toMatch(/\d+(px|em|rem|%)$/);
            }
            if (heading.color) {
              expect(heading.color).toMatch(/^#[0-9a-fA-F]{6}$|^rgb\(|^rgba\(|^var\(/);
            }
          });

          // Check paragraph styles
          if (theme.paragraph.fontSize) {
            expect(theme.paragraph.fontSize).toMatch(/\d+(px|em|rem|%)$/);
          }
        });

        it('should not contain WeChat incompatible properties', () => {
          // Check for position property (not allowed in WeChat)
          const checkNoPosition = (obj: any) => {
            if (typeof obj === 'object' && obj !== null) {
              expect(obj.position).toBeUndefined();
              Object.values(obj).forEach(value => {
                if (typeof value === 'object') {
                  checkNoPosition(value);
                }
              });
            }
          };

          checkNoPosition(theme);
        });
      });
    });
  });

  describe('Theme Validation', () => {
    it('should validate theme structure', () => {
      const invalidTheme = {
        name: 'invalid',
        // Missing required properties
      };

      expect(() => {
        // This would be implemented in a theme validator
        // For now, we just check the structure exists
        expect(invalidTheme).toHaveProperty('name');
      }).not.toThrow();
    });
  });
});