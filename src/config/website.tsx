import { PaymentTypes, PlanIntervals } from '@/payment/types';
import type { WebsiteConfig } from '@/types';

/**
 * website config, without translations
 *
 * docs:
 * https://mksaas.com/docs/config/website
 */
export const websiteConfig: WebsiteConfig = {
  ui: {
    theme: {
      defaultTheme: 'default',
      enableSwitch: true,
    },
    mode: {
      defaultMode: 'light',
      enableSwitch: true,
    },
  },
  metadata: {
    images: {
      ogImage: '/og.jpg',
      logoLight: '/logo.png',
      logoDark: '/logo.png',
    },
    social: {
      github: 'https://github.com/phototourl/mp4tourl',
      twitter: 'https://x.com/mp4tourl',
      blueSky: '',
      discord: '',
      mastodon: '',
      linkedin: '',
      youtube: '',
    },
  },
  features: {
    enableUpgradeCard: true,
    enableUpdateAvatar: true,
    enableAffonsoAffiliate: false,
    enablePromotekitAffiliate: false,
    enableDatafastRevenueTrack: false,
    enableCrispChat: process.env.NEXT_PUBLIC_DEMO_WEBSITE === 'true',
    enableTurnstileCaptcha: process.env.NEXT_PUBLIC_DEMO_WEBSITE === 'true',
  },
  routes: {
    defaultLoginRedirect: '/dashboard',
  },
  analytics: {
    enableVercelAnalytics: false,
    enableSpeedInsights: false,
  },
  auth: {
    enableGoogleLogin: true,
    enableGithubLogin: false,
    enableCredentialLogin: true,
  },
  i18n: {
    defaultLocale: 'en',
    locales: {
      en: { flag: '🇺🇸', name: 'English', hreflang: 'en' },
      'en-GB': { flag: '🇬🇧', name: 'English (UK)', hreflang: 'en-GB' },
      'en-AU': { flag: '🇦🇺', name: 'English (Australia)', hreflang: 'en-AU' },
      'en-CA': { flag: '🇨🇦', name: 'English (Canada)', hreflang: 'en-CA' },
      'fr-CA': { flag: '🇨🇦', name: 'Français (Canada)', hreflang: 'fr-CA' },
      rm: { flag: '🇨🇭', name: 'Rumantsch', hreflang: 'rm' },
      'de-CH': { flag: '🇨🇭', name: 'Deutsch (Schweiz)', hreflang: 'de-CH' },
      'fr-CH': { flag: '🇨🇭', name: 'Français (Suisse)', hreflang: 'fr-CH' },
      zh: { flag: '🇨🇳', name: '中文', hreflang: 'zh-CN' },
      'zh-TW': { flag: '🇹🇼', name: '繁體中文', hreflang: 'zh-TW' },
      es: { flag: '🇪🇸', name: 'Español', hreflang: 'es' },
      fr: { flag: '🇫🇷', name: 'Français', hreflang: 'fr' },
      pt: { flag: '🇧🇷', name: 'Português', hreflang: 'pt-BR' },
      de: { flag: '🇩🇪', name: 'Deutsch', hreflang: 'de' },
      ar: { flag: '🇸🇦', name: 'العربية', hreflang: 'ar' },
      he: { flag: '🇮🇱', name: 'עברית', hreflang: 'he' },
      ko: { flag: '🇰🇷', name: '한국어', hreflang: 'ko' },
      jp: { flag: '🇯🇵', name: '日本語', hreflang: 'ja' },
      it: { flag: '🇮🇹', name: 'Italiano', hreflang: 'it' },
      ru: { flag: '🇷🇺', name: 'Русский', hreflang: 'ru' },
      cs: { flag: '🇨🇿', name: 'Čeština', hreflang: 'cs' },
      uk: { flag: '🇺🇦', name: 'Українська', hreflang: 'uk' },
      hu: { flag: '🇭🇺', name: 'Magyar', hreflang: 'hu' },
      ro: { flag: '🇷🇴', name: 'Română', hreflang: 'ro' },
      fi: { flag: '🇫🇮', name: 'Suomi', hreflang: 'fi' },
      da: { flag: '🇩🇰', name: 'Dansk', hreflang: 'da' },
      ms: { flag: '🇲🇾', name: 'Bahasa Melayu', hreflang: 'ms' },
      hi: { flag: '🇮🇳', name: 'हिन्दी', hreflang: 'hi' },
      th: { flag: '🇹🇭', name: 'ไทย', hreflang: 'th' },
      id: { flag: '🇮🇩', name: 'Bahasa Indonesia', hreflang: 'id' },
      vi: { flag: '🇻🇳', name: 'Tiếng Việt', hreflang: 'vi' },
      tr: { flag: '🇹🇷', name: 'Türkçe', hreflang: 'tr' },
      sv: { flag: '🇸🇪', name: 'Svenska', hreflang: 'sv' },
      pl: { flag: '🇵🇱', name: 'Polski', hreflang: 'pl' },
      nl: { flag: '🇳🇱', name: 'Nederlands', hreflang: 'nl' },
      bg: { flag: '🇧🇬', name: 'Български', hreflang: 'bg' },
      ca: { flag: '🏴', name: 'Català', hreflang: 'ca' },
      el: { flag: '🇬🇷', name: 'Ελληνικά', hreflang: 'el' },
      hr: { flag: '🇭🇷', name: 'Hrvatski', hreflang: 'hr' },
      no: { flag: '🇳🇴', name: 'Norsk', hreflang: 'no' },
      sk: { flag: '🇸🇰', name: 'Slovenčina', hreflang: 'sk' },
      tl: { flag: '🇵🇭', name: 'Filipino', hreflang: 'tl' },
    },
  },
  blog: {
    enable: false,
    paginationSize: 6,
    relatedPostsSize: 3,
  },
  docs: {
    enable: false,
  },
  mail: {
    provider: 'resend',
    fromEmail: 'MP4toURL <support@mp4tourl.com>',
    supportEmail: 'MP4toURL <support@mp4tourl.com>',
  },
  newsletter: {
    enable: false,
    provider: 'resend',
    autoSubscribeAfterSignUp: false,
  },
  storage: {
    enable: true,
    provider: 's3',
  },
  payment: {
    provider: 'stripe',
  },
  price: {
    plans: {
      free: {
        id: 'free',
        prices: [],
        isFree: true,
        isLifetime: false,
        credits: {
          enable: false,
          amount: 0,
          expireDays: 30,
        },
      },
      pro: {
        id: 'pro',
        prices: [
          {
            type: PaymentTypes.SUBSCRIPTION,
            priceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_PRO_MONTHLY!,
            amount: 990,
            currency: 'USD',
            interval: PlanIntervals.MONTH,
          },
          {
            type: PaymentTypes.SUBSCRIPTION,
            priceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_PRO_YEARLY!,
            amount: 9900,
            currency: 'USD',
            interval: PlanIntervals.YEAR,
          },
        ],
        isFree: false,
        isLifetime: false,
        popular: true,
        credits: {
          enable: false,
          amount: 0,
          expireDays: 30,
        },
      },
      lifetime: {
        id: 'lifetime',
        prices: [
          {
            type: PaymentTypes.ONE_TIME,
            priceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_LIFETIME!,
            amount: 19900,
            currency: 'USD',
            allowPromotionCode: true,
          },
        ],
        isFree: false,
        isLifetime: true,
        credits: {
          enable: false,
          amount: 0,
          expireDays: 30,
        },
      },
    },
  },
  credits: {
    enableCredits: false,
    enablePackagesForFreePlan: false,
    registerGiftCredits: {
      enable: false,
      amount: 0,
      expireDays: 30,
    },
    packages: {},
  },
};
