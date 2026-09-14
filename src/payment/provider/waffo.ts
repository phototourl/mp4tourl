import { randomUUID } from 'crypto';
import {
  getWaffoEnvironment,
  isWaffoMonthlySubscriptionProduct,
  isWaffoOneTimeMonthlyProduct,
  isWaffoOneTimeYearlyProduct,
  isWaffoYearlySubscriptionProduct,
} from '@/config/waffo-env';
import { getDb } from '@/db';
import { payment, user } from '@/db/schema';
import {
  DEFAULT_STORAGE_LIMITS,
  PAID_STORAGE_LIMITS,
  PLAN_FREE,
  PLAN_PAID,
  PLAN_TIER_MONTHLY,
  PLAN_TIER_YEARLY,
} from '@/lib/constants/plans';
import { getWaffoClient } from '@/lib/waffo-client';
import {
  verifyWebhook,
  WebhookEventType,
  type WebhookEvent,
  type WebhookEventData,
} from '@waffo/pancake-ts';
import { eq } from 'drizzle-orm';
import {
  type CheckoutResult,
  type CreateCheckoutParams,
  type CreateCreditCheckoutParams,
  type CreatePortalParams,
  type PaymentProvider,
  PaymentScenes,
  PaymentTypes,
  type PlanInterval,
  PlanIntervals,
  type PortalResult,
} from '../types';

type WaffoFulfillmentContext = {
  customerId: string;
  productId: string;
  userId?: string;
  sessionId?: string;
  invoiceId?: string;
  subscriptionId?: string;
  metadata?: Record<string, string>;
  billingPeriod?: string;
  currentPeriodStart?: string;
  currentPeriodEnd?: string;
};

/**
 * Waffo Pancake payment provider for Photo To URL.
 * Subscriptions + WeChat one-time (monthly/yearly entitlements).
 */
export class WaffoProvider implements PaymentProvider {
  public async createCheckout(
    params: CreateCheckoutParams
  ): Promise<CheckoutResult> {
    const { planId, priceId, customerEmail, successUrl, metadata } = params;

    const customMetadata: Record<string, string> = {
      ...metadata,
      planId: planId || metadata?.planId || '',
      priceId,
    };

    try {
      const client = getWaffoClient();
      const session = await client.checkout.createSession({
        productId: priceId,
        currency: 'USD',
        buyerEmail: customerEmail,
        successUrl: successUrl ?? undefined,
        metadata: customMetadata,
      });

      console.log('[Waffo] checkout session created', {
        sessionId: session.sessionId,
        productId: priceId,
        environment: getWaffoEnvironment(),
      });

      return {
        url: session.checkoutUrl,
        id: session.sessionId,
      };
    } catch (error) {
      const detail = error instanceof Error ? error.message : String(error);
      console.error('Waffo create checkout error:', detail, error);
      throw new Error(`Waffo checkout failed: ${detail}`);
    }
  }

  public async createCreditCheckout(
    params: CreateCreditCheckoutParams
  ): Promise<CheckoutResult> {
    return this.createCheckout({
      planId: params.packageId,
      priceId: params.priceId,
      customerEmail: params.customerEmail,
      successUrl: params.successUrl,
      cancelUrl: params.cancelUrl,
      metadata: { ...params.metadata, type: 'credit_purchase' },
      locale: params.locale,
    });
  }

  public async createCustomerPortal(
    _params: CreatePortalParams
  ): Promise<PortalResult> {
    throw new Error(
      'Customer portal is not supported with Waffo. Manage billing from the pricing page or contact support.'
    );
  }

  public async handleWebhookEvent(
    payload: string,
    signature: string
  ): Promise<void> {
    const event = verifyWebhook(payload, signature, {
      environment: getWaffoEnvironment(),
    }) as WebhookEvent<WebhookEventData>;

    console.log(`Waffo webhook event: ${event.eventType}`);

    // subscription.renewed: period fields moved here from payment_succeeded (Waffo 2026-09).
    const eventType = String(event.eventType);
    const renewedType =
      (WebhookEventType as Record<string, string>).SubscriptionRenewed ??
      'subscription.renewed';

    switch (eventType) {
      case WebhookEventType.OrderCompleted:
        await this.onOrderCompleted(event);
        break;
      case WebhookEventType.SubscriptionActivated:
        await this.onSubscriptionActivated(event);
        break;
      case WebhookEventType.SubscriptionPaymentSucceeded:
        await this.onSubscriptionPaymentSucceeded(event);
        break;
      case renewedType:
        await this.onSubscriptionRenewed(event);
        break;
      case WebhookEventType.SubscriptionCanceling:
        await this.onSubscriptionCanceling(event);
        break;
      case WebhookEventType.SubscriptionCanceled:
        await this.onSubscriptionCanceled(event);
        break;
      case WebhookEventType.SubscriptionPastDue:
        await this.onSubscriptionPastDue(event);
        break;
      case WebhookEventType.RefundSucceeded:
        await this.onRefundSucceeded(event);
        break;
      default:
        console.log(`Unhandled Waffo webhook: ${event.eventType}`);
    }
  }

