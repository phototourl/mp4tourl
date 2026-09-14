'use client';

import { Moon, Sun } from 'lucide-react';

type HeaderThemeToggleButtonProps = {
  /** Light mode → sun; dark/gradient mode → moon */
  isLight: boolean;
  onToggle: () => void;
  ariaLabel: string;
  /** Slate on white header; white on gradient or colored header */
  appearance?: 'light' | 'onColor';
};

const buttonBase =
  'inline-flex items-center justify-center rounded-md border-0 p-1 outline-none ring-0 ring-offset-0 shadow-none focus:outline-none focus:ring-0 focus:ring-offset-0 focus-visible:outline-none focus-visible:ring-0 active:outline-none [&::-moz-focus-inner]:border-0 [&::-moz-focus-inner]:p-0';

export function HeaderThemeToggleButton({
  isLight,
  onToggle,
  ariaLabel,
  appearance = 'light',
}: HeaderThemeToggleButtonProps) {
  const colorClass =
    appearance === 'onColor'
      ? 'text-white/80 hover:text-white'
      : 'text-slate-500 hover:text-slate-800';

  return (
    <div className="inline-flex items-center px-0.5 sm:px-0">
      <button
        type="button"
        aria-label={ariaLabel}
        className={`${buttonBase} ${colorClass}`}
        style={{ outline: 'none', boxShadow: 'none' }}
        onClick={onToggle}
      >
        {isLight ? (
          <Sun className="h-4 w-4 sm:h-[18px] sm:w-[18px]" />
        ) : (
          <Moon className="h-4 w-4 sm:h-[18px] sm:w-[18px]" />
        )}
      </button>
    </div>
  );
}
