'use client';

import { AuthDialog } from '@/components/auth/auth-dialog';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Card,
  CardContent,
  CardDescription,
  CardTitle,
} from '@/components/ui/card';
import { useCurrentUser } from '@/hooks/use-current-user';
import { useLocalePathname, useLocaleRouter } from '@/i18n/navigation';
import { websiteConfig } from '@/config/website';
import { formatPrice } from '@/lib/formatter';
import {
  getSubscriptionCheckoutBlockReason,
  PLAN_TIER_MONTHLY,
  SUBSCRIPTION_PLAN_ID_YEARLY,
  type PlanTier,
  type SubscriptionCheckoutBlockReason,
} from '@/lib/constants/plans';
import { cn } from '@/lib/utils';
import {
  PaymentTypes,
  PlanIntervals,
  type Price,
  type PricePlan,
  type PlanInterval,
  type PaymentType,
} from '@/payment/types';
import { CheckCircleIcon, XCircleIcon } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { Routes } from '@/routes';
import { Badge } from '../ui/badge';
import { useState } from 'react';
import { trackPricingRedirect } from '@/lib/analytics/pricing-redirect';
import { AlertTriangle } from 'lucide-react';

interface PricingCardProps {
  plan: PricePlan;
  interval?: PlanInterval;
  paymentType?: PaymentType;
  metadata?: Record<string, string>;
  className?: string;
  isCurrentPlan?: boolean;
  subscriptionCheckout?: {
    subscriptionActive: boolean;
    planTier: PlanTier | null;
    currentPlanId?: string | null;
  };
}

function getPriceForPlan(
  plan: PricePlan,
  interval?: PlanInterval,
  paymentType?: PaymentType
): Price | undefined {
  if (plan.isFree) {
    return undefined;
  }

  return plan.prices.find((price) => {
    if (paymentType === PaymentTypes.ONE_TIME) {
      return price.type === PaymentTypes.ONE_TIME;
    }
    return (
      price.type === PaymentTypes.SUBSCRIPTION && price.interval === interval
    );
  });
}

