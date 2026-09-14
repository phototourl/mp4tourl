'use client';

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
    <section id="features" className="scroll-mt-24 px-4 py-16">
      <div className="mx-auto max-w-6xl space-y-8 lg:space-y-16">
        <HeaderSection
          title={t('title')}
          titleAs="h2"
          subtitle={t('subtitle')}
          subtitleAs="p"
        />

        <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
          <div className="flex flex-col gap-6">
            {items.map((key, index) => {
              const Icon = ICONS[index];
              return (
                <div key={key} className="flex gap-3">
                  <div className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <Icon className="size-4" />
                  </div>
                  <div>
                    <h3 className="text-base font-semibold">
                      {t(`items.${key}.title`)}
                    </h3>
                    <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                      {t(`items.${key}.description`)}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="overflow-hidden rounded-xl border bg-muted/20 shadow-sm">
              <Image
                src="/banner/mp4tourl-og-style-collage-1200x630.jpg"
                alt={tBanner('imageAlt')}
                width={1200}
                height={630}
                className="aspect-[1200/630] h-auto w-full object-cover object-center"
              />
          </div>
        </div>
      </div>
    </section>
  );
}
