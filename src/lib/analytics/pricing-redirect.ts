export type PricingRedirectTrackPayload = {
  /** 事件类型：默认 navigate_pricing */
  eventType?: string;
  /** 来源页面 pathname */
  fromPath?: string;
  /** 来源完整 URL（可选） */
  fromUrl?: string;
  /** 目标路径：默认 /pricing */
  toPath?: string;
  /** 触发模块（必填）：dashboard_photos / dashboard_documents / site_header / site_footer ... */
  sourceModule: string;
  /** 触发动作（必填）：click_upgrade_btn / upload_exceed_limit / nav_pricing ... */
  sourceAction: string;
  /** 当时套餐（可选）：free/pro/premium... */
  planAtTime?: string;
  /** 扩展信息（可选）：limit/locale/device/button 文案等 */
  meta?: unknown;
};

const LAST_KEY = '__ptu_pricing_redirect_last__';

function nowMs() {
  return Date.now();
}

function safeGetLocation() {
  if (typeof window === 'undefined') return null;
  return window.location;
}

/**
 * 仅在「真正跳转到支付页面」前调用一次。
 * - 最小资源消耗：sendBeacon（或 keepalive fetch），不阻塞跳转
 * - 去重：3 秒内相同 key 只发一次，避免双击/重复触发
 */
export function trackPricingRedirect(payload: PricingRedirectTrackPayload) {
  try {
    const loc = safeGetLocation();
    const fromPath = payload.fromPath ?? loc?.pathname ?? null;
    const fromUrl = payload.fromUrl ?? loc?.href ?? null;
    const toPath = payload.toPath ?? '/pricing';
    const eventType = payload.eventType ?? 'navigate_pricing';

    const key = JSON.stringify({
      eventType,
      fromPath,
      toPath,
      sourceModule: payload.sourceModule,
      sourceAction: payload.sourceAction,
    });

    const lastRaw = typeof sessionStorage !== 'undefined' ? sessionStorage.getItem(LAST_KEY) : null;
    if (lastRaw) {
      const last = JSON.parse(lastRaw) as { key: string; t: number } | null;
      if (last?.key === key && nowMs() - (last.t || 0) < 3000) return;
    }
    if (typeof sessionStorage !== 'undefined') {
      sessionStorage.setItem(LAST_KEY, JSON.stringify({ key, t: nowMs() }));
    }

    const body = JSON.stringify({
      eventType,
      fromPath,
      fromUrl,
      toPath,
      sourceModule: payload.sourceModule,
      sourceAction: payload.sourceAction,
      planAtTime: payload.planAtTime,
      meta: payload.meta,
    });

    // sendBeacon 优先：最适合“即将跳转”的场景
    if (typeof navigator !== 'undefined' && typeof navigator.sendBeacon === 'function') {
      const blob = new Blob([body], { type: 'application/json' });
      navigator.sendBeacon('/api/analytics/pricing-redirect', blob);
      return;
    }

    // 兜底：keepalive fetch（不 await）
    fetch('/api/analytics/pricing-redirect', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body,
      keepalive: true,
    }).catch(() => {});
  } catch {
    // ignore
  }
}

