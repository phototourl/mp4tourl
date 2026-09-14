# 订阅支付业务逻辑方案

> 创建时间：2026-03-23
> 最后更新：2026-05-23

---

## 一、现状分析

### 1.1 当前 Plan 配置

产品与定价定义：`src/config/website.tsx`（Creem `priceId`、金额）  
上传/存储/单文件上限实现：`src/lib/constants/plans.ts`（业务逻辑以代码为准）

```
对外展示名（i18n PricePlans）     配置 ID          plan / planTier        价格（USD）
────────────────────────────────────────────────────────────────────────────────────
Free                              free             free                   $0
Pro（月付）                       pro              paid + monthly         $9.90/月
Premium（年付，UI 名 Premium）    proYearly        paid + yearly          $94.90/年
```

**图片上传配额（与营销文案一致，供客服/开发对照）**

| 档位 | 每日上传次数 | 单文件上限 | 存储空间 |
|------|-------------|-----------|---------|
| 匿名（未登录） | 5 次/天 | 2MB | 100MB |
| 登录免费（未付费） | 10 次/天 | 2MB | 100MB |
| Pro 月付 | 1000 次/天 | 50MB | 100GB |
| Premium 年付 | 不限每日次数（代码 `0` = unlimited） | 256MB | 200GB |

文档/支付里仍用配置键名 `pro`、`proYearly`；面向用户的年付套餐在部分语言中显示为 **Premium**。

```typescript
// src/config/website.tsx（节选）
price: {
  plans: {
    free: { id: 'free', prices: [], isFree: true },
    pro: {
      id: 'pro',
      prices: [{
        type: 'subscription',
        priceId: process.env.NEXT_PUBLIC_CREEM_PRICE_ID_PRO_MONTHLY,
        amount: 990,
        interval: 'month',
      }],
      popular: true,
    },
    proYearly: {
      id: 'proYearly',
      prices: [{
        type: 'subscription',
        priceId: process.env.NEXT_PUBLIC_CREEM_PRICE_ID_PRO_YEARLY,
        amount: 9490,
        interval: 'year',
      }],
    },
  },
}
```

```typescript
// src/lib/constants/plans.ts（节选）
UPLOAD_LIMITS.free = 10
PAID_UPLOAD_LIMITS.monthly = 1000
PAID_UPLOAD_LIMITS.yearly = 0  // 0 = 每日上传不限
MAX_UPLOAD_FILE_BYTES_FREE = 2MB
MAX_UPLOAD_FILE_BYTES_MONTHLY = 50MB
MAX_UPLOAD_FILE_BYTES_YEARLY_PAID = 256MB
```

### 1.2 当前 User 表相关字段

```typescript
user.plan:        'free' | 'paid'
user.planTier:    'monthly' | 'yearly' | null
user.planExpiresAt: Date | null
user.customerId:  string | null  // Creem customer ID
```

### 1.3 当前 Payment 表相关字段

```typescript
payment.subscriptionId  // Creem subscription ID
payment.priceId        // Creem product ID
payment.status         // 'active' | 'canceled' | 'past_due' | 'expired' | ...
payment.periodStart    // 当前周期开始
payment.periodEnd      // 当前周期结束（订阅到期日）
payment.cancelAtPeriodEnd // 是否已申请取消（到期后生效）
```

### 1.4 已实现的 Webhook 事件处理

| 事件 | 处理 |
|------|------|
| `checkout.completed` | 创建 payment 记录，更新 user 为 paid |
| `subscription.active` | 更新 payment status = active |
| `subscription.paid` | 更新 payment 续期 |
| `subscription.canceled` | 更新 payment status = canceled，user → free |
| `subscription.scheduled_cancel` | 设置 cancelAtPeriodEnd = true |
| `subscription.past_due` | 更新 payment status = past_due |
| `subscription.expired` | 更新 payment status = expired，user → free |
| `refund.created` | 更新 payment status = refunded |

---

## 二、当前存在的问题

### 2.1 你发现的问题

| 问题 | 描述 |
|------|------|
| **只能升级不能降级** | 目前没有任何校验，理论上付费用户可以订阅任意 plan |
| **未到期不能重复购买** | 没有任何检查 |
| **购买后不能重复下单** | 没有任何检查 |

### 2.2 你没考虑到的问题

| 问题 | 描述 |
|------|------|
| **Period 重叠** | Monthly → Yearly 切换时，年费从哪天开始计算？ |
| **试用期满滥用** | 取消后重新订阅，能否再次获得试用？ |
| **订阅状态机不完整** | `trialing` / `paused` 状态没有处理 |
| **Lifetime 路径缺失** | 代码支持 `isLifetime` 但配置没有，未来如果上线 lifetime plan 逻辑不通 |
| **Checkout 无业务校验** | `/api/checkout` 只检查登录，不检查当前订阅状态 |
| **UI 按钮状态不准确** | pricing card 的 `isCurrentPlan` 只判断 planId 相等，不判断是否过期/取消 |

