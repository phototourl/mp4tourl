export type ShareCodeKind =
  | 'shareLink'
  | 'json'
  | 'markdown'
  | 'markdownLink'
  | 'html'
  | 'htmlLink'
  | 'bbcode'
  | 'bbcodeLink';

export type ShareCodeItem = {
  kind: ShareCodeKind;
  value: string;
};

/**
 * Build copy-ready share / embed snippets for a video URL.
 */
export function buildShareCodes(
  url: string,
  labels: { video: string; watch: string }
): ShareCodeItem[] {
  const safe = url.trim();
  const video = labels.video;
  const watch = labels.watch;

  return [
    { kind: 'shareLink', value: safe },
    {
      kind: 'json',
      // Structured payload for APIs, CMS fields, scripts, Zapier/n8n, etc.
      value: JSON.stringify(
        {
          url: safe,
          title: video,
          label: watch,
          type: 'video',
        },
        null,
        2
      ),
    },
    { kind: 'markdown', value: `[${video}](${safe})` },
    { kind: 'markdownLink', value: `[${watch}](${safe})` },
    {
      kind: 'html',
      value: `<video src="${safe}" controls preload="metadata"></video>`,
    },
    {
      kind: 'htmlLink',
      value: `<a href="${safe}" target="_blank" rel="noopener noreferrer">${watch}</a>`,
    },
    { kind: 'bbcode', value: `[url]${safe}[/url]` },
    { kind: 'bbcodeLink', value: `[url=${safe}]${watch}[/url]` },
  ];
}

/**
 * Snippet extensions by kind:
 * JSON → .json, Markdown → .md, HTML → .html, else .txt
 */
export function shareCodeFileExt(kind: ShareCodeKind): string {
  if (kind === 'json') return 'json';
  if (kind === 'markdown' || kind === 'markdownLink') return 'md';
  if (kind === 'html' || kind === 'htmlLink') return 'html';
  return 'txt';
}

export function shareCodeMime(kind: ShareCodeKind): string {
  const ext = shareCodeFileExt(kind);
  if (ext === 'json') return 'application/json;charset=utf-8';
  if (ext === 'md') return 'text/markdown;charset=utf-8';
  if (ext === 'html') return 'text/html;charset=utf-8';
  return 'text/plain;charset=utf-8';
}

/** One portable .txt with every format — no ZIP dependency. */
export function buildShareCodesBundleText(
  items: ShareCodeItem[],
  titles: Record<ShareCodeKind, string>
): string {
  return items
    .map((item) => {
      const title = titles[item.kind] || item.kind;
      return `=== ${title} ===\n${item.value}`;
    })
    .join('\n\n');
}

/** Trigger a browser download for a text snippet. */
export function downloadTextFile(
  filename: string,
  content: string,
  mime = 'text/plain;charset=utf-8'
): void {
  const blob = new Blob([content], { type: mime });
  const objectUrl = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = objectUrl;
  a.download = filename;
  a.rel = 'noopener';
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.setTimeout(() => URL.revokeObjectURL(objectUrl), 1500);
}
