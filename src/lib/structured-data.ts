import { siteUrl } from "@/app/seo-metadata";
import { routing } from "@/i18n/routing";

const ORGANIZATION_ID = `${siteUrl}/#organization`;
const WEBSITE_ID = `${siteUrl}/#website`;

function localeHomeUrl(locale: string): string {
  return locale === routing.defaultLocale ? `${siteUrl}/` : `${siteUrl}/${locale}/`;
}

/**
 * Organization — site-wide entity for E-E-A-T / GEO
 */
export function generateOrganizationSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": ORGANIZATION_ID,
    name: "MP4 to URL",
    url: siteUrl,
    logo: {
      "@type": "ImageObject",
      url: `${siteUrl}/icons/light_58x58.png`,
      width: 58,
      height: 58,
    },
    image: `${siteUrl}/og-image.png`,
    description:
      "Free video hosting: convert MP4 and other videos into permanent shareable URLs for docs, demos, and social sharing.",
    email: "support@mp4tourl.com",
    sameAs: ["https://github.com/mp4tourl", "https://x.com/mp4tourl"],
    contactPoint: {
      "@type": "ContactPoint",
      contactType: "customer support",
      email: "support@mp4tourl.com",
      url: `${siteUrl}/contact`,
      availableLanguage: [...routing.locales],
    },
  };
}

/**
 * WebSite — homepage entity with SearchAction omitted (no on-site search index)
 */
export function generateWebSiteSchema(locale: string = "en") {
  const url = localeHomeUrl(locale);
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": WEBSITE_ID,
    name: "MP4 to URL",
    url,
    inLanguage: locale,
    publisher: { "@id": ORGANIZATION_ID },
    about: { "@id": ORGANIZATION_ID },
  };
}

/**
 * FAQ Schema（多语言支持）
 */
export function generateFAQSchema(
  faqItems: Array<{ question: string; answer: string }>,
  locale: string = "en"
) {
  const url = localeHomeUrl(locale);
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "@id": `${url}#faq`,
    mainEntity: faqItems.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.answer,
      },
    })),
  };
}

/**
 * HowTo Schema（多语言支持）
 */
export function generateHowToSchema(
  name: string,
  description: string,
  steps: Array<{ name: string; text: string; image?: string }>,
  locale: string = "en"
) {
  const url = localeHomeUrl(locale);

  return {
    "@context": "https://schema.org",
    "@type": "HowTo",
    "@id": `${url}#howto`,
    name,
    description,
    image: `${siteUrl}/og-image.png`,
    step: steps.map((step, index) => ({
      "@type": "HowToStep",
      position: index + 1,
      name: step.name,
      text: step.text,
      ...(step.image && { image: step.image }),
    })),
  };
}

/**
 * WebApplication Schema（工具站标识）
 */
export function generateSoftwareApplicationSchema(
  name: string,
  description: string,
  applicationCategory: string = "UtilitiesApplication",
  featureList: string[] = [],
  locale: string = "en"
) {
  const url = localeHomeUrl(locale);

  return {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    "@id": `${url}#webapp`,
    name,
    description,
    url,
    applicationCategory,
    operatingSystem: "Any",
    browserRequirements: "Requires JavaScript. Requires HTML5.",
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
      availability: "https://schema.org/InStock",
    },
    ...(featureList.length > 0 && { featureList }),
    screenshot: `${siteUrl}/og-image.png`,
    softwareVersion: "1.0",
    datePublished: "2024-01-01",
    dateModified: "2026-03-28",
    author: { "@id": ORGANIZATION_ID },
    publisher: { "@id": ORGANIZATION_ID },
    provider: { "@id": ORGANIZATION_ID },
    isPartOf: { "@id": WEBSITE_ID },
  };
}

/**
 * 生成所有结构化数据的组合（首页）
 */
export function generateStructuredData(
  locale: string,
  translations: {
    faq: Array<{ question: string; answer: string }>;
    howTo: {
      name: string;
      description: string;
      steps: Array<{ name: string; text: string; image?: string }>;
    };
    softwareApplication: {
      name: string;
      description: string;
      featureList: string[];
    };
  }
) {
  return [
    generateOrganizationSchema(),
    generateWebSiteSchema(locale),
    generateFAQSchema(translations.faq, locale),
    generateHowToSchema(
      translations.howTo.name,
      translations.howTo.description,
      translations.howTo.steps,
      locale
    ),
    generateSoftwareApplicationSchema(
      translations.softwareApplication.name,
      translations.softwareApplication.description,
      "UtilitiesApplication",
      translations.softwareApplication.featureList,
      locale
    ),
  ];
}
