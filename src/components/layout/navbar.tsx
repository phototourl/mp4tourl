'use client';

import { LoginWrapper } from '@/components/auth/login-wrapper';
import Container from '@/components/layout/container';
import { Logo } from '@/components/layout/logo';
import { ModeSwitcher } from '@/components/layout/mode-switcher';
import { NavbarMobile } from '@/components/layout/navbar-mobile';
import { UserButton } from '@/components/layout/user-button';
import { Button, buttonVariants } from '@/components/ui/button';
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  navigationMenuTriggerStyle,
} from '@/components/ui/navigation-menu';
import { useNavbarLinks } from '@/config/navbar-config';
import { useScroll } from '@/hooks/use-scroll';
import { LocaleLink, useLocalePathname } from '@/i18n/navigation';
import { authClient } from '@/lib/auth-client';
import { cn } from '@/lib/utils';
import { Routes } from '@/routes';
import { ArrowUpRightIcon } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';
import { Skeleton } from '../ui/skeleton';
import LocaleSwitcher from './locale-switcher';

interface NavBarProps {
  scroll?: boolean;
}

const customNavigationMenuTriggerStyle = cn(
  navigationMenuTriggerStyle(),
  'relative bg-transparent text-muted-foreground cursor-pointer no-underline shadow-none',
  'hover:bg-accent hover:text-foreground',
  'focus:bg-transparent focus:text-muted-foreground',
  'focus-visible:ring-0 focus-visible:outline-none',
  'data-active:font-semibold data-active:bg-transparent data-active:text-foreground',
  'data-[active=true]:bg-transparent data-[active=true]:text-foreground data-[active=true]:hover:bg-accent data-[active=true]:focus:bg-transparent',
  'data-[state=open]:bg-transparent data-[state=open]:text-foreground'
);

