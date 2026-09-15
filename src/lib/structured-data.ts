import { websiteConfig } from '@/config/website';
import { routing } from '@/i18n/routing';
import { getBaseUrl, getUrlWithLocale } from '@/lib/urls/urls';

const baseUrl = getBaseUrl();
const ORGANIZATION_ID = `${baseUrl}/#organization`;
const WEBSITE_ID = `${baseUrl}/#website`;

function localeHomeUrl(locale: string): string {
  return getUrlWithLocale('/', locale);
}

function sameAsLinks(): string[] {
  const social = websiteConfig.metadata.social;
  if (!social) return [];
  return [
    social.twitter,
    social.blueSky,
    social.discord,
    social.linkedin,
    social.youtube,
  ].filter((url): url is string => Boolean(url && url.trim()));
}

function metadataImage(path: string | undefined, fallback: string): string {
  return `${baseUrl}${path || fallback}`;
}

/**
 * Organization — site-wide entity for E-E-A-T / GEO
 */
export function generateOrganizationSchema() {
  const images = websiteConfig.metadata.images;
  const logo = metadataImage(images?.logoLight, '/logo.png');
  const image = metadataImage(images?.ogImage, '/og.jpg');
  const sameAs = sameAsLinks();

  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    '@id': ORGANIZATION_ID,
    name: 'MP4toURL',
    alternateName: 'mp4tourl',
    url: baseUrl,
    logo: {
      '@type': 'ImageObject',
      url: logo,
    },
    image,
    description:
      'Free video to URL converter — upload MP4, MOV, AVI, WebM, MKV and get permanent shareable links.',
    email: 'support@mp4tourl.com',
    ...(sameAs.length > 0 ? { sameAs } : {}),
    contactPoint: {
      '@type': 'ContactPoint',
      contactType: 'customer support',
      email: 'support@mp4tourl.com',
      url: `${baseUrl}/contact`,
      availableLanguage: [...routing.locales],
    },
  };
}

/**
 * WebSite — homepage entity
 */
export function generateWebSiteSchema(locale: string = 'en') {
  const url = localeHomeUrl(locale);
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    '@id': WEBSITE_ID,
    name: 'MP4toURL',
    url,
    inLanguage: locale,
    publisher: { '@id': ORGANIZATION_ID },
    about: { '@id': ORGANIZATION_ID },
  };
}

/**
 * FAQPage Schema
 */
export function generateFAQSchema(
  faqItems: Array<{ question: string; answer: string }>,
  locale: string = 'en'
) {
  const url = localeHomeUrl(locale);
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    '@id': `${url}#faq`,
    mainEntity: faqItems.map((item) => ({
      '@type': 'Question',
      name: item.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: item.answer,
      },
    })),
  };
}

/**
 * HowTo Schema
 */
export function generateHowToSchema(
  name: string,
  description: string,
  steps: Array<{ name: string; text: string }>,
  locale: string = 'en'
) {
  const url = localeHomeUrl(locale);
  return {
    '@context': 'https://schema.org',
    '@type': 'HowTo',
    '@id': `${url}#howto`,
    name,
    description,
    image: metadataImage(websiteConfig.metadata.images?.ogImage, '/og.jpg'),
    step: steps.map((step, index) => ({
      '@type': 'HowToStep',
      position: index + 1,
      name: step.name,
      text: step.text,
    })),
  };
}

/**
 * WebApplication Schema
 */
export function generateWebApplicationSchema(
  name: string,
  description: string,
  featureList: string[] = [],
  locale: string = 'en',
  dates?: { datePublished?: string; dateModified?: string }
) {
  const url = localeHomeUrl(locale);
  return {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    '@id': `${url}#webapp`,
    name,
    description,
    url,
    applicationCategory: 'MultimediaApplication',
    operatingSystem: 'Any',
    browserRequirements: 'Requires JavaScript. Requires HTML5.',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD',
      availability: 'https://schema.org/InStock',
    },
    ...(featureList.length > 0 ? { featureList } : {}),
    screenshot: metadataImage(websiteConfig.metadata.images?.ogImage, '/og.jpg'),
    datePublished: dates?.datePublished ?? '2026-01-01',
    dateModified: dates?.dateModified ?? '2026-09-15',
    author: { '@id': ORGANIZATION_ID },
    publisher: { '@id': ORGANIZATION_ID },
    provider: { '@id': ORGANIZATION_ID },
    isPartOf: { '@id': WEBSITE_ID },
  };
}

/**
 * WebPage — citability / speakable entity aligned with visible homepage copy
 */
export function generateWebPageSchema(
  name: string,
  description: string,
  locale: string = 'en',
  dates?: { datePublished?: string; dateModified?: string }
) {
  const url = localeHomeUrl(locale);
  return {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    '@id': `${url}#webpage`,
    name,
    description,
    url,
    inLanguage: locale,
    isPartOf: { '@id': WEBSITE_ID },
    about: { '@id': ORGANIZATION_ID },
    primaryImageOfPage: {
      '@type': 'ImageObject',
      url: metadataImage(websiteConfig.metadata.images?.ogImage, '/og.jpg'),
    },
    datePublished: dates?.datePublished ?? '2026-01-01',
    dateModified: dates?.dateModified ?? '2026-09-15',
    speakable: {
      '@type': 'SpeakableSpecification',
      cssSelector: ['#hero h1', '#faqs', '#how-to-use'],
    },
    mainEntity: { '@id': `${url}#webapp` },
    significantLink: [
      `${url}#upload`,
      `${url}#features`,
      `${url}#how-to-use`,
      `${url}#faqs`,
      `${baseUrl}/llms.txt`,
    ],
  };
}

/**
 * ItemList — feature bullets already shown on the page
 */
export function generateFeatureListSchema(
  name: string,
  items: Array<{ name: string; description: string }>,
  locale: string = 'en'
) {
  const url = localeHomeUrl(locale);
  return {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    '@id': `${url}#features-list`,
    name,
    numberOfItems: items.length,
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      description: item.description,
      url: `${url}#features`,
    })),
  };
}
