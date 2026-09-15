/** Storage caps (free 300MB · Pro 10GB · Lifetime 100GB). */
export const STORAGE_LIMIT_FREE = 300 * 1024 * 1024;
export const STORAGE_LIMIT_PRO = 10 * 1024 * 1024 * 1024;
export const STORAGE_LIMIT_LIFETIME = 100 * 1024 * 1024 * 1024;

export function getStorageLimitForPlan(planId: string | null | undefined): number {
  if (planId === 'lifetime') return STORAGE_LIMIT_LIFETIME;
  if (planId === 'pro') return STORAGE_LIMIT_PRO;
  return STORAGE_LIMIT_FREE;
}

/** Prefer plan cap so free-tier bumps apply without migrating every user row. */
export function resolveStorageLimit(
  planId: string | null | undefined,
  dbLimit?: number | null
): number {
  const planLimit = getStorageLimitForPlan(planId);
  const stored = dbLimit && dbLimit > 0 ? Number(dbLimit) : 0;
  return Math.max(planLimit, stored);
}

export function formatBytes(bytes: number, locale = 'en'): string {
  if (!Number.isFinite(bytes) || bytes <= 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  let n = bytes;
  let i = 0;
  while (n >= 1024 && i < units.length - 1) {
    n /= 1024;
    i += 1;
  }
  return `${n.toLocaleString(locale, {
    maximumFractionDigits: i === 0 ? 0 : 1,
  })} ${units[i]}`;
}
