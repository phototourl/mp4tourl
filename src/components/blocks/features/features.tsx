'use client';

import {
  AmbientBlobs,
  ParallaxFrame,
  ScrollReveal,
  Stagger,
  StaggerItem,
} from '@/components/motion/scroll-reveal';
import { HeaderSection } from '@/components/layout/header-section';
import { Link2, Shield, Zap } from 'lucide-react';
import { useTranslations } from 'next-intl';
import Image from 'next/image';

const ICONS = [Zap, Shield, Link2] as const;

/**
 * Features — editstamp electronic-seal layout: copy left, one banner right.
 */
export default function FeaturesSection() {
  const t = useTranslations('HomePage.features');
  const tBanner = useTranslations('HomePage.productBanner');
  const items = ['item-1', 'item-2', 'item-3'] as const;

  return (
    <section
      id="features"
      className="relative scroll-mt-28 overflow-hidden px-4 py-20 md:py-24"
    >
      <AmbientBlobs />
      <div className="mx-auto max-w-6xl space-y-12 lg:space-y-16">
        <ScrollReveal>
          <HeaderSection
            title={t('title')}
            titleAs="h2"
            subtitle={t('subtitle')}
            subtitleAs="p"
          />
        </ScrollReveal>

        <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
          <Stagger className="flex flex-col gap-10">
            {items.map((key, index) => {
              const Icon = ICONS[index];
              return (
                <StaggerItem key={key} className="flex gap-4">
                  <div className="mt-0.5 flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <Icon className="size-5" />
                  </div>
                  <div className="min-w-0 space-y-2">
                    <h3 className="text-lg font-semibold">
                      {t(`items.${key}.title`)}
                    </h3>
                    <p className="text-sm leading-relaxed text-muted-foreground md:text-base">
                      {t(`items.${key}.description`)}
                    </p>
                  </div>
                </StaggerItem>
              );
            })}
          </Stagger>

          <ScrollReveal delay={0.12} y={36}>
            <ParallaxFrame className="rounded-xl border bg-muted/20 shadow-sm">
              <Image
                src="/banner/mp4tourl-og-style-collage-1200x630.jpg"
                alt={tBanner('imageAlt')}
                width={1200}
                height={630}
                className="aspect-[1200/630] h-auto w-full scale-110 object-cover object-center"
              />
            </ParallaxFrame>
          </ScrollReveal>
        </div>
      </div>
    </section>
  );
}
