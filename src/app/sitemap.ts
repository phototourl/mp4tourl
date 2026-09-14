import { getLocalePathname } from '@/i18n/navigation';
import { routing } from '@/i18n/routing';
import { generateHreflangUrls } from '@/lib/hreflang';
import type { MetadataRoute } from 'next';
import type { Locale } from 'next-intl';
import { getBaseUrl } from '../lib/urls/urls';

type Href = Parameters<typeof getLocalePathname>[0]['href'];

/** Public marketing + legal pages only (no auth / dashboard / docs / blog) */
const staticRoutes = [
  '/',
  '/about',
  '/contact',
  '/privacy',
  '/terms',
  '/cookie',
];

/**
 * Generate a sitemap for the website with hreflang support
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  return staticRoutes.flatMap((route) => {
    return routing.locales.map((locale) => ({
      url: getUrl(route, locale),
      alternates: {
        languages: generateHreflangUrls(route),
      },
    }));
  });
}

function getUrl(href: Href, locale: Locale) {
  const pathname = getLocalePathname({ locale, href });
  return getBaseUrl() + pathname;
}
