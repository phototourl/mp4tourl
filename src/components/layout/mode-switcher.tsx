'use client';

import { Button } from '@/components/ui/button';
import { websiteConfig } from '@/config/website';
import { useMounted } from '@/hooks/use-mounted';
import { MoonIcon, SunIcon } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useTheme } from 'next-themes';

/**
 * Mode switcher — click to toggle light/dark (same as editstamp).
 */
export function ModeSwitcher() {
  if (!websiteConfig.ui.mode?.enableSwitch) {
    return null;
  }

  const { resolvedTheme, setTheme } = useTheme();
  const mounted = useMounted();
  const t = useTranslations('Common.mode');
  const isDark = resolvedTheme === 'dark';

  if (!mounted) {
    return (
      <Button
        variant="ghost"
        size="sm"
        className="size-8 p-0.5 border border-border rounded-full cursor-pointer"
        aria-label={t('label')}
        disabled
      >
        <MoonIcon className="size-4 opacity-0" aria-hidden />
      </Button>
    );
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      className="size-8 p-0.5 border border-border rounded-full cursor-pointer"
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
      aria-label={t('label')}
      title={isDark ? t('light') : t('dark')}
    >
      <SunIcon className="rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
      <MoonIcon className="absolute rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
      <span className="sr-only">{t('label')}</span>
    </Button>
  );
}
