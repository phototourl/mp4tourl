import Container from '@/components/layout/container';
import { Button, buttonVariants } from '@/components/ui/button';
import { websiteConfig } from '@/config/website';
import { constructMetadata } from '@/lib/metadata';
import { cn } from '@/lib/utils';
import { MailIcon, TwitterIcon } from 'lucide-react';
import type { Metadata } from 'next';
import type { Locale } from 'next-intl';
import { getTranslations } from 'next-intl/server';
import Image from 'next/image';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}): Promise<Metadata | undefined> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'Metadata' });
  const pt = await getTranslations({ locale, namespace: 'AboutPage' });

  return constructMetadata({
    title: pt('title') + ' | ' + t('title'),
    description: pt('description'),
    locale,
    pathname: '/about',
  });
}

/**
 * About — layout aligned with editstamp About page;
 * brand mark: /images/avatars/fox.png
 */
export default async function AboutPage() {
  const t = await getTranslations('AboutPage');

  return (
    <div className="mb-16">
      <div className="mt-8 flex w-full flex-col items-center justify-center gap-4 px-4 md:mt-12">
        <div className="mx-auto max-w-3xl space-y-4 text-center">
          <h1 className="text-3xl font-bold tracking-tight md:text-4xl">
            {t('title')}
          </h1>
          <p className="text-lg text-muted-foreground">{t('authorBio')}</p>
        </div>
      </div>

      <Container className="mt-10 px-4 md:mt-12">
        <div className="mx-auto max-w-3xl">
          <div className="grid grid-cols-1 items-center gap-8 sm:grid-cols-2 sm:gap-10">
            <div className="flex flex-col items-center gap-3">
              <div className="relative aspect-square w-full max-w-[200px] shrink-0 overflow-hidden rounded-2xl sm:max-w-[220px]">
                <Image
                  src="/images/avatars/fox.png"
                  alt={t('imageAlt')}
                  fill
                  className="object-contain"
                  priority
                />
              </div>
              <div className="text-center">
                <p className="text-xl font-semibold tracking-tight text-foreground">
                  {t('authorName')}
                </p>
              </div>
            </div>

            <div className="min-w-0 text-center sm:text-left">
              <p className="text-base leading-relaxed text-muted-foreground md:text-lg">
                {t('introduction')}
              </p>

              <div className="mt-6 flex flex-wrap items-center justify-center gap-3 sm:justify-start">
                {websiteConfig.metadata.social?.twitter ? (
                  <a
                    href={websiteConfig.metadata.social.twitter}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={cn(
                      buttonVariants({ variant: 'outline' }),
                      'cursor-pointer rounded-lg'
                    )}
                  >
                    <TwitterIcon className="mr-1 size-4" />
                    {t('followMe')}
                  </a>
                ) : null}
                {websiteConfig.mail.supportEmail ? (
                  <Button
                    variant="outline"
                    className="cursor-pointer rounded-lg"
                    asChild
                  >
                    <a href={`mailto:${websiteConfig.mail.supportEmail}`}>
                      <MailIcon className="mr-1 size-4" />
                      {t('talkWithMe')}
                    </a>
                  </Button>
                ) : null}
              </div>
            </div>
          </div>
        </div>
      </Container>
    </div>
  );
}
