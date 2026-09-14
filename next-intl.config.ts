// 支持语言（顺序与 editstamp 语言选择器一致）
export const locales = [
  "en",
  "en-GB",
  "en-AU",
  "en-CA",
  "fr-CA",
  "rm",
  "de-CH",
  "fr-CH",
  "de",
  "fr",
  "ar",
  "he",
  "ko",
  "jp",
  "es",
  "it",
  "nl",
  "sv",
  "da",
  "no",
  "fi",
  "pt",
  "pl",
  "cs",
  "tr",
  "ru",
  "uk",
  "zh",
  "zh-TW",
  "hi",
  "id",
  "ms",
  "th",
  "vi",
  "tl",
  "ca",
  "el",
  "bg",
  "hr",
  "hu",
  "ro",
  "sk",
] as const;

export const defaultLocale = "en" as const;

// 默认语言不加前缀：/ 直接是英文；其他语言用 /zh /fr ...
export const localePrefix = "as-needed" as const;

export default {
  locales,
  defaultLocale,
  localePrefix,
};
