"use client";

import { LocaleLink, useLocalePathname } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import {
  DollarSign,
  FileText,
  Files,
  Home,
} from "lucide-react";
import { trackPricingRedirect } from "@/lib/analytics/pricing-redirect";
import type { SiteHeaderTone } from "@/lib/constants/site-header-tone";

export function HeaderNavWithHistory({ tone = "white" }: { tone?: SiteHeaderTone }) {
  const t = useTranslations("common");
  const pathname = useLocalePathname();
  const isHome = pathname === "/" || pathname === "";
  const isPdfToUrl = pathname === "/pdf-to-url" || pathname.startsWith("/pdf-to-url");
  const isFileToUrl = pathname === "/file-to-url" || pathname.startsWith("/file-to-url");
  const isPricing = pathname === "/pricing" || pathname.startsWith("/pricing");
  const navLinkBase =
    tone === "gradient"
      ? "flex items-center justify-center gap-1 whitespace-nowrap rounded-lg border border-transparent text-xs font-medium transition-colors h-7 w-7 sm:h-9 sm:w-auto sm:gap-1.5 sm:px-2 sm:text-sm md:h-10 md:px-2.5 sm:hover:bg-white/20 sm:hover:text-white sm:hover:font-semibold sm:hover:border-transparent"
      : "flex items-center justify-center gap-1 whitespace-nowrap rounded-lg text-xs font-medium transition-colors sm:hover:bg-[#0abab5]/16 sm:hover:text-[#089590] h-7 w-7 sm:h-9 sm:w-auto sm:gap-1.5 sm:px-2 sm:text-sm md:h-10 md:px-2.5 border border-transparent sm:hover:border-[#0abab5]/55";
  const navLinkActive =
    tone === "gradient"
      ? "bg-white/20 text-white font-semibold border-transparent shadow-none"
      : "bg-[#d9f6f5] text-[#0a9f9a] border-[#7ddbd8]";
  const navLinkInactive = tone === "gradient" ? "text-white/85" : "text-slate-700";

  return (
    <nav className="flex min-w-0 flex-1 items-center justify-between gap-0 px-1 sm:flex-none sm:shrink-0 sm:justify-center sm:gap-1.5 sm:px-0 md:gap-3">
      <LocaleLink
        href="/"
        className={`${navLinkBase} ${isHome ? navLinkActive : navLinkInactive}`}
      >
        <Home className="h-3 w-3 shrink-0 sm:h-4 sm:w-4" />
        <span dir="auto" className="hidden whitespace-nowrap sm:inline">{t("header.home")}</span>
      </LocaleLink>
      <LocaleLink
        href="/pdf-to-url"
        className={`${navLinkBase} ${isPdfToUrl ? navLinkActive : navLinkInactive}`}
      >
        <FileText className="h-3 w-3 shrink-0 sm:h-4 sm:w-4" />
        <span dir="auto" className="hidden whitespace-nowrap normal-case sm:inline">{t("header.pdfToUrlNav")}</span>
      </LocaleLink>
      <LocaleLink
        href="/file-to-url"
        className={`${navLinkBase} ${isFileToUrl ? navLinkActive : navLinkInactive}`}
      >
        <Files className="h-3 w-3 shrink-0 sm:h-4 sm:w-4" />
        <span dir="auto" className="hidden whitespace-nowrap normal-case sm:inline">{t("header.fileToUrlNav")}</span>
      </LocaleLink>
      <LocaleLink
        href="/pricing"
        className={`${navLinkBase} ${isPricing ? navLinkActive : navLinkInactive}`}
        onClick={() => trackPricingRedirect("header_nav")}
      >
        <DollarSign className="h-3 w-3 shrink-0 sm:h-4 sm:w-4" />
        <span dir="auto" className="hidden whitespace-nowrap sm:inline">{t("header.pricingNav")}</span>
      </LocaleLink>
    </nav>
  );
}
