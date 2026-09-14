import { cn } from '@/lib/utils';

/**
 * 设置页卡片底部多为 `bg-muted`，默认 outline 按钮容易「像文字块」。
 * 统一加阴影、描边与最小点击区域，让主操作一眼可辨。
 */
export const settingsButtonPrimary = cn(
  'min-h-9 min-w-[5.5rem] px-4 font-semibold shadow-sm',
  'bg-[#0abab5] text-white hover:bg-[#089590]',
  'ring-1 ring-[#0abab5]/25 hover:shadow-md hover:ring-[#0abab5]/40',
);

export const settingsButtonOutline = cn(
  'min-h-9 min-w-[5.5rem] px-4 font-medium shadow-sm',
  'border-2 border-[#0abab5] bg-white text-slate-700',
  'hover:border-[#089590] hover:bg-slate-50 hover:shadow',
  'dark:border-input dark:hover:border-[#0abab5]/50',
);

export const settingsButtonDestructive = cn(
  'min-h-9 min-w-[8rem] px-4 font-semibold shadow-sm',
  'bg-red-600 text-white hover:bg-red-700',
  'ring-1 ring-red-600/25 hover:shadow-md hover:ring-red-600/35',
);
