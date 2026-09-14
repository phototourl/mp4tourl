'use client';

import type { NestedMenuItem } from '@/types';
import {
  BellIcon,
  CircleUserRoundIcon,
  CreditCardIcon,
  LayoutDashboard,
  LockKeyholeIcon,
  Settings2Icon,
} from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Routes } from '@/routes';

export function useSidebarLinks(): NestedMenuItem[] {
  const t = useTranslations('Dashboard');

  return [
    {
      title: t('title') ?? 'Dashboard',
      icon: <LayoutDashboard className="size-4 shrink-0" />,
      href: Routes.Dashboard,
      external: false,
    },
    {
      title: t('settings.title') ?? 'Settings',
      icon: <Settings2Icon className="size-4 shrink-0" />,
      items: [
        {
          title: t('settings.profile.title') ?? 'Profile',
          icon: <CircleUserRoundIcon className="size-4 shrink-0" />,
          href: Routes.SettingsProfile,
          external: false,
        },
        {
          title: t('settings.billing.title') ?? 'Billing',
          icon: <CreditCardIcon className="size-4 shrink-0" />,
          href: Routes.SettingsBilling,
          external: false,
        },
        {
          title: t('settings.security.title') ?? 'Security',
          icon: <LockKeyholeIcon className="size-4 shrink-0" />,
          href: Routes.SettingsSecurity,
          external: false,
        },
        {
          title: t('settings.notification.title') ?? 'Notification',
          icon: <BellIcon className="size-4 shrink-0" />,
          href: Routes.SettingsNotifications,
          external: false,
        },
      ],
    },
  ];
}
