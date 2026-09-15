import CallToActionSection from '@/components/blocks/calltoaction/calltoaction';
import BannerMarqueeSection from '@/components/blocks/banner-marquee/banner-marquee';
import FaqSection from '@/components/blocks/faqs/faqs';
import FeaturesSection from '@/components/blocks/features/features';
import HeroSection from '@/components/blocks/hero/hero';
import HowToUseSection from '@/components/blocks/how-to-use/how-to-use';
import ProductBannerSection from '@/components/blocks/product-banner/product-banner';
import { HomeCitabilitySsr } from '@/components/seo/home-citability-ssr';
import {
  getHomeStructuredData,
  HomeStructuredDataScripts,
} from '@/components/seo/home-structured-data';
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
 * Landing: Upload → Features → Product banner → How to Use → Banner marquee → FAQ → CTA
 */
export default async function HomePage({ params }: HomePageProps) {
  const { locale } = await params;
  const structuredData = await getHomeStructuredData(locale);

  return (
    <div className="flex flex-col">
      <HomeStructuredDataScripts data={structuredData} />
      <HomeCitabilitySsr locale={locale} />
      <HeroSection />
      <FeaturesSection />
      <ProductBannerSection />
      <HowToUseSection />
      <BannerMarqueeSection />
      <FaqSection />
      <CallToActionSection />
    </div>
  );
}
