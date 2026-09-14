# Payment (Stripe)

mp4tourl uses Stripe for subscriptions and lifetime (one-time) purchases.

## Key paths

- `src/payment/provider/stripe.ts` — checkout, webhooks, portal
- `src/payment/index.ts` — provider facade (`createCheckout`, portal, etc.)
- `src/app/api/webhooks/stripe/route.ts` — webhook entry
- `src/components/pricing/customer-portal-button.tsx` — billing portal CTA
- `src/components/settings/billing/` — current plan UI
- `src/actions/get-current-plan.ts` — resolve plan from `payment` rows

## Scenes

- `subscription` — recurring plans
- `lifetime` — one-time lifetime unlock

Credits packages are not used.

## Notes

Checkout UI / pricing page is not wired yet. Existing subscribers manage billing via the Stripe Customer Portal. When adding a pricing page, call `createCheckout` from a server action and set Stripe price IDs in env (`NEXT_PUBLIC_STRIPE_PRICE_*`).
