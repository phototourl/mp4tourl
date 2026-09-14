// Simplified website config - types inlined
export const websiteConfig = {
  ui: {
    mode: {
      defaultMode: 'light',
      enableSwitch: false,
    },
    theme: {
      defaultTheme: 'default',
      enableSwitch: false,
    },
  },
  metadata: {
    name: 'MP4 to URL',
    images: {
      logoLight: '/icons/light_logo.png',
      logoDark: '/icons/light_logo.png',
    },
  },
  features: {
    enableUpgradeCard: false,
    enableUpdateAvatar: false,
    enableCrispChat: false,
    enableTurnstileCaptcha: false,
  },
  routes: {
    defaultLoginRedirect: '/',
  },
  analytics: {
    enableVercelAnalytics: false,
    enableSpeedInsights: false,
  },
  auth: {
    enableGoogleLogin: true,
    enableCredentialLogin: true,
  },
  i18n: {
    defaultLocale: 'en',
    locales: {
      en: { flag: '🇺🇸', name: 'English' },
      'en-GB': { flag: '🇬🇧', name: 'English (UK)' },
      'en-AU': { flag: '🇦🇺', name: 'English (Australia)' },
      'en-CA': { flag: '🇨🇦', name: 'English (Canada)' },
      'fr-CA': { flag: '🇨🇦', name: 'Français (Canada)' },
      rm: { flag: '🇨🇭', name: 'Rumantsch' },
      'de-CH': { flag: '🇨🇭', name: 'Deutsch (Schweiz)' },
      'fr-CH': { flag: '🇨🇭', name: 'Français (Suisse)' },
      zh: { flag: '🇨🇳', name: '中文' },
      'zh-TW': { flag: '🇹🇼', name: '繁體中文' },
      es: { flag: '🇪🇸', name: 'Español' },
      fr: { flag: '🇫🇷', name: 'Français' },
      pt: { flag: '🇧🇷', name: 'Português' },
      de: { flag: '🇩🇪', name: 'Deutsch' },
      ar: { flag: '🇸🇦', name: 'العربية' },
      he: { flag: '🇮🇱', name: 'עברית' },
      ko: { flag: '🇰🇷', name: '한국어' },
      jp: { flag: '🇯🇵', name: '日本語' },
      it: { flag: '🇮🇹', name: 'Italiano' },
      ru: { flag: '🇷🇺', name: 'Русский' },
      cs: { flag: '🇨🇿', name: 'Čeština' },
      uk: { flag: '🇺🇦', name: 'Українська' },
      hu: { flag: '🇭🇺', name: 'Magyar' },
      ro: { flag: '🇷🇴', name: 'Română' },
      fi: { flag: '🇫🇮', name: 'Suomi' },
      da: { flag: '🇩🇰', name: 'Dansk' },
      ms: { flag: '🇲🇾', name: 'Bahasa Melayu' },
      hi: { flag: '🇮🇳', name: 'हिन्दी' },
      th: { flag: '🇹🇭', name: 'ไทย' },
      id: { flag: '🇮🇩', name: 'Bahasa Indonesia' },
      vi: { flag: '🇻🇳', name: 'Tiếng Việt' },
      tr: { flag: '🇹🇷', name: 'Türkçe' },
      sv: { flag: '🇸🇪', name: 'Svenska' },
      pl: { flag: '🇵🇱', name: 'Polski' },
      nl: { flag: '🇳🇱', name: 'Nederlands' },
      bg: { flag: '🇧🇬', name: 'Български' },
      ca: { flag: '🏴', name: 'Català' },
      el: { flag: '🇬🇷', name: 'Ελληνικά' },
      hr: { flag: '🇭🇷', name: 'Hrvatski' },
      no: { flag: '🇳🇴', name: 'Norsk' },
      sk: { flag: '🇸🇰', name: 'Slovenčina' },
      tl: { flag: '🇵🇭', name: 'Filipino' },
    },
  },
  mail: {
    provider: 'resend' as const,
    /** 发件人；本地/线上都用 RESEND_FROM_EMAIL，需在 Resend 验证域名 */
    fromEmail:
      process.env.RESEND_FROM_EMAIL ??
      'MP4toURL <support@mp4tourl.com>',
    supportEmail: 'support@mp4tourl.com',
  },
  blog: {
    enable: false,
    paginationSize: 12,
    relatedPostsSize: 6,
  },
  payment: {
    provider: 'waffo',
  },
  newsletter: {
    enable: false,
    provider: 'resend',
  },
  storage: {
    enable: false,
    provider: 's3',
  },
  price: {
    plans: {
      free: {
        id: 'free',
        prices: [],
        isFree: true,
        isLifetime: false,
      },
      pro: {
        id: 'pro',
        prices: [
          {
            type: 'subscription',
            priceId:
              process.env.NEXT_PUBLIC_WAFFO_PRICE_ID_PRO_MONTHLY ||
              process.env.WAFFO_PRICE_ID_PRO_MONTHLY ||
              '',
            amount: 990,
            currency: 'USD',
            interval: 'month',
          },
          // One-time monthly (WeChat Pay). Shown as dual CTA on zh / zh-TW only.
          {
            type: 'one_time',
            priceId:
              process.env.NEXT_PUBLIC_WAFFO_PRICE_ID_PRO_MONTHLY_ONETIME ||
              process.env.WAFFO_PRICE_ID_PRO_MONTHLY_ONETIME ||
              '',
            amount: 990,
            currency: 'USD',
            interval: 'month',
          },
        ],
        isFree: false,
        isLifetime: false,
        popular: true,
      },
      proYearly: {
        id: 'proYearly',
        prices: [
          {
            type: 'subscription',
            priceId:
              process.env.NEXT_PUBLIC_WAFFO_PRICE_ID_PRO_YEARLY ||
              process.env.WAFFO_PRICE_ID_PRO_YEARLY ||
              '',
            amount: 7900,
            currency: 'USD',
            interval: 'year',
          },
          {
            // One-time annual (WeChat Pay). Shown as dual CTA on zh / zh-TW only.
            type: 'one_time',
            priceId:
              process.env.NEXT_PUBLIC_WAFFO_PRICE_ID_PRO_YEARLY_ONETIME ||
              process.env.WAFFO_PRICE_ID_PRO_YEARLY_ONETIME ||
              '',
            amount: 7900,
            currency: 'USD',
            interval: 'year',
          },
        ],
        isFree: false,
        isLifetime: false,
      },
    },
  },
  credits: {
    enableCredits: false,
    enablePackagesForFreePlan: false,
    registerGiftCredits: { enable: false, amount: 0 },
    packages: {},
  },
};
