/**
 * Locale display order — keep in sync with editstamp language-select-modal.
 */
export const LOCALE_DISPLAY_ORDER = [
  'en',
  'en-GB',
  'en-AU',
  'en-CA',
  'fr-CA',
  'rm',
  'de-CH',
  'fr-CH',
  'de',
  'fr',
  'ar',
  'he',
  'ko',
  'jp',
  'es',
  'it',
  'nl',
  'sv',
  'da',
  'no',
  'fi',
  'pt',
  'pl',
  'cs',
  'tr',
  'ru',
  'uk',
  'zh',
  'zh-TW',
  'hi',
  'id',
  'ms',
  'th',
  'vi',
  'tl',
  'ca',
  'el',
  'bg',
  'hr',
  'hu',
  'ro',
  'sk',
] as const;

export type DisplayLocale = (typeof LOCALE_DISPLAY_ORDER)[number];

export function sortLocalesByDisplayOrder<T>(
  entries: [string, T][]
): [string, T][] {
  return [...entries].sort(([codeA], [codeB]) => {
    const indexA = LOCALE_DISPLAY_ORDER.indexOf(codeA as DisplayLocale);
    const indexB = LOCALE_DISPLAY_ORDER.indexOf(codeB as DisplayLocale);
    const inOrderA = indexA !== -1;
    const inOrderB = indexB !== -1;
    if (inOrderA && inOrderB) return indexA - indexB;
    if (inOrderA && !inOrderB) return -1;
    if (!inOrderA && inOrderB) return 1;
    return codeA.localeCompare(codeB);
  });
}