---

## 三、行业标准做法（参考 Stripe / Paddle / Lemon Squeezy / Creem）

### 3.1 升级 / 降级规则

| 场景 | 行业标准 |
|------|----------|
| **升级**（低→高） | **可立即生效**，按比例补差价（proration）；或在当前周期末生效 |
| **降级**（高→低） | **必须等到当前周期结束**才生效，平台不会主动退款 |
| **同 plan 续订** | 禁止，提示"已存在活跃订阅" |
| **跨 interval 切换**（月→年） | 算升级，可立即生效，按比例计算 |

### 3.2 防止重复购买

主流平台在产品级别有配置：

| 平台 | 设置 |
|------|------|
| **Paddle** | `Allow multiple subscriptions` 默认关闭 |
| **Stripe** | Customer Portal 可限制同一 product 只能有 1 个 active 订阅 |
| **Creem** | 每个 product 默认只能有 1 个活跃订阅 |

> 注意：平台层面保护不能替代业务层校验，仍需在 checkout 前做检查。

### 3.3 试用 period 防滥用

| 平台 | 做法 |
|------|------|
| **所有主流平台** | 每个 customer（按 email/customer_id）每个 product **只能试用一次** |
| **Stripe** | `trial_period_days` 在 product 上设置，同 customer 重复购买不会再次获得试用 |
| **Paddle / Creem** | Trial 结束的订阅，再次购买不会再有 trial |

### 3.4 订阅状态机

```
trialing → active → past_due → canceled/expired
             ↓
          paused
```

| 状态 | 含义 |
|------|------|
| `trialing` | 试用期间，免费或赠送 |
| `active` | 正常订阅，正常扣费 |
| `paused` | 暂停（某些平台支持） |
| `past_due` | 扣费失败，等待重试 |
| `canceled` | 已申请取消，订阅持续到周期末 |
| `expired` | 订阅到期，用户失去付费权益 |

### 3.5 Proration（按比例计费）

Stripe 的 `proration_behavior`：

| 设置 | 行为 |
|------|------|
| `create_prorations`（默认） | 立即生成按比例发票，升级时立即扣差价 |
| `always_invoice` | 同上，但强制立即出票 |
| `none` | 禁用按比例，降级/升级都在下个周期生效 |

**行业惯例**：升级立即生效（平台按比例算钱），降级等周期结束。

### 3.6 取消后重新订阅

| 场景 | 标准做法 |
|------|----------|
| 取消但未到期 | 订阅持续到周期末，到期后变 free |
| 取消后重新订阅 | **可以**，但不重新获得 trial |
| 退款后重新订阅 | 可以，但需人工审核 |

---

## 四、决策结果

### 4.1 Plan 层级定义

```
Tier 0: free / 未付费     — 10 次/天，2MB/文件（见 plans.ts）
Tier 1: pro（月付）        — 1000 次/天，50MB/文件，$9.90/月
Tier 2: proYearly（年付）  — 每日上传不限，256MB/文件，$94.90/年（UI：Premium）
```

### 4.2 操作矩阵

| 操作 | 允许？ | 条件 |
|------|--------|------|
| Free → Pro Monthly | ✅ 升级 | 无活跃订阅 |
| Free → Pro Yearly | ✅ 升级 | 无活跃订阅 |
| Pro Monthly → Pro Yearly | ✅ 升级 | 无活跃订阅（立即生效，proration） |
| Pro Yearly → Pro Monthly | ❌ 降级 | 不允许，必须等 year 到期后用户自行取消 |
| Pro Monthly → Free | ❌ 降级 | 不允许 |
| Pro Yearly → Free | ❌ 降级 | 不允许 |
| Pro Monthly → Pro Monthly | ❌ 重复购买 | 订阅未到期 |
| Pro Yearly → Pro Yearly | ❌ 重复购买 | 订阅未到期 |
| 取消后重新订阅（未到期） | ❌ | 取消只是申请，到期前还是原订阅 |
| 取消后重新订阅（已到期） | ✅ | 视为新购买 |

### 4.3 计费时机

| 场景 | 生效时间 | 说明 |
|------|----------|------|
| Free → Pro Monthly | 立即 | 立即扣费，开始计算周期 |
| Free → Pro Yearly | 立即 | 立即扣费，开始计算周期 |
| Pro Monthly → Pro Yearly | 立即 | 按比例计算月费已用部分，补差价 |
| Pro Yearly → Pro Monthly | 等 year 到期 | 不允许降级，到期后可购买 |

