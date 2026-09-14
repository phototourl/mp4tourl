# Creem 支付对接文档

## 1. 概述

Creem 是一款面向 SaaS 和独立开发者的支付平台（Merchant of Record），类似 Lemon Squeezy、Paddle。

**关键优势：**
- 无需注册美国公司即可销售
- 自动处理税务合规
- 支持订阅（年付/月付）和一次性付款
- 内置退款和争议处理

---

## 2. 技术架构

### 2.1 核心概念

| 概念 | 说明 |
|------|------|
| **Product** | 产品/订阅计划（如 "Pro 年付"、"Free 试用"） |
| **Checkout** | 结账会话，创建后重定向到 Creem 托管的结账页 |
| **Subscription** | 订阅实例，关联客户和产品 |
| **Webhook** | 支付事件通知，用于同步本地用户权限 |
| **Customer** | 客户信息（邮箱、ID 等） |

### 2.2 环境

| 环境 | API Key 前缀 | 说明 |
|------|-------------|------|
| **Test（沙盒）** | `creem_test_` | 测试环境，不真实扣款 |
| **Production** | `creem_live_` | 正式环境 |

用户提供的年付链接：测试环境
```
Product ID: prod_6wwG7LdhqhiSCXmlYLfeOP
Checkout ID: ch_4ulrWkvueEoN9uQE0zEEUE
```

---

## 3. 环境变量

```env
# Creem API Keys
CREEM_API_KEY=creem_test_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
CREEM_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# 环境切换：0=生产, 1=测试
CREEM_SERVER_IDX=1
```

---

## 4. SDK 安装

```bash
npm install creem
npm install @creem_io/nextjs  # Next.js 专用，包含 Webhook 路由
```

---

## 5. 订阅计划设计（PhotoToURL）

### 5.1 产品配置

| Plan | 类型 | 定价 | Product ID |
|------|------|------|------------|
| Free | 订阅 | $0 | - |
| Pro 年付 | 订阅 | $XX/year | `prod_xxxxxxxxxxxxx`（待创建） |
| Pro 月付 | 订阅 | $XX/month | `prod_xxxxxxxxxxxxx`（待创建） |

### 5.2 产品创建（CLI）

```bash
# 年付产品
creem products create \
  --name "Pro Yearly" \
  --price 9900 \
  --currency USD \
  --billing-type recurring \
  --billing-period every-year

# 月付产品
creem products create \
  --name "Pro Monthly" \
  --price 990 \
  --currency USD \
  --billing-type recurring \
  --billing-period every-month
```

---

## 6. 结账流程

### 6.1 创建 Checkout（点击购买按钮时）

```typescript
// lib/creem.ts
import { Creem } from 'creem';

const creem = new Creem({
  apiKey: process.env.CREEM_API_KEY!,
  serverIdx: process.env.CREEM_SERVER_IDX === '1' ? 1 : 0,
});

export async function createCheckout(productId: string, userId: string) {
  const checkout = await creem.checkouts.create({
    productId,
    successUrl: `${process.env.NEXT_PUBLIC_BASE_URL}/dashboard?upgrade=success`,
    cancelUrl: `${process.env.NEXT_PUBLIC_BASE_URL}/settings/billing?upgrade=cancelled`,
    metadata: {
      userId,  // 关键：关联用户
    },
  });

  return checkout;
}
```

### 6.2 跳转结账页

```typescript
// 组件中
const handleUpgrade = async () => {
  const checkout = await createCheckout('prod_xxxxxxxxxxxxx', user.id);
  window.location.href = checkout.checkoutUrl;
};
```

---

## 7. Webhook 事件处理

### 7.1 可用事件

