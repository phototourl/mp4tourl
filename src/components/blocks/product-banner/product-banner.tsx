'use client';

import { HeaderSection } from '@/components/layout/header-section';
import { Link2, Upload, Zap } from 'lucide-react';
import { useTranslations } from 'next-intl';
import Image from 'next/image';

/**
 * Homepage product banner — same layout as editstamp electronic-seal:
 * copy left, one image right, direct public path.
 */
export default function ProductBannerSection() {
  const t = useTranslations('HomePage.productBanner');

  return (
    <section id="product-banner" className="px-4 py-16">
      <div className="mx-auto max-w-6xl space-y-8 lg:space-y-16">
        <HeaderSection
          title={t('title')}
          subtitle={t('subtitle')}
          subtitleAs="h2"
          description={t('description')}
          descriptionAs="p"
        />

        <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
          <div>
            <ul className="divide-y border-y">
              <li className="flex items-center gap-3 py-3">
                <Upload className="size-5 shrink-0 text-primary" />
                <span>{t('point1')}</span>
              </li>
              <li className="flex items-center gap-3 py-3">
                <Zap className="size-5 shrink-0 text-primary" />
                <span>{t('point2')}</span>
              </li>
              <li className="flex items-center gap-3 py-3">
                <Link2 className="size-5 shrink-0 text-primary" />
                <span>{t('point3')}</span>
              </li>
            </ul>
          </div>

          <div className="overflow-hidden rounded-xl border bg-muted/20 shadow-sm">
            <Image
              src="/banner/mp4tourl-og-new-style-1200x630.jpg"
              alt={t('imageAltNew')}
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
