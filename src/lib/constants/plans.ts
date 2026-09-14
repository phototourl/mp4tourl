// Plan types
export const PLAN_FREE = 'free';
export const PLAN_PAID = 'paid';

export type Plan = typeof PLAN_FREE | typeof PLAN_PAID;

// Plan tier types (only for paid users)
export const PLAN_TIER_MONTHLY = 'monthly';
export const PLAN_TIER_YEARLY = 'yearly';

export type PlanTier = typeof PLAN_TIER_MONTHLY | typeof PLAN_TIER_YEARLY;

export const SUBSCRIPTION_PLAN_ID_MONTHLY = 'pro';
export const SUBSCRIPTION_PLAN_ID_YEARLY = 'proYearly';

export type SubscriptionCheckoutBlockReason =
  | 'current_plan'
  | 'downgrade'
  | 'already_active';

export function parsePlanTier(value: string | null | undefined): PlanTier | null {
  if (value === PLAN_TIER_MONTHLY || value === PLAN_TIER_YEARLY) {
    return value;
  }
  return null;
}

export function isYearlyTier(planTier?: PlanTier | null): boolean {
  return planTier === PLAN_TIER_YEARLY;
}

function inferPlanTierFromPlanId(planId?: string | null): PlanTier | null {
  if (planId === SUBSCRIPTION_PLAN_ID_YEARLY) return PLAN_TIER_YEARLY;
  if (planId === SUBSCRIPTION_PLAN_ID_MONTHLY) return PLAN_TIER_MONTHLY;
  return null;
}

/** Block same-tier repurchase and downgrades; allow monthly → yearly upgrade. */
export function getSubscriptionCheckoutBlockReason(options: {
  subscriptionActive: boolean;
  planTier?: PlanTier | null;
  currentPlanId?: string | null;
  targetPlanId: string;
  isLifetime?: boolean;
}): SubscriptionCheckoutBlockReason | null {
  const isSubscriptionTarget =
    options.targetPlanId === SUBSCRIPTION_PLAN_ID_MONTHLY ||
    options.targetPlanId === SUBSCRIPTION_PLAN_ID_YEARLY;

  if (!isSubscriptionTarget) return null;
  if (options.isLifetime) return 'already_active';
  if (!options.subscriptionActive) return null;

  const effectiveTier =
    options.planTier ?? inferPlanTierFromPlanId(options.currentPlanId);

  if (isYearlyTier(effectiveTier)) {
    if (options.targetPlanId === SUBSCRIPTION_PLAN_ID_MONTHLY) {
      return 'downgrade';
    }
    if (options.targetPlanId === SUBSCRIPTION_PLAN_ID_YEARLY) {
      return 'current_plan';
    }
  }

  if (effectiveTier === PLAN_TIER_MONTHLY) {
    if (options.targetPlanId === SUBSCRIPTION_PLAN_ID_MONTHLY) {
      return 'current_plan';
    }
  }

  if (
    options.currentPlanId &&
    options.currentPlanId !== SUBSCRIPTION_PLAN_ID_MONTHLY &&
    options.currentPlanId !== SUBSCRIPTION_PLAN_ID_YEARLY
  ) {
    return 'already_active';
  }

  return null;
}

export function isPaidSubscriptionActive(
  plan: Plan,
  planExpiresAt?: string | Date | null
): boolean {
  if (plan !== PLAN_PAID) {
    return false;
  }
  if (!planExpiresAt) {
    return false;
  }

  const expiresAtMs = new Date(planExpiresAt).getTime();
  if (Number.isNaN(expiresAtMs)) {
    return false;
  }

  return expiresAtMs > Date.now();
}

/** 工作台「我的照片」批量上传：仅月付/年付；单次最多张数 */
export const DASHBOARD_BATCH_UPLOAD_MAX_MONTHLY = 20;
export const DASHBOARD_BATCH_UPLOAD_MAX_YEARLY = 50;

/** 免费或未付费返回 null；付费按档位返回单次批量上限 */
export function getDashboardBatchUploadMaxFiles(
	plan: Plan,
	planTier?: PlanTier | null
): number | null {
	if (plan !== PLAN_PAID) return null;
	if (planTier === PLAN_TIER_YEARLY) return DASHBOARD_BATCH_UPLOAD_MAX_YEARLY;
	if (planTier === PLAN_TIER_MONTHLY) return DASHBOARD_BATCH_UPLOAD_MAX_MONTHLY;
	return DASHBOARD_BATCH_UPLOAD_MAX_MONTHLY;
}

// Upload limits per day (0 = unlimited)
export const UPLOAD_LIMITS = {
  [PLAN_FREE]: 10,       // 登录免费用户 10次/天（匿名见 ANONYMOUS_UPLOAD_LIMIT）
  [PLAN_PAID]: 1000,     // 付费月付用户 1000次/天
} as const;

// 登录但未付费用户的每日限制
export const LOGGED_IN_FREE_LIMIT = 10;

// 付费用户按套餐类型的上传限制（0 = 无限）
export const PAID_UPLOAD_LIMITS = {
  [PLAN_TIER_MONTHLY]: 1000,  // 月付：1000次/天
  [PLAN_TIER_YEARLY]: 0,       // 年付：无限
} as const;

