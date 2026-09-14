import { createHmac, randomUUID, timingSafeEqual } from 'crypto';
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
import { and, desc, eq, isNull, ne, or } from 'drizzle-orm';
import {
  PaymentScenes,
  PaymentTypes,
  type PlanInterval,
  PlanIntervals,
} from '../types';

/**
 * Creem webhook-only handler for main-Waffo.
 *
 * New checkouts stay on Waffo. This keeps https://phototourl.com/api/webhooks/creem
 * alive for legacy Creem subscription renewals / cancel / expire.
 *
 * Does not use the `creem` npm SDK — only HMAC verification + DB updates.
 */
export class CreemLegacyWebhookProvider {
  private webhookSecret: string;

  constructor() {
    const webhookSecret = process.env.CREEM_WEBHOOK_SECRET;
    if (!webhookSecret) {
      throw new Error(
        'CREEM_WEBHOOK_SECRET is required for legacy Creem webhooks on main-Waffo'
      );
    }
    this.webhookSecret = webhookSecret;
  }

  public async handleWebhookEvent(
    payload: string,
    signature: string
  ): Promise<void> {
    const event = this.verifyWebhookSignature(payload, signature);
    if (!event) {
      throw new Error('Invalid Creem webhook signature');
    }

    const eventType = event.type;
    console.log(`[Creem legacy] webhook event: ${eventType}`);

    switch (eventType) {
      case 'checkout.completed':
        await this.onCheckoutCompleted(event.data);
        break;
      case 'subscription.active':
        await this.onSubscriptionActive(event.data);
        break;
      case 'subscription.paid':
        await this.onSubscriptionPaid(event.data);
        break;
      case 'subscription.canceled':
        await this.onSubscriptionCanceled(event.data);
        break;
      case 'subscription.scheduled_cancel':
        await this.onSubscriptionScheduledCancel(event.data);
        break;
      case 'subscription.past_due':
        await this.onSubscriptionPastDue(event.data);
        break;
      case 'subscription.expired':
        await this.onSubscriptionExpired(event.data);
        break;
      case 'refund.created':
        await this.onRefundCreated(event.data);
        break;
      default:
        console.log(`[Creem legacy] unhandled event: ${eventType}`);
    }
  }

  private verifyWebhookSignature(
    payload: string,
    signature: string
  ): CreemWebhookEvent | null {
    const expectedSignature = createHmac('sha256', this.webhookSecret)
      .update(payload)
      .digest('hex');

    try {
      const sigBuffer = Buffer.from(signature);
      const expectedBuffer = Buffer.from(expectedSignature);
      if (sigBuffer.length !== expectedBuffer.length) return null;
      if (!timingSafeEqual(sigBuffer, expectedBuffer)) return null;

      const raw = JSON.parse(payload);
      const object = raw.object;

      const mappedData: CreemWebhookData = {
        ...object,
        customerId: object.customer?.id,
        currentPeriodStart: object.current_period_start_date,
        currentPeriodEnd:
          object.current_period_end_date ??
          (typeof object.last_transaction?.period_end === 'number'
            ? new Date(object.last_transaction.period_end).toISOString()
            : undefined),
        subscriptionId: object.subscription?.id,
        productId: object.product?.id ?? object.metadata?.priceId,
        invoiceId: object.order?.id,
        billingPeriod: object.billing_period ?? object.product?.billing_period,
        expiresAt:
          object.expires_at ?? object.subscription?.current_period_end_date,
        userId: object.metadata?.userId,
      };

      return {
        type: raw.eventType,
        data: mappedData,
      };
    } catch {
      return null;
    }
  }

  private async updateUserWithCustomerId(
    customerId: string,
    userId: string
  ): Promise<void> {
    // Do not overwrite a Waffo PAY_ customer id with a Creem cust_ id.
    const db = await getDb();
    const rows = await db
      .select({ customerId: user.customerId })
      .from(user)
      .where(eq(user.id, userId))
      .limit(1);
    const existing = rows[0]?.customerId;
    if (existing?.startsWith('PAY_')) {
      console.log(
        '[Creem legacy] skip customerId overwrite (user already has Waffo PAY_ id)'
      );
      return;
    }

    await db
      .update(user)
      .set({
        customerId,
        updatedAt: new Date(),
      })
      .where(eq(user.id, userId));
  }

