'use client';

import { Routes } from '@/routes';
import type { NestedMenuItem } from '@/types';
import { useTranslations } from 'next-intl';

/**
 * Nav mirrors VideoToURL: Upload / Features / How to Use / FAQ
 */
export function useNavbarLinks(): NestedMenuItem[] {
  const t = useTranslations('Marketing.navbar');

  return [
    {
      title: t('upload.title'),
      href: Routes.Upload,
      external: false,
    },
    {
      title: t('features.title'),
      href: Routes.Features,
      external: false,
    },
    {
      title: t('howToUse.title'),
      href: Routes.HowToUse,
      external: false,
    },
    {
      title: t('faq.title'),
      href: Routes.FAQ,
      external: false,
    },
  ];
}
