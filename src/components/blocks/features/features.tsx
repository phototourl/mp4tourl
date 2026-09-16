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
} from '@/components/layout/section-shell';
import { Link2, Shield, Zap } from 'lucide-react';
import { useTranslations } from 'next-intl';
import Image from 'next/image';

const ICONS = [Zap, Shield, Link2] as const;

/**
 * Features — left copy + banner; header left-aligned with the list.
 * No ParallaxFrame: keeps full OG art visible without scroll-edge gaps.
 */
export default function FeaturesSection() {
  const t = useTranslations('HomePage.features');
  const tBanner = useTranslations('HomePage.productBanner');
  const items = ['item-1', 'item-2', 'item-3'] as const;

  return (
    <SectionShell id="features">
      <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
        <div className="min-w-0 space-y-10">
          <ScrollReveal>
            <HeaderSection
              align="start"
              title={t('title')}
              titleAs="p"
              subtitle={t('subtitle')}
              subtitleAs="h2"
            />
          </ScrollReveal>

          <Stagger className="flex flex-col gap-8">
            {items.map((key, index) => {
              const Icon = ICONS[index];
              return (
                <StaggerItem key={key} className="flex gap-4">
                  <div className="mt-0.5 flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <Icon className="size-5" />
                  </div>
                  <div className="min-w-0 space-y-2">
                    <h3 className={sectionH3Class}>{t(`items.${key}.title`)}</h3>
                    <p className={sectionBodyClass}>
                      {t(`items.${key}.description`)}
                    </p>
                  </div>
                </StaggerItem>
              );
            })}
          </Stagger>
        </div>

        <ScrollReveal delay={0.12} y={36}>
          <div className="overflow-hidden rounded-xl">
            <Image
              src="/banner/mp4tourl-og-style-collage-1200x630.jpg"
              alt={tBanner('imageAlt')}
              width={1200}
              height={630}
              className="block h-auto w-full"
            />
          </div>
        </ScrollReveal>
      </div>
    </SectionShell>
  );
}