  private toFulfillmentContext(
    data: WebhookEventData,
    options?: { subscriptionOrder?: boolean }
  ): WaffoFulfillmentContext | null {
    const metadata = data.orderMetadata ?? {};
    const productId =
      metadata.priceId ??
      metadata.productId ??
      data.productMetadata?.priceId ??
      '';

    // Prefer Waffo transaction id (PAY_...); never store buyer email as customer_id
    const customerId =
      data.paymentId ?? data.orderId ?? '';

    if (!customerId || !productId) {
      console.warn('[Waffo] webhook missing customer or product', {
        customerId: customerId || null,
        productId: productId || null,
        orderId: data.orderId ?? null,
      });
      return null;
    }

    return {
      customerId,
      productId,
      userId: metadata.userId,
      sessionId: data.orderId,
      invoiceId: data.paymentId ?? data.orderId,
      subscriptionId: options?.subscriptionOrder ? data.orderId : undefined,
      metadata,
      billingPeriod: data.billingPeriod,
      currentPeriodStart: data.currentPeriodStart,
      currentPeriodEnd: data.currentPeriodEnd,
    };
  }

  private async onOrderCompleted(event: WebhookEvent): Promise<void> {
    const ctx = this.toFulfillmentContext(event.data);
    if (!ctx) return;
    await this.fulfillCheckout(ctx);
  }

  private async onSubscriptionActivated(event: WebhookEvent): Promise<void> {
    const ctx = this.toFulfillmentContext(event.data, {
      subscriptionOrder: true,
    });
    if (!ctx) return;
    await this.syncSubscriptionPaymentAndUser(ctx);
  }

  /** Renewal lifecycle — carries billingPeriod / currentPeriodStart / currentPeriodEnd. */
  private async onSubscriptionRenewed(event: WebhookEvent): Promise<void> {
    const ctx = this.toFulfillmentContext(event.data, {
      subscriptionOrder: true,
    });
    if (!ctx) return;
    await this.syncSubscriptionPaymentAndUser(ctx);
  }

  /**
   * Payment receipt only after Waffo 2026-09 — period fields may be absent.
   * Keep membership active; do not overwrite periods already set by activated/renewed.
   */
  private async onSubscriptionPaymentSucceeded(
    event: WebhookEvent
  ): Promise<void> {
    const ctx = this.toFulfillmentContext(event.data, {
      subscriptionOrder: true,
    });
    if (!ctx) return;
    await this.syncSubscriptionPaymentAndUser(ctx, {
      updatePeriodsOnlyIfPresent: true,
    });
  }

  private async onSubscriptionCanceling(event: WebhookEvent): Promise<void> {
    const subscriptionId = event.data.orderId;
    if (!subscriptionId) return;

    const db = await getDb();
    await db
      .update(payment)
      .set({
        cancelAtPeriodEnd: true,
        updatedAt: new Date(),
      })
      .where(eq(payment.subscriptionId, subscriptionId));

    const ctx = this.toFulfillmentContext(event.data);
    if (!ctx?.userId) return;

    const interval = this.resolveSubscriptionInterval(ctx);
    await this.updateUserToPaid(
      ctx.userId,
      interval,
      ctx.currentPeriodEnd ? new Date(ctx.currentPeriodEnd) : undefined
    );
  }

