'use client';

import { useEffect, useState } from 'react';
import { authClient } from '@/lib/auth-client';
import { PLAN_PAID } from '@/lib/constants/plans';

/**
 * 与 AdSense 一致：付费且订阅有效时不加载广告；接口失败时默认展示。
 */
export function useShouldServeAds(): boolean {
  const [enabled, setEnabled] = useState(false);
  const { data: session, isPending } = authClient.useSession();

  useEffect(() => {
    if (isPending) return;

    let cancelled = false;
    void (async () => {
      if (!session?.user?.id) {
        if (!cancelled) setEnabled(true);
        return;
      }
      try {
        const res = await fetch('/api/resources?metaOnly=1');
        if (!res.ok || cancelled) {
          if (!cancelled) setEnabled(true);
          return;
        }
        const data = (await res.json()) as {
          plan?: string;
          subscriptionActive?: boolean;
        };
        const activePaid =
          data?.plan === PLAN_PAID && Boolean(data?.subscriptionActive);
        if (!cancelled) setEnabled(!activePaid);
      } catch {
        if (!cancelled) setEnabled(true);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [session?.user?.id, isPending]);

  return enabled;
}
