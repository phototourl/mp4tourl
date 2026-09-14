import { NextResponse } from 'next/server';
import { randomUUID } from 'crypto';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getDb } from '@/db';
import { userDocument, user, userResource } from '@/db/schema';
import { eq, and, gte, lt, sum, count } from 'drizzle-orm';
import {
  getStorageLimit,
  getMaxDocumentUploadFileBytes,
  isPaidSubscriptionActive,
  PLAN_FREE,
  PLAN_PAID,
  PLAN_TIER_MONTHLY,
  PLAN_TIER_YEARLY,
  LOGGED_IN_FREE_LIMIT,
  PAID_UPLOAD_LIMITS,
  formatUploadLimitForDisplay,
  type Plan,
  type PlanTier,
} from '@/lib/constants/plans';
import { betterFetch } from '@better-fetch/fetch';
import type { Session } from '@/lib/auth-types';
import { DOCUMENT_UPLOAD_ALLOWLIST } from '@/lib/document-upload-allowlist';

const ALLOWED_MIME: Record<string, { ext: string; category: 'pdf' | 'word' | 'ppt' | 'execl' }> =
  DOCUMENT_UPLOAD_ALLOWLIST;

const r2Enabled =
  !!process.env.R2_BUCKET &&
  !!process.env.R2_ENDPOINT &&
  !!process.env.R2_ACCESS_KEY_ID &&
  !!process.env.R2_SECRET_ACCESS_KEY &&
  !!process.env.R2_PUBLIC_BASE_URL;

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
const r2PublicBase = process.env.R2_PUBLIC_BASE_URL?.replace(/\/+$/, '');
const R2_CACHE_CONTROL = 'public, max-age=31536000, immutable';

function buildFileName(ext: string) {
  const now = new Date();
  const stamp = [
    now.getUTCFullYear(),
    String(now.getUTCMonth() + 1).padStart(2, '0'),
    String(now.getUTCDate()).padStart(2, '0'),
  ].join('-');
  return `${stamp}-${randomUUID()}${ext}`;
}

function getTodayRange() {
  const now = new Date();
  const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  const end = new Date(start.getTime() + 24 * 60 * 60 * 1000);
  return { start, end };
}

