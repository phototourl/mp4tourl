'use client';

import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { LocaleLink } from '@/i18n/navigation';
import { authClient } from '@/lib/auth-client';
import { formatBytes } from '@/lib/storage-limits';
import { cn } from '@/lib/utils';
import { Routes } from '@/routes';
import {
  ArrowRight,
  ChevronsRight,
  Cloud,
  Film,
  FolderOpen,
  HardDrive,
  Loader2Icon,
  Sparkles,
  Upload,
  type LucideIcon,
} from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import type { ReactNode } from 'react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

type Summary = {
  fileCount: number;
  storageUsed: number;
  storageLimit: number;
  plan: string;
  planInterval: string | null;
  subscriptionActive: boolean;
};

const solidCardClass =
  'group relative flex min-h-[11rem] flex-col justify-between overflow-hidden rounded-2xl bg-foreground px-5 py-5 text-background transition-[transform,opacity] hover:opacity-95 active:scale-[0.99]';

const surfaceCardClass =
  'group relative flex min-h-[11rem] flex-col justify-between overflow-hidden rounded-2xl border border-border bg-card px-5 py-5 text-foreground transition-colors hover:bg-muted/40 active:scale-[0.99]';

const filesPointMotionClass =
  'shadow-[0_2px_4px_rgba(15,23,42,0.06),0_10px_22px_-8px_rgba(15,23,42,0.18)] transition-[transform,box-shadow] duration-200 ease-out will-change-transform hover:-translate-y-1.5 hover:shadow-[0_8px_14px_rgba(15,23,42,0.1),0_20px_36px_-12px_rgba(15,23,42,0.28)] dark:shadow-[0_2px_6px_rgba(0,0,0,0.35),0_12px_24px_-8px_rgba(0,0,0,0.55)] dark:hover:shadow-[0_10px_18px_rgba(0,0,0,0.45),0_22px_40px_-12px_rgba(0,0,0,0.65)]';

function MetricCard({
  href,
  icon: Icon,
  title,
  description,
  children,
  variant = 'solid',
  showArrow = true,
}: {
  href?: string;
  icon: LucideIcon;
  title: ReactNode;
  description: ReactNode;
  children?: ReactNode;
  variant?: 'solid' | 'surface';
  showArrow?: boolean;
}) {
  const isSolid = variant === 'solid';
  const className = isSolid ? solidCardClass : surfaceCardClass;
  const body = (
    <>
      <div className="flex items-start justify-between">
        <Icon
          className={cn('size-7', isSolid ? 'opacity-90' : 'text-foreground/80')}
          strokeWidth={1.5}
        />
        {showArrow ? (
          <ArrowRight
            className={cn(
              'size-5 transition-transform group-hover:translate-x-0.5',
              isSolid ? 'opacity-50' : 'text-muted-foreground opacity-60'
            )}
          />
        ) : (
          <span className="size-5" aria-hidden />
        )}
      </div>
      <div className="space-y-1.5">
        <div className="text-xl font-semibold tracking-tight md:text-2xl">
          {title}
        </div>
        {children}
        <p
          className={cn(
            'text-sm leading-snug',
            isSolid ? 'text-background/70' : 'text-muted-foreground'
          )}
        >
          {description}
        </p>
      </div>
    </>
  );

  if (href) {
    return (
      <LocaleLink href={href} className={className}>
        {body}
      </LocaleLink>
    );
  }

  return <div className={cn(className, 'cursor-default')}>{body}</div>;
}

function EntryChevron() {
  return (
    <span
      aria-hidden
      className="relative flex h-8 w-full shrink-0 items-center overflow-visible md:h-9"
    >
      <span className="mr-9 flex min-w-0 flex-1 flex-col justify-center gap-1">
        <span className="h-1 origin-left scale-x-100 rounded-full bg-sky-300 transition-transform duration-300 ease-out [mask-image:linear-gradient(to_right,black_0%,black_82%,transparent_100%)] md:scale-x-[0.18] md:group-hover:scale-x-100 dark:bg-sky-400/70" />
        <span className="h-1 origin-left scale-x-100 rounded-full bg-sky-500 transition-transform duration-300 ease-out [mask-image:linear-gradient(to_right,black_0%,black_82%,transparent_100%)] md:scale-x-[0.18] md:group-hover:scale-x-100 dark:bg-sky-400" />
        <span className="h-1 origin-left scale-x-100 rounded-full bg-sky-700 transition-transform duration-300 ease-out [mask-image:linear-gradient(to_right,black_0%,black_82%,transparent_100%)] md:scale-x-[0.18] md:group-hover:scale-x-100 dark:bg-sky-300" />
      </span>
      <ChevronsRight
        className="absolute top-1/2 size-8 -translate-y-1/2 text-sky-700 transition-[left] duration-300 ease-out left-[calc(100%-2rem)] md:left-[calc((100%-2.25rem)*0.18)] md:group-hover:left-[calc(100%-2rem)] dark:text-sky-300"
        strokeWidth={1.5}
      />
    </span>
  );
}

