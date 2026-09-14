'use client';

import { websiteConfig } from '@/config/website';
import { useLocalePathname, useLocaleRouter } from '@/i18n/navigation';
import { sortLocalesByDisplayOrder } from '@/i18n/locale-order';
import { ChevronDown, X } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { useParams } from 'next/navigation';
import { useEffect, useState, useTransition } from 'react';
import { createPortal } from 'react-dom';

export default function LocaleSwitcher() {
  const availableLocales = sortLocalesByDisplayOrder(
    Object.entries(websiteConfig.i18n.locales)
  );

  const showLocaleSwitch = availableLocales.length > 1;

  const router = useLocaleRouter();
  const pathname = useLocalePathname();
  const params = useParams();
  const locale = useLocale();
  const t = useTranslations('Common');

  const [, startTransition] = useTransition();
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!showLocaleSwitch) return null;

  const setLocale = (nextLocale: string) => {
    startTransition(() => {
      // @ts-expect-error - next-intl navigation types
      router.replace({ pathname, params }, { locale: nextLocale });
    });
    setOpen(false);
  };

  // @ts-expect-error - locales indexing
  const current = websiteConfig.i18n.locales[locale as string];

  const FLAG_COUNTRY_MAP: Record<string, string> = {
    'en-GB': 'gb',
    'en-CA': 'ca',
    'en-AU': 'au',
    'fr-CA': 'ca',
    'de-CH': 'ch',
    'fr-CH': 'ch',
    en: 'us', zh: 'cn', 'zh-TW': 'tw', tr: 'tr', cs: 'cz', es: 'es', fr: 'fr',
    pt: 'br', de: 'de', jp: 'jp', ko: 'kr', ar: 'sa', it: 'it', nl: 'nl',
    pl: 'pl', sv: 'se', th: 'th', vi: 'vn', rm: 'ch', ru: 'ru', hi: 'in',
    id: 'id', ms: 'my', uk: 'ua', bg: 'bg', ca: 'ad', da: 'dk', el: 'gr',
    fi: 'fi', he: 'il', hr: 'hr', hu: 'hu', no: 'no', ro: 'ro', sk: 'sk', tl: 'ph',
  };

  const getCountryCode = (code: string) =>
    FLAG_COUNTRY_MAP[code] || code.toLowerCase();

  return (
    <>
      <button
        type="button"
        className="inline-flex h-9 items-center gap-2 rounded-md border border-border bg-background/80 px-3 text-xs font-medium text-muted-foreground backdrop-blur transition hover:border-primary/70 hover:text-primary cursor-pointer"
        onClick={() => setOpen(true)}
      >
        <img
          src={`https://cdn.jsdelivr.net/gh/lipis/flag-icons/flags/4x3/${getCountryCode(locale as string)}.svg`}
          alt={current?.name ?? String(locale)}
          className="h-3.5 w-auto rounded-[2px]"
        />
        <span className="hidden md:inline whitespace-nowrap">
          {current?.name ?? t('language')}
        </span>
        <ChevronDown className="h-3 w-3 text-muted-foreground" />
      </button>

      {mounted && open && typeof document !== 'undefined' && createPortal(
        <>
          <div
            className="fixed inset-0 z-[9998] bg-black/40 backdrop-blur-sm"
            onClick={() => setOpen(false)}
          />
          <div className="fixed inset-0 z-[9999] flex items-start justify-center pt-24 sm:pt-28 pointer-events-none">
            <div
              className="w-[calc(100%-2rem)] max-w-5xl rounded-xl bg-background shadow-2xl border border-border pointer-events-auto"
              role="dialog"
              aria-modal="true"
              aria-label={t('language')}
            >
              <div className="flex items-center justify-between border-b border-border px-4 py-3 sm:px-6 sm:py-4">
                <div>
                  <h2 className="text-sm sm:text-base font-semibold">
                    {t('language')}
                  </h2>
                  <p className="mt-1 text-xs sm:text-sm text-muted-foreground">
                    {t('languageHint')}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="rounded-full p-1.5 text-muted-foreground hover:bg-muted/80 cursor-pointer"
                  aria-label="Close"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="max-h-[60vh] overflow-y-auto px-4 py-3 sm:px-6 sm:py-4">
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
                  {availableLocales.map(([code, localeData]) => {
                    const isActive = code === locale;
                    return (
                      <button
                        key={code}
                        type="button"
                        onClick={() => setLocale(code)}
                        className={[
                          'flex items-center gap-2 rounded-lg border px-2.5 py-2.5 text-left text-xs sm:text-sm transition min-w-[7rem] sm:min-w-[10rem] cursor-pointer',
                          isActive
                            ? 'border-primary bg-primary/5 text-primary'
                            : 'border-border hover:border-primary/60 hover:bg-muted',
                        ].join(' ')}
                      >
                        <img
                          src={`https://cdn.jsdelivr.net/gh/lipis/flag-icons/flags/4x3/${getCountryCode(code)}.svg`}
                          alt={localeData.name}
                          className="h-4 w-6 shrink-0 rounded-[2px] object-cover"
                        />
                        <span className="whitespace-nowrap">{localeData.name}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </>,
        document.body
      )}
    </>
  );
}