  private async onSubscriptionCanceled(event: WebhookEvent): Promise<void> {
    const subscriptionId = event.data.orderId;
    if (!subscriptionId) return;

    const db = await getDb();
    const now = new Date();
    const ctx = this.toFulfillmentContext(event.data);
    const userId = ctx ? await this.resolveUserId(ctx) : undefined;

    await db
      .update(payment)
      .set({
        status: 'canceled',
        cancelAtPeriodEnd: true,
        updatedAt: now,
      })
      .where(eq(payment.subscriptionId, subscriptionId));

    if (userId) {
      const periodEnd = ctx?.currentPeriodEnd
        ? new Date(ctx.currentPeriodEnd)
        : null;
      const periodStillActive = periodEnd
        ? periodEnd.getTime() > Date.now()
        : false;

      if (periodStillActive && periodEnd && ctx) {
        const interval = this.resolveSubscriptionInterval(ctx);
        await this.updateUserToPaid(userId, interval, periodEnd);
      } else {
        await db
          .update(user)
          .set({
            plan: PLAN_FREE,
            planTier: null,
            storageLimit: DEFAULT_STORAGE_LIMITS[PLAN_FREE],
            planExpiresAt: periodEnd,
            updatedAt: now,
          })
          .where(eq(user.id, userId));
      }
    }
  }

  private async onSubscriptionPastDue(event: WebhookEvent): Promise<void> {
    const subscriptionId = event.data.orderId;
    if (!subscriptionId) return;

    const db = await getDb();
    await db
      .update(payment)
      .set({ status: 'past_due', updatedAt: new Date() })
      .where(eq(payment.subscriptionId, subscriptionId));
  }

  private async onRefundSucceeded(event: WebhookEvent): Promise<void> {
    const invoiceId = event.data.paymentId ?? event.data.orderId;
    if (!invoiceId) return;

    const db = await getDb();
    await db
      .update(payment)
      .set({ status: 'failed', paid: false, updatedAt: new Date() })
      .where(eq(payment.invoiceId, invoiceId));
  }

  private async fulfillCheckout(ctx: WaffoFulfillmentContext): Promise<void> {
    const userId = await this.resolveUserId(ctx);
    if (!userId) {
      console.warn('[Waffo] checkout completed without userId', {
        metadata: ctx.metadata ?? null,
      });
      return;
    }

    const isOneTimeYearly = isWaffoOneTimeYearlyProduct(ctx.productId);
    const isOneTimeMonthly = isWaffoOneTimeMonthlyProduct(ctx.productId);
    const isOneTime = isOneTimeYearly || isOneTimeMonthly;
    const paymentTypeMeta = (ctx.metadata?.paymentType || '').toLowerCase();
    const metaSaysOneTime =
      paymentTypeMeta === 'one_time' || paymentTypeMeta === 'onetime';

    const treatAsOneTime = isOneTime || metaSaysOneTime;

    const interval = isOneTimeYearly
      ? PlanIntervals.YEAR
      : isOneTimeMonthly
        ? PlanIntervals.MONTH
        : treatAsOneTime && ctx.metadata?.planId === 'proYearly'
          ? PlanIntervals.YEAR
          : treatAsOneTime && ctx.metadata?.planId === 'pro'
            ? PlanIntervals.MONTH
            : this.resolveSubscriptionInterval(ctx);

    const type = treatAsOneTime
      ? PaymentTypes.ONE_TIME
      : PaymentTypes.SUBSCRIPTION;

    const db = await getDb();
    const now = new Date();

    if (ctx.subscriptionId && !treatAsOneTime) {
      const existing = await db
        .select()
        .from(payment)
        .where(eq(payment.subscriptionId, ctx.subscriptionId))
        .limit(1);
      if (existing.length > 0) {
        await this.updateUserWithCustomerId(ctx.customerId, userId);
        await this.updateUserToPaid(
          userId,
          interval,
          ctx.currentPeriodEnd ? new Date(ctx.currentPeriodEnd) : undefined
        );
        return;
      }
    }

    if (ctx.invoiceId) {
      const existingByInvoice = await db
        .select()
        .from(payment)
        .where(eq(payment.invoiceId, ctx.invoiceId))
        .limit(1);
      if (existingByInvoice.length > 0) {
        await this.updateUserWithCustomerId(ctx.customerId, userId);
        const replayExpiresAt = treatAsOneTime
          ? existingByInvoice[0].periodEnd ?? undefined
          : ctx.currentPeriodEnd
            ? new Date(ctx.currentPeriodEnd)
            : undefined;
        await this.updateUserToPaid(
          userId,
          interval,
          replayExpiresAt ?? undefined
        );
        return;
      }
    }

    if (treatAsOneTime && ctx.sessionId) {
      const existingBySession = await db
        .select()
        .from(payment)
        .where(eq(payment.sessionId, ctx.sessionId))
        .limit(1);
      if (existingBySession.length > 0) {
        await this.updateUserWithCustomerId(ctx.customerId, userId);
        await this.updateUserToPaid(
          userId,
          interval,
          existingBySession[0].periodEnd ?? undefined
        );
        return;
      }
    }

    const periodEnd = treatAsOneTime
      ? (() => {
          const end = new Date(now);
          if (interval === PlanIntervals.YEAR) {
            end.setFullYear(end.getFullYear() + 1);
          } else {
            end.setMonth(end.getMonth() + 1);
          }
          return end;
        })()
      : ctx.currentPeriodEnd
        ? new Date(ctx.currentPeriodEnd)
        : null;

    await db.insert(payment).values({
      id: randomUUID(),
      priceId: ctx.productId,
      type,
      scene: PaymentScenes.SUBSCRIPTION,
      interval,
      userId,
      customerId: ctx.customerId,
      subscriptionId: treatAsOneTime ? null : (ctx.subscriptionId ?? null),
      sessionId: ctx.sessionId ?? null,
      invoiceId: ctx.invoiceId ?? null,
      status: 'active',
      paid: true,
      periodStart: now,
      periodEnd,
      createdAt: now,
      updatedAt: now,
    });

    await this.updateUserWithCustomerId(ctx.customerId, userId);
    await this.updateUserToPaid(
      userId,
      interval,
      treatAsOneTime ? periodEnd ?? undefined : periodEnd ?? undefined
    );

    console.log(
      treatAsOneTime
        ? `[Waffo] one-time ${interval} entitlements granted`
        : '[Waffo] checkout completed'
    );
  }