### 4.4 试用期规则

- 每个用户每个 product（plan）只能试用一次
- 由 Creem 平台默认处理
- 用户取消试用后，重新订阅不会再获得试用

### 4.5 Lifetime Plan（未来扩展）

Lifetime plan 是一个独立路径，不进入订阅状态机：

```
Lifetime Plan 逻辑：
  - 一次性付款，终身有效
  - 不存在"续费"概念
  - 不存在"订阅到期"
  - 独立存储，isLifetime = true
  - 与订阅并行存在（二选一）
```

---

## 五、技术实现方案

### 5.1 新增 Checkout 校验 API

```
POST /api/checkout/validate
Body: { priceId, planId }
Response: {
  allowed: boolean,
  reason?: 'already_subscribed' | 'downgrade_not_allowed' | 'subscription_not_expired' | 'already_owned',
  currentPlan?: { id, name, tier, status, expiresAt }
}
```

**校验逻辑**：

```typescript
async function validateCheckout(userId: string, targetPlanId: string) {
  const user = await getUser(userId);
  const activeSubscription = await getActiveSubscription(userId);
  const targetTier = PLAN_TIERS[targetPlanId]; // 0 | 1 | 2

  // 1. 无活跃订阅
  if (!activeSubscription) {
    return { allowed: true };
  }

  // 2. 重复订阅同一 plan
  if (activeSubscription.planId === targetPlanId) {
    if (activeSubscription.status === 'active' || activeSubscription.status === 'trialing') {
      return { allowed: false, reason: 'already_subscribed' };
    }
    // expired / canceled 的情况，允许当作新购买
    return { allowed: true };
  }

  // 3. 降级检查
  const currentTier = PLAN_TIERS[activeSubscription.planId];
  if (targetTier <= currentTier) {
    return { allowed: false, reason: 'downgrade_not_allowed' };
  }

  // 4. 升级不受限制（即使没到期也可以立即升级）
  return { allowed: true };
}
```

### 5.2 修改 /api/checkout

在创建 checkout 前调用 `validateCheckout`，拒绝不合法的购买请求。

```typescript
// /api/checkout/route.ts
const validateResult = await validateCheckout(session.user.id, planId);
if (!validateResult.allowed) {
  return NextResponse.json(
    { error: validateResult.reason, message: getErrorMessage(validateResult.reason) },
    { status: 400 }
  );
}
```

### 5.3 Pricing Card UI 按钮状态

```typescript
type ButtonState =
  | 'login'        // 未登录
  | 'current'      // 当前有效订阅
  | 'resubscribe'  // 订阅已过期，可以续费（同一plan）
  | 'upgrade'      // 可以升级
  | 'upgrade_blocked'    // 有活跃订阅但不允许升级（理论上不存在，因为只能升）
  | 'downgrade_blocked'  // 降级被禁止
  | 'subscribe';   // 可以新订阅

function getButtonState(currentUser, plan, activeSubscription): ButtonState {
  if (!currentUser) return 'login';
  if (plan.isFree) return 'subscribe';

  const isCurrentPlan = activeSubscription?.planId === plan.id;
  const isActive = activeSubscription?.status === 'active' || activeSubscription?.status === 'trialing';
  const isExpired = activeSubscription?.status === 'expired' || activeSubscription?.status === 'canceled';
  const currentTier = activeSubscription ? PLAN_TIERS[activeSubscription.planId] : 0;
  const targetTier = PLAN_TIERS[plan.id];

  if (isCurrentPlan && isActive) return 'current';
  if (isCurrentPlan && isExpired) return 'resubscribe';
  if (targetTier > currentTier) return 'upgrade';
  if (targetTier < currentTier) return 'downgrade_blocked';
  if (activeSubscription && !isExpired) return 'subscribe_blocked';

  return 'subscribe';
}
```

**各状态按钮文案**：

| State | Button Text |
|-------|-------------|
| `login` | "Sign In to Subscribe" |
| `current` | "Current Plan" (disabled) |
| `resubscribe` | "Renew" |
| `upgrade` | "Upgrade" / "Get Started" |
| `downgrade_blocked` | "Downgrade Not Available" |
| `subscribe_blocked` | "Already Subscribed" |
| `subscribe` | "Get Started" |

### 5.4 订阅状态处理完善

**新增 `trialing` 状态处理**：

```typescript
// Creem webhook: subscription.trialing
private async onSubscriptionTrialing(data: CreemWebhookData) {
  await db.update(payment).set({ status: 'trialing', ... }).where(...);
  // trialing 期间用户享受付费权益
}
```

**完善 `paused` 状态处理**（如果 Creem 支持）：

