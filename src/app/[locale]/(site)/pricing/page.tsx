import Container from '@/components/layout/container';
import { HeaderSection } from '@/components/layout/header-section';
import { PricingTable } from '@/components/pricing/pricing-table';
import { getTranslations } from 'next-intl/server';
import type { Metadata } from 'next';
import FaqSection from '@/components/blocks/faqs/faqs';
import type { AppLocale } from '@/i18n/routing';

type PageProps = { params: Promise<{ locale: AppLocale }> };

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'PricingPage' });
  return {
    title: `${t('title')} | MP4 to URL`,
    description: t('description'),
  };
}

export default async function PricingPage() {
  const t = await getTranslations('PricingPage');

  return (
    <Container className="mt-4 max-w-7xl px-4 flex flex-col gap-8">
      <HeaderSection
        subtitle={t('subtitle')}
        subtitleAs="h1"
        subtitleClassName="text-3xl font-bold"
        description={t('description')}
        descriptionAs="p"
      />

      <PricingTable />

      <FaqSection />
    </Container>
  );
}
