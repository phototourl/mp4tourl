import type { MetadataRoute } from 'next';
import { getBaseUrl } from '../lib/urls/urls';

/**
 * GEO / AI crawler access:
 * Explicitly allow search + assistant fetchers so AITDK "AI Assistant Fetchers"
 * and related checks pass. Training bots are also allowed for citation discovery.
 *
 * NOTE: Cloudflare "Managed robots.txt" / AI Crawl Control can still prepend
 * Disallow for GPTBot/ClaudeBot/etc. Turn that OFF in CF dashboard or these
 * Allow rules will be overridden at the edge.
 */
const AI_CRAWLERS = [
  // AI search / overview
  'OAI-SearchBot',
  'Google-Extended',
  'Applebot-Extended',
  'Bingbot',
  'Googlebot',
  // AI assistant fetchers (ChatGPT, Claude, Perplexity, etc.)
  'ChatGPT-User',
  'GPTBot',
  'ClaudeBot',
  'Claude-User',
  'anthropic-ai',
  'PerplexityBot',
  'Amazonbot',
  'Bytespider',
  'CCBot',
  'meta-externalagent',
] as const;

export default function robots(): MetadataRoute.Robots {
  const base = getBaseUrl();

  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/api/', '/_next/', '/settings/', '/dashboard/'],
      },
      ...AI_CRAWLERS.map((userAgent) => ({
        userAgent,
        allow: '/',
        disallow: ['/api/', '/_next/', '/settings/', '/dashboard/'],
      })),
    ],
    sitemap: `${base}/sitemap.xml`,
    host: base.replace(/^https?:\/\//, ''),
  };
}
