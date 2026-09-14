'use client';

import { LanguageSelectModal } from '@/components/layout/language-select-modal';
import { websiteConfig } from '@/config/website';
import { useLocaleStore } from '@/stores/locale-store';
import { ChevronDown } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';

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

/**
 * LocaleSwitcher — flag button opens language modal (same as editstamp).
 */
export default function LocaleSwitcher() {
  const availableLocales = Object.entries(websiteConfig.i18n.locales);
  const showLocaleSwitch = availableLocales.length > 1;
  if (!showLocaleSwitch) {
    return null;
  }

  const locale = useLocale();
  const { setCurrentLocale } = useLocaleStore();
  const t = useTranslations('Common');

  const [open, setOpen] = useState(false);

  useEffect(() => {
    setCurrentLocale(locale);
  }, [locale, setCurrentLocale]);

  const current = websiteConfig.i18n.locales[locale as string];

  return (
    <>
      <button
        type="button"
        className="inline-flex h-8 items-center gap-1 rounded-md border border-border bg-background/80 px-2 text-xs font-medium text-foreground backdrop-blur transition hover:border-primary/70 hover:text-primary lg:h-9 lg:gap-2 lg:px-3"
        onClick={() => setOpen(true)}
      >
        <img
          src={`https://cdn.jsdelivr.net/gh/lipis/flag-icons/flags/4x3/${getCountryCode(
            locale as string
          )}.svg`}
          alt={current?.name ?? String(locale)}
          className="h-3.5 w-auto rounded-[2px]"
        />
        <span className="hidden lg:inline whitespace-nowrap">
          {current?.name ?? t('language')}
        </span>
        <ChevronDown className="h-3 w-3" />
      </button>

      <LanguageSelectModal open={open} onClose={() => setOpen(false)} />
    </>
  );
}
