'use client';

import {
  ScrollReveal,
  Stagger,
  StaggerItem,
} from '@/components/motion/scroll-reveal';
import { HeaderSection } from '@/components/layout/header-section';
import {
  SectionShell,
  sectionBodyClass,
  sectionH3Class,
  sectionStackClass,
} from '@/components/layout/section-shell';
import { useTranslations } from 'next-intl';

/**
 * How to use — three equal cards under a centered header.
 */
export default function HowToUseSection() {
  const t = useTranslations('HomePage.howToUse');
  const steps = ['step-1', 'step-2', 'step-3'] as const;

  return (
    <SectionShell id="how-to-use">
      <div className={sectionStackClass}>
        <ScrollReveal>
          <HeaderSection
            title={t('title')}
            titleAs="p"
            subtitle={t('subtitle')}
            subtitleAs="h2"
          />
        </ScrollReveal>

        <Stagger
          className="grid list-none gap-6 p-0 sm:grid-cols-3 sm:gap-8"
          stagger={0.12}
          as="ol"
        >
          {steps.map((key, index) => (
            <StaggerItem
              key={key}
              as="li"
              className="rounded-2xl border border-border/80 bg-card p-6 shadow-sm md:p-8"
            >
              <span className="inline-flex size-8 items-center justify-center rounded-full bg-foreground text-sm font-semibold text-background">
                {index + 1}
              </span>
              <h3 className={`mt-5 ${sectionH3Class}`}>
                {t(`items.${key}.title`)}
              </h3>
              <p className={`mt-3 ${sectionBodyClass}`}>
                {t(`items.${key}.description`)}
              </p>
            </StaggerItem>
          ))}
        </Stagger>
      </div>
    </SectionShell>
  );
}
