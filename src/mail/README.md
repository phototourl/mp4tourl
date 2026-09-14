# Mail (Resend)

Transactional email via Resend + React Email templates.

## Templates (`src/mail/templates/`)

- `verify-email.tsx`
- `forgot-password.tsx`
- `contact-message.tsx`

Registered in `src/mail/types.ts` → `EmailTemplates`.

## Usage

```ts
await sendEmail({
  to: user.email,
  template: 'verifyEmail',
  context: { url, name },
  locale,
});
```

Dev preview: `pnpm email` (port 3333).
