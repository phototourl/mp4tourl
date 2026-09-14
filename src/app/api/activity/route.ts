import { NextResponse } from 'next/server';
import { getDb } from '@/db';
import { userDocument, userResource } from '@/db/schema';
import { and, eq, gte } from 'drizzle-orm';
import { betterFetch } from '@better-fetch/fetch';
import type { Session } from '@/lib/auth-types';

type Range = '7d' | '30d' | '90d';

function getDays(range: Range): number {
  if (range === '7d') return 7;
  if (range === '30d') return 30;
  return 90;
}

function getUtcDayStart(d: Date): Date {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
}

function toDayKeyUtc(d: Date): string {
  return [
    d.getUTCFullYear(),
    String(d.getUTCMonth() + 1).padStart(2, '0'),
    String(d.getUTCDate()).padStart(2, '0'),
  ].join('-');
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const range = (searchParams.get('range') || '30d') as Range;
    if (!['7d', '30d', '90d'].includes(range)) {
      return NextResponse.json({ error: 'Invalid range' }, { status: 400 });
    }

    // Get session (same pattern as other routes)
    const protocol = process.env.NODE_ENV === 'production' ? 'https' : 'http';
    const host = req.headers.get('host') || 'localhost:3000';
    const baseUrl = `${protocol}://${host}`;

    let session: Session | null = null;
    try {
      const response = await betterFetch(`${baseUrl}/api/auth/get-session`, {
        baseURL: baseUrl,
        headers: { cookie: req.headers.get('cookie') || '' },
      });
      session = response.data as Session | null;
    } catch (e) {
      console.error('[Activity] Session fetch error:', e);
    }

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;
    const days = getDays(range);
    const todayUtcStart = getUtcDayStart(new Date());
    const startUtc = new Date(todayUtcStart.getTime() - (days - 1) * 24 * 60 * 60 * 1000);

    const db = await getDb();
    const photoRows = await db
      .select({ createdAt: userResource.createdAt })
      .from(userResource)
      .where(and(eq(userResource.userId, userId), gte(userResource.createdAt, startUtc)));

    const docRows = await db
      .select({ createdAt: userDocument.createdAt })
      .from(userDocument)
      .where(and(eq(userDocument.userId, userId), gte(userDocument.createdAt, startUtc)));

    const photoCounts = new Map<string, number>();
    for (const r of photoRows) {
      const created = new Date(r.createdAt);
      const key = toDayKeyUtc(created);
      photoCounts.set(key, (photoCounts.get(key) ?? 0) + 1);
    }

    const docCounts = new Map<string, number>();
    for (const r of docRows) {
      const created = new Date(r.createdAt);
      const key = toDayKeyUtc(created);
      docCounts.set(key, (docCounts.get(key) ?? 0) + 1);
    }

    const series: { date: string; photos: number; documents: number }[] = [];
    for (let i = 0; i < days; i++) {
      const d = new Date(startUtc.getTime() + i * 24 * 60 * 60 * 1000);
      const key = toDayKeyUtc(d);
      series.push({
        date: key,
        photos: photoCounts.get(key) ?? 0,
        documents: docCounts.get(key) ?? 0,
      });
    }

    return NextResponse.json({ range, series });
  } catch (e) {
    console.error('[Activity] Failed to build activity series:', e);
    return NextResponse.json({ error: 'Failed to fetch activity' }, { status: 500 });
  }
}

