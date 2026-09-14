import { cn } from '@/lib/utils';

/**
 * Settings 页面卡片样式，参考 dashboard kpiCard
 * 白底 + 细边框 + 轻阴影，统一灰色调
 */
export const settingsCard = cn(
  'w-full overflow-hidden pt-6 pb-0 flex flex-col',
  'border border-slate-200/90 bg-white shadow-[0_1px_3px_rgba(15,23,42,0.06)]',
  'dark:border-slate-700/50 dark:bg-slate-900',
);

/**
 * 存储用量进度条：与账单 StorageUsageCard 同款（细胶囊轨道 + 品牌色填充，暗色下与 bg-muted 轨道统一科技感）
 */
export const storageUsageProgressTrack = cn(
  'relative h-2 w-full overflow-hidden rounded-full bg-muted',
);

export const storageUsageProgressFill = cn(
  'h-full rounded-full bg-[#0abab5] transition-all',
);