  private async findUserIdByCustomerId(
    customerId: string
  ): Promise<string | undefined> {
    try {
      const db = await getDb();
      const result = await db
        .select({ id: user.id })
        .from(user)
        .where(eq(user.customerId, customerId))
        .limit(1);
      return result[0]?.id;
    } catch (error) {
      console.error('[Creem legacy] find user by customerId error:', error);
      return undefined;
    }
  }

  private async findUserIdBySubscriptionId(
    subscriptionId: string
  ): Promise<string | undefined> {
    try {
      const db = await getDb();
      const result = await db
        .select({ userId: payment.userId })
        .from(payment)
        .where(eq(payment.subscriptionId, subscriptionId))
        .orderBy(desc(payment.createdAt))
        .limit(1);
      return result[0]?.userId;
    } catch (error) {
      console.error(
        '[Creem legacy] find user by subscriptionId error:',
        error
      );
      return undefined;
    }
  }

  private async resolveUserId(
    data: CreemWebhookData,
    fallbackFromPayment?: string
  ): Promise<string | undefined> {
    if (data.userId) return data.userId;
    if (data.metadata?.userId) return data.metadata.userId;
    if (fallbackFromPayment) return fallbackFromPayment;
    if (data.id) {
      const bySub = await this.findUserIdBySubscriptionId(data.id);
      if (bySub) return bySub;
    }
    if (data.subscriptionId) {
      const byNestedSub = await this.findUserIdBySubscriptionId(
        data.subscriptionId
      );
      if (byNestedSub) return byNestedSub;
    }
    if (data.customerId) {
      return this.findUserIdByCustomerId(data.customerId);
    }
    return undefined;
  }

  /** Avoid wiping Waffo entitlements when a legacy Creem sub ends. */
  private async hasOtherActivePayment(
    userId: string,
    excludeSubscriptionId: string
  ): Promise<boolean> {
    const db = await getDb();
    const rows = await db
      .select({ id: payment.id })
      .from(payment)
      .where(
        and(
          eq(payment.userId, userId),
          eq(payment.status, 'active'),
          eq(payment.paid, true),
          or(
            isNull(payment.subscriptionId),
            ne(payment.subscriptionId, excludeSubscriptionId)
          )
        )
      )
      .limit(1);
    return rows.length > 0;
  }

