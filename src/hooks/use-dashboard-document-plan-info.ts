'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  normalizePlanSnapshotFromResourcesApi,
  type DashboardDocumentPlanSnapshot,
} from '@/lib/dashboard-document-plan';

/**
 * 拉取与「我的文档」一致的套餐/用量（`/api/resources?metaOnly=1`），供文档上传前校验。
 */
export function useDashboardDocumentPlanInfo(enabled: boolean) {
  const [planInfo, setPlanInfo] = useState<DashboardDocumentPlanSnapshot | null>(null);
  const [metaReady, setMetaReady] = useState(false);

  const refetchPlanInfo = useCallback(async () => {
    if (!enabled) return;
    setMetaReady(false);
    try {
      const res = await fetch('/api/resources?metaOnly=1');
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        setPlanInfo(null);
        return;
      }
      setPlanInfo(normalizePlanSnapshotFromResourcesApi(data));
    } catch {
      setPlanInfo(null);
    } finally {
      setMetaReady(true);
    }
  }, [enabled]);

  useEffect(() => {
    if (!enabled) {
      setPlanInfo(null);
      setMetaReady(false);
      return;
    }
    void refetchPlanInfo();
  }, [enabled, refetchPlanInfo]);

  return { planInfo, metaReady, refetchPlanInfo };
}