export async function POST(req: Request) {
  try {
    const protocol = process.env.NODE_ENV === 'production' ? 'https' : 'http';
    const host = req.headers.get('host') || 'localhost:3000';
    const baseUrl = `${protocol}://${host}`;
    const response = await betterFetch(`${baseUrl}/api/auth/get-session`, {
      baseURL: baseUrl,
      headers: { cookie: req.headers.get('cookie') || '' },
    });
    const session = response.data as Session | null;
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;
    const db = await getDb();
    const [userRecord] = await db
      .select({
        plan: user.plan,
        planTier: user.planTier,
        storageLimit: user.storageLimit,
        planExpiresAt: user.planExpiresAt,
      })
      .from(user)
      .where(eq(user.id, userId));

    const rawPlan: Plan = (userRecord?.plan as Plan) || PLAN_FREE;
    const subscriptionActive = isPaidSubscriptionActive(rawPlan, userRecord?.planExpiresAt ?? null);
    const plan: Plan = subscriptionActive ? rawPlan : PLAN_FREE;
    const planTier = subscriptionActive ? ((userRecord?.planTier as PlanTier | null) || null) : null;
    const customStorageLimit = userRecord?.storageLimit ?? null;

    const formData = await req.formData();
    const file = formData.get('file');
    if (!file || !(file instanceof File)) {
      return NextResponse.json({ error: "No file provided. Use form-data field 'file'." }, { status: 400 });
    }

    const mime = ALLOWED_MIME[file.type];
    if (!mime) {
      return NextResponse.json({ error: 'Unsupported document type. Use PDF/Word/PPT/Excel.' }, { status: 400 });
    }

    // Free users: skip per-file document size check and rely on total storage limit.
    // Paid users: keep tier-based per-file limits (monthly/yearly).
    if (plan === PLAN_PAID) {
      const maxFileBytes = getMaxDocumentUploadFileBytes(plan, planTier);
      if (file.size > maxFileBytes) {
        const maxMb = Math.round(maxFileBytes / (1024 * 1024));
        return NextResponse.json(
          { error: 'fileTooLarge', errorParams: { maxMb, maxSize: formatUploadLimitForDisplay(maxFileBytes) } },
          { status: 400 }
        );
      }
    }

    const { start, end } = getTodayRange();
    const paidLimit =
      plan === PLAN_PAID
        ? planTier === PLAN_TIER_YEARLY
          ? PAID_UPLOAD_LIMITS[PLAN_TIER_YEARLY]
          : PAID_UPLOAD_LIMITS[PLAN_TIER_MONTHLY]
        : LOGGED_IN_FREE_LIMIT;

    if (paidLimit > 0) {
      const [photoCount] = await db
        .select({ n: count() })
        .from(userResource)
        .where(and(eq(userResource.userId, userId), gte(userResource.createdAt, start), lt(userResource.createdAt, end)));
      const [docCount] = await db
        .select({ n: count() })
        .from(userDocument)
        .where(and(eq(userDocument.userId, userId), gte(userDocument.createdAt, start), lt(userDocument.createdAt, end)));
      const uploadsToday = Number(photoCount?.n ?? 0) + Number(docCount?.n ?? 0);
      if (uploadsToday >= paidLimit) {
        return NextResponse.json(
          { error: 'dailyLimitReached', errorParams: { limit: paidLimit }, plan, limit: paidLimit },
          { status: 429 }
        );
      }
    }

    const storageLimit = getStorageLimit(plan, planTier, customStorageLimit);
    const [photoSum] = await db
      .select({ s: sum(userResource.fileSize) })
      .from(userResource)
      .where(eq(userResource.userId, userId));
    const [docSum] = await db
      .select({ s: sum(userDocument.fileSize) })
      .from(userDocument)
      .where(eq(userDocument.userId, userId));
    const storageUsed = Number(photoSum?.s ?? 0) + Number(docSum?.s ?? 0);
    if (storageUsed + file.size > storageLimit) {
      return NextResponse.json({ error: 'storageLimitReached' }, { status: 413 });
    }

    if (!r2Enabled || !r2Client || !r2Bucket || !r2PublicBase) {
      return NextResponse.json({ error: 'Upload service is under maintenance.' }, { status: 500 });
    }

    let planFolder = 'free';
    if (plan === PLAN_PAID) {
      planFolder = planTier === PLAN_TIER_YEARLY ? 'plus' : 'pro';
    } else {
      planFolder = 'member';
    }
    // 目录结构按业务桶约定：
    // <category>/<planFolder>/<date-uuid.ext>
    // 例如：pdf/member/2026-04-14-xxxx.pdf
    const key = `${mime.category}/${planFolder}/${buildFileName(mime.ext)}`;
    const buffer = Buffer.from(await file.arrayBuffer());
    await r2Client.send(
      new PutObjectCommand({
        Bucket: r2Bucket,
        Key: key,
        Body: buffer,
        ContentType: file.type,
        CacheControl: R2_CACHE_CONTROL,
      })
    );

    const url = `${r2PublicBase}/${key}`;
    await db.insert(userDocument).values({
      userId,
      filename: file.name,
      originalFilename: file.name,
      storageKey: null,
      downloadUrl: url,
      fileSize: file.size,
      mimeType: file.type,
      fileExt: mime.ext.replace('.', ''),
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    return NextResponse.json({ url, key, category: mime.category, plan });
  } catch (error) {
    console.error('[Document Upload] failed:', error);
    return NextResponse.json({ error: 'Upload failed. Please try again later.' }, { status: 500 });
  }
}

