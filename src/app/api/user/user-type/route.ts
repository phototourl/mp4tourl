import { NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import { betterFetch } from '@better-fetch/fetch';
import { getDb } from '@/db';
import { user } from '@/db/schema';
import type { Session } from '@/lib/auth-types';
import { USER_TYPE_ART_FIGHT } from '@/lib/constants/user-type';

const ALLOWED_TYPES = new Set([USER_TYPE_ART_FIGHT]);

async function getSession(req: Request): Promise<Session | null> {
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

export async function PATCH(req: Request) {
  try {
    const session = await getSession(req);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const raw = body?.userType;
    const userType =
      raw === null || raw === undefined || raw === ''
        ? null
        : typeof raw === 'string'
          ? raw.trim()
          : null;

    if (userType !== null && !ALLOWED_TYPES.has(userType)) {
      return NextResponse.json({ error: 'Invalid user type' }, { status: 400 });
    }

    const db = await getDb();
    await db
      .update(user)
      .set({ userType, updatedAt: new Date() })
      .where(eq(user.id, session.user.id));

    return NextResponse.json({ userType });
  } catch (error) {
    console.error('[user/user-type]', error);
    return NextResponse.json({ error: 'Failed to update user type' }, { status: 500 });
  }
}
