import { websiteConfig } from '@/config/website';
import { defaultMessages } from '@/i18n/messages';
import { routing } from '@/i18n/routing';
import type { Metadata } from 'next';
import type { Locale } from 'next-intl';
import { generateAlternates, getCurrentHreflang } from './hreflang';
import { getBaseUrl, getImageUrl, getUrlWithLocale } from './urls/urls';

/**
 * Favicon / PWA / Apple icons from public/icons (designed assets).
 * Sized for browser tabs + Google Search (prefer multiples of 48px).
 * https://developers.google.com/search/docs/appearance/favicon-in-search
 */
export const siteIcons: NonNullable<Metadata['icons']> = {
  icon: [
    { url: '/favicon-16x16.png', sizes: '20x20', type: 'image/png' },
    { url: '/favicon-32x32.png', sizes: '29x29', type: 'image/png' },
    { url: '/favicon-48x48.png', sizes: '40x40', type: 'image/png' },
    { url: '/favicon.png', sizes: '96x96', type: 'image/png' },
    { url: '/logo.png', sizes: '192x192', type: 'image/png' },
    { url: '/android-chrome-512x512.png', sizes: '1024x1024', type: 'image/png' },
  ],
  shortcut: '/favicon-32x32.png',
  apple: [
    { url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    { url: '/apple-touch-icon-152x152.png', sizes: '152x152', type: 'image/png' },
    { url: '/apple-touch-icon-120x120.png', sizes: '120x120', type: 'image/png' },
  ],
  other: [
    {
      rel: 'mask-icon',
      url: '/logo.png',
    },
  ],
};

/**
 * Construct the metadata object for the current page (in docs/guides)
 */
export function constructMetadata({
  title,
  description,
  image,
  noIndex = false,
  locale,
  pathname,
}: {
  title?: string;
  description?: string;
  image?: string;
  noIndex?: boolean;
  locale?: Locale;
  pathname?: string;
} = {}): Metadata {
  title = title || defaultMessages.Metadata.title;
  description = description || defaultMessages.Metadata.description;
  image = image || websiteConfig.metadata.images?.ogImage;
  const ogImageUrl = getImageUrl(image || '');

  const canonicalUrl =
    pathname && locale ? getUrlWithLocale(pathname, locale) : undefined;

  const alternates =
    pathname && routing.locales.length > 1
      ? {
          canonical: canonicalUrl,
          ...generateAlternates(pathname),
        }
      : canonicalUrl
        ? { canonical: canonicalUrl }
        : undefined;

  return {
    title,
    description,
    alternates,
    openGraph: {
      type: 'website',
      locale: locale ? getCurrentHreflang(locale).replace('-', '_') : 'en_US',
      url: canonicalUrl,
      title,
      description,
      siteName: defaultMessages.Metadata.name,
      images: [ogImageUrl.toString()],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [ogImageUrl.toString()],
      site: getBaseUrl(),
    },
    icons: siteIcons,
    metadataBase: new URL(getBaseUrl()),
    manifest: `${getBaseUrl()}/manifest.webmanifest`,
    verification: {
      google: '_2UktIRrgg-jVqg1rHYkWclaQA9FM6l6oLEqc4ODsic',
    },
    ...(noIndex && {
      robots: {
        index: false,
        follow: false,
      },
    }),
  };
}
