'use client';

import { useEffect, useId, useMemo, useRef, useState } from 'react';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';

export type DashboardChartRange = '7d' | '30d' | '90d';

export type DashboardActivityPoint = { date: string; photos: number; documents: number };

/** EditStamp / shadcn dashboard：浅底分段切换，选中项白底 + 蓝字 */
export function DashboardChartRangeToggle({
  value,
  onChange,
  labels,
  ariaLabel,
  className,
}: {
  value: DashboardChartRange;
  onChange: (_v: DashboardChartRange) => void;
  labels: Record<DashboardChartRange, string>;
  /** 时间段选择器整体的无障碍标签 */
  ariaLabel: string;
  className?: string;
}) {
  const keys: DashboardChartRange[] = ['90d', '30d', '7d'];
  return (
    <div
      className={cn(
        'ptu-view-toggle inline-flex shrink-0 items-center gap-1 rounded-md bg-slate-200/80 p-1 dark:bg-slate-700/80',
        className,
      )}
      role="tablist"
      aria-label={ariaLabel}
    >
      {keys.map((k) => (
        <button
          key={k}
          type="button"
          role="tab"
          aria-selected={value === k}
          onClick={() => onChange(k)}
          className={cn(
            'flex items-center gap-1 rounded-sm px-2 py-1 text-xs font-medium transition-colors',
            value === k
              ? 'bg-white text-foreground shadow-sm dark:bg-slate-800'
              : 'text-muted-foreground hover:text-foreground',
          )}
        >
          {labels[k]}
        </button>
      ))}
    </div>
  );
}

/**
 * 装饰性多层蓝色面积图（无 recharts），对齐 EditStamp 访客图风格。
 */
