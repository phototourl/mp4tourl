import { websiteConfig } from '@/config/website';
import { getMessagesForLocale } from '@/i18n/messages';
import { routing, type AppLocale } from '@/i18n/routing';

type SendResetPasswordParams = {
  to: string;
  name: string;
  url: string;
  locale?: string;
};

function isAppLocale(value: string): value is AppLocale {
  return (routing.locales as readonly string[]).includes(value);
}

/**
 * Send password-reset email via Resend HTTP API (no extra npm dependency).
 * From address: websiteConfig.mail.fromEmail ← RESEND_FROM_EMAIL.
 */
export async function sendResetPasswordEmail({
  to,
  name,
  url,
  locale = routing.defaultLocale,
}: SendResetPasswordParams): Promise<boolean> {
  // 动态读取，避免构建期未注入时被 Next 内联成 undefined
  const apiKey = process.env['RESEND_API_KEY'];
  if (!apiKey) {
    console.error('[mail] RESEND_API_KEY is not set');
    return false;
  }

  const from =
    process.env['RESEND_FROM_EMAIL'] ||
    websiteConfig.mail.fromEmail ||
    'MP4toURL <support@mp4tourl.com>';

  const resolvedLocale = isAppLocale(locale) ? locale : routing.defaultLocale;
  const messages = await getMessagesForLocale(resolvedLocale);
  const mail = (messages as Record<string, unknown>).Mail as
    | {
        common?: { team?: string; copyright?: string };
        forgotPassword?: {
          title?: string;
          body?: string;
          resetPassword?: string;
          subject?: string;
        };
      }
    | undefined;
  const common = (messages as Record<string, unknown>).common as
    | { siteName?: string }
    | undefined;

  const siteName = common?.siteName || 'MP4 to URL';
  const fp = mail?.forgotPassword || {};
  const subject =
    fp.subject || `Reset your ${siteName} password`;
  const title = (fp.title || 'Hi, {name}.').replace('{name}', name || 'there');
  const body =
    fp.body ||
    'Click the button below to reset your password.';
  const buttonLabel = fp.resetPassword || 'Reset password';
  const team = (mail?.common?.team || '{name} Team').replace(
    '{name}',
    siteName
  );
  const copyright = (
    mail?.common?.copyright || '©️ {year} All Rights Reserved.'
  ).replace('{year}', String(new Date().getFullYear()));

  const html = `<!DOCTYPE html>
<html lang="${resolvedLocale}">
<body style="margin:0;padding:24px;background:#f8fafc;font-family:system-ui,-apple-system,Segoe UI,Roboto,Arial,sans-serif;color:#0f172a;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:520px;margin:0 auto;background:#ffffff;border:1px solid #e2e8f0;border-radius:12px;padding:28px;">
    <tr><td>
      <p style="margin:0 0 12px;font-size:16px;font-weight:600;">${escapeHtml(title)}</p>
      <p style="margin:0 0 20px;font-size:14px;line-height:1.6;color:#475569;">${escapeHtml(body)}</p>
      <p style="margin:0 0 24px;">
        <a href="${escapeAttr(url)}" style="display:inline-block;background:#0abab5;color:#ffffff;text-decoration:none;font-size:14px;font-weight:600;padding:12px 18px;border-radius:8px;">${escapeHtml(buttonLabel)}</a>
      </p>
      <p style="margin:0 0 8px;font-size:12px;line-height:1.5;color:#94a3b8;word-break:break-all;">${escapeHtml(url)}</p>
      <hr style="border:none;border-top:1px solid #e2e8f0;margin:24px 0;" />
      <p style="margin:0 0 4px;font-size:12px;color:#64748b;">${escapeHtml(team)}</p>
      <p style="margin:0;font-size:12px;color:#94a3b8;">${escapeHtml(copyright)}</p>
    </td></tr>
  </table>
</body>
</html>`;

  const text = `${title}\n\n${body}\n\n${url}\n\n${team}\n${copyright}`;

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from,
        to: [to],
        subject,
        html,
        text,
      }),
    });

    if (!res.ok) {
      const errText = await res.text().catch(() => '');
      console.error('[mail] Resend error', res.status, errText);
      return false;
    }
    return true;
  } catch (error) {
    console.error('[mail] Failed to send reset password email:', error);
    return false;
  }
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function escapeAttr(value: string): string {
  return escapeHtml(value).replace(/'/g, '&#39;');
}
