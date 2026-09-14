/** EditStamp uses the same locale codes; default `en` has no URL prefix (as-needed). */
const EDITSTAMP_ORIGIN = "https://editstamp.com";
const EDITSTAMP_DEFAULT_LOCALE = "en";

export function getEditStampUrl(locale: string): string {
  if (!locale || locale === EDITSTAMP_DEFAULT_LOCALE) {
    return `${EDITSTAMP_ORIGIN}/`;
  }
  return `${EDITSTAMP_ORIGIN}/${locale}`;
}
