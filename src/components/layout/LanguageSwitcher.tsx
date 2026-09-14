"use client";

import { useState } from "react";
import { useLocale } from "next-intl";
import { ChevronDown } from "lucide-react";
import { LanguageSelectModal } from "./LanguageSelectModal";
import { websiteConfig } from "@/config/website";
import { LOCALE_DISPLAY_ORDER } from "@/i18n/locale-order";


type LocaleItem = { code: string; label: string; countryCode: string };

const PRIORITY_ORDER = LOCALE_DISPLAY_ORDER;

const FLAG_COUNTRY_MAP: Record<string, string> = {
  en: "us",
  "en-GB": "gb",
  "en-CA": "ca",
  "en-AU": "au",
  "fr-CA": "ca",
  "de-CH": "ch",
  "fr-CH": "ch",
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
  FLAG_COUNTRY_MAP[code] || code.split("-")[1]?.toLowerCase() || code.toLowerCase();

const LOCALES: LocaleItem[] = Object.entries(websiteConfig.i18n.locales)
  .map(([code, locale]) => ({
    code,
    label: locale.name,
    countryCode: getCountryCode(code).toUpperCase(),
  }))
  .sort((a, b) => {
    const ia = PRIORITY_ORDER.indexOf(a.code as (typeof PRIORITY_ORDER)[number]);
    const ib = PRIORITY_ORDER.indexOf(b.code as (typeof PRIORITY_ORDER)[number]);
    const pa = ia === -1 ? Number.MAX_SAFE_INTEGER : ia;
    const pb = ib === -1 ? Number.MAX_SAFE_INTEGER : ib;
    if (pa !== pb) return pa - pb;
    return a.label.localeCompare(b.label);
  });

const FlagIcon = ({ countryCode, className, label }: { countryCode: string; className?: string; label?: string }) => {
  const countryName = label || countryCode;
  return (
    <img
      src={`https://cdn.jsdelivr.net/gh/lipis/flag-icons/flags/4x3/${countryCode.toLowerCase()}.svg`}
      alt={countryName}
      title={countryName}
      aria-label={countryName}
      className={className || "h-[1.2em] w-[1.2em] shrink-0 inline-block"}
    />
  );
};

type LanguageSwitcherProps = {
  /**
   * header: 顶部导航样式（对齐 editstamp 描边低调按钮）
   * footer: 底部简洁样式（只文字+图标，向上展开）
   * modal: 弹框模式（居中显示）
   */
  variant?: "header" | "footer" | "modal";
  /** 首页顶栏色调：gradient 时用白描边贴色样式 */
  tone?: "white" | "gradient";
  /** 是否显示弹框（仅当 variant="modal" 时有效） */
  showModal?: boolean;
  /** 弹框关闭回调（仅当 variant="modal" 时有效） */
  onModalClose?: () => void;
};

export function LanguageSwitcher({
  variant = "header",
  tone = "white",
  showModal = false,
  onModalClose,
}: LanguageSwitcherProps) {
  const locale = useLocale();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const currentLocale = LOCALES.find((item) => item.code === locale) || LOCALES[0];
  const isFooter = variant === "footer";
  const isModal = variant === "modal";
  const onGradient = variant === "header" && tone === "gradient";

  if (isModal) {
    return <LanguageSelectModal open={showModal} onClose={onModalClose || (() => {})} />;
  }

  const handleModalClose = () => {
    setIsModalOpen(false);
    onModalClose?.();
  };

  // 移动端尺寸与色调无关（紧凑 h-7）；桌面白顶栏略高、渐变与登录注册对齐
  const headerBtnClass = onGradient
    ? "inline-flex h-7 shrink-0 items-center justify-center gap-0.5 rounded-md border border-white/80 bg-white/10 px-1.5 text-xs font-medium text-white transition hover:bg-white/20 disabled:opacity-50 active:scale-[0.98] sm:h-8 sm:gap-1.5 sm:px-3"
    : "inline-flex h-7 shrink-0 items-center justify-center gap-0.5 rounded-md border border-border bg-background/80 px-1.5 text-xs font-medium text-muted-foreground backdrop-blur transition hover:border-primary/70 hover:text-primary disabled:opacity-50 active:scale-[0.98] sm:h-9 sm:gap-1.5 sm:px-3";

  return (
    <>
      <div className="group relative inline-flex shrink-0 items-center text-sm">
        <button
          type="button"
          aria-expanded={isModalOpen}
          aria-haspopup="dialog"
          className={
            isFooter
              ? "flex items-center gap-1.5 rounded-md px-1 py-0.5 text-sm sm:text-base outline-none transition hover:opacity-80 active:scale-[0.98]"
              : headerBtnClass
          }
          onClick={() => setIsModalOpen((prev) => !prev)}
        >
          <FlagIcon
            countryCode={currentLocale.countryCode}
            className="h-3.5 w-auto shrink-0 rounded-[2px]"
            label={currentLocale.label}
          />
          {variant === "header" ? (
            <span className="hidden sm:inline whitespace-nowrap">
              {currentLocale.label}
            </span>
          ) : (
            <span className="whitespace-nowrap">
              {currentLocale.label}
            </span>
          )}
          <ChevronDown
            aria-hidden="true"
            className={`shrink-0 transition-transform duration-200 ease-out ${
              isModalOpen ? "rotate-180" : ""
            } ${
              variant === "header"
                ? onGradient
                  ? "hidden h-3 w-3 text-white/90 sm:inline-block sm:h-3.5 sm:w-3.5"
                  : "hidden h-3 w-3 text-muted-foreground sm:inline-block sm:h-3.5 sm:w-3.5"
                : "h-4 w-4 text-white"
            }`}
          />
        </button>
      </div>
      <LanguageSelectModal open={isModalOpen} onClose={handleModalClose} />
    </>
  );
}
