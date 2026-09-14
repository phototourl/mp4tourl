'use client';

import {
  DEFAULT_STORAGE_LIMITS,
  PAID_STORAGE_LIMITS,
  PLAN_FREE,
  PLAN_PAID,
  PLAN_TIER_MONTHLY,
  PLAN_TIER_YEARLY,
} from '@/lib/constants/plans';

const RESOURCES_META_CACHE_KEY = 'ptu-resources-meta-cache';
const RESOURCES_META_CACHE_TTL_MS = 2 * 60 * 1000;

export type ResourcesMeta = {
  plan: string;
  planTier: string | null;
  planExpiresAt: string | null;
  subscriptionActive: boolean;
  storageUsed: number;
  storageLimit: number;
};

let inflightMetaPromise: Promise<ResourcesMeta> | null = null;

function normalizeResourcesMeta(json: {
  plan?: string;
  planTier?: string | null;
  planExpiresAt?: string | null;
  subscriptionActive?: boolean;
  storageUsed?: number;
  storageLimit?: number;
}): ResourcesMeta {
  const plan = json.plan || PLAN_FREE;
  const planTier = json.planTier ?? null;
  const planExpiresAt = json.planExpiresAt ?? null;
  const subscriptionActive = Boolean(json.subscriptionActive);
  const storageUsed = json.storageUsed ?? 0;
  const storageLimit =
    typeof json.storageLimit === 'number'
      ? json.storageLimit
      : plan === PLAN_PAID
        ? (planTier === PLAN_TIER_YEARLY
          ? PAID_STORAGE_LIMITS[PLAN_TIER_YEARLY]
          : PAID_STORAGE_LIMITS[PLAN_TIER_MONTHLY])
        : DEFAULT_STORAGE_LIMITS[PLAN_FREE];

  return { plan, planTier, planExpiresAt, subscriptionActive, storageUsed, storageLimit };
}

export function readCachedResourcesMeta(): ResourcesMeta | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.sessionStorage.getItem(RESOURCES_META_CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as {
      ts?: number;
      plan?: string;
      planTier?: string | null;
      planExpiresAt?: string | null;
      subscriptionActive?: boolean;
      storageUsed?: number;
      storageLimit?: number;
    };
    if (typeof parsed.ts !== 'number') return null;
    if (Date.now() - parsed.ts >= RESOURCES_META_CACHE_TTL_MS) return null;
    // Invalidate legacy cache payloads so newly added fields are fetched immediately.
    if (!Object.prototype.hasOwnProperty.call(parsed, 'planExpiresAt')) return null;
    return normalizeResourcesMeta(parsed);
  } catch {
    return null;
  }
}

export function writeCachedResourcesMeta(meta: ResourcesMeta): void {
  if (typeof window === 'undefined') return;
  try {
    window.sessionStorage.setItem(
      RESOURCES_META_CACHE_KEY,
      JSON.stringify({
        ts: Date.now(),
        ...meta,
      })
    );
  } catch {
    // ignore storage failures
  }
}

export async function getResourcesMeta(): Promise<ResourcesMeta> {
  const cached = readCachedResourcesMeta();
  if (cached) return cached;

  if (inflightMetaPromise) return inflightMetaPromise;

  inflightMetaPromise = (async () => {
    const res = await fetch('/api/resources?metaOnly=1');
    if (!res.ok) throw new Error(String(res.status));
    const json = (await res.json()) as {
      plan?: string;
      planTier?: string | null;
      planExpiresAt?: string | null;
      subscriptionActive?: boolean;
      storageUsed?: number;
      storageLimit?: number;
    };
    const meta = normalizeResourcesMeta(json);
    writeCachedResourcesMeta(meta);
    return meta;
  })().finally(() => {
    inflightMetaPromise = null;
  });

  return inflightMetaPromise;
}
