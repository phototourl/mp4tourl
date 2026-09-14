import { betterFetch } from '@better-fetch/fetch';
import createMiddleware from 'next-intl/middleware';
import { type NextRequest, NextResponse } from 'next/server';
import {
	LOCALES,
	routing,
	type AppLocale,
} from './i18n/routing';
import type { Session } from './lib/auth-types';
import { getBaseUrl } from './lib/urls';
import { protectedRoutes as appProtectedRoutes } from './routes';
import nextIntlConfig from '../next-intl.config';

const intlMiddleware = createMiddleware(routing);

/**
 * Routes that logged-in users cannot access (redirect to dashboard)
 */
const routesNotAllowedByLoggedInUsers = ['/auth/login', '/auth/register'];

const isDev = process.env.NODE_ENV === 'development';

export default async function middleware(req: NextRequest) {
	const { nextUrl } = req;
	if (isDev) {
		console.log('>> middleware start, pathname', nextUrl.pathname);
	}

	// Skip API routes
	if (nextUrl.pathname.startsWith('/api')) {
		if (isDev) console.log('<< middleware end, skipping API route');
		return NextResponse.next();
	}

	const pathnameWithoutLocale = getPathnameWithoutLocale(
		nextUrl.pathname,
		[...LOCALES]
	);

	const isAuthRoute = routesNotAllowedByLoggedInUsers.some((route) =>
		new RegExp(`^${route}$`).test(pathnameWithoutLocale)
	);
	const isProtectedRoute = appProtectedRoutes.some((route) =>
		new RegExp(`^${route}$`).test(pathnameWithoutLocale)
	);

	const hasSessionCookie = hasBetterAuthSessionCookie(req);

	// 受保护路由：无会话 cookie 直接重定向，避免额外网络请求导致导航卡顿
	if (isProtectedRoute && !hasSessionCookie) {
		let callbackUrl = nextUrl.pathname;
		if (nextUrl.search) {
			callbackUrl += nextUrl.search;
		}
		const encodedCallbackUrl = encodeURIComponent(callbackUrl);
		if (isDev) {
			console.log('<< middleware end, no session cookie, redirecting to login, callbackUrl', callbackUrl);
		}
		return NextResponse.redirect(
			new URL(`/auth/login?callbackUrl=${encodedCallbackUrl}`, nextUrl)
		);
	}

	// 登录/注册页仍需要准确 session，避免登录用户停留在 auth 页面
	const needsSession = isAuthRoute;
	let isLoggedIn = isProtectedRoute && hasSessionCookie;

	if (needsSession) {
		try {
			const baseUrl = getBaseUrl() || `${nextUrl.protocol}//${nextUrl.host}`;

			const controller = new AbortController();
			const timeoutId = setTimeout(() => controller.abort(), 3000);

			const { data: session } = await betterFetch<Session>(
				'/api/auth/get-session',
				{
					baseURL: baseUrl,
					headers: {
						cookie: req.headers.get('cookie') || '',
					},
					signal: controller.signal,
				}
			);

			clearTimeout(timeoutId);
			isLoggedIn = !!session;
		} catch (error) {
			if (error instanceof Error && error.name !== 'AbortError') {
				console.error('Middleware: Failed to check session', error);
			}
			isLoggedIn = false;
		}
	}

	if (isLoggedIn) {
		const isNotAllowedRoute = routesNotAllowedByLoggedInUsers.some((route) =>
			new RegExp(`^${route}$`).test(pathnameWithoutLocale)
		);
		if (isNotAllowedRoute) {
			const dash = dashboardPathFromUrl(nextUrl.pathname);
			if (isDev) {
				console.log(
					'<< middleware end, not allowed route, already logged in, redirecting to dashboard',
					dash
				);
			}
			return NextResponse.redirect(new URL(dash, nextUrl));
		}
	}

	if (isDev) console.log('<< middleware end, applying intlMiddleware');
	return intlMiddleware(req);
}

/** 去掉前缀 /{locale}，含仅语言段路径如 /zh */
function getPathnameWithoutLocale(pathname: string, locales: string[]): string {
	const localePattern = new RegExp(`^/(${locales.join('|')})(?=/|$)`);
	const m = pathname.match(localePattern);
	if (!m) return pathname;
	const rest = pathname.slice(m[0].length);
	return rest && rest.length > 0 ? rest : '/';
}

/** 与 next-intl as-needed 一致：默认语言无前缀，其它语言 /{locale}/dashboard */
function dashboardPathFromUrl(pathname: string): string {
	const first = pathname.split('/').filter(Boolean)[0];
	if (!first || !LOCALES.includes(first as AppLocale)) {
		return '/dashboard';
	}
	if (
		first === nextIntlConfig.defaultLocale &&
		nextIntlConfig.localePrefix === 'as-needed'
	) {
		return '/dashboard';
	}
	return `/${first}/dashboard`;
}

function hasBetterAuthSessionCookie(req: NextRequest): boolean {
	const names = req.cookies.getAll().map((c) => c.name);
	return names.some((name) =>
		name === 'better-auth.session_token' ||
		name === '__Secure-better-auth.session_token' ||
		name === 'better-auth-session_token' ||
		name === '__Secure-better-auth-session_token'
	);
}

export const config = {
	matcher: [
		'/((?!api|_next|_vercel|.*\\..*).*)',
	],
};
