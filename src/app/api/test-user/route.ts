import { getDb } from '@/db';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const db = await getDb();
    const hasTransaction = typeof (db as any).transaction === 'function';
    const dbKeys = Object.keys(db as object).filter(k => typeof (db as any)[k] === 'function');

    return NextResponse.json({
      hasTransaction,
      dbKeys,
      dbType: typeof db
    });
  } catch (error: any) {
    console.error('error:', error);
    return NextResponse.json({ error: error?.message || String(error) }, { status: 500 });
  }
}