  private async onCheckoutCompleted(data: CreemWebhookData): Promise<void> {
    console.log('[Creem legacy] checkout.completed:', data.id);

    const { customer, metadata } = data;
    if (!customer?.id) {
      console.warn('[Creem legacy] no customer.id in checkout');
      return;
    }
    const userId = metadata?.userId as string | undefined;
    if (!userId) {
      console.warn('[Creem legacy] no userId in checkout metadata');
      return;
    }
    if (!data.productId) {
      console.warn('[Creem legacy] no productId in checkout');
      return;
    }

    const currentDate = new Date();
    const isOneTimeYearly = this.isOneTimeYearlyProduct(data.productId);
    const isOneTimeMonthly = this.isOneTimeMonthlyProduct(data.productId);
    const isOneTime = isOneTimeYearly || isOneTimeMonthly;
    const interval = isOneTimeYearly
      ? PlanIntervals.YEAR
      : isOneTimeMonthly
        ? PlanIntervals.MONTH
        : this.mapCreemBillingPeriodToPlanInterval(data.billingPeriod);
    const type = isOneTime
      ? PaymentTypes.ONE_TIME
      : PaymentTypes.SUBSCRIPTION;
    const scene =
      metadata?.type === 'credit_purchase'
        ? PaymentScenes.CREDIT
        : PaymentScenes.SUBSCRIPTION;
    const paidExpiresAt = isOneTime
      ? undefined
      : data.expiresAt
        ? new Date(data.expiresAt)
        : undefined;

    const db = await getDb();

    if (data.subscriptionId) {
      const existing = await db
        .select()
        .from(payment)
        .where(eq(payment.subscriptionId, data.subscriptionId))
        .limit(1);
      if (existing.length > 0) {
        await this.updateUserWithCustomerId(customer.id, userId);
        await this.updateUserToPaid(userId, interval, paidExpiresAt);
        return;
      }
    }

    if (data.invoiceId) {
      const existingByInvoice = await db
        .select()
        .from(payment)
        .where(eq(payment.invoiceId, data.invoiceId))
        .limit(1);
      if (existingByInvoice.length > 0) {
        await this.updateUserWithCustomerId(customer.id, userId);
        const replayExpiresAt = isOneTime
          ? existingByInvoice[0].periodEnd ?? undefined
          : paidExpiresAt;
        await this.updateUserToPaid(
          userId,
          interval,
          replayExpiresAt ?? undefined
        );
        return;
      }
    }

    if (isOneTime && data.id) {
      const existingBySession = await db
        .select()
        .from(payment)
        .where(eq(payment.sessionId, data.id))
        .limit(1);
      if (existingBySession.length > 0) {
        await this.updateUserWithCustomerId(customer.id, userId);
        await this.updateUserToPaid(
          userId,
          interval,
          existingBySession[0].periodEnd ?? undefined
        );
        return;
      }
    }

    const periodEnd = isOneTime
      ? (() => {
          const end = new Date(currentDate);
          if (isOneTimeYearly) end.setFullYear(end.getFullYear() + 1);
          else end.setMonth(end.getMonth() + 1);
          return end;
        })()
      : data.expiresAt
        ? new Date(data.expiresAt)
        : null;

    await db.insert(payment).values({
      id: randomUUID(),
      priceId: data.productId,
      type,
      scene,
      interval,
      userId,
      customerId: customer.id,
      subscriptionId: data.subscriptionId ?? null,
      sessionId: data.id,
      invoiceId: data.invoiceId ?? null,
      status: 'active',
      paid: true,
      periodStart: currentDate,
      periodEnd,
      createdAt: currentDate,
      updatedAt: currentDate,
    });

    await this.updateUserWithCustomerId(customer.id, userId);
    await this.updateUserToPaid(userId, interval, paidExpiresAt);
    console.log('[Creem legacy] checkout.completed done');
  }

  private isOneTimeYearlyProduct(productId: string): boolean {
    const ids = [
      process.env.NEXT_PUBLIC_CREEM_PRICE_ID_PRO_YEARLY_ONETIME,
      process.env.CREEM_PRICE_ID_PRO_YEARLY_ONETIME,
      'prod_2NYkUTBhfMz2926BAA4BJl',
      'prod_3LQCHdSQMfTfg6GmSEXE2I',
    ].filter((id): id is string => typeof id === 'string' && id.length > 0);
    return ids.includes(productId);
  }

  private isOneTimeMonthlyProduct(productId: string): boolean {
    const ids = [
      process.env.NEXT_PUBLIC_CREEM_PRICE_ID_PRO_MONTHLY_ONETIME,
      process.env.CREEM_PRICE_ID_PRO_MONTHLY_ONETIME,
      'prod_50mrFwK7QGfnjCZBmoi9F2',
      'prod_6GCZFTn4zh86RNTDD6kVft',
    ].filter((id): id is string => typeof id === 'string' && id.length > 0);
    return ids.includes(productId);
  }

