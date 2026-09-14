import { NextRequest, NextResponse } from 'next/server';
import { getBaseUrl } from '@/lib/urls';
import { createCheckout } from '@/payment';
import type { CreateCheckoutParams } from '@/payment/types';
import { getSessionFromRequest } from '@/lib/auth-api-session';
import { getDb } from '@/db';
import { user } from '@/db/schema';
import { eq } from 'drizzle-orm';
import {
  getSubscriptionCheckoutBlockReason,
  isPaidSubscriptionActive,
  parsePlanTier,
  PLAN_TIER_YEARLY,
  SUBSCRIPTION_PLAN_ID_MONTHLY,
  SUBSCRIPTION_PLAN_ID_YEARLY,
  type Plan,
} from '@/lib/constants/plans';

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const session = await getSessionFromRequest(req);

    if (!session?.user || !session.user.email) {
      return NextResponse.json(
        { error: 'You must be logged in to checkout' },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { priceId, metadata } = body as {
      priceId: string;
      metadata?: Record<string, string>;
    };

    if (!priceId) {
      return NextResponse.json(
        { error: 'priceId is required' },
        { status: 400 }
      );
    }

    const planId = metadata?.planId || '';

    // Allow monthly → yearly upgrade; block downgrade / same-tier repurchase.
    try {
      const db = await getDb();
      const rows = await db
        .select({
          plan: user.plan,
          planTier: user.planTier,
          planExpiresAt: user.planExpiresAt,
        })
        .from(user)
        .where(eq(user.id, session.user.id))
        .limit(1);

      const row = rows[0];
      const planExpiresAt = row?.planExpiresAt ?? null;
      const subscriptionActive = isPaidSubscriptionActive(
        (row?.plan as Plan) ?? 'free',
        planExpiresAt
      );
      const planTier = parsePlanTier(row?.planTier);
      const currentPlanId = subscriptionActive
        ? planTier === PLAN_TIER_YEARLY
          ? SUBSCRIPTION_PLAN_ID_YEARLY
          : SUBSCRIPTION_PLAN_ID_MONTHLY
        : null;

      const blockReason = getSubscriptionCheckoutBlockReason({
        subscriptionActive,
        planTier,
        currentPlanId,
        targetPlanId: planId,
      });

      if (blockReason) {
        return NextResponse.json(
          {
            error: blockReason,
            planExpiresAt: planExpiresAt?.toISOString() ?? null,
          },
          { status: 409 }
        );
      }
    } catch (dbError) {
      console.error('[Checkout] Subscription guard DB error:', dbError);
    }

    const customerEmail = session.user.email;
    const origin = req.headers.get('origin') || getBaseUrl() || 'http://localhost:3000';
    const successUrl = planId
      ? `${origin}/dashboard?checkout=success&plan=${encodeURIComponent(planId)}`
      : `${origin}/dashboard?checkout=success`;

    const params: CreateCheckoutParams = {
      priceId,
      planId,
      customerEmail,
      successUrl,
      cancelUrl: `${origin}/pricing`,
      metadata: {
        ...metadata,
        userId: session.user.id,
        ...(planId ? { planId } : {}),
        ...(priceId ? { priceId } : {}),
      },
    };

    const result = await createCheckout(params);

    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    console.error('Checkout error:', error);
    return NextResponse.json(
      { error: 'Failed to create checkout session' },
      { status: 500 }
    );
  }
}
