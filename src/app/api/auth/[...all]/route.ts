import { getAuth } from '@/lib/auth';
import { toNextJsHandler } from 'better-auth/next-js';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const authPromise = getAuth().catch((error) => {
	console.error('Better Auth init error:', error);
	return null;
});

async function getHandler() {
	const auth = await authPromise;
	if (!auth) {
		return {
			GET: () => NextResponse.json({ error: 'Auth not initialized' }, { status: 500 }),
			POST: () => NextResponse.json({ error: 'Auth not initialized' }, { status: 500 }),
			HEAD: () => NextResponse.json({ error: 'Auth not initialized' }, { status: 500 }),
		};
	}
	return toNextJsHandler(auth);
}

export const GET = async (request: NextRequest) => {
	const handler = await getHandler();
	return handler.GET(request);
};

export const POST = async (request: NextRequest) => {
	const handler = await getHandler();
	return handler.POST(request);
};
