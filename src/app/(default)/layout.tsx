import { NextIntlClientProvider } from "next-intl";
import { getMessages, setRequestLocale, getTranslations } from "next-intl/server";
import type { ReactNode } from "react";
import type { Viewport } from "next";
import SiteHeader from "@/components/layout/SiteHeader";
import SiteFooter from "@/components/layout/SiteFooter";
import { GoogleAnalyticsWrapper } from "@/components/layout/GoogleAnalyticsWrapper";
import { routing } from "@/i18n/routing";
import { getLocaleMetadata } from "../seo-metadata";
import { SITE_THEME_COLOR } from "@/lib/app-ui-theme";
export const dynamic = "force-static";

export const viewport: Viewport = {
  themeColor: SITE_THEME_COLOR,
};

// 默认语言首页：使用 messages 中的本地化标题/描述 + canonical
export async function generateMetadata() {
  const locale = routing.defaultLocale;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: "seo.home" });
  const tSeo = await getTranslations({ locale, namespace: "seo" });
  
  // 从翻译文件中获取关键词字符串，转换为数组
  const keywordsString = tSeo("keywords");
  const keywords = keywordsString && typeof keywordsString === "string" && keywordsString !== "keywords" && keywordsString.trim()
    ? keywordsString.split(",").map((k: string) => k.trim()).filter(Boolean)
    : undefined;
  
  return getLocaleMetadata(locale, t("title"), t("description"), keywords);
}

export default async function DefaultLocaleLayout({ children }: { children: ReactNode }) {
  // 默认语言：不跳转 /，直接渲染英文
  setRequestLocale(routing.defaultLocale);
  const messages = await getMessages();

  const locale = routing.defaultLocale;

  return (
    <NextIntlClientProvider locale={locale} messages={messages}>
      <SiteHeader />
      <main className="min-h-screen pt-14 sm:pt-16">{children}</main>
      <SiteFooter />
      <GoogleAnalyticsWrapper />
    </NextIntlClientProvider>
  );
}

