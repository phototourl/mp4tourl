import { NextResponse } from 'next/server';
import { getDb } from '@/db';
import { userDocument } from '@/db/schema';
import { and, count, desc, eq, gte, inArray, like, lt, or, sql } from 'drizzle-orm';
import { S3Client, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { betterFetch } from '@better-fetch/fetch';
import type { Session } from '@/lib/auth-types';
import { DOCUMENT_LIST_PAGE_SIZE_DEFAULT } from '@/lib/constants/resource-pagination';

const r2Enabled =
  !!process.env.R2_BUCKET &&
  !!process.env.R2_ENDPOINT &&
  !!process.env.R2_ACCESS_KEY_ID &&
  !!process.env.R2_SECRET_ACCESS_KEY;

const r2Client = r2Enabled
  ? new S3Client({
      region: 'auto',
      endpoint: process.env.R2_ENDPOINT,
      credentials: {
        accessKeyId: process.env.R2_ACCESS_KEY_ID!,
        secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
      },
      forcePathStyle: true,
    })
  : null;

const r2Bucket = process.env.R2_BUCKET;
const MAX_PAGE_SIZE = 100;

/** 类型筛选：四类（与前台下拉一致），按 file_ext 归类 */
const DOC_TYPE_GROUPS = {
  pdf: ['pdf'],
  word: ['doc', 'docx'],
  ppt: ['ppt', 'pptx'],
  excel: ['xls', 'xlsx'],
} as const;

function normalizeExt(ext: string) {
  const t = ext.trim().toLowerCase();
  if (!t) return '';
  return t.startsWith('.') ? t.slice(1) : t;
}

function extEqCondition(ext: string) {
  const e = normalizeExt(ext);
  if (!e) return undefined;
  // tolerate legacy values like ".DOCX" / "DOCX"
  return or(
    eq(userDocument.fileExt, e),
    eq(userDocument.fileExt, `.${e}`),
    eq(sql`lower(${userDocument.fileExt})`, e),
    eq(sql`lower(${userDocument.fileExt})`, `.${e}`)
  );
}

function typeFilterCondition(typeParam: string) {
  const t = typeParam.trim().toLowerCase();
  if (!t) return undefined;
  const exts = DOC_TYPE_GROUPS[t as keyof typeof DOC_TYPE_GROUPS];
  if (exts) {
    // Also tolerate legacy dot-prefixed / upper-case stored values.
    const normalized = exts.map(normalizeExt).filter(Boolean);
    const dotPrefixed = normalized.map((e) => `.${e}`);
    const variants = Array.from(new Set([...normalized, ...dotPrefixed]));
    return or(
      inArray(userDocument.fileExt, variants),
      inArray(sql`lower(${userDocument.fileExt})`, variants)
    );
  }
  return extEqCondition(t);
}

function extractR2Key(url: string): string | null {
  try {
    const pathname = new URL(url).pathname;
    return pathname.startsWith('/') ? pathname.slice(1) : pathname;
  } catch {
    return null;
  }
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
  } catch (error) {
    console.error('[Documents] session fetch failed:', error);
    return null;
  }
}

/**
 * 列表与筛选、总数、分页均在数据库层完成（WHERE + COUNT + LIMIT/OFFSET），
 * 前端只传查询参数，不对结果集做二次过滤。
 */
export async function GET(req: Request) {
  try {
    const session = await getSession(req);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;
    const db = await getDb();
    const { searchParams } = new URL(req.url);
    const q = (searchParams.get('q') || '').trim();
    const type = (searchParams.get('type') || '').trim().toLowerCase();
    const from = (searchParams.get('from') || '').trim(); // YYYY-MM-DD
    const to = (searchParams.get('to') || '').trim(); // YYYY-MM-DD

    const pageRaw = parseInt(searchParams.get('page') || '1', 10);
    const pageSizeRaw = parseInt(
      searchParams.get('pageSize') || String(DOCUMENT_LIST_PAGE_SIZE_DEFAULT),
      10
    );
    const page = Number.isFinite(pageRaw) && pageRaw >= 1 ? pageRaw : 1;
    const pageSize = Math.min(
      MAX_PAGE_SIZE,
      Math.max(
        1,
        Number.isFinite(pageSizeRaw) ? pageSizeRaw : DOCUMENT_LIST_PAGE_SIZE_DEFAULT
      )
    );
    const offset = (page - 1) * pageSize;

    const where = and(
      eq(userDocument.userId, userId),
      q ? like(userDocument.filename, `%${q}%`) : undefined,
      type ? typeFilterCondition(type) : undefined,
      from ? gte(userDocument.createdAt, new Date(`${from}T00:00:00.000Z`)) : undefined,
      to ? lt(userDocument.createdAt, new Date(new Date(`${to}T00:00:00.000Z`).getTime() + 24 * 60 * 60 * 1000)) : undefined
    );

    const [totalRow] = await db
      .select({ n: count() })
      .from(userDocument)
      .where(where);
    const total = Number(totalRow?.n ?? 0);

    const rows = await db
      .select()
      .from(userDocument)
      .where(where)
      .orderBy(desc(userDocument.createdAt))
      .limit(pageSize)
      .offset(offset);

    // Ensure plain JSON-safe values
    const documents = rows.map((row) => ({
      ...row,
      id: Number(row.id),
      fileSize: Number(row.fileSize ?? 0),
      path: row.downloadUrl,
      originalUrl: row.downloadUrl,
    }));

    return NextResponse.json({ documents, total, page, pageSize });
  } catch (error) {
    console.error('[Documents] GET failed:', error);
    const details = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: 'Failed to fetch documents', details }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const session = await getSession(req);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;
    const db = await getDb();
    const { searchParams } = new URL(req.url);
    const idRaw = searchParams.get('id');
    const id = Number(idRaw);
    if (!idRaw || !Number.isFinite(id) || id <= 0) {
      return NextResponse.json({ error: 'Invalid document id' }, { status: 400 });
    }

    const [doc] = await db
      .select()
      .from(userDocument)
      .where(and(eq(userDocument.id, id), eq(userDocument.userId, userId)));
    if (!doc) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    }

    if (r2Enabled && r2Client && r2Bucket) {
      const key = extractR2Key(doc.downloadUrl);
      if (key) {
        await r2Client.send(
          new DeleteObjectCommand({
            Bucket: r2Bucket,
            Key: key,
          })
        );
      }
    }

    await db.delete(userDocument).where(and(eq(userDocument.id, id), eq(userDocument.userId, userId)));
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[Documents] DELETE failed:', error);
    const details = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: 'Failed to delete document', details }, { status: 500 });
  }
}

