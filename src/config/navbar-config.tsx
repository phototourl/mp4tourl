'use client';

import { Routes } from '@/routes';
import type { NestedMenuItem } from '@/types';
import { useTranslations } from 'next-intl';

/**
 * Nav: Home / FAQ / About / Contact
 * (Upload + Features + How to Use merged into Home)
 */
export function useNavbarLinks(): NestedMenuItem[] {
  const t = useTranslations('Marketing.navbar');

  return [
    {
      title: t('home.title'),
      href: Routes.Root,
      external: false,
    },
    {
      title: t('faq.title'),
      href: Routes.FAQ,
      external: false,
    },
    {
      title: t('about.title'),
      href: Routes.About,
      external: false,
    },
    {
      title: t('contact.title'),
      href: Routes.Contact,
      external: false,
    },
  ];
}