export function DashboardActivityAreaChart({
  footnote,
  series,
  emptyLabel,
  legend,
}: {
  footnote: string;
  /** Ordered daily points (oldest -> newest). */
  series: DashboardActivityPoint[];
  /** Shown when all values are 0. */
  emptyLabel: string;
  legend: { photosLabel: string; documentsLabel: string };
}) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [isTechTheme, setIsTechTheme] = useState(false);
  const svgRef = useRef<SVGSVGElement | null>(null);
  const [svgWidth, setSvgWidth] = useState(900);
  const isMobile = useIsMobile();
  const uid = useId().replace(/:/g, '');
  const a = `dash-area-a-${uid}`;
  const b = `dash-area-b-${uid}`;
  const a2 = `dash-area-a2-${uid}`;
  const b2 = `dash-area-b2-${uid}`;

  useEffect(() => {
    const el = svgRef.current;
    if (!el) return;

    const update = () => {
      const w = Math.max(320, Math.round(el.clientWidth || 0));
      if (w > 0) setSvgWidth(w);
    };

    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    window.addEventListener('resize', update);
    return () => {
      ro.disconnect();
      window.removeEventListener('resize', update);
    };
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    const getIsTech = () => root.classList.contains('ptu-theme-technology');
    const updateTheme = () => setIsTechTheme(getIsTech());
    updateTheme();
    const observer = new MutationObserver(updateTheme);
    observer.observe(root, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, []);

  // Mobile optimization: fewer points for long ranges to avoid "squeezed" chart.
  // - 30d: group by 2 days (~15 points)
  // - 90d: group by 7 days (~13 points)
  const displaySeries = useMemo<DashboardActivityPoint[]>(() => {
    const input = series;
    const n0 = input.length;
    if (!isMobile || n0 <= 20) return input;

    const bucketSize = n0 >= 75 ? 7 : 2;
    const out: DashboardActivityPoint[] = [];

    for (let i = 0; i < n0; i += bucketSize) {
      const bucket = input.slice(i, i + bucketSize);
      const photos = bucket.reduce((acc, p) => acc + (p.photos || 0), 0);
      const documents = bucket.reduce((acc, p) => acc + (p.documents || 0), 0);
      const date = bucket[bucket.length - 1]?.date ?? bucket[0]?.date ?? '';
      out.push({ date, photos, documents });
    }

    return out.length > 0 ? out : input;
  }, [series, isMobile]);

  const photoValues = displaySeries.map((s) => s.photos);
  const docValues = displaySeries.map((s) => s.documents);
  const max = Math.max(0, ...photoValues, ...docValues);
  const hasAny = [...photoValues, ...docValues].some((v) => v > 0);

  // SVG metrics
  const W = svgWidth;
  const H = 220;
  const baselineY = 180;
  const topPadding = 22;
  const usableH = Math.max(1, baselineY - topPadding);

  const n = Math.max(1, displaySeries.length);
  const stepX = n <= 1 ? 0 : W / (n - 1);
  const photoPoints = photoValues.map((v, i) => {
    const x = i * stepX;
    const y = max === 0 ? baselineY : baselineY - (v / max) * usableH;
    return { x, y };
  });
  const docPoints = docValues.map((v, i) => {
    const x = i * stepX;
    const y = max === 0 ? baselineY : baselineY - (v / max) * usableH;
    return { x, y };
  });

  const buildSmoothPath = (pts: { x: number; y: number }[]) => {
    if (pts.length <= 1) {
      const p = pts[0] ?? { x: 0, y: baselineY };
      return `M${p.x.toFixed(2)},${p.y.toFixed(2)} L${p.x.toFixed(2)},${p.y.toFixed(2)}`;
    }
    let d = `M${pts[0].x.toFixed(2)},${pts[0].y.toFixed(2)}`;
    for (let i = 0; i < pts.length - 1; i++) {
      const p0 = pts[i - 1] ?? pts[i];
      const p1 = pts[i];
      const p2 = pts[i + 1];
      const p3 = pts[i + 2] ?? p2;

      const cp1x = p1.x + (p2.x - p0.x) / 6;
      const cp1y = p1.y + (p2.y - p0.y) / 6;
      const cp2x = p2.x - (p3.x - p1.x) / 6;
      const cp2y = p2.y - (p3.y - p1.y) / 6;

      d += ` C${cp1x.toFixed(2)},${cp1y.toFixed(2)} ${cp2x.toFixed(2)},${cp2y.toFixed(2)} ${p2.x.toFixed(2)},${p2.y.toFixed(2)}`;
    }
    return d;
  };

  const photoLinePath = useMemo(() => buildSmoothPath(photoPoints), [photoPoints]);
  const docLinePath = useMemo(() => buildSmoothPath(docPoints), [docPoints]);

  const photoAreaPath = `${photoLinePath} L${W},${H} L0,${H} Z`;
  const docAreaPath = `${docLinePath} L${W},${H} L0,${H} Z`;

  const activePhotoPoint = activeIndex !== null ? photoPoints[activeIndex] : null;
  const activeDocPoint = activeIndex !== null ? docPoints[activeIndex] : null;
  const activeData = activeIndex !== null ? displaySeries[activeIndex] : null;
  const tooltipAnchorPoint =
    activePhotoPoint && activeDocPoint
      ? (activePhotoPoint.y <= activeDocPoint.y ? activePhotoPoint : activeDocPoint)
      : (activePhotoPoint ?? activeDocPoint);
  const tooltipLeftPercent = tooltipAnchorPoint ? (tooltipAnchorPoint.x / W) * 100 : 50;
  const tooltipTopPercent = tooltipAnchorPoint ? (tooltipAnchorPoint.y / H) * 100 : 30;
  // Tooltip uses dynamic alignment near edges to avoid clipping.
  const tooltipAlign: 'left' | 'center' | 'right' =
    tooltipLeftPercent <= 18 ? 'left' : tooltipLeftPercent >= 82 ? 'right' : 'center';
  const clampedTooltipLeftPercent = Math.min(96, Math.max(4, tooltipLeftPercent));
  const clampedTooltipTopPercent = Math.min(88, Math.max(12, tooltipTopPercent - 8));

  const colors = isTechTheme
    ? {
        photoArea: 'rgb(34 197 94)',
        photoAreaOpacity: 0.18,
        docArea: 'rgb(34 211 238)',
        docAreaOpacity: 0.14,
        photoLine: 'rgb(74 222 128)',
        docLine: 'rgb(34 211 238)',
      }
    : {
        // Default theme: My Documents uses technology blue.
        photoArea: 'rgb(34 197 94)',
        photoAreaOpacity: 0.18,
        docArea: 'rgb(66 144 247)',
        docAreaOpacity: 0.14,
        photoLine: 'rgb(74 222 128)',
        docLine: 'rgb(66 144 247)',
      };

  const updateActiveIndexByMouseX = (nativeOffsetX: number, clientWidth: number) => {
    if (displaySeries.length === 0 || clientWidth <= 0) {
      setActiveIndex(null);
      return;
    }
    const ratio = Math.min(1, Math.max(0, nativeOffsetX / clientWidth));
    const xInViewBox = ratio * W;
    const nearest = Math.round(xInViewBox / Math.max(1, stepX));
    setActiveIndex(Math.min(displaySeries.length - 1, Math.max(0, nearest)));
  };

  return (
    <>
      <div className="flex flex-wrap items-center justify-end gap-3 px-1 pb-2 text-xs text-muted-foreground">
        <span className="inline-flex items-center gap-2">
          <span className="h-2 w-2 rounded-full" style={{ background: colors.photoLine }} />
          {legend.photosLabel}
        </span>
        <span className="inline-flex items-center gap-2">
          <span className="h-2 w-2 rounded-full" style={{ background: colors.docLine }} />
          {legend.documentsLabel}
        </span>
      </div>
      <div className="relative overflow-visible">
        <svg
          ref={svgRef}
          viewBox={`0 0 ${W} ${H}`}
          className="h-[220px] w-full text-slate-200 dark:text-border"
          role="img"
          aria-label="Activity chart"
        >
          <defs>
            <linearGradient id={a} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={colors.photoArea} stopOpacity={colors.photoAreaOpacity} />
              <stop offset="100%" stopColor={colors.photoArea} stopOpacity="0" />
            </linearGradient>
            <linearGradient id={b} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={colors.docArea} stopOpacity={colors.docAreaOpacity} />
              <stop offset="100%" stopColor={colors.docArea} stopOpacity="0" />
            </linearGradient>
            {/* (reserved ids to avoid accidental collision with older cached markup) */}
            <linearGradient id={a2} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={colors.photoArea} stopOpacity="0" />
              <stop offset="100%" stopColor={colors.photoArea} stopOpacity="0" />
            </linearGradient>
            <linearGradient id={b2} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={colors.docArea} stopOpacity="0" />
              <stop offset="100%" stopColor={colors.docArea} stopOpacity="0" />
            </linearGradient>
          </defs>
          <line x1="0" y1={baselineY} x2={W} y2={baselineY} stroke="currentColor" strokeWidth="1" />
          {/* Real series */}
          {hasAny ? (
            <>
              <path fill={`url(#${a})`} d={photoAreaPath} />
              <path fill={`url(#${b})`} d={docAreaPath} />

              <path d={photoLinePath} fill="none" stroke={colors.photoLine} strokeOpacity="0.98" strokeWidth="2" />
              <path d={docLinePath} fill="none" stroke={colors.docLine} strokeOpacity="0.95" strokeWidth="2" />

              {activePhotoPoint && (
                <>
                  <circle cx={activePhotoPoint.x} cy={activePhotoPoint.y} r="4" fill={colors.photoLine} fillOpacity="1" />
                </>
              )}
              {activeDocPoint && (
                <>
                  <circle cx={activeDocPoint.x} cy={activeDocPoint.y} r="4" fill={colors.docLine} fillOpacity="1" />
                </>
              )}
            </>
          ) : (
            <text
              x={W / 2}
              y="110"
              textAnchor="middle"
              className="fill-slate-400 text-sm dark:fill-muted-foreground"
            >
              {emptyLabel}
            </text>
          )}
          {/* one hover layer: pick nearest point by actual mouse X */}
          {displaySeries.length > 0 && (
            <rect
              x={0}
              y={0}
              width={W}
              height={H}
              fill="transparent"
              onMouseLeave={() => setActiveIndex(null)}
              onMouseMove={(event) => {
                updateActiveIndexByMouseX(event.nativeEvent.offsetX, event.currentTarget.getBoundingClientRect().width);
              }}
            />
          )}
        </svg>
        {tooltipAnchorPoint && activeData && (
          <div
            className={cn(
              "ptu-chart-tooltip pointer-events-none absolute z-10 rounded-md border border-slate-200 bg-white/95 px-2.5 py-1.5 text-center shadow-sm dark:border-border dark:bg-card whitespace-nowrap",
              tooltipAlign === 'center' && '-translate-x-1/2',
              tooltipAlign === 'left' && 'translate-x-0',
              tooltipAlign === 'right' && '-translate-x-full',
            )}
            style={{
              left: `${clampedTooltipLeftPercent}%`,
              top: `${clampedTooltipTopPercent}%`,
            }}
          >
            <div className="flex items-center justify-center gap-2 text-[11px] font-semibold leading-none text-foreground tabular-nums">
              <span className="inline-flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full" style={{ background: colors.photoLine }} />
                {activeData.photos}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full" style={{ background: colors.docLine }} />
                {activeData.documents}
              </span>
            </div>
            <p className="mt-1 text-[10px] leading-none text-muted-foreground tabular-nums">{activeData.date}</p>
          </div>
        )}
      </div>
      <p className="px-4 pb-8 pt-3 text-center text-xs leading-snug text-muted-foreground">
        {footnote}
      </p>
    </>
  );
}
