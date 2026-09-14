'use client';

import { websiteConfig } from '@/config/website';
import { useLocalePathname, useLocaleRouter } from '@/i18n/navigation';
import { useLocaleStore } from '@/stores/locale-store';
import { X } from 'lucide-react';
import { type Locale, useLocale, useTranslations } from 'next-intl';
import { useParams } from 'next/navigation';
import { useEffect, useState, useTransition } from 'react';
import { createPortal } from 'react-dom';

const ORDER = [
  'en',
  'en-GB',
  'en-AU',
  'en-CA',
  'fr-CA',
  'rm',
  'de-CH',
  'fr-CH',
  'de',
  'fr',
  'ar',
  'he',
  'ko',
  'jp',
  'es',
  'it',
  'nl',
  'sv',
  'da',
  'no',
  'fi',
  'pt',
  'pl',
  'cs',
  'tr',
  'ru',
  'uk',
  'zh',
  'zh-TW',
  'hi',
  'id',
  'ms',
  'th',
  'vi',
  'tl',
  'ca',
  'el',
  'bg',
  'hr',
  'hu',
  'ro',
  'sk',
];

const FLAG_COUNTRY_MAP: Record<string, string> = {
  en: 'us',
  'en-GB': 'gb',
  'en-CA': 'ca',
  'en-AU': 'au',
  'fr-CA': 'ca',
  'de-CH': 'ch',
  'fr-CH': 'ch',
  zh: 'cn',
  'zh-TW': 'tw',
  es: 'es',
  fr: 'fr',
  pt: 'br',
  de: 'de',
  jp: 'jp',
  ko: 'kr',
  ar: 'sa',
  it: 'it',
  ru: 'ru',
  nl: 'nl',
  tr: 'tr',
  pl: 'pl',
  sv: 'se',
  vi: 'vn',
  id: 'id',
  th: 'th',
  hi: 'in',
  he: 'il',
  cs: 'cz',
  ms: 'my',
  da: 'dk',
  no: 'no',
  fi: 'fi',
  ro: 'ro',
  hu: 'hu',
  uk: 'ua',
  tl: 'ph',
  bg: 'bg',
  ca: 'ad',
  el: 'gr',
  hr: 'hr',
  sk: 'sk',
  rm: 'ch',
};

const getCountryCode = (code: string) =>
  FLAG_COUNTRY_MAP[code] || code.toLowerCase();

const availableLocales = Object.entries(websiteConfig.i18n.locales).sort(
  ([codeA], [codeB]) => {
    const indexA = ORDER.indexOf(codeA);
    const indexB = ORDER.indexOf(codeB);

    const inOrderA = indexA !== -1;
    const inOrderB = indexB !== -1;

    if (inOrderA && inOrderB) {
      return indexA - indexB;
    }

    if (inOrderA && !inOrderB) return -1;
    if (!inOrderA && inOrderB) return 1;

    return codeA.localeCompare(codeB);
  }
);

interface LanguageSelectModalProps {
  open: boolean;
  onClose: () => void;
}

export function LanguageSelectModal({ open, onClose }: LanguageSelectModalProps) {
  const router = useLocaleRouter();
  const pathname = useLocalePathname();
  const params = useParams();
  const locale = useLocale();
  const { setCurrentLocale } = useLocaleStore();
  const [, startTransition] = useTransition();
  const t = useTranslations('Common');

  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) return;

    const originalOverflow = document.body.style.overflow;
    const originalPaddingRight = document.body.style.paddingRight;

    const scrollbarWidth =
      window.innerWidth - document.documentElement.clientWidth;
    const gap = scrollbarWidth > 0 ? `${scrollbarWidth}px` : '';

    document.body.style.overflow = 'hidden';
    if (gap) {
      document.body.style.paddingRight = gap;
    }

    return () => {
      document.body.style.overflow = originalOverflow;
      document.body.style.paddingRight = originalPaddingRight;
    };
  }, [open]);

  const setLocale = (nextLocale: Locale) => {
    setCurrentLocale(nextLocale);

    startTransition(() => {
      router.replace(
        // @ts-expect-error -- TypeScript will validate that only known `params`
        // are used in combination with a given `pathname`. Since the two will
        // always match for the current route, we can skip runtime checks.
        { pathname, params },
        { locale: nextLocale }
      );
    });

    onClose();
  };

  if (!mounted || !open || typeof document === 'undefined') {
    return null;
  }

  return createPortal(
    <>
      <div
        className="fixed inset-0 z-[9998] bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="fixed inset-0 z-[9999] flex items-start justify-center pt-24 sm:pt-28 pointer-events-none">
        <div
          className="w-[calc(100%-1.5rem)] max-w-7xl rounded-xl bg-background shadow-2xl border border-border pointer-events-auto"
          role="dialog"
          aria-modal="true"
          aria-label={t('language')}
        >
          <div className="flex items-center justify-between border-b border-border px-6 py-5 sm:px-8 sm:py-6">
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
              onClick={onClose}
              className="rounded-full p-1.5 text-muted-foreground hover:bg-muted/80"
              aria-label="Close"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="max-h-[60vh] overflow-y-auto px-6 py-6 sm:px-8 sm:py-8">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 md:grid-cols-4 lg:grid-cols-6">
              {availableLocales.map(([code, data]) => {
                const isActive = code === locale;
                return (
                  <button
                    key={code}
                    type="button"
                    onClick={() => setLocale(code as Locale)}
                    className={[
                      'flex items-center gap-2.5 rounded-lg border px-3 py-3.5 text-left text-xs sm:text-sm transition min-w-[7rem] sm:min-w-[10rem] sm:px-3.5 sm:py-4',
                      isActive
                        ? 'border-primary bg-primary/5 text-primary'
                        : 'border-border hover:border-primary/60 hover:bg-muted',
                    ].join(' ')}
                  >
                    <img
                      src={`https://cdn.jsdelivr.net/gh/lipis/flag-icons/flags/4x3/${getCountryCode(
                        code
                      )}.svg`}
                      alt={data.name}
                      className="h-4 w-6 shrink-0 rounded-[2px] object-cover"
                    />
                    <span className="whitespace-nowrap">{data.name}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </>,
    document.body
  );
}
