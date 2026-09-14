"use client";

import { useTranslations } from "next-intl";
import { LogOut, LogInIcon, UserPlus, Home, Settings, ChevronDown } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { LoginWrapper } from "@/components/auth/login-wrapper";
import { buttonVariants } from "@/components/ui/button";
import { LocaleLink, useLocalePathname } from "@/i18n/navigation";
import { getNavbarLoginCallbackUrl } from "@/lib/auth/navbar-login-callback";
import { authClient } from "@/lib/auth-client";
import { cn } from "@/lib/utils";
import { Routes } from "@/routes";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import type { SiteHeaderTone } from "@/lib/constants/site-header-tone";

type HeaderRightProps = {
  tone?: SiteHeaderTone;
};

export function HeaderRight({ tone = "white" }: HeaderRightProps) {
  const pathname = usePathname();
  const [sessionReady, setSessionReady] = useState(false);

  useEffect(() => {
    // Home first paint: defer session request to idle time.
    const isHome =
      pathname === "/" ||
      /^\/[a-z]{2}(?:-[A-Z]{2})?$/.test(pathname || "");
    if (!isHome) {
      setSessionReady(true);
      return;
    }
    const ric = (window as Window & {
      requestIdleCallback?: (cb: () => void, opts?: { timeout: number }) => number;
      cancelIdleCallback?: (id: number) => void;
    }).requestIdleCallback;
    if (ric) {
      const id = ric(() => setSessionReady(true), { timeout: 1200 });
      return () => {
        const cancel = (window as Window & { cancelIdleCallback?: (id: number) => void }).cancelIdleCallback;
        cancel?.(id);
      };
    }
    const timer = window.setTimeout(() => setSessionReady(true), 500);
    return () => window.clearTimeout(timer);
  }, [pathname]);

  if (!sessionReady) {
    return (
      <div
        className="h-7 min-w-[4.5rem] shrink-0 sm:h-9 sm:min-w-[10rem]"
        aria-hidden
      />
    );
  }

  return <HeaderRightWithSession tone={tone} />;
}

