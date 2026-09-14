"use client";

import { useLocale, useTranslations } from "next-intl";
import { useLocaleRouter, useLocalePathname } from "@/i18n/navigation";
import { useParams } from "next/navigation";
import { cn } from "@/lib/utils";
import { websiteConfig } from "@/config/website";
import { sortLocalesByDisplayOrder } from "@/i18n/locale-order";

interface SelectRegionSectionProps {
  translationKey?: string; // 默认为 "home.selectRegion"，可以传入 "circleCrop.selectRegion"
}

export function SelectRegionSection({ translationKey = "home.selectRegion" }: SelectRegionSectionProps) {
  const locale = useLocale();
  const router = useLocaleRouter();
  const pathname = useLocalePathname();
  const params = useParams();
  const t = useTranslations(translationKey);

  const availableLocales = sortLocalesByDisplayOrder(
    Object.entries(websiteConfig.i18n.locales)
  );

  const FLAG_COUNTRY_MAP: Record<string, string> = {
    "en-GB": "gb",
    "en-CA": "ca",
    "en-AU": "au",
    "fr-CA": "ca",
    "de-CH": "ch",
    "fr-CH": "ch",
    en: "us",
    zh: "cn",
    "zh-TW": "tw",
    tr: "tr",
    cs: "cz",
    es: "es",
    fr: "fr",
    pt: "br",
    de: "de",
    jp: "jp",
    ko: "kr",
    ar: "sa",
    it: "it",
    nl: "nl",
    pl: "pl",
    sv: "se",
    th: "th",
    vi: "vn",
    rm: "ch",
    ru: "ru",
    hi: "in",
    id: "id",
    ms: "my",
    uk: "ua",
    bg: "bg",
    ca: "ad",
    da: "dk",
    el: "gr",
    fi: "fi",
    he: "il",
    hr: "hr",
    hu: "hu",
    no: "no",
    ro: "ro",
    sk: "sk",
    tl: "ph",
  };

  const getCountryCode = (code: string) =>
    FLAG_COUNTRY_MAP[code] || code.toLowerCase();

  return (
    <section className="bg-white pt-10 pb-14 sm:pt-12 sm:pb-16">
      <div className="mx-auto max-w-6xl px-6 lg:max-w-7xl lg:px-10">
        <div className="space-y-6">
          <div className="text-center space-y-2">
            <h2 className="text-2xl font-bold text-slate-800">{t("title")}</h2>
            <p className="text-sm text-slate-600">{t("subtitle")}</p>
          </div>
          <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
            {availableLocales.map(([code, localeData]) => {
              const isSelected = locale === code;
              return (
                <button
                  key={code}
                  type="button"
                  onClick={() => {
                    router.replace(
                      // @ts-expect-error -- TypeScript will validate that only known `params` are used
                      { pathname, params },
                      { locale: code }
                    );
                  }}
                  className={cn(
                    "flex items-center gap-2 rounded-lg border-2 px-3 py-2.5 text-left text-xs sm:text-sm font-medium transition-all",
                    "hover:shadow-md hover:-translate-y-0.5",
                    isSelected
                      ? "border-brand-teal bg-brand-teal/10 text-brand-teal shadow-sm"
                      : "border-slate-200 bg-white text-slate-700 hover:border-brand-teal/50 hover:bg-slate-50"
                  )}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={`https://cdn.jsdelivr.net/gh/lipis/flag-icons/flags/4x3/${getCountryCode(code)}.svg`}
                    alt={`${localeData.name} flag`}
                    title={localeData.name}
                    loading="lazy"
                    decoding="async"
                    style={{ width: "1.2em", height: "1.2em", display: "inline-block" }}
                    className="shrink-0"
                  />
                  <span className="whitespace-nowrap text-xs sm:text-sm">{localeData.name}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}

