'use client';

import { useTranslations } from 'next-intl';
import { ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { cn } from '@/lib/utils';
import { RESOURCE_LIST_PAGE_SIZE_DEFAULT } from '@/lib/constants/resource-pagination';

export const RESOURCE_PAGE_SIZE_OPTIONS = [10, 20, 50, 100, 200, 500, 1000] as const;
export const DEFAULT_RESOURCE_PAGE_SIZE = RESOURCE_LIST_PAGE_SIZE_DEFAULT;

/**
 * 样式与配色仅通过 `dashboard-technology.css` 里 `.ptu-resources-pagination` 的变量控制。
 * 每页条数使用原生 `<select>`（下拉列表高亮由系统绘制，无法用 CSS 改成绿色渐变）。
 */

function buildPageItems(current: number, totalPages: number): (number | 'ellipsis')[] {
  if (totalPages <= 0) return [];
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }
  const delta = 1;
  const set = new Set<number>([1, totalPages]);
  for (let i = current - delta; i <= current + delta; i++) {
    if (i >= 1 && i <= totalPages) set.add(i);
  }
  const sorted = Array.from(set).sort((a, b) => a - b);
  const out: (number | 'ellipsis')[] = [];
  let prev = 0;
  for (const p of sorted) {
    if (prev && p - prev > 1) out.push('ellipsis');
    out.push(p);
    prev = p;
  }
  return out;
}

type DashboardResourcesPaginationProps = {
  total: number;
  page: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
};

export function DashboardResourcesPagination({
  total,
  page,
  pageSize,
  onPageChange,
  onPageSizeChange,
}: DashboardResourcesPaginationProps) {
  const t = useTranslations('Dashboard');
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const items = useMemo(() => buildPageItems(page, totalPages), [page, totalPages]);
  const [jumpDraft, setJumpDraft] = useState(String(page));

  useEffect(() => {
    setJumpDraft(String(page));
  }, [page]);

  const commitJump = () => {
    const n = parseInt(jumpDraft.replace(/\s/g, ''), 10);
    if (!Number.isFinite(n)) {
      setJumpDraft(String(page));
      return;
    }
    const p = Math.min(totalPages, Math.max(1, n));
    onPageChange(p);
    setJumpDraft(String(p));
  };

  if (total <= 0) return null;

  return (
    <div className="ptu-resources-pagination mt-4 w-full rounded-xl px-4 py-3">
      <div className="flex w-full flex-wrap items-center justify-center gap-x-5 gap-y-3">
        <span className="ptu-pager-total text-sm font-medium tabular-nums whitespace-nowrap">
          {t('resourceTotalCount', { total })}
        </span>

        <label className="ptu-pager-size-wrap relative flex items-center">
          <span className="sr-only">{t('resourcePageSizeLabel')}</span>
          <select
            className={cn(
              'ptu-pager-size h-8 min-w-[7.25rem] cursor-pointer appearance-none rounded-md py-1 pl-3 pr-9 text-sm font-medium',
              'outline-none transition-shadow'
            )}
            value={pageSize}
            onChange={(e) => {
              const v = Number(e.target.value);
              if ((RESOURCE_PAGE_SIZE_OPTIONS as readonly number[]).includes(v)) {
                onPageSizeChange(v);
              }
            }}
          >
            {RESOURCE_PAGE_SIZE_OPTIONS.map((n) => (
              <option key={n} value={n}>
                {t('resourcePageSizeOption', { size: n })}
              </option>
            ))}
          </select>
          <ChevronDown
            className="pointer-events-none absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2"
            aria-hidden
          />
        </label>

        {totalPages > 1 ? (
          <div className="flex flex-wrap items-center justify-center gap-0.5 sm:gap-1">
            <button
              type="button"
              aria-label={t('resourcePagePrev')}
              disabled={page <= 1}
              onClick={() => onPageChange(Math.max(1, page - 1))}
              className={cn(
                'ptu-pager-arrow ptu-pager-arrow--prev inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md border-0 text-sm transition-colors'
              )}
            >
              <ChevronLeft className="h-4 w-4" strokeWidth={2.25} />
            </button>
            {items.map((item, idx) =>
              item === 'ellipsis' ? (
                <span
                  key={`e-${idx}`}
                  className="ptu-pager-ellipsis inline-flex h-8 min-w-8 items-center justify-center px-0.5 text-sm font-medium tracking-wide"
                >
                  …
                </span>
              ) : (
                <button
                  key={item}
                  type="button"
                  onClick={() => onPageChange(item)}
                  className={cn(
                    'ptu-pager-page inline-flex h-8 min-h-8 min-w-8 shrink-0 items-center justify-center rounded-md border-0 px-2 text-sm font-medium tabular-nums transition-colors',
                    page === item ? 'ptu-pager-page--active' : undefined
                  )}
                >
                  {item}
                </button>
              )
            )}
            <button
              type="button"
              aria-label={t('resourcePageNext')}
              disabled={page >= totalPages}
              onClick={() => onPageChange(Math.min(totalPages, page + 1))}
              className={cn(
                'ptu-pager-arrow ptu-pager-arrow--next inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md border-0 text-sm transition-colors'
              )}
            >
              <ChevronRight className="h-4 w-4" strokeWidth={2.25} />
            </button>

            <div className="ptu-pager-jump-row ml-2 flex items-center gap-2 text-sm font-medium sm:ml-3">
              <span className="whitespace-nowrap">{t('resourceJumpTo')}</span>
              <input
                type="text"
                inputMode="numeric"
                className={cn(
                  'ptu-pager-jump h-8 w-14 min-w-[3.25rem] rounded-md px-2 text-center text-sm font-semibold tabular-nums',
                  'outline-none transition-shadow'
                )}
                value={jumpDraft}
                onChange={(e) => setJumpDraft(e.target.value)}
                onBlur={commitJump}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    commitJump();
                  }
                }}
                aria-label={t('resourceJumpInputAria')}
              />
              <span className="whitespace-nowrap">{t('resourceJumpPageUnit')}</span>
            </div>
          </div>
        ) : (
          <span
            className={cn(
              'ptu-pager-page ptu-pager-page--active inline-flex h-8 min-w-8 items-center justify-center rounded-md border-0 px-2 text-sm font-medium'
            )}
          >
            1
          </span>
        )}
      </div>
    </div>
  );
}
