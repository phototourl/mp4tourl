import { getLocalePathname } from '@/i18n/navigation';
import { routing } from '@/i18n/routing';
import { generateHreflangUrls } from '@/lib/hreflang';
import type { Locale } from 'next-intl';
import { NextResponse } from 'next/server';
import { getBaseUrl } from '@/lib/urls/urls';

type Href = Parameters<typeof getLocalePathname>[0]['href'];

/**
 * Pretty-printed XML sitemap for humans + Google.
 *
 * Why not app/sitemap.ts alone: Next MetadataRoute emits minified XML; Chrome
 * then shows a wall of loc/lastmod text and looks "broken". This route keeps
 * the same Google-valid structure with indentation and application/xml.
 *
 * Specs:
 * - https://developers.google.com/search/docs/crawling-indexing/sitemaps/build-sitemap
 * - https://developers.google.com/search/docs/specialty/international/localized-versions
 */
const staticRoutes: ReadonlyArray<{
  path: Href;
  lastModified: string;
}> = [
  { path: '/', lastModified: '2026-09-15' },
  { path: '/about', lastModified: '2026-09-01' },
  { path: '/contact', lastModified: '2026-09-01' },
  { path: '/privacy', lastModified: '2026-09-01' },
  { path: '/terms', lastModified: '2026-09-01' },
  { path: '/cookie', lastModified: '2026-09-01' },
];

function escapeXml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function getUrl(href: Href, locale: Locale): string {
  return getBaseUrl() + getLocalePathname({ locale, href });
}

function buildUrlEntry(
  loc: string,
  lastModified: string,
  languages: Record<string, string>
): string {
  const links = Object.entries(languages)
    .map(
      ([hreflang, href]) =>
        `    <xhtml:link rel="alternate" hreflang="${escapeXml(hreflang)}" href="${escapeXml(href)}" />`
    )
    .join('\n');

  return [
    '  <url>',
    `    <loc>${escapeXml(loc)}</loc>`,
    `    <lastmod>${escapeXml(lastModified)}</lastmod>`,
    links,
    '  </url>',
  ].join('\n');
}

export async function GET() {
  const entries = staticRoutes.flatMap(({ path, lastModified }) => {
    const languages = generateHreflangUrls(path);
    const lastmod = `${lastModified}T00:00:00.000Z`;

    return routing.locales.map((locale) =>
      buildUrlEntry(getUrl(path, locale), lastmod, languages)
    );
  });

  const xml = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset',
    '  xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"',
    '  xmlns:xhtml="http://www.w3.org/1999/xhtml"',
    '>',
    ...entries,
    '</urlset>',
    '',
  ].join('\n');

  return new NextResponse(xml, {
    status: 200,
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=3600, s-maxage=3600',
    },
  });
}
