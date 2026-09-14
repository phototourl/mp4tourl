'use client';

import { usePricePlans } from '@/config/price-config';
import { useCurrentUser } from '@/hooks/use-current-user';
import {
  parsePlanTier,
  PLAN_TIER_YEARLY,
  SUBSCRIPTION_PLAN_ID_MONTHLY,
  SUBSCRIPTION_PLAN_ID_YEARLY,
  type PlanTier,
} from '@/lib/constants/plans';
import { cn } from '@/lib/utils';
import { PaymentTypes, type PricePlan } from '@/payment/types';
import { useEffect, useMemo, useState } from 'react';
import { PricingCard } from './pricing-card';

interface PricingTableProps {
  metadata?: Record<string, string>;
  currentPlan?: PricePlan | null;
  className?: string;
}

type SubscriptionCheckoutState = {
  subscriptionActive: boolean;
  planTier: PlanTier | null;
  currentPlanId: string | null;
};

const EMPTY_SUBSCRIPTION_CHECKOUT: SubscriptionCheckoutState = {
  subscriptionActive: false,
  planTier: null,
  currentPlanId: null,
};

const PLAN_FETCH_TIMEOUT_MS = 4000;

/** Lightweight plan snapshot for pricing CTAs (no storage aggregates). */
async function fetchSubscriptionCheckout(
  signal?: AbortSignal
): Promise<SubscriptionCheckoutState> {
  const res = await fetch('/api/resources?planOnly=1', {
    cache: 'no-store',
    signal,
  });
  if (!res.ok) {
    return EMPTY_SUBSCRIPTION_CHECKOUT;
  }
  const json = (await res.json()) as {
    plan?: string;
    planTier?: string | null;
    subscriptionActive?: boolean;
  };
  // Trust server flag; do not infer from plan string (expired paid still has plan=paid).
  const subscriptionActive = Boolean(json.subscriptionActive);
  const planTier = subscriptionActive
    ? parsePlanTier(json.planTier)
    : null;
  const currentPlanId = subscriptionActive
    ? planTier === PLAN_TIER_YEARLY
      ? SUBSCRIPTION_PLAN_ID_YEARLY
      : SUBSCRIPTION_PLAN_ID_MONTHLY
    : null;
  return { subscriptionActive, planTier, currentPlanId };
}

export function PricingTable({
  metadata,
  currentPlan,
  className,
}: PricingTableProps) {
  const pricePlans = usePricePlans();
  const plans = Object.values(pricePlans);
  const currentUser = useCurrentUser();
  const [subscriptionCheckout, setSubscriptionCheckout] = useState<
    SubscriptionCheckoutState | undefined
  >(undefined);

  useEffect(() => {
    if (!currentUser?.id) {
      setSubscriptionCheckout(undefined);
      return;
    }

    // Show CTAs immediately as free; refine once plan arrives.
    setSubscriptionCheckout(EMPTY_SUBSCRIPTION_CHECKOUT);

    let cancelled = false;
    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => controller.abort(), PLAN_FETCH_TIMEOUT_MS);

    void fetchSubscriptionCheckout(controller.signal)
      .then((state) => {
        if (!cancelled) setSubscriptionCheckout(state);
      })
      .catch(() => {
        if (!cancelled) setSubscriptionCheckout(EMPTY_SUBSCRIPTION_CHECKOUT);
      })
      .finally(() => {
        window.clearTimeout(timeoutId);
      });

    return () => {
      cancelled = true;
      controller.abort();
      window.clearTimeout(timeoutId);
    };
  }, [currentUser?.id]);

  const currentPlanId = useMemo(
    () => currentPlan?.id || subscriptionCheckout?.currentPlanId || null,
    [currentPlan?.id, subscriptionCheckout?.currentPlanId]
  );

  const freePlans = plans.filter((plan) => plan.isFree && !plan.disabled);
  const subscriptionPlans = plans.filter(
    (plan) =>
      !plan.isFree &&
      !plan.disabled &&
      plan.prices.some(
        (price) => !price.disabled && price.type === PaymentTypes.SUBSCRIPTION
      )
  );
  const oneTimePlans = plans.filter(
    (plan) =>
      !plan.isFree &&
      !plan.disabled &&
      plan.prices.some(
        (price) => !price.disabled && price.type === PaymentTypes.ONE_TIME
      ) &&
      !plan.prices.some(
        (price) => !price.disabled && price.type === PaymentTypes.SUBSCRIPTION
      )
  );

  const totalVisiblePlans =
    freePlans.length + subscriptionPlans.length + oneTimePlans.length;

  return (
    <div className={cn('flex flex-col gap-6', className)}>
      <div
        className={cn(
          'grid gap-4 lg:gap-5',
          totalVisiblePlans === 1 && 'grid-cols-1 max-w-md mx-auto w-full',
          totalVisiblePlans === 2 &&
            'grid-cols-1 md:grid-cols-2 max-w-2xl mx-auto w-full',
          totalVisiblePlans >= 3 &&
            'grid-cols-1 items-stretch md:grid-cols-2 lg:grid-cols-3'
        )}
      >
        {freePlans.map((plan) => (
          <PricingCard
            key={plan.id}
            plan={plan}
            metadata={metadata}
            isCurrentPlan={currentPlanId === plan.id}
            subscriptionCheckout={subscriptionCheckout}
            className="order-last md:order-none"
          />
        ))}

        {subscriptionPlans.map((plan) => {
          const price = plan.prices.find(
            (p) => p.type === PaymentTypes.SUBSCRIPTION && !p.disabled
          );
          return (
            <PricingCard
              key={plan.id}
              plan={plan}
              interval={price?.interval}
              paymentType={PaymentTypes.SUBSCRIPTION}
              metadata={metadata}
              isCurrentPlan={currentPlanId === plan.id}
              subscriptionCheckout={subscriptionCheckout}
            />
          );
        })}

        {oneTimePlans.map((plan) => (
          <PricingCard
            key={plan.id}
            plan={plan}
            paymentType={PaymentTypes.ONE_TIME}
            metadata={metadata}
            isCurrentPlan={currentPlanId === plan.id}
            subscriptionCheckout={subscriptionCheckout}
          />
        ))}
      </div>
    </div>
  );
}
