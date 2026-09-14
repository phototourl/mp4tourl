# Payment Integration (main-Waffo)

Primary checkout / billing: **Waffo Pancake**.

## Structure

```
src/payment/
├── index.ts                         # WaffoProvider (new checkouts)
├── types.ts
├── README.md
└── provider/
    ├── waffo.ts                     # Waffo checkout + webhooks
    └── creem-legacy-webhook.ts      # Creem renewals only (no checkout)
```

## Webhook URLs

| Provider | URL | Purpose |
|----------|-----|---------|
| Waffo | `https://phototourl.com/api/webhooks/waffo` | New payments |
| Creem (legacy) | `https://phototourl.com/api/webhooks/creem` | Old subscription renewals / cancel / expire |

Routes do not share secrets or providers — no conflict.

## Environment

```env
# Waffo (required for new payments)
WAFFO_MERCHANT_ID=
WAFFO_STORE_ID=
WAFFO_PRIVATE_KEY=
WAFFO_ENVIRONMENT=test

# Creem legacy renewals (required so /api/webhooks/creem works)
CREEM_WEBHOOK_SECRET=whsec_xxxxxxxx
```

`CREEM_API_KEY` / Creem price IDs are **not** needed on main-Waffo (checkout stays Waffo).

## Creem legacy events

- `subscription.paid` — renewal → extend `plan` / `planExpiresAt`
- `subscription.active` / `scheduled_cancel` / `past_due` / `canceled` / `expired`
- `checkout.completed` — late retries for old Creem checkouts
- Cancel/expire will **not** downgrade if the user still has another `active` payment (e.g. Waffo)
