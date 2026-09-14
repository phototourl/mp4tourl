'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FormError } from '@/components/shared/form-error';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  settingsCard,
  storageUsageProgressFill,
  storageUsageProgressTrack,
} from '@/components/settings/settings-card-classes';
import { settingsButtonPrimary } from '@/components/settings/settings-button-classes';
import { getResourcesMeta, readCachedResourcesMeta } from '@/components/settings/resources-meta-cache';
import { authClient } from '@/lib/auth-client';
import { PLAN_FREE, PLAN_PAID, PLAN_TIER_YEARLY } from '@/lib/constants/plans';
import { formatBytes } from '@/lib/constants/plans';
import { cn } from '@/lib/utils';
import { LocaleLink } from '@/i18n/navigation';
import { Routes } from '@/routes';
import { zodResolver } from '@hookform/resolvers/zod';
import { CalendarClock, CreditCard, Globe2, HardDrive, Mail, PenTool, Sparkles, Upload, UserPlus, Zap } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';

interface UpdateAvatarCardProps {
  className?: string;
}

/**
 * 与 EditStamp 同款布局；存储未开启时展示禁用上传说明。
 */
export function UpdateAvatarCard({ className }: UpdateAvatarCardProps) {
  const t = useTranslations('Dashboard.settings.profile');
  const tBilling = useTranslations('Dashboard.settings.billing');
  const tDashboard = useTranslations('Dashboard');
  const locale = useLocale();
  const { data: session, refetch } = authClient.useSession();
  const user = session?.user;
  const [plan, setPlan] = useState<string>(PLAN_FREE);
  const [planTier, setPlanTier] = useState<string | null>(null);
  const [planExpiresAt, setPlanExpiresAt] = useState<string | null>(null);
  const [subscriptionActive, setSubscriptionActive] = useState<boolean>(true);
  const [storageLimit, setStorageLimit] = useState<number | null>(null);
  const [storageUsed, setStorageUsed] = useState<number>(0);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | undefined>('');

  const formSchema = z.object({
    name: z
      .string()
      .min(3, { message: t('name.minLength') })
      .max(30, { message: t('name.maxLength') }),
  });

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: user?.name || '',
    },
  });

  useEffect(() => {
    if (!user?.id) return;

    let alive = true;

    async function loadPlan() {
      const cached = readCachedResourcesMeta();
      const data = cached ?? (await getResourcesMeta());
      if (!alive) return;
      setPlan(data.plan || PLAN_FREE);
      setPlanTier(data.planTier ?? null);
      setPlanExpiresAt(data.planExpiresAt ?? null);
      setSubscriptionActive(data.subscriptionActive ?? (data.plan !== PLAN_PAID));
      setStorageLimit(data.storageLimit);
      setStorageUsed(data.storageUsed);
    }

    loadPlan();
    return () => {
      alive = false;
    };
  }, [user?.id]);

  useEffect(() => {
    if (user?.name) {
      form.setValue('name', user.name);
    }
  }, [user, form]);

  if (!user) {
    return null;
  }

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    if (values.name === user.name) return;

    await authClient.updateUser(
      { name: values.name },
      {
        onRequest: () => {
          setIsSaving(true);
          setError('');
        },
        onResponse: () => {
          setIsSaving(false);
        },
        onSuccess: () => {
          toast.success(t('name.success'));
          refetch();
          form.reset({ name: values.name });
        },
        onError: (ctx) => {
          setError(`${ctx.error.status}: ${ctx.error.message}`);
          toast.error(t('name.fail'));
        },
      }
    );
  };

  // Keep in sync with `src/components/settings/billing/plan-card.tsx`
  const planNameKey =
    plan === PLAN_PAID
      ? planTier === PLAN_TIER_YEARLY
        ? 'planNames.premium'
        : 'planNames.pro'
      : 'planNames.free';
  const planName = tBilling(planNameKey);
  const hasPaidAccess = plan === PLAN_PAID && subscriptionActive;
  const isExpiredPaid = plan === PLAN_PAID && !subscriptionActive;

  const statusText = isExpiredPaid
    ? (tBilling.has('status.expired') ? tBilling('status.expired') : 'Expired')
    : tBilling('status.active');
  const statusToneClass = isExpiredPaid
    ? 'text-red-600 dark:text-red-300'
    : 'text-cyan-600 dark:text-cyan-400';

  const memberSince = user.createdAt
    ? new Date(user.createdAt).toLocaleDateString(locale)
    : '-';
  const email = user.email || '-';
  const expiryDate = planExpiresAt
    ? new Date(planExpiresAt).toLocaleDateString(locale)
    : '-';
  const storageLimitText =
    typeof storageLimit === 'number' ? formatBytes(storageLimit, locale) : '-';
  const storageUsedText = formatBytes(storageUsed, locale);

  const isFreePlan = plan === PLAN_FREE;
  const showExpiredTone = isExpiredPaid;
  const profileMetaText = isFreePlan ? email : expiryDate;
  const planBadgeText = isFreePlan ? tBilling('planNames.free') : planName;
  const planMessage =
    isFreePlan
      ? tBilling('currentPlan.description')
      : isExpiredPaid
        ? (tBilling.has('inactivePlanMessage') ? tBilling('inactivePlanMessage') : '权益已失效')
        : tBilling('paidPlanMessage');
  const showUpgradeButton =
    isFreePlan || !hasPaidAccess || (hasPaidAccess && planTier !== PLAN_TIER_YEARLY);
  const avatarInitial = (user.name || email || 'U').trim().charAt(0).toUpperCase();

  return (
    <Card className={cn(settingsCard, 'overflow-hidden', className)}>
      <CardHeader className="bg-transparent">
        <CardTitle className="text-lg font-semibold">{t('title')}</CardTitle>
      </CardHeader>
      <CardContent
        className={cn(
          'relative p-0 border-t border-slate-200/80 dark:border-slate-700/50'
        )}
      >
        <div
          aria-hidden
          className="pointer-events-none absolute hidden lg:block lg:top-0 lg:bottom-0 lg:left-1/2 lg:w-px lg:-translate-x-1/2 lg:bg-slate-200/80 dark:lg:bg-slate-700/50"
        />
        <div className="grid grid-cols-1 items-stretch lg:grid-cols-2">
          <div className="flex min-h-0 flex-col gap-4 p-6 lg:pr-10">
            <div className="text-sm font-semibold">{t('title')}</div>

            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-4">
                <div
                  className={cn(
                    "relative h-20 w-20 shrink-0 overflow-hidden rounded-full border-2 border-slate-200 dark:border-slate-700",
                    user.image
                      ? "bg-slate-100 dark:bg-slate-800"
                      : "bg-gradient-to-br from-brand-teal to-emerald-500"
                  )}
                >
                  {user.image ? (
                    <img src={user.image} alt={user.name ?? ''} className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center">
                      <span className="text-3xl font-semibold leading-none text-white select-none">
                        {avatarInitial}
                      </span>
                    </div>
                  )}
                </div>
                <div className="space-y-1">
                  <div className="text-sm text-muted-foreground">{t('title')}</div>
                  <div className="text-2xl font-semibold leading-none">{user.name || 'User'}</div>
                  <div className="text-sm text-muted-foreground break-all">{email}</div>
                </div>
              </div>
              <div className="shrink-0 whitespace-nowrap rounded-full border border-cyan-300/60 bg-cyan-50 px-3 py-1 text-xs font-semibold leading-none text-cyan-700 dark:border-cyan-700/50 dark:bg-cyan-950/30 dark:text-cyan-300">
                {planBadgeText}
              </div>
            </div>

            <div className="rounded-xl border bg-background/70 p-4">
              <div className="mb-2 text-sm font-semibold">{tBilling('currentPlan.title')}</div>
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <Zap className="h-3.5 w-3.5 text-cyan-600 dark:text-cyan-400" />
                  <span className="font-medium">{planName}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Sparkles className={cn('h-3.5 w-3.5', statusToneClass)} />
                  <span className={cn('font-medium', isExpiredPaid && 'text-red-600 dark:text-red-300')}>
                    {statusText}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <UserPlus className="h-3.5 w-3.5 text-cyan-600 dark:text-cyan-400" />
                  <span className="font-medium">{memberSince}</span>
                </div>
                <div className="flex items-center gap-2">
                  {isFreePlan ? (
                    <Mail className="h-3.5 w-3.5 text-cyan-600 dark:text-cyan-400" />
                  ) : (
                    <CalendarClock className={cn('h-3.5 w-3.5', showExpiredTone ? 'text-red-600 dark:text-red-300' : 'text-cyan-600 dark:text-cyan-400')} />
                  )}
                  <span className={cn('font-medium break-all', showExpiredTone && 'text-red-600 dark:text-red-300')}>
                    {profileMetaText}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <HardDrive className="h-3.5 w-3.5 text-cyan-600 dark:text-cyan-400" />
                  <span className="font-medium">{storageLimitText}</span>
                </div>
              </div>
            </div>

            <div className="h-px bg-border" />

            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="flex flex-col gap-3"
              >
                <div className="text-sm font-semibold">{t('name.title')}</div>
                <FormError message={error} />
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <Input placeholder={t('name.placeholder')} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <p className="text-xs text-muted-foreground">{t('name.hint')}</p>
                <div className="mt-1 flex justify-end">
                    <Button
                      type="submit"
                      disabled={isSaving}
                      className={cn('cursor-pointer text-xs', settingsButtonPrimary)}
                    >
                    {isSaving ? t('name.saving') : t('name.save')}
                  </Button>
                </div>
              </form>
            </Form>
          </div>

          <div className="flex min-h-0 flex-col gap-4 border-t p-6 lg:border-t-0 lg:pl-10">
            <div className="flex items-center gap-2 text-sm font-semibold">
              <CreditCard className="h-4 w-4 text-cyan-500" />
              <span>{tBilling('currentPlan.title')}</span>
            </div>
            <p className="text-sm text-muted-foreground">{tBilling('currentPlan.description')}</p>

            <div className="grid grid-cols-1 gap-3">
              <div className="flex h-10 items-center gap-2 rounded-lg border border-white/20 bg-gradient-to-r from-[#60a5fa] to-[#3b82f6] px-3 text-xs font-semibold text-white shadow-[inset_0_1px_0_0_rgba(255,255,255,0.18)]">
                <Upload className="h-3.5 w-3.5 shrink-0" />
                <span>{tBilling('freePlanMessage')}</span>
              </div>
              <div className="flex h-10 items-center gap-2 rounded-lg border border-white/20 bg-gradient-to-r from-[#22c55e] to-[#10b981] px-3 text-xs font-semibold text-white shadow-[inset_0_1px_0_0_rgba(255,255,255,0.18)]">
                <HardDrive className="h-3.5 w-3.5 shrink-0" />
                <span>{tBilling('upgradeHint')}</span>
              </div>
              <div className="flex h-10 items-center gap-2 rounded-lg border border-white/20 bg-gradient-to-r from-[#f59e0b] to-[#ea580c] px-3 text-xs font-semibold text-white shadow-[inset_0_1px_0_0_rgba(255,255,255,0.18)]">
                <Globe2 className="h-3.5 w-3.5 shrink-0" />
                <span>{tBilling('storage.title')}</span>
              </div>
              <div className="flex h-10 items-center gap-2 rounded-lg border border-white/20 bg-gradient-to-r from-[#a78bfa] to-[#a259ec] px-3 text-xs font-semibold text-white shadow-[inset_0_1px_0_1px_0_rgba(255,255,255,0.18)]">
                <PenTool className="h-3.5 w-3.5 shrink-0" />
                <span>{tBilling('featureAdvancedEditing')}</span>
              </div>
            </div>

            <div className="mt-12 flex flex-col gap-4 rounded-xl border border-slate-200/80 bg-background/70 p-4 shadow-sm dark:border-white/10 dark:bg-white/5 dark:shadow-[inset_0_1px_0_0_rgba(255,255,255,0.06)] lg:mt-16">
              <div className="min-w-0">
                <div className="truncate text-sm font-semibold text-foreground dark:text-white">{planName}</div>
              </div>
              {isExpiredPaid ? (
                <div className="-mt-2 text-xs text-red-600 dark:text-red-300">
                  {tBilling.has('expiredStorageLimitHint')
                    ? tBilling('expiredStorageLimitHint')
                    : '到期后仅享 100MB 存储额度'}
                </div>
              ) : null}
              <div>
                <div className="flex items-center justify-between text-xs text-muted-foreground dark:text-white/80">
                  <span>{tBilling('storageUsed')}</span>
                  <span className="font-semibold text-foreground dark:text-white">
                    {storageUsedText} / {storageLimitText}
                  </span>
                </div>
                <div className={cn('mt-2', storageUsageProgressTrack)}>
                  <div
                    className={storageUsageProgressFill}
                    style={{
                      width:
                        typeof storageLimit === 'number' && storageLimit > 0
                          ? `${Math.min((storageUsed / storageLimit) * 100, 100)}%`
                          : '0%',
                    }}
                  />
                </div>
              </div>

              <div
                className={cn(
                  'line-clamp-2 text-xs',
                  isExpiredPaid
                    ? 'text-red-600 dark:text-red-300'
                    : 'text-muted-foreground dark:text-white/80'
                )}
              >
                {planMessage}
              </div>

              {showUpgradeButton && (
                <div className="-mt-3 flex justify-end">
                  <Button
                    className={cn(
                      'cursor-pointer',
                      'min-h-9 px-4 text-xs font-semibold text-white shadow-sm',
                      'bg-[#22c55e] hover:bg-[#16a34a] ring-1 ring-[#22c55e]/25 hover:ring-[#22c55e]/40 hover:shadow-md',
                      'rounded-none',
                    )}
                    asChild
                  >
                    <LocaleLink href={Routes.Pricing}>{tDashboard('upgrade.button')}</LocaleLink>
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
