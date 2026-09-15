import {
  generateFAQSchema,
  generateFeatureListSchema,
  generateHowToSchema,
  generateOrganizationSchema,
  generateWebApplicationSchema,
  generateWebPageSchema,
  generateWebSiteSchema,
} from '@/lib/structured-data';
import { getTranslations } from 'next-intl/server';

export type HomeStructuredDataPayload = {
  organization: Record<string, unknown>;
  website: Record<string, unknown>;
  webPage: Record<string, unknown>;
  faq: Record<string, unknown>;
  howTo: Record<string, unknown>;
  webApp: Record<string, unknown>;
  features: Record<string, unknown>;
};

const FAQ_IDS = [
  'item-1',
  'item-2',
  'item-3',
  'item-4',
  'item-5',
  'item-6',
  'item-7',
] as const;

const HOW_TO_STEPS = ['step-1', 'step-2', 'step-3'] as const;
const FEATURE_IDS = ['item-1', 'item-2', 'item-3'] as const;

const PAGE_DATES = {
  datePublished: '2026-01-01',
  dateModified: '2026-09-15',
} as const;

/**
 * Homepage JSON-LD (no UI): Organization, WebSite, WebPage, FAQ, HowTo,
 * WebApplication, Feature ItemList — copy matches on-page sections.
 */
export async function getHomeStructuredData(
  locale: string
): Promise<HomeStructuredDataPayload> {
  const tMeta = await getTranslations({ locale, namespace: 'Metadata' });
  const tFaq = await getTranslations({ locale, namespace: 'HomePage.faqs' });
  const tHow = await getTranslations({ locale, namespace: 'HomePage.howToUse' });
  const tFeatures = await getTranslations({
    locale,
    namespace: 'HomePage.features',
  });
  const tHero = await getTranslations({ locale, namespace: 'HomePage.hero' });

  const faqItems = FAQ_IDS.map((id) => ({
    question: tFaq(`items.${id}.question`),
    answer: tFaq(`items.${id}.answer`),
  }));

  const howToSteps = HOW_TO_STEPS.map((id) => ({
    name: tHow(`items.${id}.title`),
    text: tHow(`items.${id}.description`),
  }));

  const featureItems = FEATURE_IDS.map((id) => ({
    name: tFeatures(`items.${id}.title`),
    description: tFeatures(`items.${id}.description`),
  }));

  const pageDescription = `${tHero('description')} ${tHero('tagline')}`;

  return {
    organization: generateOrganizationSchema(),
    website: generateWebSiteSchema(locale),
    webPage: generateWebPageSchema(
      tMeta('title'),
      pageDescription,
      locale,
      PAGE_DATES
    ),
    faq: generateFAQSchema(faqItems, locale),
    howTo: generateHowToSchema(
      tHow('title'),
      tHow('subtitle'),
      howToSteps,
      locale
    ),
    webApp: generateWebApplicationSchema(
      tMeta('name'),
      tMeta('description'),
      featureItems.map((item) => item.name),
      locale,
      PAGE_DATES
    ),
    features: generateFeatureListSchema(
      tFeatures('title'),
      featureItems,
      locale
    ),
  };
}

export function HomeStructuredDataScripts({
  data,
}: {
  data: HomeStructuredDataPayload;
}) {
  const blocks = [
    data.organization,
    data.website,
    data.webPage,
    data.faq,
    data.howTo,
    data.webApp,
    data.features,
  ];

  return (
    <>
      {blocks.map((block, index) => (
        <script
          // Stable order; types differ per block
          key={index}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(block) }}
        />
      ))}
    </>
  );
}
