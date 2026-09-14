'use client';

import { Button } from '@/components/ui/button';
import { websiteConfig } from '@/config/website';
import { cn } from '@/lib/utils';
import { MoonIcon, SunIcon } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';

/**
 * Mode switcher for footer — single toggle like editstamp.
 */
export function ModeSwitcherHorizontal() {
  if (!websiteConfig.ui.mode?.enableSwitch) {
    return null;
  }

  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const t = useTranslations('Common.mode');
  const isDark = resolvedTheme === 'dark';

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="flex items-center gap-2 rounded-full border p-1">
        <div className="size-6 px-0 rounded-full" />
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 rounded-full border p-1">
      <Button
        variant="ghost"
        size="icon"
        className={cn(
          'size-6 px-0 rounded-full cursor-pointer',
          'bg-muted text-foreground'
        )}
        onClick={() => setTheme(isDark ? 'light' : 'dark')}
        aria-label={t('label')}
        title={isDark ? t('light') : t('dark')}
      >
        {isDark ? (
          <SunIcon className="size-4" />
        ) : (
          <MoonIcon className="size-4" />
        )}
      </Button>
    </div>
  );
}