  private async syncSubscriptionPaymentAndUser(
    ctx: WaffoFulfillmentContext,
    options?: { updatePeriodsOnlyIfPresent?: boolean }
  ): Promise<void> {
    const subscriptionId = ctx.subscriptionId;
    if (!subscriptionId) return;

    // One-time WeChat products must not be treated as recurring.
    if (
      isWaffoOneTimeMonthlyProduct(ctx.productId) ||
      isWaffoOneTimeYearlyProduct(ctx.productId)
    ) {
      await this.fulfillCheckout({ ...ctx, subscriptionId: undefined });
      return;
    }

    const userId = await this.resolveUserId(ctx);
    if (!userId) {
      console.warn('[Waffo] subscription sync without userId', {
        subscriptionId,
      });
      return;
    }

    const db = await getDb();
    const now = new Date();
    const interval = this.resolveSubscriptionInterval(ctx);
    const hasPeriodStart = !!ctx.currentPeriodStart;
    const hasPeriodEnd = !!ctx.currentPeriodEnd;
    const periodStart = hasPeriodStart
      ? new Date(ctx.currentPeriodStart!)
      : now;
    const periodEnd = hasPeriodEnd ? new Date(ctx.currentPeriodEnd!) : null;
    const onlyIfPresent = options?.updatePeriodsOnlyIfPresent === true;

    await this.updateUserWithCustomerId(ctx.customerId, userId);

    const existing = await db
      .select({ id: payment.id })
      .from(payment)
      .where(eq(payment.subscriptionId, subscriptionId))
      .limit(1);

    if (existing.length === 0) {
      await db.insert(payment).values({
        id: randomUUID(),
        priceId: ctx.productId,
        type: PaymentTypes.SUBSCRIPTION,
        scene: PaymentScenes.SUBSCRIPTION,
        interval,
        userId,
        customerId: ctx.customerId,
        subscriptionId,
        invoiceId: ctx.invoiceId ?? null,
        status: 'active',
        paid: true,
        periodStart,
        periodEnd,
        createdAt: now,
        updatedAt: now,
      });
    } else {
      const patch: {
        status: string;
        paid: boolean;
        interval: PlanInterval;
        updatedAt: Date;
        periodStart?: Date;
        periodEnd?: Date | null;
      } = {
        status: 'active',
        paid: true,
        interval,
        updatedAt: now,
      };
      // Only write period columns when webhook carries them (activated/renewed).
      // Missing fields must not null-out rows that lifecycle events already set.
      if (!onlyIfPresent || hasPeriodStart) {
        patch.periodStart = periodStart;
      }
      if (!onlyIfPresent || hasPeriodEnd) {
        patch.periodEnd = periodEnd;
      }
      await db
        .update(payment)
        .set(patch)
        .where(eq(payment.subscriptionId, subscriptionId));
    }

    // Membership expiry: use provider end when present; otherwise fall back to
    // now+interval inside updateUserToPaid (same as before this webhook change).
    // Do not reuse a stale payment.periodEnd on payment_succeeded — that would
    // block renewal extension when period fields are omitted.
    await this.updateUserToPaid(userId, interval, periodEnd ?? undefined);
  }

