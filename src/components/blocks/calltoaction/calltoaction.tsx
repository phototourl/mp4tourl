'use client';

import { ScrollReveal } from '@/components/motion/scroll-reveal';
import { SectionShell } from '@/components/layout/section-shell';
import { useTranslations } from 'next-intl';

export default function CallToActionSection() {
  const t = useTranslations('HomePage.calltoaction');

  return (
    <SectionShell id="call-to-action" tone="muted" className="md:py-28">
      <ScrollReveal className="mx-auto max-w-3xl text-center">
        <h2 className="text-balance text-3xl font-semibold tracking-tight md:text-4xl lg:text-5xl">
          {t('title')}
        </h2>
        <p className="mx-auto mt-5 max-w-2xl text-base text-muted-foreground md:mt-6 md:text-lg">
          {t('description')}
        </p>
      </ScrollReveal>
    </SectionShell>
  );
}
