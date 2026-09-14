import "./globals.css";
import type { Metadata } from "next";
import Script from "next/script";
import { baseMetadata } from "./seo-metadata";
import type { ReactNode } from "react";
import localFont from "next/font/local";
import { getLocale } from "next-intl/server";
import { routing } from "@/i18n/routing";
import { PaidSubscriberAdsenseCleanup } from "@/components/layout/PaidSubscriberAdsenseCleanup";
import { shouldServeGoogleAdsense } from "@/lib/ads/should-serve-google-adsense";
import { DASHBOARD_THEME_INIT_SCRIPT } from "@/lib/dashboard-theme-init-script";

const RTL_LOCALES = new Set(["ar", "he"]);

function dirForLocale(locale: string): "ltr" | "rtl" {
  return RTL_LOCALES.has(locale) ? "rtl" : "ltr";
}

export const metadata: Metadata = baseMetadata;

// 只加载必要的字体变体以提升性能
const inter = localFont({
  src: [
    { path: "./api/image/Inter/Inter-Regular.ttf", weight: "400", style: "normal" },
    { path: "./api/image/Inter/Inter-Medium.ttf", weight: "500", style: "normal" },
    { path: "./api/image/Inter/Inter-SemiBold.ttf", weight: "600", style: "normal" },
    { path: "./api/image/Inter/Inter-Bold.ttf", weight: "700", style: "normal" },
  ],
  display: "swap",
  // 移动端：减少与 LCP 争抢带宽；Inter 仍会通过 className 加载
  preload: false,
  fallback: ["system-ui", "arial"],
});

/**
 * 根布局只负责提供 <html><body> 与全局样式/字体。
 * 具体的 i18n Provider + Header/Footer 由 app/(default)/layout.tsx 与 app/[locale]/layout.tsx 提供。
 */
export default async function RootLayout({ children }: { children: ReactNode }) {
  let locale: string = routing.defaultLocale;
  try {
    locale = await getLocale();
  } catch {
    /* 无请求上下文（如部分静态分析）时回退 */
  }
  const dir = dirForLocale(locale);

  /** AdSense 发布商 ID（公开）；本地可不设 .env，与 Google 控制台一致即可 */
  const ADSENSE_CLIENT =
    process.env.NEXT_PUBLIC_GOOGLE_ADSENSE_CLIENT_ID ?? "ca-pub-4341915232925745";
  const serveAdsense = await shouldServeGoogleAdsense();

  return (
    <html lang={locale} dir={dir} suppressHydrationWarning>
      <head>
        {serveAdsense && (
          <>
            <meta name="google-adsense-account" content={ADSENSE_CLIENT} />
            <script
              async
              src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${encodeURIComponent(ADSENSE_CLIENT)}`}
              crossOrigin="anonymous"
            />
          </>
        )}
        <link rel="icon" href="/favicon.png" type="image/png" />
        <link rel="shortcut icon" href="/favicon.png" />
        <link rel="manifest" href="/site.webmanifest" />
        <link rel="dns-prefetch" href="https://cdn.jsdelivr.net" />
        <link rel="preconnect" href="https://cdn.jsdelivr.net" crossOrigin="anonymous" />

      </head>
      <body className={`${inter.className} bg-white text-slate-900`}>
        <Script id="ptu-dashboard-theme-init" strategy="beforeInteractive">
          {DASHBOARD_THEME_INIT_SCRIPT}
        </Script>
        <PaidSubscriberAdsenseCleanup />
        {children}
        {/* Social Bar (28988956) disabled: low revenue, covers Login/Sign Up */}
      </body>
    </html>
  );
}
