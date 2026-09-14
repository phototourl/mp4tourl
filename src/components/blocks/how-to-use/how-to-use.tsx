'use client';

import {
  AmbientBlobs,
  ScrollReveal,
  Stagger,
  StaggerItem,
} from '@/components/motion/scroll-reveal';
import { HeaderSection } from '@/components/layout/header-section';
import { useTranslations } from 'next-intl';

/**
 * How to use — three short steps with staggered scroll reveal.
 */
export default function HowToUseSection() {
  const t = useTranslations('HomePage.howToUse');
  const steps = ['step-1', 'step-2', 'step-3'] as const;

  return (
    <section
      id="how-to-use"
      className="relative scroll-mt-28 overflow-hidden bg-muted/40 px-4 py-20 md:py-24"
    >
      <AmbientBlobs />
      <div className="mx-auto max-w-5xl space-y-12 lg:space-y-16">
        <ScrollReveal>
          <HeaderSection
            title={t('title')}
            titleAs="h2"
            subtitle={t('subtitle')}
            subtitleAs="p"
          />
        </ScrollReveal>

        <Stagger
          className="grid gap-8 sm:grid-cols-3"
          stagger={0.12}
        >
          {steps.map((key, index) => (
            <StaggerItem
              key={key}
              className="rounded-2xl border bg-background p-6 shadow-sm md:p-8"
            >
              <span className="inline-flex size-8 items-center justify-center rounded-full bg-foreground text-sm font-semibold text-background">
                {index + 1}
              </span>
              <h3 className="mt-5 text-lg font-semibold">
                {t(`items.${key}.title`)}
              </h3>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground md:text-base">
                {t(`items.${key}.description`)}
              </p>
            </StaggerItem>
          ))}
        </Stagger>
      </div>
    </section>
  );
}
