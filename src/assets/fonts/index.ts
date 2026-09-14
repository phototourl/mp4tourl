import type { CSSProperties } from 'react';

/**
 * Offline-safe fonts — no Google Fonts download at compile time.
 * Local networks often fail fonts.googleapis.com with ECONNRESET.
 */

export const fontSansFamily =
  'ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, "Noto Sans", "PingFang SC", "Microsoft YaHei", sans-serif';

export const fontSerifFamily =
  'ui-serif, Georgia, Cambria, "Times New Roman", Times, serif';

export const fontMonoFamily =
  'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace';

/** Display / headline stack (was Bricolage Grotesque via Google Fonts) */
export const fontDisplayFamily = fontSansFamily;

/** CSS custom properties applied on <body> */
export const fontCssVariables = {
  '--font-noto-sans': fontSansFamily,
  '--font-noto-serif': fontSerifFamily,
  '--font-noto-sans-mono': fontMonoFamily,
  '--font-bricolage-grotesque': fontDisplayFamily,
} as CSSProperties;

/** Kept for call sites that expect next/font-like shape */
export const fontNotoSans = {
  className: '',
  variable: '',
  style: { fontFamily: fontSansFamily },
};

export const fontNotoSerif = {
  className: '',
  variable: '',
  style: { fontFamily: fontSerifFamily },
};

export const fontNotoSansMono = {
  className: '',
  variable: '',
  style: { fontFamily: fontMonoFamily },
};

export const fontBricolageGrotesque = {
  className: '',
  variable: '',
  style: { fontFamily: fontDisplayFamily },
};