  private async onSubscriptionActive(data: CreemWebhookData): Promise<void> {
    const subscriptionId = data.id;
    if (!subscriptionId) {
      console.warn('[Creem legacy] no subscription id in subscription.active');
      return;
    }
    console.log('[Creem legacy] subscription.active:', subscriptionId);

    const db = await getDb();
    const currentDate = new Date();

    await db
      .update(payment)
      .set({
        status: 'active',
        periodStart: data.currentPeriodStart
          ? new Date(data.currentPeriodStart)
          : currentDate,
        periodEnd: data.currentPeriodEnd
          ? new Date(data.currentPeriodEnd)
          : null,
        updatedAt: currentDate,
      })
      .where(eq(payment.subscriptionId, subscriptionId));

    const userId = await this.resolveUserId(data);
    if (userId) {
      const interval = this.mapCreemBillingPeriodToPlanInterval(
        data.billingPeriod
      );
      await this.updateUserToPaid(
        userId,
        interval,
        data.currentPeriodEnd ? new Date(data.currentPeriodEnd) : undefined
      );
    }
  }

  private async onSubscriptionPaid(data: CreemWebhookData): Promise<void> {
    const subscriptionId = data.id;
    if (!subscriptionId) {
      console.warn('[Creem legacy] no subscription id in subscription.paid');
      return;
    }
    console.log('[Creem legacy] subscription.paid (renewal):', subscriptionId);

    const db = await getDb();
    const currentDate = new Date();

    const payments = await db
      .select()
      .from(payment)
      .where(eq(payment.subscriptionId, subscriptionId))
      .orderBy(desc(payment.createdAt))
      .limit(1);

    const fallbackUserId = payments[0]?.userId;

    await db
      .update(payment)
      .set({
        status: 'active',
        paid: true,
        periodStart: data.currentPeriodStart
          ? new Date(data.currentPeriodStart)
          : currentDate,
        periodEnd: data.currentPeriodEnd
          ? new Date(data.currentPeriodEnd)
          : null,
        updatedAt: currentDate,
      })
      .where(eq(payment.subscriptionId, subscriptionId));

    const userId = await this.resolveUserId(data, fallbackUserId);
    if (userId) {
      const interval = this.mapCreemBillingPeriodToPlanInterval(
        data.billingPeriod
      );
      await this.updateUserToPaid(
        userId,
        interval,
        data.currentPeriodEnd ? new Date(data.currentPeriodEnd) : undefined
      );
    } else {
      console.warn(
        '[Creem legacy] subscription.paid: cannot resolve userId',
        subscriptionId
      );
    }
  }

  private async onSubscriptionCanceled(data: CreemWebhookData): Promise<void> {
    const subscriptionId = data.id;
    if (!subscriptionId) {
      console.warn('[Creem legacy] no subscription id in subscription.canceled');
      return;
    }
    console.log('[Creem legacy] subscription.canceled:', subscriptionId);

    const db = await getDb();
    const currentDate = new Date();
    const userId = await this.resolveUserId(data);

    await db
      .update(payment)
      .set({
        status: 'canceled',
        cancelAtPeriodEnd: true,
        updatedAt: currentDate,
      })
      .where(eq(payment.subscriptionId, subscriptionId));

    if (!userId) return;

    if (await this.hasOtherActivePayment(userId, subscriptionId)) {
      console.log(
        '[Creem legacy] skip downgrade — user has another active payment'
      );
      return;
    }

    const periodEnd = data.currentPeriodEnd
      ? new Date(data.currentPeriodEnd)
      : null;
    const periodStillActive = periodEnd
      ? periodEnd.getTime() > Date.now()
      : false;

    if (periodStillActive && periodEnd) {
      const interval = this.mapCreemBillingPeriodToPlanInterval(
        data.billingPeriod
      );
      await this.updateUserToPaid(userId, interval, periodEnd);
    } else {
      await db
        .update(user)
        .set({
          plan: PLAN_FREE,
          planTier: null,
          storageLimit: DEFAULT_STORAGE_LIMITS[PLAN_FREE],
          planExpiresAt: periodEnd,
          updatedAt: currentDate,
        })
        .where(eq(user.id, userId));
    }
  }

