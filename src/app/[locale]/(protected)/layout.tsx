import { ApplyPendingUserType } from '@/components/auth/apply-pending-user-type';
import { DashboardBrowserChrome } from '@/components/dashboard/dashboard-browser-chrome';
import { DashboardSidebar } from '@/components/dashboard/dashboard-sidebar';
import { LanguageSelectTrigger } from '@/components/layout/LanguageSelectTrigger';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import { TooltipProvider } from '@/components/ui/tooltip';
import { Toaster } from 'sonner';
import { GoogleAnalyticsWrapper } from '@/components/layout/GoogleAnalyticsWrapper';
import type { CSSProperties, PropsWithChildren } from 'react';
import { setRequestLocale } from 'next-intl/server';

/**
 * 工作台页面需要登录，不能静态生成（middleware 在构建时无 session）
 */
export const dynamic = 'force-dynamic';

/**
 * 工作台：仅侧栏 + 内容区，无营销顶栏/页脚，避免破坏左右分栏。
 * 样式参考同仓库 editstamp：`(protected)/layout` + dashboard-01 浅灰底 + 白内容卡片。
 */
export default async function ProtectedLayout({ children, params }: PropsWithChildren & { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <TooltipProvider>
      <DashboardBrowserChrome />
      <Toaster richColors position="top-center" />
      <SidebarProvider
        data-dashboard-shell
        style={
          {
            '--sidebar-width': '18rem',
            /** 折叠为图标栏时的轨道宽度（默认 3rem 偏窄，略加宽便于点击与对齐） */
            '--sidebar-width-icon': '4.5rem',
            '--header-height': '3.5rem',
          } as CSSProperties
        }
      >
        <DashboardSidebar variant="inset" />
        {/**
         * inset 侧栏时 SidebarInset 默认带 md:m-2 + 圆角，主区四周会露出 wrapper 底色，浅灰无法「通铺」到边缘。
         * 去掉 inset 外边距/圆角，并用一层 flex 列保证 min-height 撑满视口，头部以下背景连续铺满。
         */}
        <SidebarInset className="flex h-[100svh] min-h-0 flex-1 flex-col overflow-x-hidden overflow-y-hidden bg-[#f9fafb] dark:bg-background md:peer-data-[variant=inset]:m-0 md:peer-data-[variant=inset]:ml-0 md:peer-data-[variant=inset]:rounded-none md:peer-data-[variant=inset]:shadow-none md:peer-data-[variant=inset]:peer-data-[state=collapsed]:ml-0">
          {/**
           * 必须用固定视口高度（100svh），仅用 min-h-svh 时主栏高度会随内容变矮，body 白底会在底部露出。
           * 内层 flex-1 + overflow-y-auto：长页面在栏内滚动，浅灰始终铺满主栏。
           */}
          <div
            data-dashboard-main-scroll
            className="flex min-h-0 flex-1 flex-col overflow-y-auto bg-[#f9fafb] pb-[max(1rem,env(safe-area-inset-bottom,0px))] dark:bg-background"
          >
            {children}
          </div>
        </SidebarInset>
      </SidebarProvider>
      {/* 工作台：统计 / 首次语言引导（首页 Schema 不挂在此，避免误标 FAQ/HowTo） */}
      <LanguageSelectTrigger />
      <GoogleAnalyticsWrapper />
      <ApplyPendingUserType />
    </TooltipProvider>
  );
}
