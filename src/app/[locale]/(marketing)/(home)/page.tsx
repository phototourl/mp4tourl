import CallToActionSection from '@/components/blocks/calltoaction/calltoaction';
import FaqSection from '@/components/blocks/faqs/faqs';
import FeaturesSection from '@/components/blocks/features/features';
import HeroSection from '@/components/blocks/hero/hero';
import HowToUseSection from '@/components/blocks/how-to-use/how-to-use';
import ProductBannerSection from '@/components/blocks/product-banner/product-banner';
import { constructMetadata } from '@/lib/metadata';
import type { Metadata } from 'next';
import type { Locale } from 'next-intl';
import { getTranslations } from 'next-intl/server';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}): Promise<Metadata | undefined> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'Metadata' });

  return constructMetadata({
    title: t('title'),
    description: t('description'),
    locale,
    pathname: '/',
  });
}

interface HomePageProps {
  params: Promise<{ locale: Locale }>;
}

/**
 * Landing page modeled after VideoToURL:
 * Upload → Features → Product banner → How to Use → FAQ → CTA
 * https://www.videotourl.com/
 */
export default async function HomePage(_props: HomePageProps) {
  return (
    <div className="flex flex-col">
      <HeroSection />
      <FeaturesSection />
      <ProductBannerSection />
      <HowToUseSection />
      <FaqSection />
      <CallToActionSection />
    </div>
  );
}
