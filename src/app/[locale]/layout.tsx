import { Analytics } from '@/analytics/analytics';
import { fontCssVariables, fontSansFamily } from '@/assets/fonts';
import { routing } from '@/i18n/routing';
import { cn } from '@/lib/utils';
import { type Locale, NextIntlClientProvider, hasLocale } from 'next-intl';
import { notFound } from 'next/navigation';
import { NuqsAdapter } from 'nuqs/adapters/next/app';
import type { ReactNode } from 'react';
import { Toaster } from 'sonner';
import { Providers } from './providers';

import '@/styles/globals.css';

interface LocaleLayoutProps {
  children: ReactNode;
  params: Promise<{ locale: Locale }>;
}

/**
 * Locale Layout
 * https://next-intl.dev/docs/getting-started/app-router/with-i18n-routing#layout
 */
export default async function LocaleLayout({
  children,
  params,
}: LocaleLayoutProps) {
  const { locale } = await params;

  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }

  return (
    <html suppressHydrationWarning lang={locale}>
      <body
        suppressHydrationWarning
        className={cn('size-full antialiased')}
        style={{
          ...fontCssVariables,
          fontFamily: fontSansFamily,
        }}
      >
        <NuqsAdapter>
          <NextIntlClientProvider>
            <Providers locale={locale}>
              {children}

              <Toaster richColors position="top-right" offset={64} />
              <Analytics />
            </Providers>
          </NextIntlClientProvider>
        </NuqsAdapter>
      </body>
    </html>
  );
}
