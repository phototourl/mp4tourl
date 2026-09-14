import { ContactFormCard } from '@/components/contact/contact-form-card';
import Container from '@/components/layout/container';
import { websiteConfig } from '@/config/website';
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
  const pt = await getTranslations({ locale, namespace: 'ContactPage' });

  return constructMetadata({
    title: pt('title') + ' | ' + t('title'),
    description: pt('description'),
    locale,
    pathname: '/contact',
  });
}

export default async function ContactPage() {
  const t = await getTranslations('ContactPage');
  const supportEmail = websiteConfig.mail.supportEmail;

  return (
    <Container className="py-16 px-4">
      <div className="mx-auto max-w-4xl space-y-8 pb-16">
        <div className="space-y-4">
          <h1 className="text-center text-3xl font-bold tracking-tight">
            {t('title')}
          </h1>
          <p className="text-center text-lg text-muted-foreground">
            {t('subtitle')}
          </p>
        </div>

        <ContactFormCard />

        {supportEmail ? (
          <p className="text-center text-sm text-muted-foreground">
            {t('orEmail')}{' '}
            <a
              className="font-medium text-foreground underline underline-offset-4"
              href={`mailto:${supportEmail}`}
            >
              {supportEmail}
            </a>
          </p>
        ) : null}
      </div>
    </Container>
  );
}
