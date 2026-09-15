import { getDb } from '@/db';
import { payment, user, userFile } from '@/db/schema';
import { getSessionFromRequest } from '@/lib/auth-api-session';
import { findPlanByPriceId, getAllPricePlans } from '@/lib/price-plan';
import { resolveStorageLimit } from '@/lib/storage-limits';
import { PaymentScenes, PaymentTypes } from '@/payment/types';
import { and, count, desc, eq, or, sql } from 'drizzle-orm';
import { type NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';

/**
 * Workbench KPI summary — storage / video count / plan.
 */
export async function GET(request: NextRequest) {
  const session = await getSessionFromRequest(request);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const userId = session.user.id;
  const db = await getDb();

  const [[countRow], [sizeRow], [userRow], payments] = await Promise.all([
    db
      .select({ n: count() })
      .from(userFile)
      .where(eq(userFile.userId, userId)),
    db
      .select({
        total: sql<number>`coalesce(sum(${userFile.fileSize}), 0)`,
      })
      .from(userFile)
      .where(eq(userFile.userId, userId)),
    db
      .select({
        plan: user.plan,
        storageLimit: user.storageLimit,
      })
      .from(user)
      .where(eq(user.id, userId))
      .limit(1),
    db
      .select({
        priceId: payment.priceId,
        type: payment.type,
        status: payment.status,
        scene: payment.scene,
        interval: payment.interval,
        createdAt: payment.createdAt,
      })
      .from(payment)
      .where(
        and(
          eq(payment.paid, true),
          eq(payment.userId, userId),
          or(
            and(
              eq(payment.type, PaymentTypes.ONE_TIME),
              eq(payment.scene, PaymentScenes.LIFETIME),
              eq(payment.status, 'completed')
            ),
            and(
              eq(payment.type, PaymentTypes.SUBSCRIPTION),
              or(eq(payment.status, 'active'), eq(payment.status, 'trialing'))
            )
          )
        )
      )
      .orderBy(desc(payment.createdAt)),
  ]);

  const plans = getAllPricePlans();
  let planId = 'free';
  let planInterval: string | null = null;
  let subscriptionActive = false;

  for (const row of payments) {
    if (
      row.type === PaymentTypes.ONE_TIME &&
      row.scene === PaymentScenes.LIFETIME &&
      row.status === 'completed'
    ) {
      const pricePlan = findPlanByPriceId(row.priceId);
      if (pricePlan?.isLifetime) {
        planId = pricePlan.id;
        subscriptionActive = true;
        break;
      }
    }
  }

  if (planId === 'free') {
    for (const row of payments) {
      if (
        row.type === PaymentTypes.SUBSCRIPTION &&
        (row.status === 'active' || row.status === 'trialing')
      ) {
        const pricePlan =
          plans.find((p) =>
            p.prices.some((price) => price.priceId === row.priceId)
          ) || findPlanByPriceId(row.priceId);
        if (pricePlan) {
          planId = pricePlan.id;
          planInterval = row.interval ?? null;
          subscriptionActive = true;
          break;
        }
      }
    }
  }

  const storageLimit = resolveStorageLimit(planId, userRow?.storageLimit);

  return NextResponse.json({
    fileCount: Number(countRow?.n ?? 0),
    storageUsed: Number(sizeRow?.total ?? 0),
    storageLimit,
    plan: planId,
    planInterval,
    subscriptionActive,
  });
}
