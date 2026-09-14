'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { useSearchParams } from 'next/navigation';
import { toast } from 'sonner';
import { useLocaleRouter } from '@/i18n/navigation';
import { authClient } from '@/lib/auth-client';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import {
  Loader2Icon,
  PlusIcon,
  CopyIcon,
  TrashIcon,
  UploadIcon,
  TrendingUp,
  HardDrive,
  Sparkles,
  Table2,
  EyeIcon,
  ExternalLinkIcon,
  DownloadIcon,
  Images,
} from 'lucide-react';
import type { User } from '@/lib/auth-types';
import {
  formatBytes,
  DEFAULT_STORAGE_LIMITS,
  PLAN_FREE,
  PLAN_PAID,
  PLAN_TIER_MONTHLY,
  PLAN_TIER_YEARLY,
  PAID_STORAGE_LIMITS,
  getMaxUploadFileBytes,
  getDashboardBatchUploadMaxFiles,
  type Plan,
  type PlanTier,
} from '@/lib/constants/plans';
import { AlertDialog } from '@/components/ui/alert-dialog';
import { DashboardHeader } from '@/components/dashboard/dashboard-header';
import {
  DashboardResourcesPagination,
  DEFAULT_RESOURCE_PAGE_SIZE,
} from '@/components/dashboard/dashboard-resources-pagination';
import {
  DashboardActivityAreaChart,
  DashboardChartRangeToggle,
  type DashboardChartRange,
  type DashboardActivityPoint,
} from '@/components/dashboard/dashboard-activity-chart';
import { Image as ImageIcon } from 'lucide-react';
import { DashboardResourceModule } from '@/components/dashboard/dashboard-resource-module';
import { DashboardImagePreviewDialog } from '@/components/dashboard/DashboardImagePreviewDialog';
import { DashboardPhotoToolboxActions } from '@/components/dashboard/DashboardPhotoToolboxActions';
import { getResourcePublicUrl } from '@/lib/constants/resource-source';
import { isArtFightUser } from '@/lib/constants/user-type';
import { UploadUpgradeDialog } from '@/components/shared/upload-upgrade-dialog';
import { trackPricingRedirect } from '@/lib/analytics/pricing-redirect';
import { triggerDashboardPhotoDownload } from '@/lib/utils/download-dashboard-photo';
import { normalizePlanSnapshotFromResourcesApi, type DashboardDocumentPlanSnapshot } from '@/lib/dashboard-document-plan';

interface Resource {
  id: string;
  filename: string;
  originalUrl: string;
  processedUrl?: string;
  fileSize: number;
  createdAt: string;
  deleteAt?: string;
}

const RESOURCES_META_CACHE_KEY = 'ptu-resources-meta-cache';

/** Prefer checkout planId so yearly isn't labeled Pro while webhook lags. */
function subscriptionPlanToastName(
  t: (key: 'planNames.premium' | 'planNames.pro') => string,
  options: { checkoutPlanId?: string | null; planTier?: PlanTier | null }
): string {
  if (
    options.checkoutPlanId === 'proYearly' ||
    options.planTier === PLAN_TIER_YEARLY
  ) {
    return t('planNames.premium');
  }
  return t('planNames.pro');
}

