import { getTranslations } from 'next-intl/server';

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

/**
 * Server HTML mirror of on-page FAQ / How-to (sr-only).
 * Same copy as visible sections — helps Machine Readability / Citability
 * without changing layout or styling.
 */
export async function HomeCitabilitySsr({ locale }: { locale: string }) {
  const tFaq = await getTranslations({ locale, namespace: 'HomePage.faqs' });
  const tHow = await getTranslations({ locale, namespace: 'HomePage.howToUse' });
  const tHero = await getTranslations({ locale, namespace: 'HomePage.hero' });

  return (
    <aside className="sr-only" aria-label={tFaq('title')}>
      <p>{tHero('description')}</p>
      <p>{tHero('tagline')}</p>
      <time dateTime="2026-09-15">2026-09-15</time>

      <h2>{tHow('title')}</h2>
      <ol>
        {HOW_TO_STEPS.map((id) => (
          <li key={id}>
            <strong>{tHow(`items.${id}.title`)}</strong>
            {': '}
            {tHow(`items.${id}.description`)}
          </li>
        ))}
      </ol>

      <h2>{tFaq('title')}</h2>
      <dl>
        {FAQ_IDS.map((id) => (
          <div key={id}>
            <dt>{tFaq(`items.${id}.question`)}</dt>
            <dd>{tFaq(`items.${id}.answer`)}</dd>
          </div>
        ))}
      </dl>
    </aside>
  );
}