export function PricingCard({
  plan,
  interval,
  paymentType,
  metadata,
  className,
  isCurrentPlan = false,
  subscriptionCheckout,
}: PricingCardProps) {
  const t = useTranslations('PricingPage.PricingCard');
  const locale = useLocale();
  const price = getPriceForPlan(plan, interval, paymentType);
  const oneTimePrice = plan.prices.find(
    (p) =>
      !p.disabled &&
      p.type === PaymentTypes.ONE_TIME &&
      !!p.priceId &&
      (interval
        ? p.interval === interval
        : p.interval === price?.interval || !price?.interval)
  );
  const currentUser = useCurrentUser();
  const currentPath = useLocalePathname();
  const router = useLocaleRouter();
  const [loadingPriceId, setLoadingPriceId] = useState<string | null>(null);
  const [checkoutDialogOpen, setCheckoutDialogOpen] = useState(false);
  const [checkoutDialogMessage, setCheckoutDialogMessage] = useState('');
  const [authDialogOpen, setAuthDialogOpen] = useState(false);

  // Logged-in: plan snapshot loads in background. Do not park CTAs on Loading —
  // treat missing snapshot as free until it arrives (checkout API still enforces).
  const isSubscriptionStatusPending = false;

  const checkoutBlockReason: SubscriptionCheckoutBlockReason | null =
    subscriptionCheckout
      ? getSubscriptionCheckoutBlockReason({
          ...subscriptionCheckout,
          targetPlanId: plan.id,
        })
      : null;
  const isBlockedCheckout = checkoutBlockReason !== null;
  const isCurrentSubscriptionPlan =
    isCurrentPlan || checkoutBlockReason === 'current_plan';

  // Monthly → yearly: keep zh dual CTAs (WeChat one-time + subscribe upgrade).
  const isUpgradeToYearly =
    !!subscriptionCheckout?.subscriptionActive &&
    subscriptionCheckout.planTier === PLAN_TIER_MONTHLY &&
    plan.id === SUBSCRIPTION_PLAN_ID_YEARLY;

  // China / Taiwan (zh, zh-TW): dual CTAs — WeChat one-time + card subscription
  const showZhDualCtas =
    !isSubscriptionStatusPending &&
    !isBlockedCheckout &&
    (plan.id === 'pro' || plan.id === 'proYearly') &&
    (locale === 'zh' || locale === 'zh-TW') &&
    !!price &&
    !!oneTimePrice &&
    price.priceId !== oneTimePrice.priceId;

  const getSubscribeLabel = () => {
    if (plan.isLifetime) return t('getLifetimeAccess');
    if (isUpgradeToYearly) return t('upgradeToYearly');
    if (interval === PlanIntervals.YEAR) return t('subscribeYearly');
    if (interval === PlanIntervals.MONTH) return t('subscribeMonthly');
    return t('getStarted');
  };

  const getBlockedButtonLabel = () => {
    if (checkoutBlockReason === 'downgrade') return t('cannotDowngrade');
    if (isCurrentSubscriptionPlan) return t('yourCurrentPlan');
    return t('alreadySubscribed');
  };

  /** Same AuthDialog as header LoginWrapper — stay on pricing after sign-in. */
  const openAuthDialog = () => {
    setAuthDialogOpen(true);
  };

  const handleCheckout = async (plan: PricePlan, price: Price | undefined) => {
    if (!price?.priceId || isBlockedCheckout || isSubscriptionStatusPending) {
      return;
    }
    if (!currentUser) {
      openAuthDialog();
      return;
    }

    // 点击 Pro/Premium 的支付按钮时记录一条事件（不阻塞后续 checkout 跳转）
    const pricingEventType =
      plan.id === 'pro'
        ? 'click_pricing_cta_pro'
        : plan.id === 'proYearly'
          ? 'click_pricing_cta_premium'
          : 'start_checkout';
    trackPricingRedirect({
      eventType: pricingEventType,
      sourceModule: 'pricing_table',
      sourceAction:
        plan.id === 'pro'
          ? price.type === PaymentTypes.ONE_TIME
            ? 'click_get_started_pro_onetime'
            : 'click_get_started_pro'
          : plan.id === 'proYearly'
            ? price.type === PaymentTypes.ONE_TIME
              ? 'click_get_started_premium_onetime'
              : 'click_get_started_premium'
            : 'click_get_started',
      toPath: '/api/checkout',
      planAtTime: plan.id,
      meta: {
        planId: plan.id,
        priceId: price.priceId,
        interval: price.interval ?? null,
        paymentType: price.type,
      },
    });

    setLoadingPriceId(price.priceId);
    try {
      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          priceId: price.priceId,
          metadata: {
            planId: plan.id,
            paymentType: price.type,
          },
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        const err = typeof data.error === 'string' ? data.error : '';
        if (err === 'downgrade') {
          setCheckoutDialogMessage(t('cannotDowngrade'));
        } else if (err === 'current_plan') {
          setCheckoutDialogMessage(t('yourCurrentPlan'));
        } else if (err === 'already_active') {
          setCheckoutDialogMessage(t('alreadySubscribed'));
        } else {
          setCheckoutDialogMessage(
            err || t('checkoutErrorDialog.description')
          );
        }
        setCheckoutDialogOpen(true);
        return;
      }

      // Redirect to Waffo checkout
      if (data.url) {
        window.location.href = data.url;
      }
    } catch (error) {
      console.error('Checkout error:', error);
      setCheckoutDialogMessage(
        error instanceof Error ? error.message : t('checkoutErrorDialog.description')
      );
      setCheckoutDialogOpen(true);
    } finally {
      setLoadingPriceId(null);
    }
  };

  const isLoading = loadingPriceId !== null;

  let formattedPrice = '';
  let priceLabel = '';
  let strikeThroughPrice = '';
  // Keep free currency in sync with paid plans (USD) — don't use per-locale £/€ hardcodes.
  const displayCurrency =
    websiteConfig.price.plans.pro?.prices.find((p) => !!p.currency)?.currency ??
    'USD';
  if (plan.isFree) {
    formattedPrice = formatPrice(0, displayCurrency);
  } else if (price && price.amount > 0) {
    if (interval === PlanIntervals.MONTH) {
      formattedPrice = formatPrice(price.amount, price.currency, 2);
      priceLabel = t('perMonth');
    } else if (interval === PlanIntervals.YEAR) {
      // Yearly: ~~monthly×12~~ $79 USD
      formattedPrice = formatPrice(price.amount, price.currency, 2);
      priceLabel = t('perYear');
    } else {
      formattedPrice = formatPrice(price.amount, price.currency);
    }
  } else {
    formattedPrice = t('notAvailable');
  }

  const monthlyCompareAmount =
    (websiteConfig.price.plans.pro?.prices as Price[] | undefined)?.find(
      (p) =>
        p.type === PaymentTypes.SUBSCRIPTION &&
        p.interval === PlanIntervals.MONTH &&
        !p.disabled
    )?.amount ?? 0;
  if (
    !plan.isFree &&
    price &&
    price.amount > 0 &&
    interval === PlanIntervals.YEAR &&
    monthlyCompareAmount > 0
  ) {
    strikeThroughPrice = formatPrice(
      monthlyCompareAmount * 12,
      price.currency,
      2
    );
  }
  const saveVsMonthlyPercent =
    !!price &&
    price.amount > 0 &&
    interval === PlanIntervals.YEAR &&
    monthlyCompareAmount > 0
      ? Math.floor((1 - price.amount / (monthlyCompareAmount * 12)) * 100)
      : 0;

  const isPaidPlan = !plan.isFree && !!price;

  const batchUploadText = plan.isFree
    ? t('batchUpload.free')
    : interval === PlanIntervals.YEAR
      ? t('batchUpload.yearly')
      : t('batchUpload.monthly');

  // Tier-specific styling
  const isFree = plan.isFree;
  const isPro = plan.id === 'pro';
  const isPremium = plan.id === 'proYearly';
  // Dual CTAs need an explicit choice — don't treat whole card as a single checkout click.
  const isCardClickable =
    !isSubscriptionStatusPending &&
    !isCurrentSubscriptionPlan &&
    !isBlockedCheckout &&
    (plan.isFree || isPaidPlan) &&
    !showZhDualCtas;
  // 免费 / 月付 / 年付：同一套蓝色边框与强调（不要把月年改成品牌青）
  const isColoredCard = isFree || isPro || isPremium;
  const tierCardClass =
    'bg-white dark:bg-slate-950/20 border border-[#5d93f6] ring-1 ring-[rgba(93,147,246,0.22)] shadow-[inset_0_1px_0_0_rgba(255,255,255,0.55)] dark:border-[#5d93f6] dark:ring-[rgba(93,147,246,0.18)] dark:shadow-[inset_0_1px_0_0_rgba(255,255,255,0.08)]';
  const coloredCardButtonClass =
    'border-[#5d93f6] bg-[#5d93f6] text-white hover:bg-[#4b7ee9] hover:border-[#4b7ee9] shadow-[0_8px_18px_-12px_rgba(93,147,246,0.85)]';
  const coloredCardBadgeClass =
    'bg-[#5d93f6] text-white border border-[#5d93f6] shadow-[0_8px_18px_-12px_rgba(93,147,246,0.85)]';
  /** Shared CTA width; keep default Button height (h-8), don't force h-10 */
  const ctaButtonClass = 'w-full cursor-pointer';
  /** 仅月付 / 年付用实心蓝 CTA；免费档保持 outline，不强行改按钮色 */
  const usesFilledBlueCta = isPro || isPremium;

  const handleCardClick = () => {
    if (!isCardClickable || isLoading) return;

    if (plan.isFree) {
      if (currentUser) {
        router.push(Routes.Root);
      } else {
        openAuthDialog();
      }
      return;
    }

    if (isPaidPlan) {
      void handleCheckout(plan, price);
    }
  };

  const cardNode = (
    <div className={cn('flex h-full flex-col', className)}>
      <AuthDialog
        open={authDialogOpen}
        onOpenChange={setAuthDialogOpen}
        callbackUrl={currentPath}
      />

      {checkoutDialogOpen ? (
        <Dialog open={checkoutDialogOpen} onOpenChange={setCheckoutDialogOpen}>
          <DialogContent className="sm:max-w-xl border-0 shadow-2xl">
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-white to-slate-50 p-8">
              <div className="absolute -top-16 -right-16 h-32 w-32 rounded-full bg-[#0abab5]/10" />
              <div className="absolute -bottom-8 -left-8 h-24 w-24 rounded-full bg-[#0abab5]/5" />

              <div className="relative">
                <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-[#0abab5] to-[#089590] shadow-lg">
                  <AlertTriangle className="h-10 w-10 text-white" />
                </div>

                <div className="mb-6 text-center">
                  <DialogTitle className="text-2xl font-bold text-slate-900 mb-2">
                    {t('checkoutErrorDialog.title')}
                  </DialogTitle>
                  <DialogDescription className="mx-auto max-w-[34rem] text-balance text-base font-medium leading-relaxed text-red-500">
                    {checkoutDialogMessage}
                  </DialogDescription>
                </div>

                <div className="flex gap-4">
                  <Button
                    variant="outline"
                    className="h-12 w-full text-base font-medium border-2 hover:bg-slate-50"
                    onClick={() => setCheckoutDialogOpen(false)}
                  >
                    {t('activePlanDialog.close')}
                  </Button>
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      ) : null}

      <Card
        className={cn(
          'relative flex h-full flex-1 flex-col gap-3 transition-all duration-300 ease-out',
          'motion-safe:hover:-translate-y-1 motion-safe:hover:shadow-xl',
          'text-foreground',
          isColoredCard && tierCardClass,
          isCurrentSubscriptionPlan && 'ring-2 ring-white/50',
          isCardClickable && 'cursor-pointer'
        )}
        role={isCardClickable ? 'button' : undefined}
        tabIndex={isCardClickable ? 0 : undefined}
        onClick={handleCardClick}
        onKeyDown={(e) => {
          if (!isCardClickable) return;
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            handleCardClick();
          }
        }}
      >
      {plan.popular && !isCurrentSubscriptionPlan && (
        <div className="absolute -top-3.5 left-1/2 transform -translate-x-1/2">
          <Badge
            variant="default"
            className={cn(
              'border backdrop-blur',
              isColoredCard
                ? coloredCardBadgeClass
                : 'bg-background text-foreground border-border'
            )}
          >
            {t('popular')}
          </Badge>
        </div>
      )}

      {isPremium && !isCurrentSubscriptionPlan && !plan.popular && (
        <div className="absolute -top-3.5 left-1/2 transform -translate-x-1/2">
          <Badge
            variant="default"
            className={cn(
              'border backdrop-blur',
              isColoredCard
                ? coloredCardBadgeClass
                : 'bg-background text-foreground border-border'
            )}
          >
            {t('bestValue')}
          </Badge>
        </div>
      )}

      {isCurrentSubscriptionPlan && (
        <div className="absolute -top-3.5 left-1/2 transform -translate-x-1/2">
          <Badge
            variant="default"
            className={cn(
              'border backdrop-blur',
              isColoredCard
                ? coloredCardBadgeClass
                : 'bg-background text-foreground border-border'
            )}
          >
            {t('currentPlan')}
          </Badge>
        </div>
      )}

      <div className="px-6">
        <CardTitle>
          <h2 className="font-semibold">{plan.name}</h2>
        </CardTitle>

        <div className="mt-1 flex flex-col justify-start gap-0.5">
          <div className="flex flex-wrap items-baseline gap-x-2">
            {strikeThroughPrice ? (
              <span className="text-base text-muted-foreground line-through tabular-nums">
                {strikeThroughPrice}
              </span>
            ) : null}
            <span className="text-3xl font-bold tabular-nums tracking-tight">
              {formattedPrice}
            </span>
            {!isFree && price && price.amount > 0 ? (
              <span className="text-sm font-medium uppercase text-muted-foreground">
                {price.currency || displayCurrency}
              </span>
            ) : null}
            <span
              className={cn(
                'text-lg text-muted-foreground',
                !priceLabel && 'invisible select-none'
              )}
              aria-hidden={!priceLabel || undefined}
            >
              {priceLabel || t('perMonth')}
            </span>
          </div>
          {isPremium && saveVsMonthlyPercent > 0 ? (
            <p className="inline-flex items-baseline gap-0.5 text-sm font-medium leading-5 text-[#5d93f6]">
              <span>{t('savePercentLabel')}</span>
              <span className="tabular-nums">{saveVsMonthlyPercent}%</span>
              <span>{t('savePercentSuffix')}</span>
            </p>
          ) : isPro ? (
            <p className="text-sm font-medium leading-5 text-[#5d93f6]">
              {t('monthlyPriceNote')}
            </p>
          ) : isFree ? (
            <p className="text-sm font-medium leading-5 text-[#5d93f6]">
              {t('freePriceNote')}
            </p>
          ) : null}
        </div>

        <CardDescription className="mt-1">
          <p className="text-sm leading-5 text-muted-foreground">
            {plan.description}
          </p>
        </CardDescription>

        <div className="mt-2 flex w-full flex-col gap-2">
          {plan.isFree ? (
            <Button
              variant="outline"
              className={ctaButtonClass}
              onClick={(e) => {
                e.stopPropagation();
                if (currentUser) {
                  router.push(Routes.Root);
                } else {
                  openAuthDialog();
                }
              }}
            >
              {t('getStartedForFree')}
            </Button>
          ) : isSubscriptionStatusPending ? (
            <Button
              disabled
              variant="default"
              className={cn(
                ctaButtonClass,
                usesFilledBlueCta ? coloredCardButtonClass : ''
              )}
            >
              {t('loading')}
            </Button>
          ) : isCurrentSubscriptionPlan || isBlockedCheckout ? (
            <Button
              disabled
              variant={isFree ? 'outline' : 'default'}
              className={cn(
                ctaButtonClass,
                'bg-blue-100 dark:bg-blue-800 text-blue-700 dark:text-blue-100 hover:bg-blue-100 dark:hover:bg-blue-800 border border-blue-200 dark:border-blue-700'
              )}
            >
              {getBlockedButtonLabel()}
            </Button>
          ) : isPaidPlan && showZhDualCtas && oneTimePrice ? (
            <>
              <Button
                className={cn(ctaButtonClass, coloredCardButtonClass)}
                onClick={(e) => {
                  e.stopPropagation();
                  void handleCheckout(plan, oneTimePrice);
                }}
                disabled={isLoading}
              >
                {loadingPriceId === oneTimePrice.priceId
                  ? t('loading')
                  : t('payOnceWeChat')}
              </Button>
              <Button
                variant="outline"
                className={cn(
                  ctaButtonClass,
                  'border-[#5d93f6] text-[#3b6fd4] hover:bg-[#5d93f6]/10 hover:text-[#3b6fd4]'
                )}
                onClick={(e) => {
                  e.stopPropagation();
                  void handleCheckout(plan, price);
                }}
                disabled={isLoading}
              >
                {loadingPriceId === price?.priceId
                  ? t('loading')
                  : interval === PlanIntervals.YEAR
                    ? t('subscribeYearly')
                    : t('subscribeMonthly')}
              </Button>
              <p className="text-center text-[11px] leading-snug text-muted-foreground">
                {interval === PlanIntervals.YEAR
                  ? t('payOnceHintYearly')
                  : t('payOnceHintMonthly')}
              </p>
              <p className="text-center text-[11px] leading-snug text-muted-foreground">
                {interval === PlanIntervals.YEAR
                  ? t('subscribeHintYearly')
                  : t('subscribeHintMonthly')}
              </p>
            </>
          ) : isPaidPlan ? (
            <Button
              className={cn(
                ctaButtonClass,
                usesFilledBlueCta ? coloredCardButtonClass : ''
              )}
              onClick={(e) => {
                e.stopPropagation();
                void handleCheckout(plan, price);
              }}
              disabled={isLoading}
            >
              {isLoading ? t('loading') : getSubscribeLabel()}
            </Button>
          ) : (
            <Button disabled className={ctaButtonClass}>
              {t('notAvailable')}
            </Button>
          )}
        </div>
      </div>

      <CardContent className={cn('space-y-2', isColoredCard ? '' : '')}>
        <hr className={cn('border-dashed', isColoredCard ? 'border-border' : '')} />

        <ul className="list-outside space-y-4 text-sm">
          {plan.features?.map((feature, i) => {
            const key = `feature-${i + 1}`;
            // 免费版: 5=去广告否, 6–10 置灰；专业版: 10 置灰；高级版: 全部正常
            const negativeKeys = plan.isFree
              ? ['feature-5', 'feature-6', 'feature-7', 'feature-8', 'feature-9', 'feature-10']
              : plan.id === 'pro'
              ? ['feature-10']
              : [];
            // Same feature, different icons per tier (showing progression/improvement)
            const featureIcons: Record<string, string> = {
              'feature-1': plan.isFree ? '📎' : plan.id === 'pro' ? '📦' : '🗃️',
              'feature-2': plan.isFree ? '1️⃣' : plan.id === 'pro' ? '🔟' : '♾️',
              'feature-3': plan.isFree ? '📀' : plan.id === 'pro' ? '💿' : '💾',
              'feature-4': plan.isFree ? '🐢' : plan.id === 'pro' ? '🚀' : '⚡',
              'feature-5': plan.isFree ? '📢' : '🔕',
              'feature-6': '📁',
              'feature-7': plan.isFree ? '🚫' : plan.id === 'pro' ? '🖼️' : '🖼️',
              'feature-8': plan.isFree ? '🚫' : plan.id === 'pro' ? '✨' : '✨',
              'feature-9': plan.isFree ? '🚫' : plan.id === 'pro' ? '🔗' : '🔗',
              'feature-10': plan.isFree ? '🚫' : plan.id === 'pro' ? '🔐' : '🔐',
            };
            const batchUploadIcon = '🗂️';
            const isNegative = negativeKeys.includes(key);
            const icon = featureIcons[key];
            return (
              key === 'feature-6' ? [
                <li key={`batch-upload-${plan.id}`} className={cn(
                  "flex items-center gap-2",
                  plan.isFree && 'text-muted-foreground'
                )}>
                  {plan.isFree ? (
                    <XCircleIcon className={cn('size-4 flex-shrink-0', 'text-rose-500 dark:text-rose-400')} />
                  ) : (
                    <CheckCircleIcon
                      className={cn(
                        'size-4 flex-shrink-0',
                        isColoredCard ? 'text-[#5d93f6]' : 'text-emerald-500 dark:text-emerald-400'
                      )}
                    />
                  )}
                  <span>{t('batchUpload.label')}：{batchUploadText}</span>
                  {!plan.isFree && (
                    <span className="text-sm ml-auto">{batchUploadIcon}</span>
                  )}
                </li>,
                <li key={`feature-item-${i}`} className={cn(
                  "flex items-center gap-2",
                  isNegative && 'text-muted-foreground'
                )}>
                  {isNegative ? (
                    <XCircleIcon className={cn('size-4 flex-shrink-0', 'text-rose-500 dark:text-rose-400')} />
                  ) : (
                    <CheckCircleIcon
                      className={cn(
                        'size-4 flex-shrink-0',
                        isColoredCard ? 'text-[#5d93f6]' : 'text-emerald-500 dark:text-emerald-400'
                      )}
                    />
                  )}
                  <span>{feature}</span>
                  {icon && !isNegative && (
                    <span className="text-sm ml-auto">{icon}</span>
                  )}
                </li>
              ] : [
                <li key={`feature-item-${i}`} className={cn(
                  "flex items-center gap-2",
                  isNegative && 'text-muted-foreground'
                )}>
                  {isNegative ? (
                    <XCircleIcon className={cn('size-4 flex-shrink-0', 'text-rose-500 dark:text-rose-400')} />
                  ) : (
                    <CheckCircleIcon
                      className={cn(
                        'size-4 flex-shrink-0',
                        isColoredCard ? 'text-[#5d93f6]' : 'text-emerald-500 dark:text-emerald-400'
                      )}
                    />
                  )}
                  <span>{feature}</span>
                  {icon && !isNegative && (
                    <span className="text-sm ml-auto">{icon}</span>
                  )}
                </li>
              ]
            );
          })}
        </ul>

        {plan.limits && plan.limits.length > 0 && (
          <ul className="list-outside space-y-4 text-sm">
            {plan.limits?.map((limit, i) => (
              <li key={i} className={cn('flex items-center gap-2', 'text-muted-foreground')}>
                <XCircleIcon className={cn('size-4 flex-shrink-0', 'text-gray-400 dark:text-gray-500')} />
                <span>{limit}</span>
              </li>
            ))}
          </ul>
        )}

        {plan.suitableFor && (
          <div className={cn('mt-4 pt-4 border-t border-dashed', isColoredCard ? 'border-border' : '')}>
            <p className={cn('text-sm', 'text-muted-foreground')}>
              <span className="font-medium">{t('suitableFor')}</span>{plan.suitableFor}
            </p>
          </div>
        )}
      </CardContent>
      </Card>
    </div>
  );

  return cardNode;
}
