'use client';

import { SidebarTrigger } from '@/components/ui/sidebar';
import { Separator } from '@/components/ui/separator';
import { LanguageSelectModal } from '@/components/layout/LanguageSelectModal';
import { HeaderThemeToggleButton } from '@/components/layout/HeaderThemeToggleButton';
import { websiteConfig } from '@/config/website';
import { useLocale } from 'next-intl';
import { useLayoutEffect, useState } from 'react';
import { ChevronDown } from 'lucide-react';
import {
  applyDashboardHtmlTheme,
  persistDashboardTheme,
  resolveDashboardTheme,
} from '@/lib/app-ui-theme';

interface DashboardBreadcrumbItem {
  label: string;
  isCurrentPage?: boolean;
}

interface DashboardHeaderProps {
  breadcrumbs: DashboardBreadcrumbItem[];
}

/** Same mapping as editstamp LocaleSwitcher / site LanguageSwitcher */
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

export function DashboardHeader({ breadcrumbs }: DashboardHeaderProps) {
  const locale = useLocale();
  const [isOpen, setIsOpen] = useState(false);
  /** 工作台独立主题；默认深色 */
  const [isTechTheme, setIsTechTheme] = useState(true);
  const currentLocale =
    websiteConfig.i18n.locales[
      locale as keyof typeof websiteConfig.i18n.locales
    ];
  const localeLabel = currentLocale?.name ?? locale;

  useLayoutEffect(() => {
    const theme = resolveDashboardTheme();
    const enabled = theme === 'dark';
    setIsTechTheme(enabled);
    applyDashboardHtmlTheme(theme);
    if (enabled) {
      // Migrate old homepage-synced "default" → dashboard dark default.
      persistDashboardTheme('dark');
    }
  }, []);

  const toggleTechTheme = () => {
    setIsTechTheme((prev) => {
      const next = !prev;
      const theme = next ? 'dark' : 'light';
      applyDashboardHtmlTheme(theme);
      persistDashboardTheme(theme);
      return next;
    });
  };

  return (
    <>
      <header
        data-dashboard-header
        className="sticky top-0 z-50 flex h-[var(--header-height)] shrink-0 items-center gap-2 border-b border-white/20 bg-[#17A2B8] shadow-lg shadow-cyan-900/10 px-4 lg:px-6 transition-[height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-[var(--header-height)]"
      >
        <SidebarTrigger className="-ml-1 cursor-pointer text-white hover:text-white hover:bg-white/20 active:bg-white/30 rounded-md p-1.5 transition-colors" />
        <Separator orientation="vertical" className="mx-2 data-[orientation=vertical]:h-4 bg-white/35 dark:bg-white/25" />

        {/* Breadcrumbs */}
        <div className="min-w-0 flex flex-1 items-center gap-1 overflow-hidden text-base font-bold tracking-wide text-white">
          {breadcrumbs.map((item, index) => (
            <span
              key={index}
              className={`flex items-center gap-1 whitespace-nowrap ${index === 0 && breadcrumbs.length > 1 ? 'hidden sm:inline-flex' : 'min-w-0'}`}
            >
              {index > 0 && <span className="mx-1 text-white/70">/</span>}
              <span className={`truncate ${item.isCurrentPage ? 'text-white' : 'text-white/70'}`}>
                {item.label}
              </span>
            </span>
          ))}
        </div>

        {/* 右侧语言切换：对齐 editstamp — 移动端国旗，桌面国旗+语种名 */}
        <div className="ml-auto flex items-center gap-2">
          <button
            type="button"
            aria-expanded={isOpen}
            aria-haspopup="dialog"
            aria-label={localeLabel}
            onClick={() => setIsOpen((prev) => !prev)}
            className="inline-flex h-8 items-center gap-1 whitespace-nowrap rounded-md px-2 text-xs font-medium text-white transition-all hover:bg-white/20 active:bg-white/30 lg:h-9 lg:gap-2 lg:px-3 lg:text-sm"
          >
            <img
              src={`https://cdn.jsdelivr.net/gh/lipis/flag-icons/flags/4x3/${getCountryCode(locale)}.svg`}
              alt={localeLabel}
              className="h-3.5 w-auto rounded-[2px]"
            />
            <span className="hidden lg:inline whitespace-nowrap">
              {localeLabel}
            </span>
            <ChevronDown
              aria-hidden="true"
              className={`h-3 w-3 text-white/90 transition-transform duration-200 ease-out ${isOpen ? 'rotate-180' : ''}`}
            />
          </button>
          <HeaderThemeToggleButton
            isLight={!isTechTheme}
            appearance="onColor"
            ariaLabel={
              isTechTheme
                ? locale.startsWith('zh')
                  ? '切换为默认主题'
                  : 'Switch to default theme'
                : locale.startsWith('zh')
                  ? '切换为科技主题'
                  : 'Switch to technology theme'
            }
            onToggle={toggleTechTheme}
          />
        </div>
      </header>

      <LanguageSelectModal
        open={isOpen}
        onClose={() => setIsOpen(false)}
        useDashboardTechAppearance
      />
    </>
  );
}
