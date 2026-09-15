import { getDb } from '@/db';
import { payment, user, userFile } from '@/db/schema';
import { getSessionFromRequest } from '@/lib/auth-api-session';
import { findPlanByPriceId, getAllPricePlans } from '@/lib/price-plan';
import { extractStorageKeyFromUrl } from '@/lib/storage-key-from-url';
import { resolveStorageLimit } from '@/lib/storage-limits';
import { PaymentScenes, PaymentTypes } from '@/payment/types';
import { deleteFile, isStorageConfigured } from '@/storage';
import { and, count, desc, eq, like, or, sql, type SQL } from 'drizzle-orm';
import { type NextRequest, NextResponse } from 'next/server';

/** Same as editstamp: CDN URL → R2 key, then DeleteObject. */
async function deleteStorageUrl(url: string | null | undefined): Promise<void> {
  if (!url) return;
  const key = extractStorageKeyFromUrl(url);
  if (!key) {
    throw new Error(`Could not extract R2 key from url: ${url}`);
  }
  if (!isStorageConfigured()) {
    throw new Error('Storage is not configured');
  }
  await deleteFile(key);
}

export const runtime = 'nodejs';

const PAGE_SIZE_DEFAULT = 24;
const PAGE_SIZE_MAX = 50;

function mapRow(row: typeof userFile.$inferSelect) {
  const url = row.processedUrl || row.originalUrl;
  return {
    id: row.id,
    title: row.title ?? row.filename,
    filename: row.filename,
    mimeType: row.mimeType,
    fileSize: row.fileSize,
    resourceType: row.resourceType,
    paymentStatus: row.paymentStatus,
    createdAt: row.createdAt,
    url,
    originalUrl: row.originalUrl,
    processedUrl: row.processedUrl ?? undefined,
  };
}

async function resolveStorageForUser(userId: string) {
  const db = await getDb();
  const [[sizeRow], [userRow], payments] = await Promise.all([
    db
      .select({
        total: sql<number>`coalesce(sum(${userFile.fileSize}), 0)`,
      })
      .from(userFile)
      .where(eq(userFile.userId, userId)),
    db
      .select({
        storageLimit: user.storageLimit,
      })
      .from(user)
      .where(eq(user.id, userId))
      .limit(1),
    db
      .select({
        priceId: payment.priceId,
        type: payment.type,
        status: payment.status,
        scene: payment.scene,
      })
      .from(payment)
      .where(
        and(
          eq(payment.paid, true),
          eq(payment.userId, userId),
          or(
            and(
              eq(payment.type, PaymentTypes.ONE_TIME),
              eq(payment.scene, PaymentScenes.LIFETIME),
              eq(payment.status, 'completed')
            ),
            and(
              eq(payment.type, PaymentTypes.SUBSCRIPTION),
              or(eq(payment.status, 'active'), eq(payment.status, 'trialing'))
            )
          )
        )
      )
      .orderBy(desc(payment.createdAt)),
  ]);

  const plans = getAllPricePlans();
  let planId = 'free';

  for (const row of payments) {
    if (
      row.type === PaymentTypes.ONE_TIME &&
      row.scene === PaymentScenes.LIFETIME &&
      row.status === 'completed'
    ) {
      const pricePlan = findPlanByPriceId(row.priceId);
      if (pricePlan?.isLifetime) {
        planId = pricePlan.id;
        break;
      }
    }
  }

  if (planId === 'free') {
    for (const row of payments) {
      if (
        row.type === PaymentTypes.SUBSCRIPTION &&
        (row.status === 'active' || row.status === 'trialing')
      ) {
        const pricePlan =
          plans.find((p) =>
            p.prices.some((price) => price.priceId === row.priceId)
          ) || findPlanByPriceId(row.priceId);
        if (pricePlan) {
          planId = pricePlan.id;
          break;
        }
      }
    }
  }

  const storageLimit = resolveStorageLimit(planId, userRow?.storageLimit);

  return {
    storageUsed: Number(sizeRow?.total ?? 0),
    storageLimit,
  };
}

/**
 * List current user's uploaded videos (file-manager style).
 */
export async function GET(request: NextRequest) {
  const session = await getSessionFromRequest(request);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const pageRaw = parseInt(searchParams.get('page') || '1', 10);
  const pageSizeRaw = parseInt(
    searchParams.get('pageSize') || String(PAGE_SIZE_DEFAULT),
    10
  );
  const page = Number.isFinite(pageRaw) && pageRaw >= 1 ? pageRaw : 1;
  const pageSize = Math.min(
    Math.max(
      Number.isFinite(pageSizeRaw) ? pageSizeRaw : PAGE_SIZE_DEFAULT,
      1
    ),
    PAGE_SIZE_MAX
  );
  const q = (searchParams.get('q') || '').trim();
  const format = (searchParams.get('format') || 'all').trim().toLowerCase();

  const FORMAT_EXT: Record<string, string[]> = {
    mp4: ['.mp4', '.m4v'],
    mov: ['.mov'],
    avi: ['.avi'],
    webm: ['.webm'],
    mkv: ['.mkv'],
    mpeg: ['.mpeg', '.mpg'],
    flv: ['.flv'],
    '3gp': ['.3gp'],
  };

  const db = await getDb();
  const conditions: SQL[] = [eq(userFile.userId, session.user.id)];
  if (q) {
    conditions.push(
      or(like(userFile.filename, `%${q}%`), like(userFile.title, `%${q}%`))!
    );
  }
  const exts = FORMAT_EXT[format];
  if (exts?.length) {
    conditions.push(
      or(...exts.map((ext) => like(userFile.filename, `%${ext}`)))!
    );
  }
  const where = and(...conditions);

  const [[totalRow], rows, storage] = await Promise.all([
    db.select({ n: count() }).from(userFile).where(where),
    db
      .select()
      .from(userFile)
      .where(where)
      .orderBy(desc(userFile.createdAt))
      .limit(pageSize)
      .offset((page - 1) * pageSize),
    resolveStorageForUser(session.user.id),
  ]);

  return NextResponse.json({
    items: rows.map(mapRow),
    total: Number(totalRow?.n ?? 0),
    page,
    pageSize,
    storageUsed: storage.storageUsed,
    storageLimit: storage.storageLimit,
  });
}

/**
 * Delete one of the current user's files (DB row + R2 object when possible).
 */
export async function DELETE(request: NextRequest) {
  const session = await getSessionFromRequest(request);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const id = (searchParams.get('id') || '').trim();
  if (!id) {
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

  // Dedupe: upload often sets originalUrl === processedUrl
  const urls = [...new Set([row.originalUrl, row.processedUrl].filter(Boolean))];
  try {
    for (const url of urls) {
      await deleteStorageUrl(url);
    }
  } catch (error) {
    console.error('[files] R2 delete failed:', error);
    return NextResponse.json(
      { error: 'Failed to delete storage object' },
      { status: 502 }
    );
  }

  await db
    .delete(userFile)
    .where(and(eq(userFile.id, id), eq(userFile.userId, session.user.id)));

  return NextResponse.json({ ok: true });
}
