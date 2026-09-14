'use client';

import {
  AmbientBlobs,
  ParallaxFrame,
  ScrollReveal,
  Stagger,
  StaggerItem,
} from '@/components/motion/scroll-reveal';
import { HeaderSection } from '@/components/layout/header-section';
import { Link2, Upload, Zap } from 'lucide-react';
import { useTranslations } from 'next-intl';
import Image from 'next/image';

/**
 * Homepage product banner — copy left, image right, with scroll motion.
 */
export default function ProductBannerSection() {
  const t = useTranslations('HomePage.productBanner');
  const points = [
    { icon: Upload, key: 'point1' as const },
    { icon: Zap, key: 'point2' as const },
    { icon: Link2, key: 'point3' as const },
  ];

  return (
    <section
      id="product-banner"
      className="relative overflow-hidden px-4 py-20 md:py-24"
    >
      <AmbientBlobs />
      <div className="mx-auto max-w-6xl space-y-12 lg:space-y-16">
        <ScrollReveal>
          <HeaderSection
            title={t('title')}
            subtitle={t('subtitle')}
            subtitleAs="h2"
            description={t('description')}
            descriptionAs="p"
          />
        </ScrollReveal>

        <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
          <Stagger className="divide-y border-y">
            {points.map(({ icon: Icon, key }) => (
              <StaggerItem
                key={key}
                className="flex items-center gap-3 py-4"
              >
                <Icon className="size-5 shrink-0 text-primary" />
                <span>{t(key)}</span>
              </StaggerItem>
            ))}
          </Stagger>

          <ScrollReveal delay={0.1} y={36}>
            <ParallaxFrame className="rounded-xl border bg-muted/20 shadow-sm">
              <Image
                src="/banner/mp4tourl-og-new-style-1200x630.jpg"
                alt={t('imageAltNew')}
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
