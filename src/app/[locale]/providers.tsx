'use client';

import { PostHogProvider } from '@/analytics/posthog-analytics';
import { ActiveThemeProvider } from '@/components/layout/active-theme-provider';
import { QueryProvider } from '@/components/providers/query-provider';
import { TooltipProvider } from '@/components/ui/tooltip';
import { websiteConfig } from '@/config/website';
import { ThemeProvider } from 'next-themes';
import type { ReactNode } from 'react';

interface ProvidersProps {
  children: ReactNode;
  locale: string;
}

/**
 * Providers
 *
 * - PostHogProvider: analytics
 * - QueryProvider: React Query
 * - ThemeProvider / ActiveThemeProvider: theme
 * - TooltipProvider: tooltips
 */
export function Providers({ children }: ProvidersProps) {
  const defaultMode = websiteConfig.ui.mode?.defaultMode ?? 'system';

  return (
    <PostHogProvider>
      <QueryProvider>
        <ThemeProvider
          attribute="class"
          defaultTheme={defaultMode}
          enableSystem={true}
          disableTransitionOnChange
        >
          <ActiveThemeProvider>
            <TooltipProvider>{children}</TooltipProvider>
          </ActiveThemeProvider>
        </ThemeProvider>
      </QueryProvider>
    </PostHogProvider>
  );
}