/**
 * Workbench — top metrics keep mp4tourl solid/surface cards;
 * entries + resources strip match the prior editstamp-style layout.
 */
export function DashboardHomeOverview() {
  const t = useTranslations('Dashboard.resources');
  const tHome = useTranslations('Dashboard.home');
  const locale = useLocale();
  const { data: session } = authClient.useSession();
  const [sessionReady, setSessionReady] = useState(false);
  const [data, setData] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setSessionReady(true);
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const res = await fetch('/api/dashboard/summary');
        if (!res.ok) throw new Error('summary failed');
        const json = (await res.json()) as Summary;
        if (!cancelled) setData(json);
      } catch {
        if (!cancelled) toast.error(t('loadError'));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [t]);

  const storageUsed = data?.storageUsed ?? 0;
  const storageLimit = data?.storageLimit ?? 0;
  const storagePercent =
    storageLimit > 0 ? Math.min((storageUsed / storageLimit) * 100, 100) : 0;
  const storageFull = storageLimit > 0 && storageUsed >= storageLimit;
  const fileCount = data?.fileCount ?? 0;
  const planId = data?.plan ?? 'free';

  const planLabel =
    planId === 'lifetime'
      ? t('planLifetime')
      : planId === 'pro'
        ? t('planPro')
        : t('planFree');

  const planHint =
    planId === 'lifetime'
      ? t('planHintLifetime')
      : planId === 'pro'
        ? t('planHintPro')
        : t('planHintFree');

  const displayName = sessionReady
    ? session?.user?.name?.trim() || session?.user?.email || ''
    : '';

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-4 px-4 py-3 lg:px-6 md:py-4">
      {displayName ? (
        <h1 className="shrink-0 text-xl font-semibold tracking-tight md:text-2xl">
          {t('welcome', { name: displayName })}
        </h1>
      ) : null}

      {loading && !data ? (
        <div className="flex flex-1 items-center justify-center gap-2 py-16 text-muted-foreground">
          <Loader2Icon className="size-5 animate-spin" />
          <span>{tHome('loading')}</span>
        </div>
      ) : (
        <>
          <div className="grid shrink-0 grid-cols-1 gap-3 sm:grid-cols-2 @5xl/main:grid-cols-3">
            <MetricCard
              icon={HardDrive}
              showArrow={false}
              title={
                <span className="tabular-nums">
                  {formatBytes(storageUsed, locale)}
                  <span className="text-base font-normal text-background/70">
                    {' '}
                    / {formatBytes(storageLimit, locale)}
                  </span>
                </span>
              }
              description={
                storageFull ? tHome('storageFullHint') : t('storageHint')
              }
            >
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-background/20">
                <div
                  className={cn(
                    'h-full rounded-full transition-all',
                    storageFull ? 'bg-red-400' : 'bg-background'
                  )}
                  style={{ width: `${storagePercent}%` }}
                />
              </div>
            </MetricCard>

            <MetricCard
              href={Routes.Resources}
              icon={Film}
              title={<span className="tabular-nums">{fileCount}</span>}
              description={tHome('videoCountLabel')}
            />

            <MetricCard
              icon={Sparkles}
              showArrow={false}
              title={planLabel}
              description={planHint}
            />
          </div>

          <div className="grid shrink-0 grid-cols-1 gap-3 md:grid-cols-2 md:gap-4">
            <LocaleLink
              href={Routes.Resources}
              className="group block rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <Card className="flex h-full flex-col justify-between gap-3 py-4 transition-colors group-hover:border-primary/40 md:gap-5 md:py-5">
                <CardHeader className="gap-2.5 px-4 md:gap-3 md:px-6">
                  <div className="flex size-9 items-center justify-center rounded-xl bg-primary/10 text-primary md:size-11 dark:bg-primary/20 dark:text-blue-300">
                    <FolderOpen className="size-4 md:size-5" strokeWidth={1.75} />
                  </div>
                  <div className="space-y-1.5 md:space-y-2">
                    <CardTitle className="text-base text-foreground md:text-lg">
                      {tHome('entryResourcesTitle')}
                    </CardTitle>
                    <CardDescription className="text-sm leading-relaxed text-muted-foreground dark:text-zinc-300">
                      {tHome('entryResourcesDesc')}
                    </CardDescription>
                  </div>
                </CardHeader>
                <CardFooter className="px-4 pt-0 md:px-6 md:pt-1">
                  <EntryChevron />
                </CardFooter>
              </Card>
            </LocaleLink>

            <LocaleLink
              href={Routes.Upload}
              className="group block rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <Card className="flex h-full flex-col justify-between gap-3 py-4 transition-colors group-hover:border-primary/40 md:gap-5 md:py-5">
                <CardHeader className="gap-2.5 px-4 md:gap-3 md:px-6">
                  <div className="flex size-9 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700 md:size-11 dark:bg-emerald-500/20 dark:text-emerald-300">
                    <Upload className="size-4 md:size-5" strokeWidth={1.75} />
                  </div>
                  <div className="space-y-1.5 md:space-y-2">
                    <CardTitle className="text-base text-foreground md:text-lg">
                      {tHome('entryUploadTitle')}
                    </CardTitle>
                    <CardDescription className="text-sm leading-relaxed text-muted-foreground dark:text-zinc-300">
                      {tHome('entryUploadDesc')}
                    </CardDescription>
                  </div>
                </CardHeader>
                <CardFooter className="px-4 pt-0 md:px-6 md:pt-1">
                  <EntryChevron />
                </CardFooter>
              </Card>
            </LocaleLink>
          </div>

          <Card className="flex min-h-0 flex-1 flex-col border-slate-200/80 bg-gradient-to-br from-slate-50/90 via-card to-card dark:border-border dark:bg-card dark:from-transparent">
            <CardHeader className="shrink-0">
              <LocaleLink
                href={Routes.Resources}
                className="group flex flex-col gap-3 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:flex-row sm:items-start sm:justify-between"
              >
                <div className="flex min-w-0 flex-1 items-start gap-3">
                  <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-slate-200/70 text-slate-700 dark:bg-muted dark:text-foreground">
                    <Film className="size-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <CardTitle className="text-lg">
                      {tHome('entryFilesTitle')}
                    </CardTitle>
                    <CardDescription className="mt-1 text-pretty">
                      {tHome('entryFilesDesc')}
                    </CardDescription>
                  </div>
                </div>
                <span className="inline-flex h-9 w-full shrink-0 items-center justify-center rounded-md border border-slate-200 bg-white px-3 text-sm font-medium text-slate-800 shadow-xs transition-colors group-hover:bg-slate-50 sm:w-auto sm:self-start dark:border-border dark:bg-muted dark:text-foreground dark:group-hover:bg-muted/80">
                  {tHome('entryFilesCta')}
                </span>
              </LocaleLink>
            </CardHeader>
            <div className="grid min-h-0 flex-1 grid-cols-1 gap-2.5 overflow-visible border-t border-slate-200/70 px-6 pt-3 pb-6 sm:grid-cols-2 lg:grid-cols-4 dark:border-border">
              <LocaleLink
                href={Routes.Upload}
                className={`flex min-h-0 flex-col justify-center rounded-md bg-sky-50/80 px-3 py-2.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring dark:bg-sky-500/20 ${filesPointMotionClass}`}
              >
                <div className="flex items-center gap-1.5 text-sm font-medium text-sky-900 dark:text-sky-100">
                  <Upload className="size-3.5 shrink-0 text-sky-600 dark:text-sky-300" />
                  {tHome('filesPointUploadTitle')}
                </div>
                <p className="mt-1 text-xs leading-snug text-pretty text-sky-800/70 dark:text-sky-200/75">
                  {tHome('filesPointUploadBody')}
                </p>
              </LocaleLink>
              <LocaleLink
                href={Routes.Resources}
                className={`flex min-h-0 flex-col justify-center rounded-md bg-violet-50/80 px-3 py-2.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring dark:bg-violet-500/20 ${filesPointMotionClass}`}
              >
                <div className="flex items-center gap-1.5 text-sm font-medium text-violet-900 dark:text-violet-100">
                  <FolderOpen className="size-3.5 shrink-0 text-violet-600 dark:text-violet-300" />
                  {tHome('filesPointManageTitle')}
                </div>
                <p className="mt-1 text-xs leading-snug text-pretty text-violet-800/70 dark:text-violet-200/75">
                  {tHome('filesPointManageBody')}
                </p>
              </LocaleLink>
              <LocaleLink
                href={Routes.SettingsBilling}
                className={`flex min-h-0 flex-col justify-center rounded-md bg-emerald-50/80 px-3 py-2.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring dark:bg-emerald-500/20 ${filesPointMotionClass}`}
              >
                <div className="flex items-center gap-1.5 text-sm font-medium text-emerald-900 dark:text-emerald-100">
                  <HardDrive className="size-3.5 shrink-0 text-emerald-600 dark:text-emerald-300" />
                  {tHome('filesPointFreeTitle')}
                </div>
                <p className="mt-1 text-xs leading-snug text-pretty text-emerald-800/70 dark:text-emerald-200/75">
                  {tHome('filesPointFreeBody')}
                </p>
              </LocaleLink>
              <LocaleLink
                href={Routes.SettingsBilling}
                className={`flex min-h-0 flex-col justify-center rounded-md bg-amber-50/80 px-3 py-2.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring dark:bg-amber-500/20 ${filesPointMotionClass}`}
              >
                <div className="flex items-center gap-1.5 text-sm font-medium text-amber-900 dark:text-amber-100">
                  <Cloud className="size-3.5 shrink-0 text-amber-600 dark:text-amber-300" />
                  {tHome('filesPointPaidTitle')}
                </div>
                <p className="mt-1 text-xs leading-snug text-pretty text-amber-800/70 dark:text-amber-200/75">
                  {tHome('filesPointPaidBody')}
                </p>
              </LocaleLink>
            </div>
          </Card>
        </>
      )}
    </div>
  );
}
