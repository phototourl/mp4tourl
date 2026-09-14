import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { getDb } from '@/db/index';
import { LOCALE_COOKIE_NAME, routing, type AppLocale } from '@/i18n/routing';
import { sendResetPasswordEmail } from '@/mail/send-reset-password';
import { getBaseUrl, getUrlWithLocaleInCallbackUrl } from './urls';

/**
 * Better Auth configuration
 *
 * docs:
 * https://www.better-auth.com/docs/reference/options
 */

let authInstance: any = null;

export async function getAuth() {
	if (authInstance) return authInstance;

	const db = await getDb();
	authInstance = betterAuth({
		baseURL: getBaseUrl(),
		database: drizzleAdapter(db, {
			provider: 'mysql',
			transaction: true,
		}),
		trustedOrigins: [
			'http://localhost:3000',
			'https://mp4tourl.com',
			'https://www.mp4tourl.com',
		],
		session: {
			cookieCache: {
				enabled: true,
				maxAge: 60 * 60,
			},
			expiresIn: 60 * 60 * 24 * 7,
			updateAge: 60 * 60 * 24,
			freshAge: 0,
		},
		emailAndPassword: {
			enabled: true,
			requireEmailVerification: false,
			// https://www.better-auth.com/docs/authentication/email-password#forget-password
			async sendResetPassword({ user, url }, request) {
				const locale = getLocaleFromRequest(request);
				const localizedUrl = getUrlWithLocaleInCallbackUrl(url, locale);
				const sent = await sendResetPasswordEmail({
					to: user.email,
					name: user.name || user.email,
					url: localizedUrl,
					locale,
				});
				// better-auth 默认仍返回成功；发信失败必须抛错，否则前端误以为已发出
				if (!sent) {
					throw new Error('Failed to send password reset email');
				}
			},
		},
		emailVerification: {
			autoSignInAfterVerification: true,
		},
		socialProviders: {
			google: {
				clientId: process.env.GOOGLE_CLIENT_ID!,
				clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
			},
		},
		account: {
			accountLinking: {
				enabled: true,
				trustedProviders: ['google'],
			},
		},
		user: {
			deleteUser: {
				enabled: true,
			},
			additionalFields: {
				userType: {
					type: 'string',
					required: false,
					input: true,
					returned: true,
				},
			},
		},
		onAPIError: {
			errorURL: '/auth/error',
			onError: (error, ctx) => {
				console.error('auth error:', error);
			},
		},
	});
	return authInstance;
}

function parseCookies(cookieHeader: string): Record<string, string> {
	const out: Record<string, string> = {};
	for (const part of cookieHeader.split(';')) {
		const idx = part.indexOf('=');
		if (idx === -1) continue;
		const key = part.slice(0, idx).trim();
		const value = part.slice(idx + 1).trim();
		if (key) out[key] = decodeURIComponent(value);
	}
	return out;
}

export function getLocaleFromRequest(request?: Request): AppLocale {
	const cookies = parseCookies(request?.headers.get('cookie') ?? '');
	const raw = cookies[LOCALE_COOKIE_NAME];
	if (raw && (routing.locales as readonly string[]).includes(raw)) {
		return raw as AppLocale;
	}
	return routing.defaultLocale as AppLocale;
}
