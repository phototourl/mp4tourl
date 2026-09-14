/**
 * Waffo Pancake product IDs & API settings — read from env only.
 * Phototourl: Pro monthly/yearly subscription + WeChat one-time variants.
 * Env names: `WAFFO_PRICE_ID_*` (plus optional `NEXT_PUBLIC_WAFFO_PRICE_ID_*` for client build).
 */
export type WaffoPlanKey =
  | 'pro'
  | 'proYearly'
  | 'proMonthlyOnetime'
  | 'proYearlyOnetime';

const WAFFO_PRICE_ENV: Record<WaffoPlanKey, string[]> = {
  pro: [
    'WAFFO_PRICE_ID_PRO_MONTHLY',
    'NEXT_PUBLIC_WAFFO_PRICE_ID_PRO_MONTHLY',
  ],
  proYearly: [
    'WAFFO_PRICE_ID_PRO_YEARLY',
    'NEXT_PUBLIC_WAFFO_PRICE_ID_PRO_YEARLY',
  ],
  proMonthlyOnetime: [
    'WAFFO_PRICE_ID_PRO_MONTHLY_ONETIME',
    'NEXT_PUBLIC_WAFFO_PRICE_ID_PRO_MONTHLY_ONETIME',
  ],
  proYearlyOnetime: [
    'WAFFO_PRICE_ID_PRO_YEARLY_ONETIME',
    'NEXT_PUBLIC_WAFFO_PRICE_ID_PRO_YEARLY_ONETIME',
  ],
};

function readEnv(name: string): string {
  return process.env[name]?.trim() ?? '';
}

function readFirstEnv(names: string[]): string {
  for (const name of names) {
    const value = readEnv(name);
    if (value) return value;
  }
  return '';
}

export function getWaffoMerchantId(): string {
  return readEnv('WAFFO_MERCHANT_ID');
}

export function getWaffoEnvironment(): 'test' | 'prod' {
  const raw = readEnv('WAFFO_ENVIRONMENT').toLowerCase();
  return raw === 'prod' || raw === 'live' ? 'prod' : 'test';
}

export function getWaffoPrivateKey(): string {
  const raw = readEnv('WAFFO_PRIVATE_KEY');
  if (!raw) return '';
  return raw.includes('\\n') ? raw.replace(/\\n/g, '\n') : raw;
}

export function getWaffoProductId(planKey: WaffoPlanKey): string {
  return readFirstEnv(WAFFO_PRICE_ENV[planKey]);
}

export function isWaffoOneTimeMonthlyProduct(productId: string): boolean {
  const id = getWaffoProductId('proMonthlyOnetime');
  return Boolean(id && productId === id);
}

export function isWaffoOneTimeYearlyProduct(productId: string): boolean {
  const id = getWaffoProductId('proYearlyOnetime');
  return Boolean(id && productId === id);
}

/** Subscription monthly product (card recurring) — not WeChat one-time. */
export function isWaffoMonthlySubscriptionProduct(productId: string): boolean {
  const id = getWaffoProductId('pro');
  return Boolean(id && productId === id);
}

/** Subscription yearly product — Waffo activate webhooks often omit billingPeriod. */
export function isWaffoYearlySubscriptionProduct(productId: string): boolean {
  const id = getWaffoProductId('proYearly');
  return Boolean(id && productId === id);
}