  private async resolveUserId(
    ctx: WaffoFulfillmentContext
  ): Promise<string | undefined> {
    if (ctx.userId) return ctx.userId;
    if (ctx.metadata?.userId) return ctx.metadata.userId;
    if (ctx.customerId) {
      return this.findUserIdByCustomerId(ctx.customerId);
    }
    return undefined;
  }

  private async findUserIdByCustomerId(
    customerId: string
  ): Promise<string | undefined> {
    try {
      const db = await getDb();
      const rows = await db
        .select({ id: user.id })
        .from(user)
        .where(eq(user.customerId, customerId))
        .limit(1);
      return rows[0]?.id;
    } catch (error) {
      console.error('Find user by customer ID error:', error);
      return undefined;
    }
  }

  private async updateUserWithCustomerId(
    customerId: string,
    userId: string
  ): Promise<void> {
    // user.customer_id only stores transaction id (PAY_...), not ORD_/email fallbacks
    if (!customerId.startsWith('PAY_')) return;

    const db = await getDb();
    await db
      .update(user)
      .set({
        customerId,
        updatedAt: new Date(),
      })
      .where(eq(user.id, userId));
  }

  private async updateUserToPaid(
    userId: string,
    interval: PlanInterval,
    expiresAtFromProvider?: Date
  ): Promise<void> {
    const db = await getDb();

    let planExpiresAt = expiresAtFromProvider;
    if (!planExpiresAt) {
      planExpiresAt = new Date();
      if (interval === PlanIntervals.YEAR) {
        planExpiresAt.setFullYear(planExpiresAt.getFullYear() + 1);
      } else {
        planExpiresAt.setMonth(planExpiresAt.getMonth() + 1);
      }
    }

    const storageLimit =
      interval === PlanIntervals.YEAR
        ? PAID_STORAGE_LIMITS[PLAN_TIER_YEARLY]
        : PAID_STORAGE_LIMITS[PLAN_TIER_MONTHLY];

    await db
      .update(user)
      .set({
        plan: PLAN_PAID,
        planTier:
          interval === PlanIntervals.YEAR ? PLAN_TIER_YEARLY : PLAN_TIER_MONTHLY,
        planExpiresAt,
        storageLimit,
        updatedAt: new Date(),
      })
      .where(eq(user.id, userId));
  }

  /**
   * Prefer planId / product ID over billingPeriod.
   * Waffo SubscriptionActivated often omits or leaves billingPeriod empty
   * (same issue fixed on editstamp — empty period defaulted to monthly).
   */
  private resolveSubscriptionInterval(
    ctx: WaffoFulfillmentContext
  ): PlanInterval {
    const planId = ctx.metadata?.planId;
    if (planId === 'proYearly') return PlanIntervals.YEAR;
    if (planId === 'pro') return PlanIntervals.MONTH;

    if (
      isWaffoOneTimeYearlyProduct(ctx.productId) ||
      isWaffoYearlySubscriptionProduct(ctx.productId)
    ) {
      return PlanIntervals.YEAR;
    }
    if (
      isWaffoOneTimeMonthlyProduct(ctx.productId) ||
      isWaffoMonthlySubscriptionProduct(ctx.productId)
    ) {
      return PlanIntervals.MONTH;
    }

    return this.mapBillingPeriodToPlanInterval(ctx.billingPeriod);
  }

  private mapBillingPeriodToPlanInterval(
    billingPeriod?: string
  ): PlanInterval {
    const normalized = (billingPeriod ?? '').toLowerCase().trim();
    if (
      normalized === 'yearly' ||
      normalized === 'year' ||
      normalized === 'annual' ||
      normalized === 'annually' ||
      normalized.includes('year') ||
      normalized.includes('annual')
    ) {
      return PlanIntervals.YEAR;
    }
    return PlanIntervals.MONTH;
  }
}
