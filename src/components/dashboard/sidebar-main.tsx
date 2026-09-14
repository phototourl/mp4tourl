'use client';

import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '@/components/ui/sidebar';
import { LocaleLink, useLocalePathname } from '@/i18n/navigation';
import type { NestedMenuItem } from '@/types';

export function SidebarMain({ items }: { items: NestedMenuItem[] }) {
  const pathname = useLocalePathname();
  const { setOpenMobile } = useSidebar();

  const isActive = (href: string | undefined): boolean => {
    if (!href) return false;
    return pathname === href || pathname.startsWith(href + '/');
  };

  const handleLinkClick = () => {
    setOpenMobile(false);
  };

  return (
    <>
      {items.map((item) =>
        item.items && item.items.length > 0 ? (
          <SidebarGroup key={item.title}>
            <SidebarGroupLabel>{item.title}</SidebarGroupLabel>
            <SidebarGroupContent className="flex flex-col gap-2">
              <SidebarMenu>
                {item.items.map((subItem) => (
                  <SidebarMenuItem key={subItem.title}>
                    <SidebarMenuButton
                      isActive={isActive(subItem.href)}
                      className="w-full transition-all duration-200 ease-out"
                    >
                      <LocaleLink
                        href={subItem.href || ''}
                        onClick={handleLinkClick}
                        className="flex h-full w-full items-center gap-2 group-data-[collapsible=icon]:w-auto group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:gap-0"
                      >
                        {subItem.icon ? subItem.icon : null}
                        <span className="truncate font-medium text-sm group-data-[collapsible=icon]:hidden">
                          {subItem.title}
                        </span>
                      </LocaleLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ) : (
          <SidebarGroup key={item.title}>
            <SidebarGroupContent className="flex flex-col gap-2">
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton
                    isActive={isActive(item.href)}
                    className="w-full transition-all duration-200 ease-out"
                  >
                    <LocaleLink
                      href={item.href || ''}
                      onClick={handleLinkClick}
                      className="flex h-full w-full items-center gap-2 group-data-[collapsible=icon]:w-auto group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:gap-0"
                    >
                      {item.icon ? item.icon : null}
                      <span className="truncate font-medium text-sm group-data-[collapsible=icon]:hidden">
                        {item.title}
                      </span>
                    </LocaleLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )
      )}
    </>
  );
}
