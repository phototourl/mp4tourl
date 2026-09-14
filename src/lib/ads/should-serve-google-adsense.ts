import { headers } from 'next/headers';
import { eq } from 'drizzle-orm';
import { getDb } from '@/db';
import { user } from '@/db/schema';
import { getAuth } from '@/lib/auth';
import {
  isPaidSubscriptionActive,
  PLAN_FREE,
  PLAN_PAID,
  type Plan,
} from '@/lib/constants/plans';

/**
 * 与 /api/resources 等处的套餐判断一致：仅「plan=paid 且订阅未过期」不加载 AdSense。
 * 出错时默认仍加载广告；客户端 `PaidSubscriberAdsenseCleanup` 会在登录态变化后再移除广告脚本。
 */
export async function shouldServeGoogleAdsense(): Promise<boolean> {
  try {
    const auth = await getAuth();
    const session = await auth.api.getSession({
      headers: await headers(),
    });
    if (!session?.user?.id) return true;

    const db = await getDb();
    const [row] = await db
      .select({ plan: user.plan, planExpiresAt: user.planExpiresAt })
      .from(user)
      .where(eq(user.id, session.user.id))
      .limit(1);

    if (!row) return true;
    const rawPlan = (row.plan as Plan) || PLAN_FREE;
    if (rawPlan !== PLAN_PAID) return true;
    const subscriptionActive = isPaidSubscriptionActive(rawPlan, row.planExpiresAt ?? null);
    return !subscriptionActive;
  } catch {
    return true;
  }
}
