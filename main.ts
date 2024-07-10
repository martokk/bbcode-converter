import { Plugin, Editor, MarkdownView, Notice, addIcon, Platform } from 'obsidian';

export default class BBCodeConverterPlugin extends Plugin {
  async onload() {
    // Add the icon for the mobile toolbar
    addIcon('bbcode', '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10 3H6a2 2 0 0 0-2 2v14c0 1.1.9 2 2 2h4M14 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4M9 12h6"/></svg>');

    // Add command for converting to BBCode
    this.addCommand({
      id: 'convert-to-bbcode',
      name: 'Convert to BBCode',
      icon: 'bbcode',
      editorCallback: (editor: Editor) => this.convertToBBCode(editor),
      hotkeys: [{ modifiers: ["Mod", "Shift"], key: "b" }]
    });

    // Add to editor menu (right-click menu)
    this.registerEvent(
      this.app.workspace.on('editor-menu', (menu, editor: Editor) => {
        menu.addItem((item) => {
          item
            .setTitle('Convert to BBCode')
            .setIcon('bbcode')
            .onClick(() => this.convertToBBCode(editor));
        });
      })
    );

    // Add to mobile toolbar
    if (Platform.isMobile) {
      this.addRibbonIcon('bbcode', 'Convert to BBCode', (evt: MouseEvent) => {
        const view = this.app.workspace.getActiveViewOfType(MarkdownView);
        if (view) {
          this.convertToBBCode(view.editor);
        }
      });
    }
  }

  convertToBBCode(editor: Editor) {
    const selection = editor.getSelection();
    if (selection) {
      const bbcode = this.textToBBCode(selection);
      navigator.clipboard.writeText(bbcode).then(() => {
        new Notice('Converted text copied to clipboard');
      });
    } else {
      new Notice('No text selected');
    }
  }

  textToBBCode(text: string): string {
    let inList = false;
    let listContent = '';

    const processedText = text
      // Headers
      .replace(/^(#{1,6})\s+(.*?)$/gm, (_, hashes, content) => {
        return `[h${hashes.length}]${content}[/h${hashes.length}]`;
      })
      // Bold
      .replace(/\*\*(.*?)\*\*/g, '[b]$1[/b]')
      // Italic
      .replace(/\*(.*?)\*/g, '[i]$1[/i]')
      // Strikethrough
      .replace(/~~(.*?)~~/g, '[s]$1[/s]')
      // Links
      .replace(/\[(.*?)\]\((.*?)\)/g, '[url=$2]$1[/url]')
      // Horizontal rules
      .replace(/^---$/gm, '[hr]');

    const lines = processedText.split('\n');
    const result = lines.map((line, index) => {
      if (line.match(/^\s*[-*+]\s/)) {
        if (!inList) {
          inList = true;
          listContent = '';
        }
        listContent += '[*]' + line.replace(/^\s*[-*+]\s/, '') + '\n';

        // If this is the last line or the next line is not a list item
        if (index === lines.length - 1 || !lines[index + 1].match(/^\s*[-*+]\s/)) {
          const fullList = `[list]\n${listContent}[/list]`;
          inList = false;
          listContent = '';
          return fullList;
        }
        return '';
      } else {
        if (inList) {
          const fullList = `[list]\n${listContent}[/list]`;
          inList = false;
          listContent = '';
          return fullList + '\n' + line;
        }
        return line;
      }
    });

    return result.filter(line => line !== '').join('\n');
  }
}