  private async onSubscriptionScheduledCancel(
    data: CreemWebhookData
  ): Promise<void> {
    const subscriptionId = data.id;
    if (!subscriptionId) {
      console.warn(
        '[Creem legacy] no subscription id in subscription.scheduled_cancel'
      );
      return;
    }
    console.log(
      '[Creem legacy] subscription.scheduled_cancel:',
      subscriptionId
    );

    const db = await getDb();
    await db
      .update(payment)
      .set({
        cancelAtPeriodEnd: true,
        updatedAt: new Date(),
      })
      .where(eq(payment.subscriptionId, subscriptionId));

    const userId = await this.resolveUserId(data);
    if (userId) {
      const interval = this.mapCreemBillingPeriodToPlanInterval(
        data.billingPeriod
      );
      await this.updateUserToPaid(
        userId,
        interval,
        data.currentPeriodEnd ? new Date(data.currentPeriodEnd) : undefined
      );
    }
  }

  private async onSubscriptionPastDue(data: CreemWebhookData): Promise<void> {
    const subscriptionId = data.id;
    if (!subscriptionId) {
      console.warn('[Creem legacy] no subscription id in subscription.past_due');
      return;
    }
    console.log('[Creem legacy] subscription.past_due:', subscriptionId);

    const db = await getDb();
    await db
      .update(payment)
      .set({
        status: 'past_due',
        updatedAt: new Date(),
      })
      .where(eq(payment.subscriptionId, subscriptionId));
  }

  private async onSubscriptionExpired(data: CreemWebhookData): Promise<void> {
    const subscriptionId = data.id;
    if (!subscriptionId) {
      console.warn('[Creem legacy] no subscription id in subscription.expired');
      return;
    }
    console.log('[Creem legacy] subscription.expired:', subscriptionId);

    const db = await getDb();
    const currentDate = new Date();
    const userId = await this.resolveUserId(data);

    await db
      .update(payment)
      .set({
        status: 'expired',
        updatedAt: currentDate,
      })
      .where(eq(payment.subscriptionId, subscriptionId));

    if (!userId) return;

    if (await this.hasOtherActivePayment(userId, subscriptionId)) {
      console.log(
        '[Creem legacy] skip downgrade on expire — user has another active payment'
      );
      return;
    }

    await db
      .update(user)
      .set({
        plan: PLAN_FREE,
        planTier: null,
        storageLimit: DEFAULT_STORAGE_LIMITS[PLAN_FREE],
        planExpiresAt: data.currentPeriodEnd
          ? new Date(data.currentPeriodEnd)
          : null,
        updatedAt: currentDate,
      })
      .where(eq(user.id, userId));
  }

  private async onRefundCreated(data: CreemWebhookData): Promise<void> {
    console.log('[Creem legacy] refund.created:', data.id);
    if (!data.invoiceId) return;

    const db = await getDb();
    await db
      .update(payment)
      .set({
        status: 'refunded',
        updatedAt: new Date(),
      })
      .where(eq(payment.invoiceId, data.invoiceId));
  }

  private async updateUserToPaid(
    userId: string,
    interval: PlanInterval,
    expiresAtFromCreem?: Date
  ): Promise<void> {
    const db = await getDb();

    let planExpiresAt = expiresAtFromCreem;
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

  private mapCreemBillingPeriodToPlanInterval(
    billingPeriod?: string
  ): PlanInterval {
    switch (billingPeriod) {
      case 'every-year':
      case 'yearly':
        return PlanIntervals.YEAR;
      case 'every-month':
      case 'monthly':
      default:
        return PlanIntervals.MONTH;
    }
  }
}

interface CreemWebhookEvent {
  type: string;
  data: CreemWebhookData;
}

interface CreemWebhookData {
  id?: string;
  customer?: { id: string };
  subscriptionId?: string;
  invoiceId?: string;
  productId?: string;
  billingPeriod?: string;
  expiresAt?: string;
  metadata?: Record<string, string>;
  userId?: string;
  customerId?: string;
  currentPeriodStart?: string;
  currentPeriodEnd?: string;
}
