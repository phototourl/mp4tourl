import { NextIntlClientProvider } from "next-intl";
import { getMessages, setRequestLocale, getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import { routing, type AppLocale } from "@/i18n/routing";
import type { ReactNode } from "react";
import { getLocaleMetadata } from "../seo-metadata";

// Allow dynamic rendering for proper locale updates

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

// 多语言路由：为不同 locale 输出对应 canonical / OG url + 本地化 title/description/keywords
export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "seo.home" });
  const tKeywords = await getTranslations({ locale, namespace: "seo" });

  const keywordsString = tKeywords("keywords") || "";
  const keywords = keywordsString
    ? keywordsString.split(",").map((k: string) => k.trim()).filter(Boolean)
    : undefined;

  return getLocaleMetadata(locale, t("title"), t("description"), keywords);
}

interface LocaleLayoutProps {
  children: ReactNode;
  params: Promise<{ locale: string }>;
}

/**
 * 仅负责 next-intl 与合法 locale；站点外壳在 (site)/layout，工作台外壳在 (protected)/layout。
 */
export default async function LocaleLayout({
  children,
  params,
}: LocaleLayoutProps) {
  const { locale } = await params;

  if (!routing.locales.includes(locale as AppLocale)) {
    notFound();
  }

  setRequestLocale(locale);
  const messages = await getMessages();

  return (
    <NextIntlClientProvider locale={locale} messages={messages}>
      {children}
    </NextIntlClientProvider>
  );
}
