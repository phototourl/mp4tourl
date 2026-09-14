'use client';

import { HeaderSection } from '@/components/layout/header-section';
import { useTranslations } from 'next-intl';

/**
 * How to use — three short steps like VideoToURL.
 */
export default function HowToUseSection() {
  const t = useTranslations('HomePage.howToUse');
  const steps = ['step-1', 'step-2', 'step-3'] as const;

  return (
    <section id="how-to-use" className="scroll-mt-24 bg-muted/40 px-4 py-20">
      <div className="mx-auto max-w-5xl space-y-12">
        <HeaderSection
          title={t('title')}
          titleAs="h2"
          subtitle={t('subtitle')}
          subtitleAs="p"
        />

        <ol className="grid gap-6 sm:grid-cols-3">
          {steps.map((key, index) => (
            <li
              key={key}
              className="rounded-2xl border bg-background p-6 shadow-sm"
            >
              <span className="inline-flex size-8 items-center justify-center rounded-full bg-foreground text-sm font-semibold text-background">
                {index + 1}
              </span>
              <h3 className="mt-4 text-lg font-semibold">
                {t(`items.${key}.title`)}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                {t(`items.${key}.description`)}
              </p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