export default function DashboardPage() {
  const t = useTranslations('Dashboard');
  const tCommon = useTranslations('common');
  const [user, setUser] = useState<User | null>(null);
  const [resources, setResources] = useState<Resource[]>([]);
  const [resourceTotal, setResourceTotal] = useState(0);
  const [resourceTotalAll, setResourceTotalAll] = useState(0);
  const [resourcesPage, setResourcesPage] = useState(1);
  const [resourcesPageSize, setResourcesPageSize] = useState(DEFAULT_RESOURCE_PAGE_SIZE);
  const [photoQuery, setPhotoQuery] = useState('');
  const [planInfo, setPlanInfo] = useState<DashboardDocumentPlanSnapshot | null>(null);
  const [userType, setUserType] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [resourcesLoaded, setResourcesLoaded] = useState(false);
  const [documentsVisible, setDocumentsVisible] = useState(false);
  const [statsVisible, setStatsVisible] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [chartRange, setChartRange] = useState<DashboardChartRange>('30d');
  const [activitySeries, setActivitySeries] = useState<DashboardActivityPoint[]>([]);
  const [activityLoading, setActivityLoading] = useState(false);
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('grid');
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isBatchUploading, setIsBatchUploading] = useState(false);
  const [batchUploadProgress, setBatchUploadProgress] = useState<{ current: number; total: number } | null>(
    null
  );
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [showUpgradeDialog, setShowUpgradeDialog] = useState(false);
  const [noticeMessage, setNoticeMessage] = useState<string | null>(null);
  const router = useLocaleRouter();
  const locale = useLocale();
  const searchParams = useSearchParams();

  // Checkout return: poll until webhook activates plan, then toast (editstamp pattern).
  // Toast uses protected layout Toaster (richColors, top-center) — no PaymentCard overlay.
  const checkoutSuccessShown = useRef(false);
  const queryInitialized = useRef(false);
  useEffect(() => {
    if (searchParams.get('checkout') !== 'success' || checkoutSuccessShown.current) {
      return;
    }
    checkoutSuccessShown.current = true;
    const checkoutPlanId = searchParams.get('plan');
    const url = new URL(window.location.href);
    url.searchParams.delete('checkout');
    url.searchParams.delete('plan');
    window.history.replaceState({}, '', url.pathname + url.search);

    const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
    let lastTier: PlanTier | null = null;

    void (async () => {
      for (let attempt = 0; attempt < 12; attempt++) {
        try {
          const res = await fetch('/api/resources?metaOnly=1');
          const data = await res.json().catch(() => null);
          if (res.ok && data) {
            const snapshot = normalizePlanSnapshotFromResourcesApi(data);
            if (snapshot) {
              setPlanInfo(snapshot);
            }
            const active = Boolean(data?.subscriptionActive);
            const tier =
              typeof data?.planTier === 'string'
                ? (data.planTier as PlanTier)
                : null;
            lastTier = tier;
            if (active) {
              if (
                checkoutPlanId === 'proYearly' &&
                tier !== PLAN_TIER_YEARLY &&
                attempt < 11
              ) {
                await sleep(700);
                continue;
              }
              if (
                checkoutPlanId === 'pro' &&
                tier !== PLAN_TIER_MONTHLY &&
                attempt < 11
              ) {
                await sleep(700);
                continue;
              }
              break;
            }
          }
        } catch {
          // retry
        }
        await sleep(700);
      }
      await fetchData();
      const planName = subscriptionPlanToastName(t, {
        checkoutPlanId,
        planTier: lastTier,
      });
      toast.success(t('subscriptionSuccess', { plan: planName }));
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  const fetchData = useCallback(async (forcedPage?: number) => {
    const page = forcedPage ?? resourcesPage;
    if (forcedPage != null && forcedPage !== resourcesPage) {
      setResourcesPage(forcedPage);
    }
    try {
      let currentUser = user;
      if (!currentUser) {
        const { data: session } = await authClient.getSession();
        currentUser = session?.user ?? null;
        if (currentUser) {
          setUser(currentUser);
        }
      }
      if (currentUser) {

        const params = new URLSearchParams();
        params.set('page', String(page));
        params.set('pageSize', String(resourcesPageSize));
        if (photoQuery.trim()) params.set('q', photoQuery.trim());
        const res = await fetch(`/api/resources?${params.toString()}`);
        const data = await res.json().catch(() => null);
        if (!res.ok) {
          // Avoid rendering a blank table with no hint.
          console.error('[Dashboard] Failed to fetch /api/resources', res.status, data);
          if (res.status === 401) {
            setUser(null);
            setResources([]);
            setResourceTotal(0);
            setPlanInfo(null);
            return;
          }
          throw new Error(typeof data?.error === 'string' ? data.error : `HTTP ${res.status}`);
        }
        setResources(data?.resources || []);
        setResourceTotal(typeof data?.total === 'number' ? data.total : (data?.resources || []).length);
        setResourceTotalAll(
          typeof data?.totalResources === 'number'
            ? data.totalResources
            : (typeof data?.total === 'number' ? data.total : (data?.resources || []).length)
        );
        const snapshot = normalizePlanSnapshotFromResourcesApi(data);
        if (snapshot) {
          setPlanInfo(snapshot);
        }
        if (typeof data?.userType === 'string' || data?.userType === null) {
          setUserType(data.userType ?? null);
        }
        sessionStorage.setItem(
          RESOURCES_META_CACHE_KEY,
          JSON.stringify({
            ts: Date.now(),
            plan: data?.plan || PLAN_FREE,
            planTier: data?.planTier ?? null,
            planExpiresAt: data?.planExpiresAt ?? null,
            subscriptionActive: Boolean(data?.subscriptionActive),
            storageLimit:
              typeof data?.storageLimit === 'number'
                ? data.storageLimit
                : data?.plan === PLAN_PAID && data?.subscriptionActive
                  ? (data?.planTier === PLAN_TIER_YEARLY
                    ? PAID_STORAGE_LIMITS[PLAN_TIER_YEARLY]
                    : PAID_STORAGE_LIMITS[PLAN_TIER_MONTHLY])
                  : DEFAULT_STORAGE_LIMITS[PLAN_FREE],
            storageUsed: data?.storageUsed || 0,
          })
        );
      }
    } catch (error) {
      console.error('[Dashboard] fetchData error', error);
      setNoticeMessage(t('loadFailed'));
    } finally {
      setIsLoading(false);
      setResourcesLoaded(true);
    }
  }, [resourcesPage, resourcesPageSize, photoQuery, t, user]);

  useEffect(() => {
    // Skip initial mount to avoid duplicate fetch with the main effect below.
    if (!queryInitialized.current) {
      queryInitialized.current = true;
      return;
    }
    // When query changes, reset to page 1 and refetch.
    setResourcesPage(1);
    void fetchData(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [photoQuery]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const resourceTotalPages = Math.max(1, Math.ceil(resourceTotal / resourcesPageSize));

  useEffect(() => {
    if (resourcesPage > resourceTotalPages) {
      setResourcesPage(resourceTotalPages);
    }
  }, [resourceTotalPages, resourcesPage]);

  useEffect(() => {
    if (!resourcesLoaded) return;
    const timer = window.setTimeout(() => setDocumentsVisible(true), 80);
    return () => window.clearTimeout(timer);
  }, [resourcesLoaded]);

  useEffect(() => {
    if (!documentsVisible) return;
    const timer = window.setTimeout(() => setStatsVisible(true), 80);
    return () => window.clearTimeout(timer);
  }, [documentsVisible]);

  useEffect(() => {
    let cancelled = false;
    async function loadActivity() {
      if (!user || !statsVisible) return;
      setActivityLoading(true);
      try {
        const res = await fetch(`/api/activity?range=${encodeURIComponent(chartRange)}`);
        if (!res.ok) throw new Error(String(res.status));
        const data = await res.json();
        if (!cancelled) setActivitySeries(data.series || []);
      } catch {
        if (!cancelled) setActivitySeries([]);
      } finally {
        if (!cancelled) setActivityLoading(false);
      }
    }
    loadActivity();
    return () => {
      cancelled = true;
    };
  }, [chartRange, user, statsVisible]);

  const handleCopy = async (url: string, id: string) => {
    await navigator.clipboard.writeText(url);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleDelete = async () => {
    if (!deleteConfirmId) return;

    setDeletingId(deleteConfirmId);
    setDeleteConfirmId(null);
    try {
      const res = await fetch(`/api/resources?id=${deleteConfirmId}`, { method: 'DELETE' });
      if (res.ok) {
        fetchData();
      } else {
        const data = await res.json().catch(() => ({}));
        setNoticeMessage(
          typeof data.error === 'string' && data.error ? data.error : t('deleteFailed')
        );
      }
    } catch {
      setNoticeMessage(t('deleteFailed'));
    } finally {
      setDeletingId(null);
    }
  };

  const handleDeleteClick = (id: string) => {
    setDeleteConfirmId(id);
  };

  const handleDeleteCancel = () => {
    setDeleteConfirmId(null);
  };

  const dashboardStorageUsed = planInfo?.storageUsed ?? 0;
  const dashboardStorageLimit = planInfo?.storageLimit ?? DEFAULT_STORAGE_LIMITS[PLAN_FREE];
  const isDashboardStorageExceeded = useCallback(
    (extraBytes = 0) => {
      if (dashboardStorageLimit <= 0) return false;
      return (
        dashboardStorageUsed >= dashboardStorageLimit ||
        dashboardStorageUsed + extraBytes > dashboardStorageLimit
      );
    },
    [dashboardStorageLimit, dashboardStorageUsed]
  );

  const requireDashboardLogin = useCallback(async () => {
    const { data: session } = await authClient.getSession();
    if (!session?.user?.id) {
      setUploadError(t('uploadErrorGeneric'));
      return null;
    }
    return session.user.id;
  }, [t]);

  type PhotoUploadResult =
    | { kind: 'ok' }
    | { kind: 'storage' }
    | { kind: 'daily'; limit: number }
    | { kind: '413' }
    | { kind: 'invalidType' }
    | { kind: 'tooLarge'; maxMb: number }
    | { kind: 'http'; data: unknown }
    | { kind: 'network' };

  const performDashboardPhotoUpload = useCallback(
    async (file: File, opts?: { storageUsedBase?: number }): Promise<PhotoUploadResult> => {
      const usedBase = opts?.storageUsedBase ?? dashboardStorageUsed;
      const limit = dashboardStorageLimit;
      const exceedsStorage =
        limit <= 0 ? false : usedBase >= limit || usedBase + file.size > limit;
      if (exceedsStorage) {
        return { kind: 'storage' };
      }

      const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'image/gif'];
      if (!allowedTypes.includes(file.type)) {
        return { kind: 'invalidType' };
      }
      const maxBytes = planInfo
        ? getMaxUploadFileBytes(
            planInfo.plan === PLAN_PAID && planInfo.subscriptionActive ? PLAN_PAID : PLAN_FREE,
            planInfo.plan === PLAN_PAID && planInfo.subscriptionActive && planInfo.planTier === PLAN_TIER_YEARLY
              ? PLAN_TIER_YEARLY
              : planInfo.plan === PLAN_PAID && planInfo.subscriptionActive
                ? PLAN_TIER_MONTHLY
                : null
          )
        : getMaxUploadFileBytes(PLAN_FREE, null);
      if (file.size > maxBytes) {
        return { kind: 'tooLarge', maxMb: maxBytes / (1024 * 1024) };
      }

      try {
        const formData = new FormData();
        formData.append('file', file);
        const res = await fetch('/api/upload', { method: 'POST', body: formData });
        const data = await res.json();
        if (!res.ok) {
          if (res.status === 429) {
            return { kind: 'daily', limit: data?.errorParams?.limit || data?.limit || 0 };
          }
          if (res.status === 413) {
            return { kind: '413' };
          }
          if (res.status === 400 && data?.error === 'fileTooLarge') {
            return {
              kind: 'tooLarge',
              maxMb: data?.errorParams?.maxMb ?? maxBytes / (1024 * 1024),
            };
          }
          return { kind: 'http', data };
        }
        return { kind: 'ok' };
      } catch {
        return { kind: 'network' };
      }
    },
    [dashboardStorageLimit, dashboardStorageUsed, planInfo]
  );

  const applyPhotoUploadFailure = useCallback(
    (r: PhotoUploadResult) => {
      if (r.kind === 'storage' || r.kind === '413') {
        setUploadError(t('uploadErrorStorageLimit'));
        setShowUpgradeDialog(true);
        return;
      }
      if (r.kind === 'daily') {
        setUploadError(t('uploadErrorDailyLimit', { limit: r.limit }));
        setShowUpgradeDialog(true);
        return;
      }
      if (r.kind === 'invalidType') {
        setUploadError(t('uploadErrorInvalidType'));
        return;
      }
      if (r.kind === 'tooLarge') {
        setUploadError(t('uploadErrorTooLarge', { maxMb: r.maxMb }));
        setShowUpgradeDialog(true);
        return;
      }
      if (r.kind === 'http') {
        const data = r.data as { error?: string };
        setUploadError(typeof data?.error === 'string' ? data.error : t('uploadErrorGeneric'));
        return;
      }
      setUploadError(t('uploadErrorGeneric'));
    },
    [t]
  );

  const handleDashboardUpload = useCallback(
    async (file: File) => {
      const userId = await requireDashboardLogin();
      if (!userId) {
        return;
      }

      setIsUploading(true);
      setUploadError(null);
      try {
        const r = await performDashboardPhotoUpload(file);
        if (r.kind === 'ok') {
          void fetchData(1);
        } else {
          applyPhotoUploadFailure(r);
        }
      } finally {
        setIsUploading(false);
      }
    },
    [applyPhotoUploadFailure, fetchData, performDashboardPhotoUpload, requireDashboardLogin]
  );

  const resolvePaidPlanTier = useCallback((): PlanTier | null => {
    if (planInfo?.plan !== PLAN_PAID || !planInfo.subscriptionActive) return null;
    if (planInfo.planTier === PLAN_TIER_YEARLY) return PLAN_TIER_YEARLY;
    if (planInfo.planTier === PLAN_TIER_MONTHLY) return PLAN_TIER_MONTHLY;
    return PLAN_TIER_MONTHLY;
  }, [planInfo]);

  const handleDashboardBatchUpload = useCallback(
    async (files: File[]) => {
      const userId = await requireDashboardLogin();
      if (!userId) {
        return;
      }
      if (planInfo == null) {
        return;
      }

      const plan = planInfo.plan === PLAN_PAID && planInfo.subscriptionActive ? PLAN_PAID : PLAN_FREE;
      const maxBatch = getDashboardBatchUploadMaxFiles(plan as Plan, resolvePaidPlanTier());
      if (maxBatch == null) {
        setUploadError(null);
        setShowUpgradeDialog(true);
        return;
      }

      if (files.length === 0) {
        return;
      }

      if (files.length > maxBatch) {
        setUploadError(t('batchUploadTooMany', { max: maxBatch }));
        return;
      }

      const maxBytes = getMaxUploadFileBytes(
        planInfo.plan === PLAN_PAID && planInfo.subscriptionActive ? PLAN_PAID : PLAN_FREE,
        planInfo.plan === PLAN_PAID && planInfo.subscriptionActive && planInfo.planTier === PLAN_TIER_YEARLY
          ? PLAN_TIER_YEARLY
          : planInfo.plan === PLAN_PAID && planInfo.subscriptionActive
            ? PLAN_TIER_MONTHLY
            : null
      );
      const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'image/gif'];

      setIsBatchUploading(true);
      setBatchUploadProgress({ current: 0, total: files.length });
      setUploadError(null);

      let runningUsed = dashboardStorageUsed;
      let skippedTooLarge = 0;
      let skippedInvalidType = 0;

      for (let i = 0; i < files.length; i++) {
        const file = files[i]!;
        setBatchUploadProgress({ current: i + 1, total: files.length });
        if (!allowedTypes.includes(file.type)) {
          skippedInvalidType += 1;
          continue;
        }
        if (file.size > maxBytes) {
          skippedTooLarge += 1;
          continue;
        }
        const r = await performDashboardPhotoUpload(file, { storageUsedBase: runningUsed });
        if (r.kind === 'ok') {
          runningUsed += file.size;
          continue;
        }
        applyPhotoUploadFailure(r);
        void fetchData(1);
        setIsBatchUploading(false);
        setBatchUploadProgress(null);
        return;
      }

      await fetchData(1);
      setIsBatchUploading(false);
      setBatchUploadProgress(null);
      if (skippedTooLarge > 0 || skippedInvalidType > 0) {
        if (skippedTooLarge > 0) {
          setUploadError(t('uploadErrorTooLarge', { maxMb: maxBytes / (1024 * 1024) }));
          setShowUpgradeDialog(true);
          return;
        }
        setUploadError(t('uploadErrorInvalidType'));
      }
    },
    [
      applyPhotoUploadFailure,
      fetchData,
      isDashboardStorageExceeded,
      planInfo,
      performDashboardPhotoUpload,
      requireDashboardLogin,
      resolvePaidPlanTier,
      t,
      dashboardStorageUsed,
    ]
  );

  const storagePercent =
    dashboardStorageLimit > 0
      ? Math.min((dashboardStorageUsed / dashboardStorageLimit) * 100, 100)
      : 0;

  const isPaidSubscriptionActive = Boolean(
    planInfo?.subscriptionActive && planInfo?.plan === PLAN_PAID
  );
  const isExpiredPaid = Boolean(planInfo?.plan === PLAN_PAID && !planInfo?.subscriptionActive);
  const planLabel = planInfo?.plan === PLAN_PAID
    ? (planInfo?.planTier === 'yearly' ? t('planNames.premium') : t('planNames.pro'))
    : t('planNames.free');
  const shouldUseRenewCopy = Boolean(planInfo?.plan === PLAN_PAID && !planInfo?.subscriptionActive);
  const uploadUpgradeDescription = shouldUseRenewCopy && t.has('uploadRenewDescription')
    ? t('uploadRenewDescription')
    : t('uploadUpgradeDescription');

  /** 今日上传卡、当前套餐卡：是否显示「立即升级」（条件与第四张一致） */
  const showKpiUpgradeButton =
    !isPaidSubscriptionActive || planInfo?.planTier !== PLAN_TIER_YEARLY;

  /** KPI 卡片：默认白卡；科技主题通过 `.ptu-kpi-card` / `.ptu-trend-badge` 覆写 */
  const kpiCard =
    'ptu-kpi-card relative overflow-hidden rounded-xl border border-slate-200/85 bg-white shadow-[0_1px_3px_rgba(15,23,42,0.06)] dark:border-border dark:bg-card';
  const trendBadge =
    'ptu-trend-badge gap-1 border-slate-200/90 bg-slate-50 font-normal text-slate-600 dark:border-border dark:bg-muted/40 dark:text-muted-foreground';
  // Jump-color accents: badge/button color differs from card background.
  const blueTrendBadge = 'ptu-kpi-badge-blue gap-1 border-[#5d93f6] bg-[#5d93f6] font-normal text-white shadow-[0_8px_18px_-12px_rgba(93,147,246,0.85)]';
  const greenTrendBadge = 'ptu-kpi-badge-green gap-1 border-[#24c667] bg-[#24c667] font-normal text-white shadow-[0_8px_18px_-12px_rgba(36,198,103,0.85)]';
  const orangeTrendBadge = 'ptu-kpi-badge-orange gap-1 border-[#e3a33a] bg-[#e3a33a] font-normal text-white shadow-[0_8px_18px_-12px_rgba(227,163,58,0.85)]';
  const redTrendBadge = 'gap-1 border-red-500 bg-red-500 font-normal text-white shadow-[0_8px_18px_-12px_rgba(239,68,68,0.85)]';
  const purpleTrendBadge = 'ptu-kpi-badge-purple gap-1 border-[#9b63e6] bg-[#9b63e6] font-normal text-white shadow-[0_8px_18px_-12px_rgba(155,99,230,0.85)]';
  /** 彩色 KPI「升级」：样式与卡片右上角 outline 徽章一致（dashboard-technology.css） */
  const kpiUpgradeBtnClass = cn(
    'ptu-kpi-upgrade-btn cursor-pointer shrink-0 shadow-none',
    'h-8 min-w-[7.25rem] px-3 text-xs font-semibold sm:text-[13px]',
  );
  const orangeUpgradeBtnClass = cn(
    kpiUpgradeBtnClass,
    'ptu-kpi-upgrade-orange border-[#e3a33a] bg-[#e3a33a] text-white hover:bg-[#dd982e] hover:border-[#dd982e]'
  );
  const purpleUpgradeBtnClass = cn(
    kpiUpgradeBtnClass,
    'ptu-kpi-upgrade-purple border-[#9b63e6] bg-[#9b63e6] text-white hover:bg-[#8f56dd] hover:border-[#8f56dd]'
  );
  const blueUpgradeBtnClass = cn(
    kpiUpgradeBtnClass,
    'ptu-kpi-upgrade-blue border-[#5d93f6] bg-[#5d93f6] text-white hover:bg-[#4b7ee9] hover:border-[#4b7ee9]'
  );
  const greenUpgradeBtnClass = cn(
    kpiUpgradeBtnClass,
    'ptu-kpi-upgrade-green border-[#24c667] bg-[#24c667] text-white hover:bg-[#20be5f] hover:border-[#20be5f]'
  );

  const photosTitle = t.has('photos') ? t('photos') : t('resources');
  const photosCountText = t.has('photosCount')
    ? t('photosCount', { count: resourceTotal })
    : t('resourcesCount', { count: resourceTotal });
  const isArtFightArtist = isArtFightUser(userType);

  if (!user && isLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2Icon className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <p className="text-muted-foreground">{t('loginRequired')}</p>
      </div>
    );
  }

  return (
    <>
      <DashboardHeader breadcrumbs={[{ label: t('title'), isCurrentPage: true }]} />

      <div className="flex w-full flex-col">
        <div className="flex flex-col gap-4 py-4 pb-16 md:gap-6 md:py-6 md:pb-24">
          <p className="px-4 text-sm text-muted-foreground lg:px-6">
            {t('welcome')},{' '}
            <span className="font-medium text-foreground">{user.name}</span>
            {' — '}
            {t('subtitle')}
          </p>

          {/* EditStamp 式 KPI：白底、灰字标签、右上趋势小徽章、底部说明 */}
          <div className="grid grid-cols-1 gap-4 px-4 lg:grid-cols-2 lg:px-6 xl:grid-cols-4">
            <Card className={cn(kpiCard, 'ptu-kpi-color ptu-kpi-primary')}>
              <CardHeader>
                <CardDescription>{t('storage')}</CardDescription>
                <CardTitle className="min-w-0 whitespace-nowrap text-lg font-semibold leading-tight tabular-nums text-foreground sm:text-3xl">
                  {formatBytes(dashboardStorageUsed, locale)}
                </CardTitle>
                <CardAction>
                  <Badge variant="outline" className={cn(trendBadge, greenTrendBadge)}>
                    <HardDrive className="h-3.5 w-3.5 text-white" />
                    {planLabel}
                  </Badge>
                </CardAction>
              </CardHeader>
              <CardContent className="hidden pt-0 sm:block">
                <div className="relative h-2 w-full rounded-full bg-slate-100 dark:bg-muted">
                  <div
                    className="h-2 rounded-full bg-blue-600 transition-all dark:bg-blue-500"
                    style={{ width: `${storagePercent}%` }}
                  />
                  {isExpiredPaid ? (
                    <span className="pointer-events-none absolute left-0 -top-5 text-[11px] text-red-600 dark:text-red-300">
                      {t.has('expiredStorageLimitHint')
                        ? t('expiredStorageLimitHint')
                        : 'After expiry, only 100MB storage is available'}
                    </span>
                  ) : null}
                  <span className="pointer-events-none absolute right-0 -top-5 text-[11px] text-muted-foreground">
                    {formatBytes(dashboardStorageLimit, locale)}
                  </span>
                </div>
              </CardContent>
              <CardFooter className="flex-col items-start gap-1 border-t-0 pt-0 text-sm">
                <div className="text-muted-foreground">{t('statStorageHint')}</div>
              </CardFooter>
            </Card>

            <Card className={cn(kpiCard, 'ptu-kpi-color ptu-kpi-success')}>
              <CardHeader>
                <CardDescription>{t('resources')}</CardDescription>
                <CardTitle className="text-2xl font-semibold tabular-nums text-foreground sm:text-3xl">
                  {resourceTotalAll}
                </CardTitle>
                <CardAction>
                  <Badge variant="outline" className={cn(trendBadge, purpleTrendBadge)}>
                    <TrendingUp className="h-3.5 w-3.5 text-white" />
                    {resourceTotalAll} {t('files')}
                  </Badge>
                </CardAction>
              </CardHeader>
              <CardFooter className="flex-col items-start gap-1 border-t-0 pt-0 text-sm">
                <div className="text-muted-foreground">{t('statResourcesHint')}</div>
              </CardFooter>
            </Card>

            <Card className={cn(kpiCard, 'ptu-kpi-color ptu-kpi-warning')}>
              <CardHeader>
                <CardDescription>{t('dailyUploads')}</CardDescription>
                <CardTitle className="text-2xl font-semibold tabular-nums text-foreground sm:text-3xl">
                  {planInfo?.uploadsToday ?? 0}
                </CardTitle>
                <CardAction>
                  <Badge variant="outline" className={cn(trendBadge, blueTrendBadge, 'gap-1')}>
                    <UploadIcon className="h-3.5 w-3.5 text-white" />
                    {planInfo?.uploadLimit === 0
                      ? t('uploadUnlimited')
                      : t('uploadLimitDisplay', {
                          current: planInfo?.uploadsToday || 0,
                          limit: planInfo?.uploadLimit || 3,
                        })}
                  </Badge>
                </CardAction>
              </CardHeader>
              <CardFooter className="flex flex-wrap items-center justify-between gap-2 border-t-0 pt-0 text-sm">
                <div className="min-w-0 flex-1 text-muted-foreground">
                  {t('statUploadsHint')}
                </div>
                {showKpiUpgradeButton && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className={blueUpgradeBtnClass}
                    onClick={() => {
                      trackPricingRedirect({
                        sourceModule: 'dashboard_kpi',
                        sourceAction: 'click_upgrade_btn_uploads',
                        toPath: '/pricing',
                      });
                      router.push('/pricing');
                    }}
                  >
                    {t('upgrade.button')}
                  </Button>
                )}
              </CardFooter>
            </Card>

            <Card className={cn(kpiCard, 'ptu-kpi-color ptu-kpi-purple')}>
              <CardHeader>
                <CardDescription>{t('planCardTitle')}</CardDescription>
                <CardTitle className="text-2xl font-semibold tabular-nums text-foreground sm:text-3xl">
                  {planLabel}
                </CardTitle>
                <CardAction>
                  <Badge
                    variant="outline"
                    className={cn(
                      trendBadge,
                      isPaidSubscriptionActive ? orangeTrendBadge : isExpiredPaid ? redTrendBadge : greenTrendBadge
                    )}
                  >
                    <Sparkles className="h-3.5 w-3.5 text-white" />
                    {isExpiredPaid
                      ? (t.has('planExpired') ? t('planExpired') : 'Expired')
                      : t('planActive')}
                  </Badge>
                </CardAction>
              </CardHeader>
              <CardFooter className="flex flex-wrap items-center justify-between gap-2 border-t-0 pt-0 text-sm">
                <div className="min-w-0 flex-1 text-muted-foreground">
                  {isPaidSubscriptionActive && planInfo?.planTier === PLAN_TIER_YEARLY
                    ? t('planCardHintAllUpgraded')
                    : t('planCardHintUpgrade')}
                </div>
                {showKpiUpgradeButton && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className={greenUpgradeBtnClass}
                    onClick={() => {
                      trackPricingRedirect({
                        sourceModule: 'dashboard_kpi',
                        sourceAction: 'click_upgrade_btn_plan',
                        toPath: '/pricing',
                      });
                      router.push('/pricing');
                    }}
                  >
                    {t('upgrade.button')}
                  </Button>
                )}
              </CardFooter>
            </Card>
          </div>

          {/* My Resources：标题 + 表格/照片墙切换 + 内容 */}
          <div className="px-4 pb-6 lg:px-6">
            <Card className={cn(kpiCard, viewMode === 'grid' && '!border-0')}>
              <CardHeader>
                <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
                  <div className="flex flex-col gap-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <CardTitle className="text-base font-semibold">{photosTitle}</CardTitle>
                      {isArtFightArtist ? (
                        <span className="rounded-full border border-teal-200 bg-teal-50 px-2 py-0.5 text-[11px] font-semibold text-teal-800">
                          {t('artFightWorkspaceBadge')}
                        </span>
                      ) : null}
                      <span className="text-sm text-muted-foreground">
                        {resourceTotalAll === 0
                          ? t('noResources')
                          : photosCountText}
                      </span>
                    </div>
                    {isArtFightArtist ? (
                      <p className="text-xs text-muted-foreground sm:max-w-xl">{t('artFightWorkspaceHint')}</p>
                    ) : null}
                  </div>
                </div>

                <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:gap-x-3 sm:gap-y-2">
                  <div className="flex shrink-0 items-center gap-2 sm:self-center">
                    {(() => {
                      const uploadBtnClass =
                        "h-7 shrink-0 gap-1 rounded-md px-3 text-xs bg-[#02c7c7] text-white hover:bg-[#00b3b3] shadow-sm shadow-[#02c7c7]/40 [&_svg]:h-3 [&_svg]:w-3";
                      const batchBtnClass =
                        "h-7 shrink-0 gap-1 rounded-md border border-transparent px-3 text-xs font-semibold bg-orange-500 text-white shadow-md shadow-orange-500/35 hover:bg-orange-600 focus-visible:ring-2 focus-visible:ring-orange-500/45 dark:bg-orange-500 dark:hover:bg-orange-400 [&_svg]:h-3 [&_svg]:w-3";
                      const paidTierForBatch: PlanTier | null =
                        isPaidSubscriptionActive && planInfo?.planTier === PLAN_TIER_YEARLY
                          ? PLAN_TIER_YEARLY
                          : isPaidSubscriptionActive && planInfo?.planTier === PLAN_TIER_MONTHLY
                            ? PLAN_TIER_MONTHLY
                            : isPaidSubscriptionActive
                              ? PLAN_TIER_MONTHLY
                              : null;
                      const maxBatchFiles = getDashboardBatchUploadMaxFiles(
                        isPaidSubscriptionActive ? PLAN_PAID : PLAN_FREE,
                        paidTierForBatch
                      );
                      const batchTitle =
                        maxBatchFiles != null
                          ? t('batchUploadTierHint', { max: maxBatchFiles })
                          : uploadUpgradeDescription;
                      const busy = isUploading || isBatchUploading;
                      return (
                        <>
                          <input
                            type="file"
                            id="dashboard-upload-input"
                            accept="image/png,image/jpeg,image/jpg,image/webp,image/gif"
                            className="hidden"
                            disabled={busy || planInfo == null}
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                handleDashboardUpload(file);
                              }
                              e.target.value = '';
                            }}
                          />
                          <input
                            type="file"
                            id="dashboard-batch-upload-input"
                            accept="image/png,image/jpeg,image/jpg,image/webp,image/gif"
                            multiple
                            className="hidden"
                            disabled={busy || planInfo == null}
                            onChange={(e) => {
                              const list = e.target.files;
                              if (list?.length) {
                                void handleDashboardBatchUpload(Array.from(list));
                              }
                              e.target.value = '';
                            }}
                          />
                          <Button
                            type="button"
                            size="sm"
                            variant="default"
                            className={cn(uploadBtnClass, planInfo == null && 'pointer-events-none opacity-60')}
                            onClick={() => {
                              // Must open the file picker in the same sync turn as the tap.
                              // Awaiting session first drops user activation on mobile browsers.
                              if (busy || planInfo == null) return;
                              if (isDashboardStorageExceeded(0)) {
                                setUploadError(t('uploadErrorStorageLimit'));
                                setShowUpgradeDialog(true);
                                return;
                              }
                              const input = document.getElementById('dashboard-upload-input') as HTMLInputElement | null;
                              input?.click();
                            }}
                          >
                              {planInfo == null ? (
                                <>
                                  <Loader2Icon className="h-3 w-3 animate-spin" aria-hidden />
                                  {t('loading')}
                                </>
                              ) : isUploading ? (
                                <>
                                  <Loader2Icon className="h-3 w-3 animate-spin" aria-hidden />
                                  {t('uploading')}
                                </>
                              ) : (
                                <>
                                  <UploadIcon className="h-3 w-3 shrink-0" aria-hidden />
                                  {t('uploadPhoto')}
                                </>
                              )}
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            variant="default"
                            title={batchTitle}
                            aria-label={t('batchUploadPhotos')}
                            className={cn(batchBtnClass, planInfo == null && 'pointer-events-none opacity-60')}
                            disabled={busy || planInfo == null}
                            onClick={() => {
                              // Same as single upload: sync click only — session is checked in onChange handlers.
                              if (busy || planInfo == null) return;
                              if (maxBatchFiles == null) {
                                setUploadError(null);
                                setShowUpgradeDialog(true);
                                return;
                              }
                              if (isDashboardStorageExceeded(0)) {
                                setUploadError(t('uploadErrorStorageLimit'));
                                setShowUpgradeDialog(true);
                                return;
                              }
                              const batchInput = document.getElementById(
                                'dashboard-batch-upload-input'
                              ) as HTMLInputElement | null;
                              batchInput?.click();
                            }}
                          >
                            {isBatchUploading && batchUploadProgress ? (
                              <>
                                <Loader2Icon className="h-3 w-3 animate-spin shrink-0" aria-hidden />
                                <span className="tabular-nums">
                                  {t('batchUploadProgress', {
                                    current: batchUploadProgress.current,
                                    total: batchUploadProgress.total,
                                  })}
                                </span>
                              </>
                            ) : (
                              <>
                                <Images className="h-3 w-3 shrink-0" aria-hidden />
                                {t('batchUploadPhotos')}
                              </>
                            )}
                          </Button>
                        </>
                      );
                    })()}
                  </div>
                  <input
                    value={photoQuery}
                    onChange={(e) => setPhotoQuery(e.target.value)}
                    placeholder={t('resourceModule.searchPlaceholder')}
                    aria-label={t('resourceModule.searchPlaceholder')}
                    className="ptu-doc-filter-control h-9 min-h-9 w-full min-w-0 rounded-md border border-slate-200 bg-white px-3 text-sm text-foreground shadow-none outline-none ring-0 placeholder:text-slate-400 focus:border-slate-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-200/70 sm:max-w-[320px]"
                  />
                  <button
                    type="button"
                    className="ptu-doc-filter-reset inline-flex w-auto items-center justify-center h-9 min-h-9 shrink-0 cursor-pointer select-none whitespace-nowrap rounded-md border border-slate-200 bg-slate-50 px-3 text-sm font-semibold leading-none text-slate-700 shadow-sm transition-colors active:translate-y-px hover:bg-slate-100 hover:border-slate-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-200/70 disabled:cursor-not-allowed disabled:opacity-55"
                    disabled={!photoQuery.trim()}
                    onClick={() => setPhotoQuery('')}
                  >
                    {t('resourceModule.reset')}
                  </button>
                  <div className="ptu-view-toggle flex items-center gap-1 self-start rounded-md bg-slate-200/80 p-1 sm:ml-auto dark:bg-slate-700/80 sm:self-auto">
                    <button
                      onClick={() => setViewMode('grid')}
                      className={cn(
                        "gap-1 px-2 py-1 text-xs rounded-sm transition-colors flex items-center",
                        viewMode === 'grid'
                          ? "bg-white dark:bg-slate-800 text-foreground shadow-sm"
                          : "text-muted-foreground hover:text-foreground"
                      )}
                    >
                      <ImageIcon className="h-3 w-3" />
                      {t('viewGrid')}
                    </button>
                    <button
                      onClick={() => setViewMode('table')}
                      className={cn(
                        "gap-1 px-2 py-1 text-xs rounded-sm transition-colors flex items-center",
                        viewMode === 'table'
                          ? "bg-white dark:bg-slate-800 text-foreground shadow-sm"
                          : "text-muted-foreground hover:text-foreground"
                      )}
                    >
                      <Table2 className="h-3 w-3" />
                      {t('viewTable')}
                    </button>
                  </div>
                  {uploadError && !showUpgradeDialog ? (
                    <p
                      className="mt-2 w-full basis-full text-xs text-red-600 dark:text-red-400"
                      role="alert"
                    >
                      {uploadError}
                    </p>
                  ) : null}
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                {/* 表格 / 照片墙内容 */}
                {!resourcesLoaded ? (
                  <div className="space-y-2 py-2">
                    <div className="h-16 rounded-lg bg-slate-100/80 dark:bg-muted/30 [html.ptu-theme-technology_&]:bg-white/10" />
                    <div className="h-16 rounded-lg bg-slate-100/80 dark:bg-muted/30 [html.ptu-theme-technology_&]:bg-white/10" />
                    <div className="h-16 rounded-lg bg-slate-100/80 dark:bg-muted/30 [html.ptu-theme-technology_&]:bg-white/10" />
                  </div>
                ) : viewMode === 'table' ? (
                  <div className="ptu-table-shell overflow-hidden rounded-lg border border-slate-200/80 bg-white/60 backdrop-blur-sm dark:border-border dark:bg-transparent">
                    <div className="contents">
                      {/* 表格列头 - desktop only */}
                      <div className="ptu-table-head hidden border-b border-slate-200/80 bg-slate-50/80 px-4 py-2.5 text-xs font-medium text-muted-foreground sm:grid sm:grid-cols-[minmax(0,1.25fr)_minmax(0,2fr)_4.5rem_minmax(15rem,1.25fr)] dark:border-border dark:bg-muted/30">
                        <span>{t('tableFile')}</span>
                        <span>{t('tablePath')}</span>
                        <span>{t('tableSize')}</span>
                        <span className="text-right">{t('tableActions')}</span>
                      </div>
                      {resourceTotal > 0 ? (
                        <ul className="divide-y divide-slate-100 dark:divide-border">
                          {resources.map((resource) => (
                            <li
                              key={resource.id}
                              className="ptu-table-row grid grid-cols-1 gap-2 px-4 py-3 transition-colors hover:bg-slate-50/80 dark:hover:bg-muted/20 sm:grid-cols-[minmax(0,1.25fr)_minmax(0,2fr)_4.5rem_minmax(15rem,1.25fr)] sm:items-center sm:gap-3"
                            >
                              {/* Mobile: buttons at top, filename below */}
                              <div className="sm:hidden">
                                <div className="flex flex-wrap gap-1 mb-2">
                                  {/* ptu-toolbox-table */}
                                  <DashboardPhotoToolboxActions
                                    resource={resource}
                                    userType={userType}
                                    isPaidSubscriptionActive={isPaidSubscriptionActive}
                                    planTier={planInfo?.planTier}
                                    locale={locale}
                                    variant="table"
                                  />
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-8 w-8 p-0 rounded-md ptu-action-btn"
                                    onClick={() => handleCopy(resource.originalUrl, resource.id)}
                                    aria-label={t('copy')}
                                  >
                                    {copiedId === resource.id ? (
                                      <CopyIcon className="h-4 w-4 text-green-600" />
                                    ) : (
                                      <CopyIcon className="h-4 w-4" />
                                    )}
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-8 w-8 p-0 rounded-md ptu-action-btn"
                                    onClick={() => setPreviewUrl(getResourcePublicUrl(resource))}
                                    aria-label={t('open')}
                                  >
                                    <EyeIcon className="h-4 w-4" />
                                  </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-8 w-8 p-0 rounded-md ptu-action-btn"
                                  onClick={() => triggerDashboardPhotoDownload(resource.id)}
                                  aria-label="Download"
                                >
                                  <DownloadIcon className="h-4 w-4" />
                                </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-8 w-8 p-0 rounded-md ptu-action-btn ptu-action-danger"
                                    onClick={() => handleDeleteClick(resource.id)}
                                    disabled={deletingId === resource.id}
                                    aria-label={t('delete')}
                                  >
                                    {deletingId === resource.id ? (
                                      <Loader2Icon className="h-4 w-4 animate-spin" />
                                    ) : (
                                      <TrashIcon className="h-4 w-4" />
                                    )}
                                  </Button>
                                </div>
                                <div className="min-w-0 flex-1">
                                  <p className="text-xs text-muted-foreground">
                                    {new Date(resource.createdAt).toLocaleDateString(locale, { timeZone: 'UTC' })}{' '}
                                    · {formatBytes(resource.fileSize, locale)}
                                  </p>
                                  <p className="ptu-photo-filename text-sm font-medium text-foreground truncate">{resource.filename}</p>
                                </div>
                              </div>
                              {/* Desktop: inline layout */}
                              <div className="hidden min-w-0 sm:block">
                                <p className="text-xs font-normal text-muted-foreground">
                                  {new Date(resource.createdAt).toLocaleDateString(locale, { timeZone: 'UTC' })}
                                </p>
                                <p className="ptu-photo-filename text-sm font-medium text-foreground whitespace-nowrap overflow-hidden truncate">
                                  {resource.filename}
                                </p>
                                {resource.deleteAt && (
                                  <span className="ml-1 text-xs text-orange-600 dark:text-orange-400">
                                    ({t('scheduledForDeletion')})
                                  </span>
                                )}
                              </div>
                              <div className="hidden min-w-0 sm:block">
                                <p className="text-sm text-muted-foreground whitespace-nowrap overflow-hidden truncate">{resource.originalUrl}</p>
                              </div>
                              <div className="hidden shrink-0 whitespace-nowrap text-sm text-muted-foreground sm:block">
                                {formatBytes(resource.fileSize, locale)}
                              </div>
                              <div className="hidden min-w-0 flex-wrap items-center justify-end gap-1 sm:flex">
                                {/* ptu-toolbox-table */}
                                  <DashboardPhotoToolboxActions
                                    resource={resource}
                                    userType={userType}
                                    isPaidSubscriptionActive={isPaidSubscriptionActive}
                                    planTier={planInfo?.planTier}
                                    locale={locale}
                                    variant="table"
                                  />
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-8 w-8 p-0 rounded-md ptu-action-btn"
                                  onClick={() => handleCopy(resource.originalUrl, resource.id)}
                                  aria-label={t('copy')}
                                >
                                  {copiedId === resource.id ? (
                                    <CopyIcon className="h-4 w-4 text-green-600" />
                                  ) : (
                                    <CopyIcon className="h-4 w-4" />
                                  )}
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-8 w-8 p-0 rounded-md ptu-action-btn"
                                  onClick={() => window.open(resource.originalUrl, '_blank')}
                                  aria-label={t('open')}
                                >
                                  <ExternalLinkIcon className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-8 w-8 p-0 rounded-md ptu-action-btn"
                                  onClick={() =>
                                    triggerDashboardPhotoDownload(resource.id, { originalOnly: true })
                                  }
                                  aria-label="Download"
                                >
                                  <DownloadIcon className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-8 w-8 p-0 rounded-md ptu-action-btn ptu-action-danger"
                                  onClick={() => handleDeleteClick(resource.id)}
                                  disabled={deletingId === resource.id}
                                  aria-label={t('delete')}
                                >
                                  {deletingId === resource.id ? (
                                    <Loader2Icon className="h-4 w-4 animate-spin" />
                                  ) : (
                                    <TrashIcon className="h-4 w-4" />
                                  )}
                                </Button>
                              </div>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <div className="py-8 text-center text-muted-foreground">
                          <p>{t('noResources')}</p>
                        </div>
                      )}
                    </div>
                  </div>
                  ) : (
                    <div className="ptu-photo-wall rounded-xl border border-slate-200/70 bg-slate-50 p-4 dark:border-border dark:bg-muted/30">
                      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7">
                          <div className="ptu-thumb ptu-upload-tile group relative aspect-square overflow-hidden rounded-lg border border-dashed border-sky-300/80 bg-gradient-to-br from-sky-50 to-blue-100/80 p-0 text-sky-700 transition-all duration-200 ease-out motion-safe:hover:-translate-y-0.5 motion-safe:hover:shadow-[0_10px_24px_-16px_rgba(14,116,144,0.45)] motion-safe:hover:border-sky-400 dark:border-slate-500/50 dark:bg-slate-800/40 dark:text-slate-200 dark:motion-safe:hover:border-cyan-300/60 dark:motion-safe:hover:shadow-[0_12px_28px_-18px_rgba(34,211,238,0.45)]">
                            <label
                              htmlFor="dashboard-upload-input"
                              aria-label={isUploading ? t('uploading') : t('uploadPhoto')}
                              className={cn(
                                'flex h-full w-full cursor-pointer items-center justify-center transition-all duration-200 group-hover:scale-[1.02] hover:text-sky-800 dark:hover:text-white',
                                isUploading && 'pointer-events-none opacity-60'
                              )}
                            >
                              {isUploading ? (
                                <Loader2Icon className="h-20 w-20 animate-spin" aria-hidden />
                              ) : (
                                <PlusIcon className="h-20 w-20" aria-hidden />
                              )}
                            </label>
                          </div>
                          {resourceTotal === 0 ? (
                            <div className="col-span-2 flex min-h-[4.5rem] min-w-0 items-center justify-center px-2 sm:col-span-3 md:col-span-4 lg:col-span-5 xl:col-span-6">
                              <p className="max-w-prose break-words text-center text-sm leading-snug text-muted-foreground">
                                {t('noResources')}
                              </p>
                            </div>
                          ) : null}
                          {resources.map((resource) => (
                            <div
                              key={resource.id}
                              className="ptu-thumb group relative aspect-square overflow-hidden rounded-lg border border-slate-200/80 bg-transparent p-0 dark:border-border dark:bg-transparent"
                            >
                              <img
                                src={getResourcePublicUrl(resource)}
                                alt={resource.filename}
                                className="h-full w-full object-cover transition-transform duration-200 group-hover:scale-105"
                              />
                              <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-100 sm:opacity-0 sm:transition-opacity sm:group-hover:opacity-100" />
                              <div className="pointer-events-none absolute bottom-0 left-0 right-0 p-2">
                                <p className="text-[11px] text-white/80">
                                  {new Date(resource.createdAt).toLocaleDateString(locale, { timeZone: 'UTC' })}
                                </p>
                                <p className="truncate text-xs font-medium text-white">{resource.filename}</p>
                                <p className="text-[11px] text-white/75">{formatBytes(resource.fileSize, locale)}</p>
                              </div>
                              {/* Mobile: buttons at top, always visible */}
                              <div className="absolute left-1 top-1 right-1 z-10 flex flex-wrap gap-1 sm:hidden">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="ptu-grid-action-btn h-7 w-7 p-0 bg-white/90 hover:bg-white text-blue-600 rounded-md opacity-90"
                                  onClick={() => handleCopy(resource.originalUrl, resource.id)}
                                  aria-label={t('copy')}
                                >
                                  {copiedId === resource.id ? (
                                    <CopyIcon className="h-3.5 w-3.5 text-green-600" />
                                  ) : (
                                    <CopyIcon className="h-3.5 w-3.5" />
                                  )}
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="ptu-grid-action-btn h-7 w-7 p-0 bg-white/90 hover:bg-white text-blue-600 rounded-md opacity-90"
                                  onClick={() => setPreviewUrl(getResourcePublicUrl(resource))}
                                  aria-label={t('open')}
                                >
                                  <EyeIcon className="h-3.5 w-3.5" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="ptu-grid-action-btn h-7 w-7 p-0 bg-white/90 hover:bg-white text-blue-600 rounded-md opacity-90"
                                  onClick={() => triggerDashboardPhotoDownload(resource.id)}
                                  aria-label="Download"
                                >
                                  <DownloadIcon className="h-3.5 w-3.5" />
                                </Button>
                                {/* ptu-toolbox-grid */}
                                <DashboardPhotoToolboxActions
                                  resource={resource}
                                  userType={userType}
                                  isPaidSubscriptionActive={isPaidSubscriptionActive}
                                  planTier={planInfo?.planTier}
                                  locale={locale}
                                  variant="grid"
                                />
                              </div>
                              {/* Mobile: delete pinned to top-right (avoid wrapping to 2nd row) */}
                              <div className="absolute right-1 top-1 z-20 sm:hidden">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="ptu-grid-action-btn ptu-grid-action-danger h-7 w-7 p-0 bg-white/90 hover:bg-white text-red-600 rounded-md opacity-90"
                                  onClick={() => handleDeleteClick(resource.id)}
                                  disabled={deletingId === resource.id}
                                  aria-label={t('delete')}
                                >
                                  {deletingId === resource.id ? (
                                    <Loader2Icon className="h-3.5 w-3.5 animate-spin" />
                                  ) : (
                                    <TrashIcon className="h-3.5 w-3.5" />
                                  )}
                                </Button>
                              </div>
                              {/* Desktop: hover to show buttons (wrap to avoid clipping on yearly plan) */}
                              <div className="absolute left-1 right-1 top-1 z-10 hidden w-fit max-w-[124px] flex-wrap justify-end gap-1 opacity-0 transition-opacity group-hover:opacity-100 sm:ml-auto sm:flex">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="ptu-grid-action-btn h-7 w-7 p-0 bg-white/90 hover:bg-white text-blue-600 rounded-md"
                                  onClick={() => handleCopy(resource.originalUrl, resource.id)}
                                  aria-label={t('copy')}
                                >
                                  {copiedId === resource.id ? (
                                    <CopyIcon className="h-3.5 w-3.5 text-green-600" />
                                  ) : (
                                    <CopyIcon className="h-3.5 w-3.5" />
                                  )}
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="ptu-grid-action-btn h-7 w-7 p-0 bg-white/90 hover:bg-white text-blue-600 rounded-md"
                                  onClick={() => setPreviewUrl(getResourcePublicUrl(resource))}
                                  aria-label={t('open')}
                                >
                                  <EyeIcon className="h-3.5 w-3.5" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="ptu-grid-action-btn h-7 w-7 p-0 bg-white/90 hover:bg-white text-blue-600 rounded-md"
                                  onClick={() => triggerDashboardPhotoDownload(resource.id)}
                                  aria-label="Download"
                                >
                                  <DownloadIcon className="h-3.5 w-3.5" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="ptu-grid-action-btn ptu-grid-action-danger h-7 w-7 p-0 bg-white/90 hover:bg-white text-red-600 rounded-md"
                                  onClick={() => handleDeleteClick(resource.id)}
                                  disabled={deletingId === resource.id}
                                  aria-label={t('delete')}
                                >
                                  {deletingId === resource.id ? (
                                    <Loader2Icon className="h-3.5 w-3.5 animate-spin" />
                                  ) : (
                                    <TrashIcon className="h-3.5 w-3.5" />
                                  )}
                                </Button>
                                {/* ptu-toolbox-grid */}
                                <DashboardPhotoToolboxActions
                                  resource={resource}
                                  userType={userType}
                                  isPaidSubscriptionActive={isPaidSubscriptionActive}
                                  planTier={planInfo?.planTier}
                                  locale={locale}
                                  variant="grid"
                                />
                              </div>
                              {resource.deleteAt && (
                                <div className="absolute left-1 top-1 z-20">
                                  <span className="inline-flex items-center rounded bg-orange-500 px-1.5 py-0.5 text-xs font-medium text-white">
                                    Deleting
                                  </span>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                    </div>
                  )}
                  <DashboardResourcesPagination
                    total={resourceTotal}
                    page={resourcesPage}
                    pageSize={resourcesPageSize}
                    onPageChange={setResourcesPage}
                    onPageSizeChange={(size) => {
                      setResourcesPageSize(size);
                      setResourcesPage(1);
                    }}
                  />
              </CardContent>
            </Card>
          </div>

          {/* My Resources: 文档上传与管理（图片模块下方） */}
          <div className="px-4 pb-2 lg:px-6">
            {documentsVisible ? (
              <DashboardResourceModule
                locale={locale}
                cardClassName={kpiCard}
                planInfo={planInfo}
                onUsageChanged={() => fetchData()}
              />
            ) : (
              <Card className={kpiCard}>
                <CardHeader>
                  <CardTitle className="text-base font-semibold">{t('resourceModule.title')}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="h-12 rounded-lg bg-slate-100/80 dark:bg-muted/30 [html.ptu-theme-technology_&]:bg-white/10" />
                  <div className="h-12 rounded-lg bg-slate-100/80 dark:bg-muted/30 [html.ptu-theme-technology_&]:bg-white/10" />
                </CardContent>
              </Card>
            )}
          </div>

          {/* EditStamp 中部：标题 + 时间段切换 + 蓝色面积图 */}
          <div className="px-4 pb-2 lg:px-6 lg:pb-4">
            {statsVisible ? (
              <Card className={kpiCard}>
                <CardHeader>
                  <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-2">
                      <CardTitle className="text-base font-semibold">{t('chartTitle')}</CardTitle>
                      <span className="text-sm text-muted-foreground">{t('chartDescription')}</span>
                    </div>
                    <CardAction>
                      <DashboardChartRangeToggle
                        value={chartRange}
                        onChange={setChartRange}
                        ariaLabel={t('chartTitle')}
                        labels={{
                          '7d': t('chartRange7d'),
                          '30d': t('chartRange30d'),
                          '90d': t('chartRange90d'),
                        }}
                      />
                    </CardAction>
                  </div>
                </CardHeader>
                <CardContent className="pt-0 ptu-tech-chart">
                  <DashboardActivityAreaChart
                    footnote={t('chartDemoNote')}
                    emptyLabel={t('chartPlaceholder')}
                    series={activitySeries}
                    legend={{
                      photosLabel: t('photos'),
                      documentsLabel: t('resourceModule.title'),
                    }}
                  />
                </CardContent>
              </Card>
            ) : (
              <Card className={kpiCard}>
                <CardHeader>
                  <CardTitle className="text-base font-semibold">{t('chartTitle')}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-52 rounded-lg bg-slate-100/80 dark:bg-muted/30 [html.ptu-theme-technology_&]:bg-white/10" />
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>

      <AlertDialog
        open={deleteConfirmId !== null}
        title={t('deleteResource')}
        description={t('deleteConfirm')}
        confirmText={t('delete')}
        cancelText={t('cancel')}
        onConfirm={handleDelete}
        onCancel={handleDeleteCancel}
        loading={deletingId !== null}
        destructive
      />

      <AlertDialog
        open={noticeMessage !== null}
        title={t('errorTitle')}
        description={noticeMessage ?? ''}
        confirmText={t('dismiss')}
        showCancel={false}
        destructive={false}
        onConfirm={() => setNoticeMessage(null)}
        onCancel={() => setNoticeMessage(null)}
      />

      <UploadUpgradeDialog
        open={showUpgradeDialog}
        onOpenChange={setShowUpgradeDialog}
        siteName={tCommon('siteName')}
        title={t('uploadUpgradeTitle')}
        description={uploadUpgradeDescription}
        errorMessage={uploadError}
        confirmText={t('upgrade.button')}
        cancelText={t('cancel')}
        onConfirm={() => {
          setShowUpgradeDialog(false);
          trackPricingRedirect({
            sourceModule: 'dashboard_photos',
            sourceAction: 'click_upgrade_btn',
            toPath: '/pricing',
            meta: uploadError ? { reason: 'upload_limit', message: uploadError } : { reason: 'upload_limit' },
          });
          router.push('/pricing');
        }}
      />

      <DashboardImagePreviewDialog url={previewUrl} onClose={() => setPreviewUrl(null)} />

    </>
  );
}
