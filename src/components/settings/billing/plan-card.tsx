'use client';

import { Badge } from '@/components/ui/badge';
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
  settingsButtonOutline,
} from '@/components/settings/settings-button-classes';
import { settingsCard } from '@/components/settings/settings-card-classes';
import {
  getResourcesMeta,
  type ResourcesMeta,
} from '@/components/settings/resources-meta-cache';
import { LocaleLink } from '@/i18n/navigation';
import { authClient } from '@/lib/auth-client';
import { PLAN_FREE, PLAN_PAID, PLAN_TIER_YEARLY } from '@/lib/constants/plans';
import { cn } from '@/lib/utils';
import { Routes } from '@/routes';
import { AlertTriangleIcon, CheckCircleIcon } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useCallback, useEffect, useState } from 'react';

export function PlanCard() {
  const t = useTranslations('Dashboard.settings.billing');
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
            {t('billingPagePlanTitle')}
          </CardTitle>
          <CardDescription>{t('currentPlan.description')}</CardDescription>
        </CardHeader>
        <CardContent className="flex-1 space-y-4">
          <Skeleton className="h-8 w-2/5" />
          <Skeleton className="h-6 w-4/5" />
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
            {t('billingPagePlanTitle')}
          </CardTitle>
          <CardDescription>{t('currentPlan.description')}</CardDescription>
        </CardHeader>
        <CardContent className="flex-1">
          <p className="text-sm text-destructive">{t('loadError')}</p>
        </CardContent>
        <CardFooter className="mt-2 flex items-center justify-end rounded-none bg-muted px-6 py-4">
          <Button
            variant="outline"
            className={cn('cursor-pointer', settingsButtonOutline)}
            onClick={load}
          >
            {t('retry')}
          </Button>
        </CardFooter>
      </Card>
    );
  }

  const plan = data?.plan || PLAN_FREE;
  const planTier = data?.planTier;
  const subscriptionActive = data?.subscriptionActive ?? (plan !== PLAN_PAID);
  const isExpiredPaid = plan === PLAN_PAID && !subscriptionActive;
  const planNameKey = plan === PLAN_PAID
    ? (planTier === 'yearly' ? 'planNames.premium' : 'planNames.pro')
    : 'planNames.free';
  const planName = t(planNameKey);
  const statusText = isExpiredPaid
    ? (t.has('status.expired') ? t('status.expired') : 'Expired')
    : t('status.active');
  const statusBadgeClass = isExpiredPaid
    ? 'text-xs border-red-200 bg-red-50 text-red-700 dark:border-red-900/60 dark:bg-red-950/30 dark:text-red-300'
    : 'text-xs';
  const statusIconClass = isExpiredPaid
    ? 'mr-1 h-3 w-3 text-red-600 dark:text-red-300'
    : 'mr-1 h-3 w-3 text-green-600';
  const isFreePlan = plan === PLAN_FREE;
  const isPro = subscriptionActive && plan === PLAN_PAID && planTier !== PLAN_TIER_YEARLY;
  const showUpgradeButton = isFreePlan || !subscriptionActive || isPro;

  return (
    <Card className={settingsCard}>
      <CardHeader>
        <CardTitle className="text-lg font-semibold">
          {t('billingPagePlanTitle')}
        </CardTitle>
        <CardDescription>{t('currentPlan.description')}</CardDescription>
      </CardHeader>
      <CardContent className="flex-1 space-y-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="text-3xl font-medium">{planName}</div>
          <Badge variant="outline" className={statusBadgeClass}>
            {isExpiredPaid ? (
              <AlertTriangleIcon className={statusIconClass} />
            ) : (
              <CheckCircleIcon className={statusIconClass} />
            )}
            {statusText}
          </Badge>
        </div>
        <div className="space-y-1 text-sm text-muted-foreground">
          {isFreePlan ? (
            <p>{t('freePlanMessage')}</p>
          ) : !subscriptionActive ? (
            <p className="text-red-600 dark:text-red-300">
              {t.has('inactivePlanMessage') ? t('inactivePlanMessage') : '权益已失效'}
            </p>
          ) : (
            <p>{t('paidPlanMessage')}</p>
          )}
        </div>
      </CardContent>
      <CardFooter className="mt-2 flex flex-wrap items-center justify-end gap-2 rounded-none bg-muted px-6 py-4">
        {showUpgradeButton ? (
          <Button
            className={cn(
              'cursor-pointer rounded-none',
              // 高亮绿色系按钮（恢复）
              'min-h-9 min-w-[5.5rem] px-4 text-sm font-semibold text-white shadow-sm',
              'bg-[#22c55e] hover:bg-[#16a34a] ring-1 ring-[#22c55e]/25 hover:ring-[#22c55e]/40 hover:shadow-md',
            )}
            asChild
          >
            <LocaleLink href={Routes.Pricing}>{t('upgradeToPlan')}</LocaleLink>
          </Button>
        ) : null}
      </CardFooter>
    </Card>
  );
}