// Default storage limits in bytes
export const DEFAULT_STORAGE_LIMITS = {
  [PLAN_FREE]: 100 * 1024 * 1024,              // 登录 free 用户 100MB（与匿名一致）
  [PLAN_PAID]: 100 * 1024 * 1024 * 1024,      // 100GB (默认月付)
} as const;

// 匿名用户存储空间限制
export const ANONYMOUS_STORAGE_LIMIT = 100 * 1024 * 1024; // 100MB

// Paid user storage limits by tier
export const PAID_STORAGE_LIMITS = {
  [PLAN_TIER_MONTHLY]: 100 * 1024 * 1024 * 1024, // 100GB
  [PLAN_TIER_YEARLY]: 200 * 1024 * 1024 * 1024,  // 200GB
} as const;

// Grace period for downgraded users (30 days in ms)
export const GRACE_PERIOD_MS = 30 * 24 * 60 * 60 * 1000;

/** Single-file upload cap (video): free = 100MB; paid monthly = 500MB; paid yearly = 2GB */
export const MAX_UPLOAD_FILE_BYTES_FREE = 100 * 1024 * 1024;
export const MAX_UPLOAD_FILE_BYTES_MONTHLY = 500 * 1024 * 1024;
export const MAX_UPLOAD_FILE_BYTES_YEARLY_PAID = 2 * 1024 * 1024 * 1024;

export function getMaxUploadFileBytes(
  plan: Plan,
  planTier?: PlanTier | null
): number {
  if (plan === PLAN_FREE) {
    return MAX_UPLOAD_FILE_BYTES_FREE;
  }
  if (plan === PLAN_PAID && planTier === PLAN_TIER_YEARLY) {
    return MAX_UPLOAD_FILE_BYTES_YEARLY_PAID;
  }
  return MAX_UPLOAD_FILE_BYTES_MONTHLY;
}

/** Document single-file upload cap: free = 10MB; paid monthly = 2GB; paid yearly = 5GB */
export const MAX_DOCUMENT_UPLOAD_BYTES_FREE = 10 * 1024 * 1024;
export const MAX_DOCUMENT_UPLOAD_BYTES_MONTHLY = 2 * 1024 * 1024 * 1024;
export const MAX_DOCUMENT_UPLOAD_BYTES_YEARLY = 5 * 1024 * 1024 * 1024;

export function getMaxDocumentUploadFileBytes(
  plan: Plan,
  planTier?: PlanTier | null
): number {
  if (plan === PLAN_FREE) return MAX_DOCUMENT_UPLOAD_BYTES_FREE;
  if (plan === PLAN_PAID && planTier === PLAN_TIER_YEARLY) return MAX_DOCUMENT_UPLOAD_BYTES_YEARLY;
  return MAX_DOCUMENT_UPLOAD_BYTES_MONTHLY;
}

export function getUploadLimit(plan: Plan): number {
  return UPLOAD_LIMITS[plan] ?? UPLOAD_LIMITS[PLAN_FREE];
}

/**
 * 获取用户存储空间限制
 * @param plan 用户plan
 * @param planTier 付费用户的套餐类型（月付/年付）
 * @param customLimit 用户自定义限制（数据库中存储的值）
 */
export function getStorageLimit(
  plan: Plan,
  planTier?: PlanTier | null,
  customLimit?: number | null
): number {
  // 付费用户按套餐类型区分，其他用户使用默认限制
  const planBasedLimit =
    plan === PLAN_PAID && planTier
      ? (PAID_STORAGE_LIMITS[planTier] ?? PAID_STORAGE_LIMITS[PLAN_TIER_MONTHLY])
      : (DEFAULT_STORAGE_LIMITS[plan] ?? DEFAULT_STORAGE_LIMITS[PLAN_FREE]);

  // 免费/匿名始终跟配置走，便于下调 DEFAULT 后立即生效
  if (plan !== PLAN_PAID) {
    return planBasedLimit;
  }

  // 付费：自定义值仅用于上调（避免历史脏数据覆盖高级版容量）
  if (customLimit && customLimit > 0) {
    return Math.max(customLimit, planBasedLimit);
  }

  return planBasedLimit;
}

export function formatBytes(bytes: number, locale?: string): string {
  const l = locale || 'en';
  const units: Record<string, string> = {
    'en': 'B KB MB GB',
    'zh': 'B KB MB GB',
    'ar': 'بايت ك.ب م.ب ج.ب',
    'de': 'B KB MB GB',
    'fr': 'o Kio Mio Gio',
    'es': 'B KB MB GB',
    'ja': 'B KB MB GB',
    'ko': 'B KB MB GB',
    'ru': 'Б КБ МБ ГБ',
    'pt': 'B KB MB GB',
    // 可以继续添加更多语言的单位缩写
  };
  const u = units[l] || units['en'];

  if (bytes < 1024) return `${bytes} ${u.split(' ')[0]}`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} ${u.split(' ')[1]}`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} ${u.split(' ')[2]}`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} ${u.split(' ')[3]}`;
}

export function formatUploadLimitForDisplay(bytes: number): string {
  const MB = 1024 * 1024;
  const GB = 1024 * MB;
  if (bytes >= GB) {
    const gbValue = bytes / GB;
    if (Number.isInteger(gbValue)) {
      return `${gbValue} GB`;
    }
    return `${gbValue.toFixed(1)} GB`;
  }
  return `${Math.round(bytes / MB)} MB`;
}
