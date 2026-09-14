"use client";

import dynamic from "next/dynamic";
import SiteHeader from "@/components/layout/SiteHeader";
import SiteFooter from "@/components/layout/SiteFooter";
import { GoogleAnalyticsWrapper } from "@/components/layout/GoogleAnalyticsWrapper";
import { ResetTechnologyTheme } from "@/components/theme/ResetTechnologyTheme";
import { Toaster } from "sonner";
import type { ReactNode } from "react";
import { useState } from "react";
import type { SiteHeaderTone } from "@/lib/constants/site-header-tone";

const UploadHistoryDrawer = dynamic(
  () =>
    import("@/components/upload/UploadHistoryDrawer").then((m) => m.UploadHistoryDrawer),
  { ssr: false }
);

const LanguageSelectTrigger = dynamic(
  () =>
    import("@/components/layout/LanguageSelectTrigger").then((m) => m.LanguageSelectTrigger),
  { ssr: false }
);

interface SiteChromeLayoutClientProps {
  children: ReactNode;
  initialHeaderTone: SiteHeaderTone;
}

/**
 * 营销站 / 工具页外壳：顶栏 + 主内容 + 页脚。
 * 与 (protected) 工作台隔离，避免侧栏布局被包进 <main> 导致左右结构失效。
 */
export function SiteChromeLayoutClient({
  children,
  initialHeaderTone,
}: SiteChromeLayoutClientProps) {
  const [historyOpen, setHistoryOpen] = useState(false);

  return (
    <>
      <ResetTechnologyTheme />
      <Toaster
        position="top-right"
        toastOptions={{
          unstyled: true,
          classNames: {
            success: "bg-green-50 text-green-800 border border-green-200",
            error: "bg-red-50 text-red-800 border border-red-200",
          },
        }}
      />
      <SiteHeader initialTone={initialHeaderTone} />
      <main className="min-h-screen">{children}</main>
      <SiteFooter onHistoryClick={() => setHistoryOpen(true)} />
      <UploadHistoryDrawer open={historyOpen} onClose={() => setHistoryOpen(false)} />
      <LanguageSelectTrigger />
      <GoogleAnalyticsWrapper />
    </>
  );
}
