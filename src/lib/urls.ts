import { routing, type AppLocale } from '@/i18n/routing';

/**
 * Get the base URL for the application
 */
export function getBaseUrl() {
	if (process.env.NEXT_PUBLIC_BASE_URL) {
		return process.env.NEXT_PUBLIC_BASE_URL;
	}
	if (process.env.NEXT_PUBLIC_SITE_URL) {
		return process.env.NEXT_PUBLIC_SITE_URL;
	}
	if (process.env.VERCEL_URL) {
		return `https://${process.env.VERCEL_URL}`;
	}
	return 'http://localhost:3000';
}

export function shouldAppendLocale(locale?: string | null): boolean {
	return (
		!!locale &&
		locale !== routing.defaultLocale &&
		locale !== 'default' &&
		(routing.locales as readonly string[]).includes(locale)
	);
}

/**
 * Adds locale to the callbackURL query param in better-auth reset/verify links.
 * Supports relative (`/auth/reset-password`) and absolute callback URLs.
 */
export function getUrlWithLocaleInCallbackUrl(
	url: string,
	locale: AppLocale | string
): string {
	if (!shouldAppendLocale(locale)) {
		return url;
	}

	try {
		const parsed = new URL(url);
		const callbackURL = parsed.searchParams.get('callbackURL');
		if (!callbackURL) return url;

		const localizedCallback = localizeCallbackPath(callbackURL, locale);
		if (localizedCallback === callbackURL) return url;

		parsed.searchParams.set('callbackURL', localizedCallback);
		return parsed.toString();
	} catch {
		return url;
	}
}

function localizeCallbackPath(callbackURL: string, locale: string): string {
	// Absolute URL: localize pathname only, keep origin
	if (
		callbackURL.startsWith('http://') ||
		callbackURL.startsWith('https://')
	) {
		try {
			const cb = new URL(callbackURL);
			if (
				cb.pathname.startsWith(`/${locale}/`) ||
				cb.pathname === `/${locale}`
			) {
				return callbackURL;
			}
			cb.pathname = `/${locale}${cb.pathname.startsWith('/') ? '' : '/'}${cb.pathname}`;
			// better-auth expects relative callback; prefer path+search
			return `${cb.pathname}${cb.search}`;
		} catch {
			return callbackURL;
		}
	}

	if (
		callbackURL.startsWith(`/${locale}/`) ||
		callbackURL === `/${locale}`
	) {
		return callbackURL;
	}

	return callbackURL.startsWith('/')
		? `/${locale}${callbackURL}`
		: `/${locale}/${callbackURL}`;
}
