import { marked, Renderer } from 'marked';
import { ThemeConfig } from './types';
import { generateStyle, createStyledElement } from './utils';

/**
 * 基于主题的Markdown渲染器
 */
export class ThemeRenderer {
  private theme: ThemeConfig;
  private renderer: Renderer;

  constructor(theme: ThemeConfig) {
    this.theme = theme;
    this.renderer = new Renderer();
    this.setupRenderer();
  }

  /**
   * 设置渲染器
   */
  private setupRenderer(): void {
    // 标题渲染
    this.renderer.heading = (text: string, level: number) => {
      const headingKey = `h${level}` as keyof typeof this.theme.headings;
      const styles = this.theme.headings[headingKey];
      return createStyledElement(`h${level}`, text, styles);
    };

    // 段落渲染
    this.renderer.paragraph = (text: string) => {
      return createStyledElement('p', text, this.theme.paragraph);
    };

    // 链接渲染
    this.renderer.link = (href: string, title: string | null, text: string) => {
      const attributes: Record<string, string> = {
        href,
        target: '_blank',
        rel: 'noopener'
      };
      if (title) {
        attributes.title = title;
      }
      return createStyledElement('a', text, this.theme.link, attributes);
    };

    // 图片渲染
    this.renderer.image = (href: string, title: string | null, text: string) => {
      const attributes: Record<string, string> = {
        src: href,
        alt: text || ''
      };
      if (title) {
        attributes.title = title;
      }
      return createStyledElement('img', '', this.theme.image, attributes);
    };

    // 代码块渲染
    this.renderer.code = (code: string, language?: string) => {
      const codeElement = createStyledElement('code', code, this.theme.codeBlock.code);
      const attributes: Record<string, string> = {};
      if (language) {
        attributes['data-language'] = language;
      }
      return createStyledElement('pre', codeElement, this.theme.codeBlock.container, attributes);
    };

    // 行内代码渲染
    this.renderer.codespan = (code: string) => {
      return createStyledElement('code', code, this.theme.inlineCode);
    };

    // 引用渲染
    this.renderer.blockquote = (quote: string) => {
      return createStyledElement('blockquote', quote, this.theme.blockquote);
    };

    // 列表渲染
    this.renderer.list = (body: string, ordered: boolean) => {
      const tag = ordered ? 'ol' : 'ul';
      const styles = ordered ? this.theme.list.ordered : this.theme.list.unordered;
      return createStyledElement(tag, body, styles);
    };

    this.renderer.listitem = (text: string) => {
      return createStyledElement('li', text, this.theme.list.item);
    };

    // 表格渲染
    this.renderer.table = (header: string, body: string) => {
      const thead = `<thead>${header}</thead>`;
      const tbody = `<tbody>${body}</tbody>`;
      return createStyledElement('table', thead + tbody, this.theme.table.table);
    };

    this.renderer.tablerow = (content: string) => {
      return createStyledElement('tr', content, this.theme.table.row);
    };

    this.renderer.tablecell = (content: string, flags: { header: boolean; align: string | null }) => {
      const tag = flags.header ? 'th' : 'td';
      const styles = flags.header ? this.theme.table.header : this.theme.table.cell;
      const attributes: Record<string, string> = {};
      
      if (flags.align) {
        attributes.style = `text-align: ${flags.align}`;
      }
      
      return createStyledElement(tag, content, styles, attributes);
    };

    // 水平线渲染
    this.renderer.hr = () => {
      return '<hr style="border: none; border-top: 2px solid #e1e4e8; margin: 24px 0;" />';
    };

    // 强调渲染
    this.renderer.strong = (text: string) => {
      return `<strong style="font-weight: bold; color: inherit;">${text}</strong>`;
    };

    this.renderer.em = (text: string) => {
      return `<em style="font-style: italic; color: inherit;">${text}</em>`;
    };

    // 删除线渲染
    this.renderer.del = (text: string) => {
      return `<del style="text-decoration: line-through; color: #6a737d;">${text}</del>`;
    };
  }

  /**
   * 渲染Markdown内容
   */
  render(content: string): string {
    // 配置marked选项
    marked.setOptions({
      renderer: this.renderer,
      gfm: true,
      breaks: true
    });

    // 转换为HTML
    const htmlContent = marked(content) as string;
    
    // 包装在主题容器中
    return createStyledElement('div', htmlContent, this.theme.container);
  }

  /**
   * 获取当前主题
   */
  getTheme(): ThemeConfig {
    return this.theme;
  }

  /**
   * 更新主题
   */
  updateTheme(theme: ThemeConfig): void {
    this.theme = theme;
    this.setupRenderer();
  }
}

/**
 * 创建主题渲染器实例
 */
export function createThemeRenderer(theme: ThemeConfig): ThemeRenderer {
  return new ThemeRenderer(theme);
}