export function Navbar({ scroll }: NavBarProps) {
  const t = useTranslations();
  const scrolled = useScroll(50);
  const menuLinks = useNavbarLinks();
  const localePathname = useLocalePathname();
  const [mounted, setMounted] = useState(false);
  const [hash, setHash] = useState('');
  const { data: session, isPending } = authClient.useSession();
  const currentUser = session?.user;

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const syncHash = () => setHash(window.location.hash);
    syncHash();
    window.addEventListener('hashchange', syncHash);
    window.addEventListener('popstate', syncHash);
    return () => {
      window.removeEventListener('hashchange', syncHash);
      window.removeEventListener('popstate', syncHash);
    };
  }, [localePathname]);

  const isNavActive = (href?: string) => {
    if (!href) return false;
    const hashIndex = href.indexOf('#');
    // In-page anchors (e.g. FAQ /#faqs) — only that item, not Home too
    if (hashIndex >= 0) {
      return localePathname === '/' && hash === href.slice(hashIndex);
    }
    // Home: landing root with no section hash
    if (href === '/' || href === Routes.Root) {
      return localePathname === '/' && !hash;
    }
    return localePathname.startsWith(href);
  };

  const scrollToTop = () => {
    if (window.location.hash) {
      const path = window.location.pathname + window.location.search;
      window.history.replaceState(null, '', path);
      setHash('');
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  /** App Router often delays/skips hashchange — set active state immediately */
  const onNavClick = (href?: string) => {
    if (!href) return;
    if (href === Routes.Root || href === '/') {
      scrollToTop();
      return;
    }
    const hashIndex = href.indexOf('#');
    if (hashIndex >= 0) {
      const nextHash = href.slice(hashIndex);
      setHash(nextHash);
      // Ensure URL + scroll even when already on home
      window.requestAnimationFrame(() => {
        if (window.location.hash !== nextHash) {
          window.location.hash = nextHash;
        }
      });
    }
  };

  return (
    <section
      className={cn(
        'sticky inset-x-0 top-0 z-40 py-4 transition-all duration-300',
        scroll
          ? scrolled
            ? 'bg-muted/50 backdrop-blur-md border-b supports-backdrop-filter:bg-muted/50'
            : 'bg-transparent'
          : 'border-b bg-muted/50'
      )}
    >
      <Container className="px-4">
        {/* desktop navbar */}
        <nav className="hidden lg:flex">
          {/* logo and name */}
          <div className="flex items-center">
            <LocaleLink
              href="/"
              className="flex items-center space-x-2"
              onClick={scrollToTop}
            >
              <Logo />
              <span className="text-xl font-semibold">
                {t('Metadata.name')}
              </span>
            </LocaleLink>
          </div>

          {/* menu links */}
          <div className="flex-1 flex items-center justify-center space-x-2">
            <NavigationMenu className="relative" viewport={false}>
              <NavigationMenuList className="flex items-center gap-3">
                {menuLinks?.map((item, index) =>
                  item.items ? (
                    <NavigationMenuItem key={index} className="relative">
                      <NavigationMenuTrigger
                        data-active={
                          item.items.some((subItem) =>
                            subItem.href
                              ? isNavActive(subItem.href)
                              : false
                          )
                            ? 'true'
                            : undefined
                        }
                        className={customNavigationMenuTriggerStyle}
                      >
                        {item.title}
                      </NavigationMenuTrigger>
                      <NavigationMenuContent>
                        <ul className="grid w-[400px] gap-4 p-4 md:w-[500px] md:grid-cols-2 lg:w-[600px]">
                          {item.items?.map((subItem, subIndex) => {
                            const isSubItemActive = isNavActive(subItem.href);
                            return (
                              <li key={subIndex}>
                                <NavigationMenuLink asChild>
                                  <LocaleLink
                                    href={subItem.href || '#'}
                                    target={
                                      subItem.external ? '_blank' : undefined
                                    }
                                    rel={
                                      subItem.external
                                        ? 'noopener noreferrer'
                                        : undefined
                                    }
                                    className={cn(
                                      'group flex select-none flex-row items-center gap-4 rounded-md',
                                      'p-2 leading-none no-underline outline-hidden transition-colors',
                                      'hover:bg-accent hover:text-accent-foreground',
                                      'focus:bg-accent focus:text-accent-foreground',
                                      isSubItemActive &&
                                        'bg-accent text-accent-foreground'
                                    )}
                                  >
                                    <div
                                      className={cn(
                                        'flex size-8 shrink-0 items-center justify-center transition-colors',
                                        'bg-transparent text-muted-foreground',
                                        'group-hover:bg-transparent group-hover:text-accent-foreground',
                                        'group-focus:bg-transparent group-focus:text-accent-foreground',
                                        isSubItemActive &&
                                          'bg-transparent text-accent-foreground'
                                      )}
                                    >
                                      {subItem.icon ? subItem.icon : null}
                                    </div>
                                    <div className="flex-1">
                                      <div
                                        className={cn(
                                          'text-sm font-medium text-muted-foreground',
                                          'group-hover:bg-transparent group-hover:text-accent-foreground',
                                          'group-focus:bg-transparent group-focus:text-accent-foreground',
                                          isSubItemActive &&
                                            'bg-transparent text-accent-foreground'
                                        )}
                                      >
                                        {subItem.title}
                                      </div>
                                      {subItem.description && (
                                        <div
                                          className={cn(
                                            'text-sm text-muted-foreground',
                                            'group-hover:bg-transparent group-hover:text-accent-foreground/80',
                                            'group-focus:bg-transparent group-focus:text-accent-foreground/80',
                                            isSubItemActive &&
                                              'bg-transparent text-accent-foreground/80'
                                          )}
                                        >
                                          {subItem.description}
                                        </div>
                                      )}
                                    </div>
                                    {subItem.external && (
                                      <ArrowUpRightIcon
                                        className={cn(
                                          'size-4 shrink-0 text-muted-foreground',
                                          'group-hover:bg-transparent group-hover:text-accent-foreground',
                                          'group-focus:bg-transparent group-focus:text-accent-foreground',
                                          isSubItemActive &&
                                            'bg-transparent text-accent-foreground'
                                        )}
                                      />
                                    )}
                                  </LocaleLink>
                                </NavigationMenuLink>
                              </li>
                            );
                          })}
                        </ul>
                      </NavigationMenuContent>
                    </NavigationMenuItem>
                  ) : (
                    <NavigationMenuItem key={index}>
                      <NavigationMenuLink
                        asChild
                        active={isNavActive(item.href)}
                        className={customNavigationMenuTriggerStyle}
                      >
                        <LocaleLink
                          href={item.href || '#'}
                          target={item.external ? '_blank' : undefined}
                          rel={
                            item.external ? 'noopener noreferrer' : undefined
                          }
                          className="no-underline"
                          onClick={() => onNavClick(item.href)}
                        >
                          {item.title}
                        </LocaleLink>
                      </NavigationMenuLink>
                    </NavigationMenuItem>
                  )
                )}
              </NavigationMenuList>
            </NavigationMenu>
          </div>

          {/* 右侧：主题 → 语言 → 账号/登录注册（与 editstamp 一致） */}
          <div className="flex items-center gap-x-3">
            <ModeSwitcher />
            <LocaleSwitcher />

            {!mounted || isPending ? (
              <Skeleton className="h-9 w-44 rounded-full" />
            ) : currentUser ? (
              <UserButton user={currentUser} />
            ) : (
              <div className="flex items-center gap-x-3">
                <LoginWrapper mode="modal" asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="cursor-pointer"
                  >
                    {t('Common.login')}
                  </Button>
                </LoginWrapper>

                <LocaleLink
                  href={Routes.Register}
                  className={cn(
                    buttonVariants({
                      variant: 'default',
                      size: 'sm',
                    })
                  )}
                >
                  {t('Common.signUp')}
                </LocaleLink>
              </div>
            )}
          </div>
        </nav>

        {/* mobile navbar */}
        <NavbarMobile className="lg:hidden" />
      </Container>
    </section>
  );
}
