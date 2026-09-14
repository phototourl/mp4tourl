import { NextResponse } from 'next/server';
import { betterFetch } from '@better-fetch/fetch';
import type { Session } from '@/lib/auth-types';
import { getDb } from '@/db';
import { pricingRedirectEvent } from '@/db/schema';

function getClientIp(req: Request): string | null {
  // Cloudflare 优先，其次常见反代头
  const cf = req.headers.get('cf-connecting-ip');
  if (cf) return cf.trim();

  const xff = req.headers.get('x-forwarded-for');
  if (xff) return xff.split(',')[0]?.trim() || null;

  const xri = req.headers.get('x-real-ip');
  if (xri) return xri.trim();

  return null;
}

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
  } catch {
    return null;
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const eventType = typeof body?.eventType === 'string' ? body.eventType : 'navigate_pricing';
    const fromPath = typeof body?.fromPath === 'string' ? body.fromPath : null;
    const fromUrl = typeof body?.fromUrl === 'string' ? body.fromUrl : null;
    const toPath = typeof body?.toPath === 'string' ? body.toPath : '/pricing';
    const sourceModule = typeof body?.sourceModule === 'string' ? body.sourceModule : null;
    const sourceAction = typeof body?.sourceAction === 'string' ? body.sourceAction : null;
    const planAtTime = typeof body?.planAtTime === 'string' ? body.planAtTime : null;
    const meta = body?.meta != null ? JSON.stringify(body.meta).slice(0, 8000) : null;
    const sessionId = typeof body?.sessionId === 'string' ? body.sessionId.slice(0, 64) : null;

    // 必填：不然无法统计来源
    if (!sourceModule || !sourceAction) {
      return NextResponse.json({ ok: false, error: 'sourceModule/sourceAction required' }, { status: 400 });
    }

    const session = await getSession(req);
    const userId = session?.user?.id ?? null;

    const db = await getDb();
    await db.insert(pricingRedirectEvent).values({
      userId,
      sessionId,
      eventType,
      fromPath,
      fromUrl,
      toPath,
      sourceModule,
      sourceAction,
      planAtTime,
      meta,
      ip: getClientIp(req),
      userAgent: (req.headers.get('user-agent') || '').slice(0, 255) || null,
    });

    // 不阻塞跳转；成功与否都尽量快速返回
    return NextResponse.json({ ok: true });
  } catch (error) {
    // 埋点失败不影响业务跳转
    console.error('[pricing-redirect] failed:', error);
    return NextResponse.json({ ok: false }, { status: 204 });
  }
}