| 事件 | 触发时机 |
|------|---------|
| `checkout.completed` | Checkout 完成（一次性付款） |
| `subscription.active` | 订阅激活（支付成功） |
| `subscription.paid` | 订阅续费成功 |
| `subscription.canceled` | 订阅取消 |
| `subscription.scheduled_cancel` | 订阅计划到期取消 |
| `subscription.past_due` | 支付失败 |
| `subscription.expired` | 订阅过期 |
| `refund.created` | 退款 |

### 7.2 Webhook 处理（Next.js）

```typescript
// app/api/webhook/creem/route.ts
import { Webhook } from '@creem_io/nextjs';
import { db } from '@/db';
import { payment, user } from '@/db/schema';
import { eq } from 'drizzle-orm';

export const POST = Webhook({
  webhookSecret: process.env.CREEM_WEBHOOK_SECRET!,

  // Checkout 完成 → 创建支付记录
  onCheckoutCompleted: async ({ customer, checkout, metadata }) => {
    const userId = metadata?.userId as string;
    if (!userId) return;

    await db.insert(payment).values({
      id: crypto.randomUUID(),
      priceId: checkout.productId,
      type: 'subscription',
      scene: 'subscription',
      interval: checkout.billingPeriod, // 'month' | 'year'
      userId,
      customerId: customer.id,
      subscriptionId: checkout.subscriptionId,
      sessionId: checkout.id,
      invoiceId: checkout.invoiceId,
      status: 'active',
      paid: true,
      periodStart: new Date(),
      periodEnd: checkout.expiresAt ? new Date(checkout.expiresAt) : null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    // 更新用户权限
    await db.update(user)
      .set({ plan: 'paid', planTier: checkout.billingPeriod })
      .where(eq(user.id, userId));
  },

  // 订阅激活 → 更新支付记录
  onSubscriptionActive: async ({ customer, subscription, metadata }) => {
    const userId = metadata?.userId as string;
    if (!userId) return;

    await db.update(payment)
      .set({
        status: 'active',
        periodStart: new Date(subscription.currentPeriodStart),
        periodEnd: new Date(subscription.currentPeriodEnd),
        updatedAt: new Date(),
      })
      .where(eq(payment.subscriptionId, subscription.id));
  },

  // 订阅取消 → 标记取消
  onSubscriptionCanceled: async ({ customer, subscription, metadata }) => {
    const userId = metadata?.userId as string;

    await db.update(payment)
      .set({
        status: 'canceled',
        cancelAtPeriodEnd: true,
        updatedAt: new Date(),
      })
      .where(eq(payment.subscriptionId, subscription.id));

    // 降级用户（等到期后）
    if (userId) {
      await db.update(user)
        .set({ plan: 'free' })
        .where(eq(user.id, userId));
    }
  },

  // 订阅过期 → 彻底降级
  onSubscriptionExpired: async ({ customer, subscription, metadata }) => {
    const userId = metadata?.userId as string;

    await db.update(payment)
      .set({
        status: 'expired',
        updatedAt: new Date(),
      })
      .where(eq(payment.subscriptionId, subscription.id));

    if (userId) {
      await db.update(user)
        .set({ plan: 'free' })
        .where(eq(user.id, userId));
    }
  },
});
```

### 7.3 Webhook 签名验证（手动实现）

```typescript
import crypto from 'crypto';

function verifyWebhookSignature(payload: string, signature: string, secret: string): boolean {
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex');

  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature)
  );
}
```

---

## 8. 用户权限同步

### 8.1 现有数据库字段

`user` 表已有相关字段：

| 字段 | 类型 | 说明 |
|------|------|------|
| `customer_id` | VARCHAR(255) | Creem 客户 ID |
| `creem_subscription_id` | VARCHAR(255) | Creem 订阅 ID（新增索引） |
| `plan` | VARCHAR(50) | 'free' \| 'paid' |
| `plan_tier` | VARCHAR(20) | 'monthly' \| 'yearly' |
| `plan_expires_at` | TIMESTAMP | 付费计划到期时间 |

### 8.2 payment 表（与模板一致）

