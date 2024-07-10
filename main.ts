import { Plugin, Editor, Menu, Notice } from 'obsidian';

export default class BBCodeConverterPlugin extends Plugin {
  async onload() {
    this.registerEvent(
      this.app.workspace.on('editor-menu', (menu: Menu, editor: Editor) => {
        menu.addItem((item) => {
          item
            .setTitle('Convert to BBCode')
            .setIcon('clipboard-copy')
            .onClick(() => this.convertToBBCode(editor));
        });
      })
    );
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