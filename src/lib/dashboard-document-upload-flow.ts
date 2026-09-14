import {
  formatUploadLimitForDisplay,
  getMaxDocumentUploadFileBytes,
  PLAN_PAID,
  PLAN_TIER_MONTHLY,
  PLAN_TIER_YEARLY,
} from '@/lib/constants/plans';
import type { DashboardDocumentPlanSnapshot } from '@/lib/dashboard-document-plan';

export type DocumentUploadPrecheckFailure =
  | { code: 'storage' }
  | { code: 'file_too_large'; maxSize: string };

/**
 * 与 `DashboardResourceModule` 中 `handleUpload` 开头逻辑一致：
 * - 存储满或加上本文件后超限 → storage
 * - 仅「付费且订阅有效」时校验单文件文档上限；免费/到期会员不做单文件预检（与 API 一致）
 */
export function precheckDashboardDocumentUpload(
  planInfo: DashboardDocumentPlanSnapshot | null | undefined,
  fileSize: number
): DocumentUploadPrecheckFailure | null {
  if (
    planInfo &&
    (planInfo.storageUsed >= planInfo.storageLimit || planInfo.storageUsed + fileSize > planInfo.storageLimit)
  ) {
    return { code: 'storage' };
  }
  const isPaidActive = planInfo?.plan === PLAN_PAID && planInfo?.subscriptionActive;
  if (isPaidActive) {
    const maxBytes = getMaxDocumentUploadFileBytes(
      PLAN_PAID,
      planInfo?.planTier === PLAN_TIER_YEARLY ? PLAN_TIER_YEARLY : PLAN_TIER_MONTHLY
    );
    if (fileSize > maxBytes) {
      const maxSize = formatUploadLimitForDisplay(maxBytes);
      return { code: 'file_too_large', maxSize };
    }
  }
  return null;
}

export type DocumentUploadApiFailure =
  | { code: 'daily_limit'; limit: number }
  | { code: 'storage' }
  | { code: 'file_too_large'; maxSize: string }
  | { code: 'generic'; message: string };

/**
 * 与 `DashboardResourceModule` 对 `/api/documents/upload` 失败分支一致。
 */
export function interpretDashboardDocumentUploadApiFailure(
  status: number,
  data: Record<string, unknown>
): DocumentUploadApiFailure {
  if (status === 429) {
    const ep = data.errorParams;
    const limit =
      typeof ep === 'object' && ep !== null && 'limit' in ep && typeof (ep as { limit?: unknown }).limit === 'number'
        ? (ep as { limit: number }).limit
        : typeof data.limit === 'number'
          ? data.limit
          : 0;
    return { code: 'daily_limit', limit };
  }
  if (status === 413) {
    return { code: 'storage' };
  }
  if (status === 400 && data.error === 'fileTooLarge') {
    const ep = data.errorParams;
    const maxSize =
      typeof ep === 'object' && ep !== null
        ? typeof (ep as { maxSize?: unknown }).maxSize === 'string'
          ? (ep as { maxSize: string }).maxSize
          : typeof (ep as { maxMb?: unknown }).maxMb === 'number'
            ? `${(ep as { maxMb: number }).maxMb} MB`
            : '0 MB'
        : '0 MB';
    return { code: 'file_too_large', maxSize };
  }
  if (typeof data.error === 'string' && data.error) {
    return { code: 'generic', message: data.error };
  }
  return { code: 'generic', message: '' };
}

type ResourceModuleT = (
  key: 'uploadErrorStorageLimit' | 'uploadErrorTooLarge' | 'uploadErrorDailyLimit' | 'uploadErrorGeneric',
  values?: Record<string, string | number>
) => string;

export function messageForDocumentUploadPrecheckFailure(
  failure: DocumentUploadPrecheckFailure,
  tRm: ResourceModuleT
): { showUpgradeDialog: boolean; message: string } {
  if (failure.code === 'storage') {
    return { showUpgradeDialog: true, message: tRm('uploadErrorStorageLimit') };
  }
  return {
    showUpgradeDialog: false,
    message: tRm('uploadErrorTooLarge', { maxMb: failure.maxSize, maxSize: failure.maxSize }),
  };
}

export function messageForDocumentUploadApiFailure(
  failure: DocumentUploadApiFailure,
  tRm: ResourceModuleT
): { showUpgradeDialog: boolean; message: string } {
  switch (failure.code) {
    case 'daily_limit':
      return { showUpgradeDialog: true, message: tRm('uploadErrorDailyLimit', { limit: failure.limit }) };
    case 'storage':
      return { showUpgradeDialog: true, message: tRm('uploadErrorStorageLimit') };
    case 'file_too_large':
      return {
        showUpgradeDialog: false,
        message: tRm('uploadErrorTooLarge', { maxMb: failure.maxSize, maxSize: failure.maxSize }),
      };
    case 'generic':
      return {
        showUpgradeDialog: false,
        message: failure.message.trim() ? failure.message : tRm('uploadErrorGeneric'),
      };
    default:
      return { showUpgradeDialog: false, message: tRm('uploadErrorGeneric') };
  }
}
