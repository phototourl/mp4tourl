import { getDb } from '@/db';
import { userFile } from '@/db/schema';
import { getSessionFromRequest } from '@/lib/auth-api-session';
import { and, eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type RouteContext = { params: Promise<{ id: string }> };

function contentDispositionAttachment(filename: string): string {
  const asciiFallback =
    filename.replace(/[^\x20-\x7E]+/g, '_').replace(/["\\]/g, '_') || 'video';
  const encoded = encodeURIComponent(filename).replace(/['()]/g, (c) =>
    `%${c.charCodeAt(0).toString(16).toUpperCase()}`
  );
  return `attachment; filename="${asciiFallback}"; filename*=UTF-8''${encoded}`;
}

/**
 * Same-origin attachment download — ownership-checked proxy of R2 URL.
 * Avoids cross-origin `a.download` being ignored (opens a new tab instead).
 */
export async function GET(request: Request, context: RouteContext) {
  const session = await getSessionFromRequest(request);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await context.params;
  if (!id?.trim()) {
    return NextResponse.json({ error: 'Missing id' }, { status: 400 });
  }

  const db = await getDb();
  const [row] = await db
    .select()
    .from(userFile)
    .where(and(eq(userFile.id, id), eq(userFile.userId, session.user.id)))
    .limit(1);

  if (!row) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const upstreamUrl = row.processedUrl || row.originalUrl;
  if (!upstreamUrl) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const upstream = await fetch(upstreamUrl, { cache: 'no-store' });
  if (!upstream.ok) {
    return NextResponse.json({ error: 'Upstream failed' }, { status: 502 });
  }

  const mime =
    row.mimeType ||
    upstream.headers.get('content-type') ||
    'application/octet-stream';
  const headers: Record<string, string> = {
    'Content-Type': mime,
    'Content-Disposition': contentDispositionAttachment(
      row.filename || 'video'
    ),
    'Cache-Control': 'private, no-store',
    'X-Content-Type-Options': 'nosniff',
  };
  const len = upstream.headers.get('content-length');
  if (len) headers['Content-Length'] = len;

  if (upstream.body) {
    return new Response(upstream.body, { status: 200, headers });
  }

  const buffer = Buffer.from(await upstream.arrayBuffer());
  return new NextResponse(buffer, { status: 200, headers });
}
