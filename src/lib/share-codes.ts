export type ShareCodeKind =
  | 'shareLink'
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
