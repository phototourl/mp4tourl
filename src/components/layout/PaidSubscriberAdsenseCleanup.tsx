'use client';

import { useEffect } from 'react';
import { authClient } from '@/lib/auth-client';
import { PLAN_PAID } from '@/lib/constants/plans';

/**
 * Only strip AdSense-injected nodes. Never remove the root-layout <script>/<meta>
 * React owns those — el.remove() orphans fibers → removeChild null on next nav.
 */
function neutralizeAdsInDocument() {
  document.querySelectorAll('ins.adsbygoogle').forEach((el) => {
    try {
      el.remove();
    } catch {
      /* ignore */
    }
  });
  document.querySelectorAll('iframe[src*="googlesyndication"], iframe[src*="doubleclick"]').forEach(
    (el) => {
      try {
        el.remove();
      } catch {
        /* ignore */
      }
    }
  );
  try {
    const w = window as unknown as { adsbygoogle?: { push?: (...args: unknown[]) => unknown } };
    if (w.adsbygoogle) {
      w.adsbygoogle.push = () => 0;
    }
  } catch {
    /* ignore */
  }
}

/**
 * 根布局在首屏 SSR 时可能仍带上广告；用户在同一会话内登录/续费后，
 * 用与接口一致的 metaOnly 判断中和 AdSense，避免付费用户继续看到广告。
 */
export function PaidSubscriberAdsenseCleanup() {
  const { data: session, isPending } = authClient.useSession();

  useEffect(() => {
    if (isPending) return;
    if (!session?.user?.id) return;

    let cancelled = false;
    void (async () => {
      try {
        const res = await fetch('/api/resources?metaOnly=1');
        if (!res.ok || cancelled) return;
        const data = (await res.json()) as {
          plan?: string;
          subscriptionActive?: boolean;
        };
        const activePaid =
          data?.plan === PLAN_PAID && Boolean(data?.subscriptionActive);
        if (!activePaid || cancelled) return;
        neutralizeAdsInDocument();
      } catch {
        /* ignore */
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [session?.user?.id, isPending]);

  return null;
}
