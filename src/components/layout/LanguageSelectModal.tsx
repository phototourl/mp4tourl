"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useLocale, useTranslations } from "next-intl";
import { X } from "lucide-react";
import { useLocalePathname, useLocaleRouter } from "@/i18n/navigation";
import { websiteConfig } from "@/config/website";
import { LOCALE_DISPLAY_ORDER } from "@/i18n/locale-order";

const ANIM_DURATION_MS = 200;

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

const FlagIcon = ({ countryCode, className }: { countryCode: string; className?: string }) => {
  return (
    <img
      src={`https://cdn.jsdelivr.net/gh/lipis/flag-icons/flags/4x3/${countryCode.toLowerCase()}.svg`}
      alt={countryCode}
      className={`inline-block ${className || "h-4 w-4"}`}
      style={{ display: "inline-block" }}
    />
  );
};

type LanguageSelectModalProps = {
  open: boolean;
  onClose: () => void;
  /** 仅工作台：与 html.ptu-theme-technology 配套深蓝弹窗；营销站勿开 */
  useDashboardTechAppearance?: boolean;
};

export function LanguageSelectModal({
  open,
  onClose,
  useDashboardTechAppearance = false,
}: LanguageSelectModalProps) {
  const router = useLocaleRouter();
  const pathname = useLocalePathname();
  const locale = useLocale();
  const [isPending, startTransition] = useTransition();
  const modalRef = useRef<HTMLDivElement>(null);
  const t = useTranslations("common");
  const [entered, setEntered] = useState(false);
  const [exiting, setExiting] = useState(false);
  const closeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // 进入动画：挂载后下一帧再显示，触发 transition
  useEffect(() => {
    if (!open) return;
    setExiting(false);
    const rafId = requestAnimationFrame(() => {
      requestAnimationFrame(() => setEntered(true));
    });
    return () => cancelAnimationFrame(rafId);
  }, [open]);

  // 关闭动画：先播完再真正 onClose
  const startClose = () => {
    if (closeTimeoutRef.current) return;
    setExiting(true);
    closeTimeoutRef.current = setTimeout(() => {
      closeTimeoutRef.current = null;
      setEntered(false);
      onClose();
    }, ANIM_DURATION_MS);
  };

  useEffect(() => {
    if (!open) return;
    const inDashboard = Boolean(document.querySelector("header[data-dashboard-header]"));
    if (inDashboard) {
      window.dispatchEvent(new CustomEvent("language-modal-change", { detail: { open: true } }));
      return () => {
        if (closeTimeoutRef.current) clearTimeout(closeTimeoutRef.current);
        window.dispatchEvent(new CustomEvent("language-modal-change", { detail: { open: false } }));
      };
    }

    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
    const prevOverflow = document.body.style.overflow;
    const prevPaddingRight = document.body.style.paddingRight;
    const gap = scrollbarWidth > 0 ? scrollbarWidth : 0;
    document.body.style.overflow = "hidden";
    document.body.style.paddingRight = `${gap}px`;
    document.body.setAttribute("data-modal-open", "true");
    document.body.style.setProperty("--scrollbar-gap", `${gap}px`);
    window.dispatchEvent(new CustomEvent("language-modal-change", { detail: { open: true } }));
    return () => {
      if (closeTimeoutRef.current) clearTimeout(closeTimeoutRef.current);
      document.body.style.overflow = prevOverflow;
      document.body.style.paddingRight = prevPaddingRight;
      document.body.removeAttribute("data-modal-open");
      document.body.style.removeProperty("--scrollbar-gap");
      window.dispatchEvent(new CustomEvent("language-modal-change", { detail: { open: false } }));
    };
  }, [open]);

  const handleLocaleChange = (newLocale: string) => {
    if (pathname.includes("/circle-crop")) {
      sessionStorage.setItem("circleCropLanguageSwitch", "true");
    }
    if (pathname.includes("/rounded-corners")) {
      sessionStorage.setItem("roundedCornersLanguageSwitch", "true");
    }
    if (pathname === "/" || pathname === "") {
      sessionStorage.setItem("homePageLanguageSwitch", "true");
    }
    // Close modal first, then navigate — avoids portal unmount racing soft nav
    // (same removeChild class of crash as orphaned theme-color metas).
    startClose();
    startTransition(() => {
      window.setTimeout(() => {
        router.push(pathname, { locale: newLocale });
      }, ANIM_DURATION_MS);
    });
  };

  if (!open) return null;

  const techModalAttr = useDashboardTechAppearance
    ? { "data-ptu-dashboard-lang-modal": "" as const }
    : {};

  const visible = entered && !exiting;

  return (
    <>
      {/* 遮罩：移动端对齐 editstamp；sm+ 保持原透明度 */}
      <div
        className="ptu-language-modal-backdrop fixed inset-0 z-[9998] bg-black/40 backdrop-blur-sm transition-opacity duration-200 ease-out sm:bg-black/30 sm:backdrop-blur-none"
        {...techModalAttr}
        style={{ opacity: visible ? 1 : 0 }}
        onClick={startClose}
        aria-hidden="true"
      />
      {/*
        移动端位置/尺寸对齐 editstamp（pt-24、左右 0.75rem、列表 60vh、内边距与选项规格）
        sm+ 保持原居中 / 纵向国旗样式
      */}
      <div className="fixed inset-0 z-[9999] flex items-start justify-center pt-24 pointer-events-none sm:items-center sm:pt-0">
        <div
          className="ptu-language-modal flex w-[calc(100%-1.5rem)] max-w-7xl flex-col overflow-hidden rounded-xl border-0 bg-white shadow-2xl transition-all duration-200 ease-out pointer-events-auto sm:max-h-[98vh] sm:w-[calc(100%-2.5rem)] sm:max-w-5xl"
          {...techModalAttr}
          style={{
            opacity: visible ? 1 : 0,
            transform: `scale(${visible ? 1 : 0.95})`,
          }}
          ref={modalRef}
          role="dialog"
          aria-modal="true"
          aria-labelledby="language-modal-title"
        >
          <div className="ptu-language-modal-header hero-gradient flex shrink-0 items-center justify-between border-b border-white/20 px-6 py-5 sm:px-6 sm:py-3">
            <div>
              <h2
                id="language-modal-title"
                className="text-sm font-semibold text-white sm:text-lg"
              >
                {t("languageSelect.title")}
              </h2>
              <p className="ptu-language-modal-subtitle mt-1 text-xs text-white/85 sm:text-sm">
                {t("languageSelect.subtitle")}
              </p>
            </div>
            <button
              type="button"
              onClick={startClose}
              className="rounded-full p-1.5 text-white/75 transition-colors hover:bg-white/15 hover:text-white sm:rounded-lg"
              aria-label={t("languageSelect.close")}
            >
              <X className="h-4 w-4 sm:h-5 sm:w-5" />
            </button>
          </div>

          <div className="max-h-[60vh] overflow-y-auto px-6 py-6 sm:max-h-none sm:min-h-0 sm:flex-1 sm:p-4">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-2.5 md:grid-cols-4 lg:grid-cols-6">
              {LOCALES.map((item) => {
                const isSelected = item.code === locale;
                return (
                  <button
                    key={item.code}
                    type="button"
                    onClick={() => handleLocaleChange(item.code)}
                    disabled={isPending}
                    className={[
                      "ptu-language-option rounded-lg transition",
                      // 移动端：与 editstamp 同规格（横向、边框、py-3.5）
                      "flex min-w-[7rem] items-center gap-2.5 border px-3 py-3.5 text-left text-xs",
                      // 桌面端：恢复纵向居中国旗
                      "sm:min-w-0 sm:flex-col sm:items-center sm:gap-1.5 sm:border-0 sm:px-2.5 sm:py-2 sm:text-center sm:text-sm sm:leading-tight",
                      isSelected
                        ? "border-brand-teal bg-brand-teal/10 font-medium text-brand-teal sm:border-transparent"
                        : "border-slate-200 text-slate-700 hover:border-brand-teal/60 hover:bg-slate-50 sm:border-transparent sm:hover:border-transparent",
                    ].join(" ")}
                  >
                    <FlagIcon
                      countryCode={item.countryCode}
                      className="h-4 w-6 shrink-0 rounded-[2px] object-cover sm:h-6 sm:w-6 sm:rounded-none sm:object-fill"
                    />
                    <span className="whitespace-nowrap sm:w-full sm:whitespace-normal sm:break-words">
                      {item.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
