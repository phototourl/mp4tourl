'use client';

import { LocaleLink } from '@/i18n/navigation';
import { Routes } from '@/routes';
import { cn } from '@/lib/utils';
import { ArrowLeft } from 'lucide-react';

interface AuthBackButtonProps {
  className?: string;
  /** Compact size for dashboard sidebar; default matches auth footer. */
  size?: 'default' | 'compact';
  ariaLabel?: string;
}

/** 与 editstamp 一致：粗边框 + 硬偏移阴影；主题色适配深浅模式 */
const sizeStyles = {
  default: {
    box: { width: 56, height: 56 } as const,
    icon: { width: 24, height: 24 } as const,
    button: 'border-[2.5px]',
    shadow: 'shadow-[4px_4px_0_0_#0f172a] dark:shadow-[4px_4px_0_0_#e2e8f0]',
    hoverShadow:
      'hover:shadow-[3px_3px_0_0_#0f172a] dark:hover:shadow-[3px_3px_0_0_#e2e8f0]',
  },
  compact: {
    box: { width: 36, height: 36 } as const,
    icon: { width: 16, height: 16 } as const,
    button: 'border-2',
    shadow: 'shadow-[2px_2px_0_0_#0f172a] dark:shadow-[2px_2px_0_0_#e2e8f0]',
    hoverShadow:
      'hover:shadow-[1.5px_1.5px_0_0_#0f172a] dark:hover:shadow-[1.5px_1.5px_0_0_#e2e8f0]',
  },
} as const;

export function AuthBackButton({
  className,
  size = 'default',
  ariaLabel = 'Back',
}: AuthBackButtonProps) {
  const styles = sizeStyles[size];

  return (
    <LocaleLink
      href={Routes.Root}
      aria-label={ariaLabel}
      style={styles.box}
      className={cn(
        'ptu-auth-back-btn group inline-flex shrink-0 items-center justify-center rounded-full',
        styles.button,
        'border-foreground bg-background text-foreground',
        styles.shadow,
        styles.hoverShadow,
        'transition-[transform,box-shadow,color] duration-150 ease-out',
        'hover:translate-x-px hover:translate-y-px',
        'active:translate-x-1 active:translate-y-1 active:shadow-none',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground/30 focus-visible:ring-offset-2 focus-visible:ring-offset-background',
        className
      )}
    >
      <ArrowLeft
        style={styles.icon}
        className="shrink-0 transition-transform duration-150 group-hover:-translate-x-0.5"
        strokeWidth={2}
      />
    </LocaleLink>
  );
}
