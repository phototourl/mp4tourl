'use client';

import type { PricePlan, Price } from '@/payment/types';
import { PaymentTypes, PlanIntervals, type PlanInterval, type PaymentType } from '@/payment/types';
import { useTranslations } from 'next-intl';
import { websiteConfig } from './website';

/**
 * Get price plans with translations for client components
 *
 * @returns The price plans with translated content
 */
export function usePricePlans(): Record<string, PricePlan> {
  const t = useTranslations('PricePlans');
  const priceConfig = websiteConfig.price;
  const plans: Record<string, PricePlan> = {};

  // Helper to map price type string to PaymentType
  const mapPriceType = (type: string): PaymentType => {
    return type === 'one_time' ? PaymentTypes.ONE_TIME : PaymentTypes.SUBSCRIPTION;
  };

  // Helper to map interval string to PlanInterval
  const mapInterval = (interval?: string): PlanInterval | undefined => {
    if (!interval) return undefined;
    return interval === 'year' ? PlanIntervals.YEAR : PlanIntervals.MONTH;
  };

  // Helper to map prices array
  const mapPrices = (prices: Price[]): Price[] => {
    return prices.map(price => ({
      ...price,
      type: mapPriceType(price.type as unknown as string),
      interval: mapInterval(price.interval as unknown as string),
    }));
  };

  // Free plan
  if (priceConfig.plans.free) {
    plans.free = {
      ...priceConfig.plans.free,
      name: t('free.name'),
      description: t('free.description'),
      features: [
        t('free.features.feature-1'),
        t('free.features.feature-2'),
        t('free.features.feature-3'),
        t('free.features.feature-4'),
        t('free.features.feature-5'),
        t('free.features.feature-6'),
        t('free.features.feature-7'),
        t('free.features.feature-8'),
        t('free.features.feature-9'),
        t('free.features.feature-10'),
      ],
      limits: [],
      suitableFor: t('free.suitableFor'),
    };
  }

  // Pro plan
  if (priceConfig.plans.pro) {
    const proPlan = priceConfig.plans.pro;
    plans.pro = {
      ...proPlan,
      prices: mapPrices(proPlan.prices as Price[]),
      name: t('pro.name'),
      description: t('pro.description'),
      features: [
        t('pro.features.feature-1'),
        t('pro.features.feature-2'),
        t('pro.features.feature-3'),
        t('pro.features.feature-4'),
        t('pro.features.feature-5'),
        t('pro.features.feature-6'),
        t('pro.features.feature-7'),
        t('pro.features.feature-8'),
        t('pro.features.feature-9'),
        t('pro.features.feature-10'),
      ],
      limits: [],
      suitableFor: t('pro.suitableFor'),
    };
  }

  // Pro Yearly plan
  if (priceConfig.plans.proYearly) {
    const proYearlyPlan = priceConfig.plans.proYearly;
    plans.proYearly = {
      ...proYearlyPlan,
      prices: mapPrices(proYearlyPlan.prices as Price[]),
      name: t('proYearly.name'),
      description: t('proYearly.description'),
      features: [
        t('proYearly.features.feature-1'),
        t('proYearly.features.feature-2'),
        t('proYearly.features.feature-3'),
        t('proYearly.features.feature-4'),
        t('proYearly.features.feature-5'),
        t('proYearly.features.feature-6'),
        t('proYearly.features.feature-7'),
        t('proYearly.features.feature-8'),
        t('proYearly.features.feature-9'),
        t('proYearly.features.feature-10'),
      ],
      limits: [],
      suitableFor: t('proYearly.suitableFor'),
    };
  }

  return plans;
}
