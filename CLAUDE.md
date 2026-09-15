# CLAUDE.md

Guidance for working in the MP4toURL repository (`mp4tourl.com`).

## Development Commands

- `pnpm dev` — Start development server
- `pnpm build` — Production build
- `pnpm start` — Start production server
- `pnpm lint` — Biome linter
- `pnpm format` — Format with Biome

### Database (Drizzle + MySQL)

- `pnpm db:generate` — Generate migrations from schema
- `pnpm db:migrate` — Apply migrations
- `pnpm db:push` — Sync schema (dev)
- `pnpm db:studio` — Drizzle Studio

### Content and Email

- `pnpm content` — Process MDX content collections
- `pnpm email` — Email template preview (port 3333)

## Product

**MP4toURL** — upload a video, get a permanent CDN shareable link (MP4 / MOV / AVI / WebM / MKV). Free tier up to 100MB. Primary domain: `https://mp4tourl.com`.

## Stack

- Next.js (App Router) + next-intl (42 locales under `messages/`)
- MySQL via Drizzle (`mysql2`, `DB_*` env vars) — bootstrap: `sql/mp4tourl.sql`; anon uploads: `sql/seed-anonymous-user.sql`
- Better Auth (Google / credentials; MySQL adapter)
- Stripe payments
- Cloudflare R2 storage (`R2_*`, free uploads under `video/free/`)
- Resend for transactional email

## Key paths

- `src/app/` — App Router (locale-aware)
- `src/components/` — UI and marketing blocks
- `src/config/` — Website / DB config
- `src/db/` — Schema and client
- `src/lib/constants/anonymous-upload.ts` — fixed anon user id for guest video rows
- `src/mail/` — Email templates
- `src/payment/` — Stripe
- `messages/` — All locale packs (update all 42 together for user-facing copy)

## Notes

- Prefer product name **MP4toURL** in copy (keep the brand untranslated in all locales, including zh / zh-TW).
- Do not invent third-party template / boilerplate branding in UI or docs.
- Do not overwrite `sql/mp4tourl.sql` unless the user asks.
- Video uploads (logged-in + anonymous) are saved to `user_file` after R2 upload. Anonymous rows use `ANON_DB_USER_ID`.
