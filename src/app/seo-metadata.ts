import type { Metadata } from "next";
import nextIntlConfig from "../../next-intl.config";

export const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL || "https://www.mp4tourl.com";

const normalizedSiteUrl = siteUrl.replace(/\/+$/, "");

function buildLanguageAlternates() {
  const isAsNeeded = nextIntlConfig.localePrefix === "as-needed";
  const defaultLocale = nextIntlConfig.defaultLocale;
  const entries = nextIntlConfig.locales.map((locale) => {
    const href =
      isAsNeeded && locale === defaultLocale
        ? `${normalizedSiteUrl}/`
        : `${normalizedSiteUrl}/${locale}`;
    return [locale, href] as const;
  });
  return Object.fromEntries(entries) as Record<string, string>;
}

const languageAlternates = buildLanguageAlternates();

export const baseMetadata: Metadata = {
  // 默认英文元数据；不同语言的标题/描述由 getLocaleMetadata 接收翻译结果覆盖
  title: "Free MP4 to URL Converter - Upload Video and Get Shareable Links | MP4toURL",
  description:
    "Convert MP4, MOV, AVI, WebM, MKV to permanent shareable URLs in seconds. Free online video hosting up to 100MB — no registration required. Fast CDN delivery.",
  alternates: {
    canonical: `${normalizedSiteUrl}/`,
    languages: languageAlternates,
  },
  openGraph: {
    title: "Free MP4 to URL Converter - Upload Video and Get Shareable Links | MP4toURL",
    description:
      "Convert MP4, MOV, AVI, WebM, MKV to permanent shareable URLs in seconds. Free online video hosting up to 100MB — no registration required. Fast CDN delivery.",
    url: `${normalizedSiteUrl}/`,
    siteName: "MP4 to URL",
    images: [
      {
        url: `${normalizedSiteUrl}/og-image.png`,
        width: 1200,
        height: 630,
        alt: "MP4 to URL Converter",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Free MP4 to URL Converter - Upload Video and Get Shareable Links | MP4toURL",
    description:
      "Convert MP4, MOV, AVI, WebM, MKV to permanent shareable URLs in seconds. Free online video hosting up to 100MB — no registration required. Fast CDN delivery.",
    images: [
      {
        url: `${normalizedSiteUrl}/og-image.png`,
        alt: "MP4 to URL Converter",
      },
    ],
  },
  icons: {
    icon: [
      { url: "/favicon.png", sizes: "96x96", type: "image/png" },
    ],
    shortcut: "/favicon.png",
    apple: "/apple-touch-icon.png",
  },
  other: {
    // Bing 站长验证
    "msvalidate.01": "9A675F33BD29DA6327CB3696B1CA322D",
    // 百度站长验证
    "baidu-site-verification": "codeva-ACSbhvu687",
    // Naver Search Advisor
    "naver-site-verification": "42bedb5db9f6ec284127d96f7e6a321e7fe2c2aa",
  },
};

// 根据当前语言返回对应 canonical / OG url + 本地化标题/描述/关键词 的元数据
export function getLocaleMetadata(
  locale: string,
  title: string,
  description: string,
  keywords?: string[]
): Metadata {
  const alternates = baseMetadata.alternates || {};
  const languages =
    (alternates.languages as Record<string, string> | undefined) ?? {};

  const canonical =
    languages[locale] || (alternates.canonical as string) || `${siteUrl}/`;

  // 构建 metadata 对象，明确处理 keywords
  const metadata: Metadata = {
    ...baseMetadata,
    title,
    description,
    alternates: {
      ...alternates,
      canonical,
      languages,
    },
    openGraph: {
      ...(baseMetadata.openGraph || {}),
      title,
      description,
      url: canonical,
    },
    twitter: {
      ...(baseMetadata.twitter || {}),
      title,
      description,
    },
  };

  // 明确设置 keywords：确保覆盖 layout 的 keywords
  // 如果提供了 keywords 数组，则使用（即使是空数组也会覆盖 layout 的 keywords）
  // 如果 keywords 是 undefined，则不设置（保留 layout 的 keywords）
  // 如果 keywords 是空数组，明确设置为空数组以覆盖 layout 的 keywords
  if (keywords !== undefined) {
    metadata.keywords = keywords.length > 0 ? keywords : [];
  }

  return metadata;
}