```typescript
// Creem webhook: subscription.paused
private async onSubscriptionPaused(data: CreemWebhookData) {
  await db.update(payment).set({ status: 'paused', ... }).where(...);
  // 暂停期间用户权益是否保留？—— 通常暂停期间不扣费，权益暂停
}
```

### 5.5 Lifetime Plan 扩展（如未来需要）

```typescript
// user 表新增字段
user.isLifetime: boolean = false
user.lifetimePlanId: string | null

// payment 表新增 scene
payment.scene: 'subscription' | 'lifetime' | 'credit'

// Lifetime 购买流程：
// 1. checkout 流程不变
// 2. webhook: checkout.completed，判断 scene = 'lifetime'
// 3. 更新 user: isLifetime = true, lifetimePlanId = plan.id
// 4. 不设置 planExpiresAt（终身有效）
// 5. 不存在续费，不存在降级
```

---

## 六、Creem 平台侧配置建议

### 6.1 产品配置

在 Creem Dashboard 中：

1. **Pro Monthly**：
   - `billing_type`: recurring
   - `billing_period`: every-month
   - 禁止同一 customer 多次购买（Creem 默认行为）

2. **Pro Yearly**：
   - `billing_type`: recurring
   - `billing_period`: every-year
   - 同上

3. **Trial**：
   - 如果要开启试用，在产品上设置 `trial_period_days: 7` 或 `14`
   - Creem 会自动保证每个 customer 只能试用一次

### 6.2 Webhook 事件配置

确保 Creem Dashboard 中开启以下 webhook events：

- [x] `checkout.completed`
- [x] `subscription.active`
- [x] `subscription.paid`
- [x] `subscription.canceled`
- [x] `subscription.scheduled_cancel`
- [x] `subscription.past_due`
- [x] `subscription.expired`
- [x] `refund.created`
- [ ] `subscription.trialing`（如使用 trial）
- [ ] `subscription.paused`（如支持）

---

## 七、错误文案（需翻译到 i18n）

| reason | 中文错误提示 |
|--------|-------------|
| `already_subscribed` | "您已订阅此计划，当前订阅尚未到期" |
| `downgrade_not_allowed` | "此计划暂不支持降级，请等待当前订阅到期后再试" |
| `subscription_not_expired` | "当前订阅尚未到期，如需变更请联系支持" |
| `already_owned` | "您已拥有此计划" |

---

## 八、实施优先级

| 优先级 | 任务 | 预计工作量 |
|--------|------|----------|
| P0 | 新增 `/api/checkout/validate` 校验 API | 2h |
| P0 | 在 `/api/checkout` 调用校验，拦截不合法的购买 | 1h |
| P0 | 完善 Creem webhook 处理（trialing / paused） | 1h |
| P1 | Pricing Card UI 按钮状态完善 | 2h |
| P1 | 过期订阅续费逻辑（resubscribe） | 1h |
| P2 | Lifetime plan 路径扩展（如未来需要） | - |
| P3 | Creem Dashboard 产品配置确认 | 0.5h |

---

## 九、测试用例

| # | 场景 | 预期结果 |
|---|------|----------|
| 1 | Free 用户点击 Pro Monthly | ✅ 跳转 checkout |
| 2 | Free 用户点击 Pro Yearly | ✅ 跳转 checkout |
| 3 | Pro Monthly 用户点击 Pro Monthly（未到期） | ❌ 提示"已订阅" |
| 4 | Pro Monthly 用户点击 Pro Yearly | （未到期） |
| 5 | Pro Monthly 用户点击 Free | ❌ 提示"降级不可用" |
| 6 | Pro Yearly 用户点击 Pro Monthly | ❌ 提示"降级不可用" |
| 7 | Pro Monthly 用户点击 Pro Yearly（pro 已过期） | ✅ 跳转 checkout（新购买） |
| 8 | Pro Monthly 用户（已取消，到期前）点击 Pro Yearly | ❌ 提示"当前订阅尚未到期" |
| 9 | 未登录用户点击任意付费 plan | 跳转登录页 |
| 10 | Pro Monthly 用户订阅过期后点击续费 | ✅ 跳转 checkout |

---

## 十、参考文档

- [Stripe: Subscription Upgrades and Downgrades](https://docs.stripe.com/billing/subscriptions/upgrades-downgrades)
- [Stripe: Prorations](https://docs.stripe.com/billing/subscriptions/prorations)
- [Stripe: Subscription Trial Periods](https://docs.stripe.com/billing/subscriptions/trial)
- [Creem Webhooks Documentation](https://docs.creem.io/code/webhooks)
- [Lemon Squeezy: Subscription API](https://docs.lemonsqueezy.com/api/subscriptions)