```sql
CREATE TABLE payment (
  id VARCHAR(255) PRIMARY KEY,              -- Payment ID (UUID)
  price_id VARCHAR(255) NOT NULL,          -- Creem Product Price ID
  type VARCHAR(50) NOT NULL,                 -- 'subscription' | 'one_time'
  scene VARCHAR(50),                         -- 'subscription' (Creem only uses subscription)
  interval VARCHAR(20),                      -- 'month' | 'year'
  user_id VARCHAR(255) NOT NULL,             -- 用户ID
  customer_id VARCHAR(255) NOT NULL,         -- Creem Customer ID
  subscription_id VARCHAR(255),             -- Creem 订阅 ID
  session_id VARCHAR(255),                   -- Creem Checkout Session ID
  invoice_id VARCHAR(255) UNIQUE,            -- Creem Invoice ID (防重复)
  status VARCHAR(50) NOT NULL,              -- 'active' | 'canceled' | 'past_due' | 'expired'
  paid BOOLEAN NOT NULL DEFAULT FALSE,     -- 是否已支付
  period_start TIMESTAMP,                    -- 订阅周期开始
  period_end TIMESTAMP,                      -- 订阅周期结束
  cancel_at_period_end BOOLEAN,              -- 是否取消但到期前继续
  trial_start TIMESTAMP,                     -- 试用开始
  trial_end TIMESTAMP,                      -- 试用结束
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX payment_user_id_idx(user_id),
  INDEX payment_subscription_id_idx(subscription_id),
  INDEX payment_status_idx(status)
);
```

### 8.3 订阅状态查询

```typescript
// 获取用户当前订阅状态
async function getSubscription(customerId: string) {
  const subscriptions = await creem.subscriptions.list({
    customerId,
  });
  return subscriptions.data[0]; // 当前活跃订阅
}
```

---

## 9. 升级/降级策略

### 9.1 升级（年付 → 月付 或 月付 → 年付）

```typescript
// Creem Dashboard 操作或 API
await creem.subscriptions.update(subscriptionId, {
  productId: newProductId,
});
```

### 9.2 取消策略

用户在 Creem Dashboard 或产品内取消后：
1. Webhook 触发 `subscription.scheduled_cancel`
2. 订阅保持到本期结束
3. 到期后触发 `subscription.expired`
4. 我们降级用户权限

---

## 10. 业务场景

### 10.1 用户点击升级按钮
```
用户点击"升级" → 创建 Checkout → 跳转 Creem 结账页 → 支付成功 → Webhook 触发 → 更新用户 plan
```

### 10.2 用户取消订阅
```
用户取消 → Creem 标记取消 → 本期结束 → Webhook.subscription.expired → 降级为 Free
```

### 10.3 支付失败
```
Webhook.subscription.past_due → 发送邮件提醒 → 用户重新支付 → 恢复订阅
```

---

## 11. 测试流程

1. 使用 `creem_test_` API Key
2. 在 Creem Dashboard 设置 Webhook 调试
3. 使用测试卡号（Creem 提供）完成支付
4. 验证 Webhook 触发和用户权限更新

---

## 12. 待办事项

- [x] 数据库表设计（`payment` 表，与模板一致）
- [ ] 在 Creem Dashboard 创建 Pro 年付产品（Product ID）
- [ ] 在 Creem Dashboard 创建 Pro 月付产品（Product ID）
- [ ] 配置 Webhook URL（生产环境）
- [ ] 实现 `payment/provider/creem.ts` Provider
- [ ] 实现 Webhook API 路由
- [ ] 实现 Checkout 创建逻辑
- [ ] 添加升级按钮 UI
- [ ] 测试完整流程

---

## 13. 参考资料

- Creem 文档：https://docs.creem.io
- Creem SDK：https://www.npmjs.com/package/creem
- Creem Next.js：https://www.npmjs.com/package/@creem_io/nextjs