function HeaderRightWithSession({ tone = "white" }: HeaderRightProps) {
  const t = useTranslations("common");
  const localePathname = useLocalePathname();
  const { data: session, isPending } = authClient.useSession();
  const currentUser = session?.user ?? null;
  /** 只挡首屏；焦点回流时的 pending 不得卸载 LoginWrapper（否则弹框 open 状态丢失） */
  const [sessionResolved, setSessionResolved] = useState(false);

  useEffect(() => {
    if (!isPending) setSessionResolved(true);
  }, [isPending]);

  const handleSignOut = async () => {
    await authClient.signOut({
      fetchOptions: {
        onSuccess: () => {
          window.location.href = "/";
        },
      },
    });
  };

  if (!sessionResolved) {
    return (
      <div
        className="h-7 min-w-[4.5rem] shrink-0 sm:h-9 sm:min-w-[10rem]"
        aria-hidden
      />
    );
  }

  if (currentUser) {
    const initial = currentUser.name?.charAt(0).toUpperCase() || 'U';

    return (
      <DropdownMenu modal={false}>
        <DropdownMenuTrigger className="group flex h-8 items-center gap-2 sm:h-10 sm:rounded-full sm:bg-slate-100/80 sm:px-3 sm:py-1 sm:hover:bg-slate-200/80 sm:dark:bg-slate-800/80 sm:dark:hover:bg-slate-700/80 transition-all duration-200 ease-out !focus:outline-none !focus:ring-0 !focus:ring-offset-0 !focus-visible:outline-none !focus-visible:ring-0 !focus-visible:ring-offset-0" style={{ outline: 'none', boxShadow: 'none' }}>
          {currentUser.image ? (
            <img
              src={currentUser.image}
              alt={currentUser.name ?? 'User'}
              className="h-7 w-7 rounded-full object-cover ring-2 ring-transparent hover:ring-brand-teal/30 transition-all duration-200 ease-out shrink-0 sm:h-8 sm:w-8"
            />
          ) : (
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-brand-teal to-emerald-500 text-xs font-medium text-white ring-2 ring-transparent transition-all duration-200 ease-out hover:ring-brand-teal/30 sm:h-8 sm:w-8 sm:text-sm">
              {initial}
            </div>
          )}
          <div className="hidden sm:flex min-w-0 items-center gap-1.5 shrink-0">
            <div className="flex min-w-0 flex-col items-start leading-snug">
              <span className="max-w-[10rem] truncate text-sm font-medium text-slate-900 dark:text-slate-100">{currentUser.name}</span>
              <span className="max-w-[10rem] truncate text-xs text-slate-500">{currentUser.email}</span>
            </div>
            <ChevronDown className="h-3.5 w-3.5 shrink-0 text-slate-500 transition-transform duration-200 ease-out group-data-[state=open]:rotate-180" />
          </div>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56 shadow-xl backdrop-blur-sm bg-white/95 dark:bg-slate-900/95 border border-slate-200/50 dark:border-slate-700/50 animate-in fade-in-0 zoom-in-95 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[side=bottom]:slide-in-from-top-2">
          <DropdownMenuItem asChild>
            <LocaleLink href={Routes.Dashboard} className="cursor-pointer hover:bg-gradient-to-r hover:from-brand-teal/10 hover:to-emerald-500/10 transition-all duration-200 ease-out rounded-md mx-1 [&_span]:hover:text-brand-teal [&_span]:transition-colors [&_span]:duration-200">
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-br from-brand-teal/20 to-emerald-500/10 shadow-sm">
                  <Home className="size-[18px] text-brand-teal transition-transform duration-200 hover:scale-110" />
                </div>
                <span className="text-slate-700 dark:text-slate-200 font-medium">{t("header.dashboard") || "Dashboard"}</span>
              </div>
            </LocaleLink>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <LocaleLink href={Routes.SettingsProfile} className="cursor-pointer hover:bg-gradient-to-r hover:from-brand-teal/10 hover:to-emerald-500/10 transition-all duration-200 ease-out rounded-md mx-1 [&_span]:hover:text-brand-teal [&_span]:transition-colors [&_span]:duration-200">
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-br from-brand-teal/20 to-emerald-500/10 shadow-sm">
                  <Settings className="size-[18px] text-brand-teal transition-transform duration-200 hover:scale-110" />
                </div>
                <span className="text-slate-700 dark:text-slate-200 font-medium">{t("header.settings")}</span>
              </div>
            </LocaleLink>
          </DropdownMenuItem>
          <DropdownMenuSeparator className="bg-gradient-to-r from-transparent via-slate-200/50 to-transparent dark:via-slate-700/50" />
          <DropdownMenuItem
            className="cursor-pointer hover:bg-gradient-to-r hover:from-red-50 hover:to-red-100/50 dark:hover:from-red-900/20 dark:hover:to-red-900/10 transition-all duration-200 ease-out rounded-md mx-1 [&_span]:hover:text-red-600 [&_span]:dark:hover:text-red-300 [&_span]:transition-colors [&_span]:duration-200"
            onSelect={handleSignOut}
          >
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-red-50 dark:bg-red-900/20 shadow-sm">
                <LogOut className="size-[18px] text-red-500 transition-transform duration-200 hover:scale-110" />
              </div>
              <span className="text-red-500 font-medium">{t("header.signOut") || "Sign out"}</span>
            </div>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  /* 尺寸与色调无关：移动端紧凑 h-7，桌面 sm:h-8；样式 class 放前面，尺寸放最后以免被 buttonVariants 盖掉 */
  const onGradient = tone === "gradient";
  const authBtnSize =
    "h-7 w-7 shrink-0 gap-1.5 p-0 sm:h-8 sm:w-auto sm:px-3";

  return (
    <div className="flex items-center gap-1.5 sm:gap-3">
      <LoginWrapper callbackUrl={getNavbarLoginCallbackUrl(localePathname)}>
        <button
          type="button"
          className={cn(
            "inline-flex cursor-pointer items-center justify-center rounded-[min(var(--radius-md),12px)] text-xs font-medium transition",
            onGradient
              ? "border border-white/80 bg-white/10 text-white hover:bg-white/20"
              : cn(
                  buttonVariants({ variant: "outline", size: "sm" }),
                  "hover:bg-teal-50 hover:text-[#0abab5]"
                ),
            authBtnSize
          )}
        >
          <LogInIcon className="h-3.5 w-3.5 shrink-0" />
          <span className="hidden sm:inline whitespace-nowrap">
            {t("header.login") || "Sign in"}
          </span>
        </button>
      </LoginWrapper>
      <LocaleLink
        href={Routes.Register}
        className={cn(
          "inline-flex items-center justify-center rounded-[min(var(--radius-md),12px)] text-xs font-medium transition",
          onGradient
            ? "border border-white bg-white text-[#0abab5] hover:bg-white/90"
            : cn(
                buttonVariants({ variant: "default", size: "sm" }),
                "border border-[#0abab5] hover:border-[#09a8a3] hover:bg-[#09a8a3]"
              ),
          authBtnSize
        )}
      >
        <UserPlus className="h-3.5 w-3.5 shrink-0" />
        <span className="hidden sm:inline whitespace-nowrap">
          {t("header.signUp") || "Sign up"}
        </span>
      </LocaleLink>
    </div>
  );
}
