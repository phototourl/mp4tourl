'use client';

import {
  ScrollReveal,
  Stagger,
  StaggerItem,
} from '@/components/motion/scroll-reveal';
import { HeaderSection } from '@/components/layout/header-section';
import { SectionShell } from '@/components/layout/section-shell';
import { Link2, Upload, Zap } from 'lucide-react';
import { useTranslations } from 'next-intl';
import Image from 'next/image';

/**
 * Product banner — left copy + image; header left-aligned with points.
 * No ParallaxFrame: scroll translate left empty gaps / cropped edges on OG art.
 */
export default function ProductBannerSection() {
  const t = useTranslations('HomePage.productBanner');
  const points = [
    { icon: Upload, key: 'point1' as const },
    { icon: Zap, key: 'point2' as const },
    { icon: Link2, key: 'point3' as const },
  ];

  return (
    <SectionShell id="product-banner" tone="muted">
      <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
        <div className="min-w-0 space-y-8">
          <ScrollReveal>
            <HeaderSection
              align="start"
              title={t('title')}
              titleAs="p"
              subtitle={t('subtitle')}
              subtitleAs="h2"
              description={t('description')}
              descriptionAs="p"
            />
          </ScrollReveal>

          <Stagger className="divide-y border-y border-border/70">
            {points.map(({ icon: Icon, key }) => (
              <StaggerItem
                key={key}
                className="flex items-center gap-3 py-4 text-base leading-snug text-foreground"
              >
                <Icon className="size-5 shrink-0 text-primary" />
                <span>{t(key)}</span>
              </StaggerItem>
            ))}
          </Stagger>
        </div>

        <ScrollReveal delay={0.1} y={36}>
          <div className="overflow-hidden rounded-xl">
            <Image
              src="/banner/mp4tourl-product-og-domain-1200x630.jpg"
              alt={t('imageAltNew')}
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
