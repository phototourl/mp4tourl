'use client';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { LanguageSelectModal } from '@/components/layout/LanguageSelectModal';
import { useLocaleRouter } from '@/i18n/navigation';
import { authClient } from '@/lib/auth-client';
import { cn } from '@/lib/utils';
import type { User } from '@/lib/auth-types';
import { LogOut, Home, Languages, ChevronsUpDown } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { toast } from 'sonner';
import { Routes } from '@/routes';
import { LocaleLink } from '@/i18n/navigation';
import { useSidebar } from '@/components/ui/sidebar';

interface SidebarUserProps {
  user: User;
}

export function SidebarUser({ user }: SidebarUserProps) {
  const router = useLocaleRouter();
  const t = useTranslations('common');
  const [langModalOpen, setLangModalOpen] = useState(false);
  const { state, isMobile } = useSidebar();
  const isCollapsed = state === 'collapsed';
  // 移动端 / 展开侧栏：向上弹出，避免 side=right 把菜单挤到侧栏外
  const menuSide = isMobile || !isCollapsed ? 'top' : 'right';
  const avatarInitial = (user.name || user.email || 'U').trim().charAt(0).toUpperCase();

  const handleSignOut = async () => {
    await authClient.signOut({
      fetchOptions: {
        onSuccess: () => {
          router.replace('/');
        },
        onError: () => {
          toast.error(t('logoutFailed') ?? 'Sign out failed');
        },
      },
    });
  };

  return (
    <div
      className={cn(
        'ptu-sidebar-user border-t border-slate-200/70 bg-slate-100/95 pt-3 pb-2',
        /* 铺满 footer 左右/底边，和导航区拉开层次 */
        '-mx-2 -mb-2',
        isCollapsed ? 'flex justify-center px-1' : 'px-3'
      )}
    >
      <DropdownMenu modal={false}>
        <DropdownMenuTrigger className={cn(
          "flex items-center gap-2 rounded-xl p-1.5 text-sm hover:bg-[#0abab5]/10 dark:hover:bg-[#0abab5]/20 focus:outline-none focus:ring-0 focus:ring-offset-0 focus-visible:outline-none focus-visible:ring-0 focus-visible:ring-offset-0 data-[state=open]:outline-none data-[state=open]:ring-0 data-[state=open]:ring-offset-0 cursor-pointer transition-all duration-200 ease-out border-0 outline-none ring-0",
          isCollapsed ? "w-9 justify-center" : "w-full"
        )}>
          {user.image ? (
            <img
              src={user.image}
              alt={user.name ?? 'User'}
              width={28}
              height={28}
              className="h-7 w-7 rounded-full object-cover shrink-0 ring-2 ring-transparent hover:ring-brand-teal/30 transition-all duration-200 ease-out focus-visible:outline-none focus-visible:ring-0 sm:h-9 sm:w-9"
            />
          ) : (
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-brand-teal to-emerald-500 text-white font-medium text-sm ring-2 ring-transparent hover:ring-brand-teal/30 transition-all duration-200 ease-out shadow-md hover:shadow-lg hover:shadow-brand-teal/20 shrink-0 sm:h-9 sm:w-9">
              <span className="leading-none select-none">{avatarInitial}</span>
            </div>
          )}
          <div className={cn(
            "grid flex-1 text-left text-sm leading-tight",
            isCollapsed && "hidden"
          )}>
            <span className="ptu-sidebar-user-name truncate font-semibold text-slate-900 [html.ptu-theme-technology_&]:text-white" suppressHydrationWarning>{user.name}</span>
            <span className="truncate text-xs text-slate-500 dark:text-slate-400" suppressHydrationWarning>{user.email}</span>
          </div>
          {!isCollapsed && (
            <ChevronsUpDown className="ptu-sidebar-user-chevrons ml-auto size-4 shrink-0 text-slate-900 [html.ptu-theme-technology_&]:text-white" />
          )}
        </DropdownMenuTrigger>
        <DropdownMenuContent
          className="ptu-dashboard-user-menu z-[60] w-56 outline-none shadow-xl backdrop-blur-sm bg-white/95 dark:bg-slate-900/95 border border-slate-200/50 dark:border-slate-700/50 animate-in fade-in-0 zoom-in-95 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95"
          side={menuSide}
          align="end"
          sideOffset={8}
          collisionPadding={12}
          onCloseAutoFocus={(e) => e.preventDefault()}
        >
          <DropdownMenuItem className="cursor-pointer transition-all duration-200 ease-out hover:bg-gradient-to-r hover:from-brand-teal/10 hover:to-emerald-500/10 focus:bg-gradient-to-r focus:from-brand-teal/10 focus:to-emerald-500/10 rounded-md mb-1 mx-1 [&_span]:hover:text-brand-teal [&_span]:transition-colors [&_span]:duration-200" asChild>
            <LocaleLink href={Routes.Root}>
              <div className="flex items-center gap-3">
                <div className="ptu-user-menu-icon-ring flex size-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-brand-teal/20 to-emerald-500/10 shadow-sm">
                  <Home className="size-[18px] text-brand-teal transition-transform duration-200 hover:scale-110" />
                </div>
                <span className="text-slate-700 dark:text-slate-200 font-medium">{t('header.home')}</span>
              </div>
            </LocaleLink>
          </DropdownMenuItem>
          <DropdownMenuSeparator className="bg-gradient-to-r from-transparent via-slate-200/50 to-transparent dark:via-slate-700/50" />
          <DropdownMenuItem
            className="cursor-pointer transition-all duration-200 ease-out hover:bg-gradient-to-r hover:from-brand-teal/10 hover:to-emerald-500/10 focus:bg-gradient-to-r focus:from-brand-teal/10 focus:to-emerald-500/10 rounded-md my-1 mx-1 [&_span]:hover:text-brand-teal [&_span]:transition-colors [&_span]:duration-200"
            onClick={() => setLangModalOpen(true)}
          >
            <div className="flex items-center gap-3">
              <div className="ptu-user-menu-icon-ring flex size-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-brand-teal/20 to-emerald-500/10 shadow-sm">
                <Languages className="size-[18px] text-brand-teal transition-transform duration-200 hover:scale-110" />
              </div>
              <span className="text-slate-700 dark:text-slate-200 font-medium">{t('switchLanguage')}</span>
            </div>
          </DropdownMenuItem>
          <DropdownMenuSeparator className="bg-gradient-to-r from-transparent via-slate-200/50 to-transparent dark:via-slate-700/50" />
          <DropdownMenuItem
            className="cursor-pointer text-red-600 dark:text-red-400 transition-all duration-200 ease-out hover:bg-gradient-to-r hover:from-red-50 hover:to-red-100/50 dark:hover:from-red-900/20 dark:hover:to-red-900/10 focus:bg-gradient-to-r focus:from-red-50 focus:to-red-100/50 dark:focus:from-red-900/20 dark:focus:to-red-900/10 rounded-md mt-1 mx-1 [&_span]:hover:text-red-700 [&_span]:dark:hover:text-red-300 [&_span]:transition-colors [&_span]:duration-200"
            onClick={async (event) => {
              event.preventDefault();
              handleSignOut();
            }}
          >
            <div className="flex items-center gap-3">
              <div className="ptu-user-menu-icon-ring flex size-8 shrink-0 items-center justify-center rounded-lg bg-red-50 dark:bg-red-900/20 shadow-sm">
                <LogOut className="size-[18px] text-red-500 transition-transform duration-200 hover:scale-110" />
              </div>
              <span className="text-red-600 dark:text-red-400 font-medium">{t('header.signOut')}</span>
            </div>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <LanguageSelectModal
        open={langModalOpen}
        onClose={() => setLangModalOpen(false)}
        useDashboardTechAppearance
      />
    </div>
  );
}
