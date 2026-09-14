export type EmbedCodeKind = 'url' | 'html' | 'bbcode' | 'markdown';
export type EmbedCodeTab = EmbedCodeKind;

export function defaultAltFromFileName(fileName: string, fallback = 'image'): string {
  return fileName.replace(/\.[^.]+$/, '').replace(/[-_]+/g, ' ').trim() || fallback;
}

export function buildEmbedCode(kind: EmbedCodeKind, url: string, alt: string): string {
  switch (kind) {
    case 'html':
      return `<img src="${url}" alt="${alt.replace(/"/g, '&quot;')}">`;
    case 'bbcode':
      return `[img]${url}[/img]`;
    case 'markdown':
      return `![${alt}](${url})`;
    default:
      return url;
  }
}
