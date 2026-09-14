import {
  DEFAULT_STORAGE_LIMITS,
  LOGGED_IN_FREE_LIMIT,
  PAID_STORAGE_LIMITS,
  PAID_UPLOAD_LIMITS,
  PLAN_FREE,
  PLAN_PAID,
  PLAN_TIER_MONTHLY,
  PLAN_TIER_YEARLY,
} from '@/lib/constants/plans';

/** 与 `DashboardResourceModule` / 工作台 `setPlanInfo` 对齐，用于文档上传前校验 */
export type DashboardDocumentPlanSnapshot = {
  plan: string;
  planTier?: string;
  subscriptionActive?: boolean;
  storageUsed: number;
  storageLimit: number;
  uploadLimit: number;
  uploadsToday: number;
};

/**
 * 将 `/api/resources`（含 `metaOnly=1`）JSON 规范为与工作台一致的 plan 快照。
 */
export function normalizePlanSnapshotFromResourcesApi(data: unknown): DashboardDocumentPlanSnapshot | null {
  if (!data || typeof data !== 'object') return null;
  const d = data as Record<string, unknown>;
  const plan = typeof d.plan === 'string' ? d.plan : PLAN_FREE;
  const planTier = typeof d.planTier === 'string' ? d.planTier : undefined;
  const subscriptionActive = Boolean(d.subscriptionActive);
  const storageUsed = typeof d.storageUsed === 'number' ? d.storageUsed : 0;
  const storageLimit =
    typeof d.storageLimit === 'number'
      ? d.storageLimit
      : plan === PLAN_PAID && subscriptionActive
        ? planTier === PLAN_TIER_YEARLY
          ? PAID_STORAGE_LIMITS[PLAN_TIER_YEARLY]
          : PAID_STORAGE_LIMITS[PLAN_TIER_MONTHLY]
        : DEFAULT_STORAGE_LIMITS[PLAN_FREE];
  const uploadLimit =
    typeof d.uploadLimit === 'number'
      ? d.uploadLimit
      : plan === PLAN_PAID && subscriptionActive
        ? planTier === PLAN_TIER_YEARLY
          ? PAID_UPLOAD_LIMITS[PLAN_TIER_YEARLY]
          : PAID_UPLOAD_LIMITS[PLAN_TIER_MONTHLY]
        : LOGGED_IN_FREE_LIMIT;
  const uploadsToday = typeof d.uploadsToday === 'number' ? d.uploadsToday : 0;

  return {
    plan,
    planTier,
    subscriptionActive,
    storageUsed,
    storageLimit,
    uploadLimit,
    uploadsToday,
  };
}
