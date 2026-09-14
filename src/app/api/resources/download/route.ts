import { NextResponse } from 'next/server';
import { betterFetch } from '@better-fetch/fetch';
import { and, eq } from 'drizzle-orm';
import { getDb } from '@/db';
import { userResource } from '@/db/schema';
import type { Session } from '@/lib/auth-types';
import { getResourcePublicUrl } from '@/lib/constants/resource-source';

export const dynamic = 'force-dynamic';

async function getSession(req: Request) {
	const protocol = process.env.NODE_ENV === 'production' ? 'https' : 'http';
	const host = req.headers.get('host') || 'localhost:3000';
	const baseUrl = `${protocol}://${host}`;
	try {
		const response = await betterFetch(`${baseUrl}/api/auth/get-session`, {
			baseURL: baseUrl,
			headers: { cookie: req.headers.get('cookie') || '' },
		});
		return response.data as Session | null;
	} catch (error) {
		console.error('[resources/download] session fetch failed:', error);
		return null;
	}
}

/** 登录用户按资源 ID 下载自己的照片（服务端拉取 R2，避免新窗口且不受浏览器 CORS 限制） */
export async function GET(req: Request) {
	try {
		const session = await getSession(req);
		if (!session?.user?.id) {
			return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
		}

		const { searchParams } = new URL(req.url);
		const id = searchParams.get('id')?.trim();
		if (!id) {
			return NextResponse.json({ error: 'Missing id' }, { status: 400 });
		}

		const db = await getDb();
		const [row] = await db
			.select()
			.from(userResource)
			.where(and(eq(userResource.id, id), eq(userResource.userId, session.user.id)))
			.limit(1);

		if (!row) {
			return NextResponse.json({ error: 'Not found' }, { status: 404 });
		}

		const useOriginalOnly = searchParams.get('original') === '1';
		const upstreamUrl = useOriginalOnly ? row.originalUrl : getResourcePublicUrl(row);

		const upstream = await fetch(upstreamUrl, { cache: 'no-store' });
		if (!upstream.ok) {
			return NextResponse.json({ error: 'Upstream failed' }, { status: 502 });
		}

		const safeName = row.filename.replace(/["\r\n]/g, '_');
		const outHeaders = new Headers();
		outHeaders.set(
			'Content-Type',
			upstream.headers.get('content-type') || 'application/octet-stream'
		);
		outHeaders.set('Content-Disposition', `attachment; filename="${safeName}"`);
		const contentLength = upstream.headers.get('content-length');
		if (contentLength) {
			outHeaders.set('Content-Length', contentLength);
		}

		// 流式转发：不把整文件读进内存再返回，首字节更快、占用更小
		if (upstream.body) {
			return new NextResponse(upstream.body, { status: 200, headers: outHeaders });
		}

		const blob = await upstream.arrayBuffer();
		return new NextResponse(blob, { status: 200, headers: outHeaders });
	} catch (e) {
		console.error('[resources/download]', e);
		return NextResponse.json({ error: 'Server error' }, { status: 500 });
	}
}
