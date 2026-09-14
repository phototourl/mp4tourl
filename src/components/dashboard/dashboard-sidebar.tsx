'use client';

import { AuthBackButton } from '@/components/auth/auth-back-button';
import { SidebarMain } from '@/components/dashboard/sidebar-main';
import { SidebarUser } from '@/components/dashboard/sidebar-user';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  useSidebar,
} from '@/components/ui/sidebar';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { useSidebarLinks } from '@/config/sidebar-config';
import { LocaleLink } from '@/i18n/navigation';
import { authClient } from '@/lib/auth-client';
import { cn } from '@/lib/utils';
import { Routes } from '@/routes';
import type * as React from 'react';
import { useEffect, useState } from 'react';
import Image from 'next/image';
import { useTranslations } from 'next-intl';
import { UpgradeCard } from './upgrade-card';

export function DashboardSidebar({
  ...props
}: React.ComponentProps<typeof Sidebar>) {
  const [mounted, setMounted] = useState(false);
  const [isTechTheme, setIsTechTheme] = useState(false);
  const { data: session, isPending } = authClient.useSession();
  const currentUser = session?.user;
  const { state, isMobile } = useSidebar();

  const sidebarLinks = useSidebarLinks();
  const tCommon = useTranslations('common');
  const tImages = useTranslations('images');
  const backLabel = tCommon('header.home');

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    const root = document.documentElement;
    const update = () => setIsTechTheme(root.classList.contains('ptu-theme-technology'));
    update();
    const observer = new MutationObserver(update);
    observer.observe(root, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, [mounted]);

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader
        className={cn(
          // 与右侧主顶栏同高 3.5rem；移动端 Sheet 在 portal 外吃不到 --header-height，故写死 h-14
          'h-14 min-h-14 shrink-0 justify-center gap-0 border-b border-slate-200 px-2 py-0 dark:border-slate-700'
        )}
      >
        <div className="flex h-full w-full items-center gap-2">
          <LocaleLink
            href={Routes.Root}
            className={cn(
              'ptu-sidebar-brand group flex min-h-0 min-w-0 flex-1 items-center rounded-md text-sidebar-foreground',
              !isMobile && 'transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
              state === 'collapsed' ? 'justify-center px-0' : 'gap-1 px-2'
            )}
          >
            <div
              className={cn(
                'ptu-sidebar-brand-mark relative shrink-0 overflow-hidden rounded-xl',
                state === 'collapsed' ? 'h-7 w-7' : 'h-9 w-9'
              )}
            >
              <Image
                src={isTechTheme ? '/icons/light_58x58.png' : '/icons/light_logo.png'}
                alt={tImages('logoAlt')}
                width={58}
                height={58}
                className="block h-full w-full rounded-xl object-contain"
                priority
                unoptimized
              />
            </div>
            <span
              className={cn(
                'truncate text-sm font-semibold sm:text-lg',
                state === 'collapsed' && 'hidden'
              )}
            >
              {tCommon('siteName')}
            </span>
          </LocaleLink>

          {state !== 'collapsed' ? (
            <Tooltip>
              <TooltipTrigger asChild>
                <AuthBackButton
                  size="compact"
                  ariaLabel={backLabel}
                  className="mr-0.5 shrink-0"
                />
              </TooltipTrigger>
              <TooltipContent side="right">{backLabel}</TooltipContent>
            </Tooltip>
          ) : null}
        </div>
      </SidebarHeader>

      <SidebarContent>
        {!isPending && mounted && <SidebarMain items={sidebarLinks} />}
      </SidebarContent>

      <SidebarFooter className="flex flex-col gap-4">
        {!isPending && mounted && (
          <>
            {currentUser && state !== 'collapsed' && <UpgradeCard />}
            {currentUser && <SidebarUser user={currentUser} />}
          </>
        )}
      </SidebarFooter>
    </Sidebar>
  );
}
