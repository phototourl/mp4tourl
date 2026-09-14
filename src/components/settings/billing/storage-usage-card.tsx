'use client';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  settingsCard,
  storageUsageProgressFill,
  storageUsageProgressTrack,
} from '@/components/settings/settings-card-classes';
import {
  getResourcesMeta,
  type ResourcesMeta,
} from '@/components/settings/resources-meta-cache';
import { LocaleLink } from '@/i18n/navigation';
import { authClient } from '@/lib/auth-client';
import {
  DEFAULT_STORAGE_LIMITS,
  PLAN_FREE,
  PLAN_PAID,
  PLAN_TIER_YEARLY,
  formatBytes,
} from '@/lib/constants/plans';
import { cn } from '@/lib/utils';
import { Routes } from '@/routes';
import { useTranslations, useLocale } from 'next-intl';
import { useCallback, useEffect, useState } from 'react';

export function StorageUsageCard() {
  const t = useTranslations('Dashboard.settings.billing');
  const locale = useLocale();
  const { data: session, isPending: sessionPending } = authClient.useSession();
  const [data, setData] = useState<ResourcesMeta | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!session?.user) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setErr(null);
    try {
      const meta = await getResourcesMeta();
      setData(meta);
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'error');
    } finally {
      setLoading(false);
    }
  }, [session?.user]);

  useEffect(() => {
    load();
  }, [load]);

  if (sessionPending || loading) {
    return (
      <Card className={settingsCard}>
        <CardHeader>
          <CardTitle className="text-lg font-semibold">
            {t('billingPageStorageTitle')}
          </CardTitle>
          <CardDescription>{t('storage.description')}</CardDescription>
        </CardHeader>
        <CardContent className="flex-1 space-y-4">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-4/5" />
        </CardContent>
        <CardFooter className="mt-2 flex items-center justify-end rounded-none bg-muted px-6 py-4">
          <Skeleton className="h-9 w-28" />
        </CardFooter>
      </Card>
    );
  }

  if (err) {
    return (
      <Card className={settingsCard}>
        <CardHeader>
          <CardTitle className="text-lg font-semibold">
            {t('billingPageStorageTitle')}
          </CardTitle>
          <CardDescription>{t('storage.description')}</CardDescription>
        </CardHeader>
        <CardContent className="flex-1">
          <p className="text-sm text-destructive">{t('loadError')}</p>
        </CardContent>
        <CardFooter className="mt-2 flex items-center justify-end rounded-none bg-muted px-6 py-4">
          <Button
            variant="outline"
            className={cn('cursor-pointer')}
            onClick={load}
          >
            {t('retry')}
          </Button>
        </CardFooter>
      </Card>
    );
  }

  const storageUsed = data?.storageUsed ?? 0;
  const storageLimit = data?.storageLimit ?? DEFAULT_STORAGE_LIMITS[PLAN_FREE];
  const usagePercent = Math.min((storageUsed / storageLimit) * 100, 100);
  const plan = data?.plan || PLAN_FREE;
  const planTier = data?.planTier;
  const subscriptionActive = data?.subscriptionActive ?? (plan !== PLAN_PAID);
  const isExpiredPaid = plan === PLAN_PAID && !subscriptionActive;
  const isPro = subscriptionActive && plan === PLAN_PAID && planTier !== PLAN_TIER_YEARLY;
  const showUpgradeButton = plan === PLAN_FREE || !subscriptionActive || isPro;

  return (
    <Card className={settingsCard}>
      <CardHeader>
        <CardTitle className="text-lg font-semibold">
          {t('billingPageStorageTitle')}
        </CardTitle>
        <CardDescription>{t('storage.description')}</CardDescription>
      </CardHeader>
      <CardContent className="flex-1 space-y-4">
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">
              {formatBytes(storageUsed, locale)} / {formatBytes(storageLimit, locale)}
            </span>
            <span className="font-medium">{usagePercent.toFixed(1)}%</span>
          </div>
          {isExpiredPaid ? (
            <p className="text-xs text-red-600 dark:text-red-300">
              {t.has('expiredStorageLimitHint')
                ? t('expiredStorageLimitHint')
                : '到期后仅享 100MB 存储额度'}
            </p>
          ) : null}
          <div className={storageUsageProgressTrack}>
            <div
              className={storageUsageProgressFill}
              style={{ width: `${usagePercent}%` }}
            />
          </div>
        </div>
      </CardContent>
      <CardFooter className="mt-2 flex items-center justify-end gap-2 rounded-none bg-muted px-6 py-4">
        {showUpgradeButton ? (
          <Button
            className={cn(
              'cursor-pointer rounded-none',
              'min-h-9 min-w-[5.5rem] px-4 text-sm font-semibold text-white shadow-sm',
              'bg-[#22c55e] hover:bg-[#16a34a] ring-1 ring-[#22c55e]/25 hover:ring-[#22c55e]/40 hover:shadow-md',
            )}
            asChild
          >
            <LocaleLink href={Routes.Pricing}>{t('storage.upgradeStorage')}</LocaleLink>
          </Button>
        ) : null}
      </CardFooter>
    </Card>
  );
}
