"use client";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useLayoutEffect, useState } from "react";
import { HeaderNavWithHistory } from "./header/HeaderNavWithHistory";
import { HeaderThemeToggleButton } from "./HeaderThemeToggleButton";
import { HeaderRight } from "./header/HeaderRight";
import { HeaderLeft } from "./header/HeaderLeft";
import { HomeLink } from "../home/HomeLink";
import { useTranslations } from "next-intl";
import { type SiteHeaderTone } from "@/lib/constants/site-header-tone";
import {
  appThemeFromHeaderTone,
  headerToneFromAppTheme,
  persistSiteHeaderTheme,
  resolveSiteHeaderTheme,
} from "@/lib/app-ui-theme";

type SiteHeaderProps = {
  /** 服务端从 cookie 读取，与刷新后的首屏一致 */
  initialTone?: SiteHeaderTone;
};

export function SiteHeader({ initialTone = "white" }: SiteHeaderProps) {
  const t = useTranslations("common");
  const tImages = useTranslations("images");
  const pathname = usePathname();
  const [headerTone, setHeaderTone] = useState<SiteHeaderTone>(initialTone);

  // 首页导航主题：仅读写 ptu-site-header-tone，与工作台独立
  useLayoutEffect(() => {
    try {
      const theme = resolveSiteHeaderTheme();
      const tone = headerToneFromAppTheme(theme);
      setHeaderTone(tone);
      persistSiteHeaderTheme(theme);
    } catch {
      /* ignore */
    }
  }, []);

  // 在工作台/设置页面隐藏主站导航
  if (pathname?.startsWith('/dashboard') || pathname?.startsWith('/settings')) {
    return null;
  }

  return (
    <>
      <header
        className={
          headerTone === "white"
            ? "ez-shadow-nav fixed top-0 z-40 w-full border-b border-slate-100 bg-white text-slate-900"
            : "ez-shadow-nav hero-gradient fixed top-0 z-40 w-full border-b border-white/20 text-white"
        }
      >
        <div className="mx-auto flex h-12 max-w-6xl items-center justify-center gap-1 px-2 sm:h-16 sm:gap-4 sm:px-6">
          {/* Logo + Title */}
          <HomeLink className="group flex shrink-0 items-center gap-0.5 sm:gap-1">
            <div className="relative h-6 w-6 overflow-hidden rounded-xl transition-all duration-300 group-hover:rotate-6 group-hover:opacity-80 sm:h-10 sm:w-10">
              <Image
                src="/icons/light_logo.png"
                alt={tImages("logoAlt")}
                width={58}
                height={58}
                className="h-full w-full object-contain transition-transform duration-300 group-hover:scale-110"
                priority
                unoptimized
              />
            </div>
            <span className={headerTone === "white" ? "text-sm font-semibold text-slate-900 whitespace-nowrap sm:text-lg" : "text-sm font-semibold text-white whitespace-nowrap sm:text-lg"}>
              <span className="hidden sm:inline">{t("siteName")}</span>
            </span>
          </HomeLink>

          {/* All nav items */}
          <HeaderNavWithHistory tone={headerTone} />
          <HeaderThemeToggleButton
            isLight={headerTone === "white"}
            appearance={headerTone === "gradient" ? "onColor" : "light"}
            ariaLabel={
              headerTone === "white"
                ? "Switch to gradient header"
                : "Switch to white header"
            }
            onToggle={() => {
              const nextTone: SiteHeaderTone =
                headerTone === "white" ? "gradient" : "white";
              setHeaderTone(nextTone);
              persistSiteHeaderTheme(appThemeFromHeaderTone(nextTone));
            }}
          />
          <HeaderLeft tone={headerTone} />
          <HeaderRight tone={headerTone} />
        </div>
      </header>
      {/* Spacer to push content below header */}
      <div className="h-12 sm:h-16" aria-hidden="true" />
    </>
  );
}

export default SiteHeader;
