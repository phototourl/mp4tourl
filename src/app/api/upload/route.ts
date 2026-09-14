import { NextResponse } from 'next/server';
import { randomUUID } from 'crypto';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getDb } from '@/db';
import { userResource, user, userDocument } from '@/db/schema';
import { eq, and, gte, lt, count, sum } from 'drizzle-orm';
import { getUploadLimit, getStorageLimit, getMaxUploadFileBytes, isPaidSubscriptionActive, PLAN_FREE, PLAN_PAID, PLAN_TIER_MONTHLY, PLAN_TIER_YEARLY, LOGGED_IN_FREE_LIMIT, PAID_UPLOAD_LIMITS, formatUploadLimitForDisplay, type PlanTier, type Plan } from '@/lib/constants/plans';
import { ANON_DB_USER_ID } from '@/lib/constants/anonymous-upload';
import { ART_FIGHT_RESOURCE_MARKER } from '@/lib/constants/resource-source';
import { betterFetch } from '@better-fetch/fetch';
import type { Session } from '@/lib/auth-types';

const ALLOWED_MIME: Record<string, string> = {
  'video/mp4': '.mp4',
  'video/webm': '.webm',
  'video/quicktime': '.mov',
  'video/x-msvideo': '.avi',
  'video/avi': '.avi',
  'video/x-matroska': '.mkv',
  'video/mpeg': '.mpeg',
  'video/ogg': '.ogv',
  'video/3gpp': '.3gp',
  'video/x-flv': '.flv',
};

const EXT_FALLBACK: Record<string, { mime: string; ext: string }> = {
  mp4: { mime: 'video/mp4', ext: '.mp4' },
  webm: { mime: 'video/webm', ext: '.webm' },
  mov: { mime: 'video/quicktime', ext: '.mov' },
  avi: { mime: 'video/x-msvideo', ext: '.avi' },
  mkv: { mime: 'video/x-matroska', ext: '.mkv' },
  mpeg: { mime: 'video/mpeg', ext: '.mpeg' },
  mpg: { mime: 'video/mpeg', ext: '.mpg' },
  ogv: { mime: 'video/ogg', ext: '.ogv' },
  '3gp': { mime: 'video/3gpp', ext: '.3gp' },
  flv: { mime: 'video/x-flv', ext: '.flv' },
};

function resolveVideoExt(file: File): { ext: string; contentType: string } | null {
  const byMime = ALLOWED_MIME[file.type];
  if (byMime) {
    return { ext: byMime, contentType: file.type };
  }
  const nameExt = file.name.split('.').pop()?.toLowerCase() ?? '';
  const fallback = EXT_FALLBACK[nameExt];
  if (fallback) {
    return { ext: fallback.ext, contentType: fallback.mime };
  }
  return null;
}

export const runtime = 'nodejs';
export const maxDuration = 300;

function buildFileName(ext: string) {
  const now = new Date();
  const stamp = [
    now.getUTCFullYear(),
    String(now.getUTCMonth() + 1).padStart(2, '0'),
    String(now.getUTCDate()).padStart(2, '0'),
  ].join('-');
  return `${stamp}-${randomUUID()}${ext}`;
}

const r2Enabled =
  !!process.env.R2_BUCKET &&
  !!process.env.R2_ENDPOINT &&
  !!process.env.R2_ACCESS_KEY_ID &&
  !!process.env.R2_SECRET_ACCESS_KEY &&
  !!process.env.R2_PUBLIC_BASE_URL;

const R2_CACHE_CONTROL = 'public, max-age=31536000, immutable';

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

function getTodayStart() {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

export async function POST(req: Request) {
  try {
    // Get session
    const protocol = process.env.NODE_ENV === 'production' ? 'https' : 'http';
    const host = req.headers.get('host') || 'localhost:3000';
    const baseUrl = `${protocol}://${host}`;

    let session: Session | null = null;
    try {
      const response = await betterFetch(`${baseUrl}/api/auth/get-session`, {
        baseURL: baseUrl,
        headers: {
          cookie: req.headers.get('cookie') || '',
        },
      });
      session = response.data as Session | null;
    } catch (sessionError) {
      console.error('[Upload] Session fetch error:', sessionError);
    }

    const db = await getDb();
    let plan: Plan = PLAN_FREE;
    let userId: string | null = null;

    // 登录用户：从数据库查询 plan
    let planTier: PlanTier | null = null;
    let customStorageLimit: number | null = null;
    if (session?.user?.id) {
      userId = session.user.id;
      const [userRecord] = await db
        .select({
          plan: user.plan,
          planTier: user.planTier,
          storageLimit: user.storageLimit,
          planExpiresAt: user.planExpiresAt,
        })
        .from(user)
        .where(eq(user.id, userId!));
      const rawPlan = (userRecord?.plan as typeof PLAN_FREE | typeof PLAN_PAID) || PLAN_FREE;
      const subscriptionActive = isPaidSubscriptionActive(rawPlan, userRecord?.planExpiresAt ?? null);
      plan = subscriptionActive ? rawPlan : PLAN_FREE;
      planTier = subscriptionActive ? (userRecord?.planTier as PlanTier | null) : null;
      customStorageLimit = userRecord?.storageLimit ?? null;
    }

    // 根据 plan 和 planTier 确定上传路径
    let folderPath = 'free/';
    if (plan === PLAN_PAID) {
      if (planTier === PLAN_TIER_YEARLY) {
        folderPath = 'plus/';
      } else {
        folderPath = 'pro/';
      }
    } else if (userId) {
      // 登录但未付费用户
      folderPath = 'member/';
    }
    

    // Paid 用户：按 planTier 确定限制（0 = 无限）
    if (plan === PLAN_PAID) {
      const paidLimit = planTier ? PAID_UPLOAD_LIMITS[planTier] : PAID_UPLOAD_LIMITS[PLAN_TIER_MONTHLY];
      if (paidLimit > 0 && userId) {
        // 检查上传次数
        const todayStart = getTodayStart();
        const tomorrowStart = new Date(todayStart.getTime() + 24 * 60 * 60 * 1000);
        const [todayPhotoUploads] = await db
          .select({ n: count() })
          .from(userResource)
          .where(
            and(
              eq(userResource.userId, userId),
              gte(userResource.createdAt, todayStart),
              lt(userResource.createdAt, tomorrowStart)
            )
          );
        const [todayDocUploads] = await db
          .select({ n: count() })
          .from(userDocument)
          .where(
            and(
              eq(userDocument.userId, userId),
              gte(userDocument.createdAt, todayStart),
              lt(userDocument.createdAt, tomorrowStart)
            )
          );
        const todayUploads = Number(todayPhotoUploads?.n ?? 0) + Number(todayDocUploads?.n ?? 0);
        if (todayUploads >= paidLimit) {
          return NextResponse.json(
            { error: 'dailyLimitReached', errorParams: { limit: paidLimit }, plan, limit: paidLimit },
            { status: 429 }
          );
        }
      }
      // paidLimit === 0 means unlimited, skip check
    } else {
      // 登录的 free 用户：按数据库计数；匿名用户由首页 localStorage 限次，此处不查库
      const uploadLimit = userId ? LOGGED_IN_FREE_LIMIT : getUploadLimit(plan as typeof PLAN_FREE | typeof PLAN_PAID);
      if (userId) {
        const todayStart = getTodayStart();
        const tomorrowStart = new Date(todayStart.getTime() + 24 * 60 * 60 * 1000);
        const [todayPhotoUploads] = await db
          .select({ n: count() })
          .from(userResource)
          .where(
            and(
              eq(userResource.userId, userId),
              gte(userResource.createdAt, todayStart),
              lt(userResource.createdAt, tomorrowStart)
            )
          );
        const [todayDocUploads] = await db
          .select({ n: count() })
          .from(userDocument)
          .where(
            and(
              eq(userDocument.userId, userId),
              gte(userDocument.createdAt, todayStart),
              lt(userDocument.createdAt, tomorrowStart)
            )
          );
        const todayUploads = Number(todayPhotoUploads?.n ?? 0) + Number(todayDocUploads?.n ?? 0);
        if (todayUploads >= uploadLimit) {
          return NextResponse.json(
            {
              error: `dailyLimitReached`,
              errorParams: { limit: uploadLimit },
              plan,
              limit: uploadLimit,
            },
            { status: 429 }
          );
        }
      }
    }

    // 读取文件
    const formData = await req.formData();
    const file = formData.get('file');
    const sourceRaw = formData.get('source');
    const source = typeof sourceRaw === 'string' ? sourceRaw.trim() : '';
    const processedUrlMarker =
      source === ART_FIGHT_RESOURCE_MARKER ? ART_FIGHT_RESOURCE_MARKER : null;

    if (!file || !(file instanceof File)) {
      return NextResponse.json(
        { error: "No file provided. Use form-data field 'file'." },
        { status: 400 }
      );
    }

    const maxFileBytes = getMaxUploadFileBytes(plan, planTier);
    if (file.size > maxFileBytes) {
      const maxMb = Math.round(maxFileBytes / (1024 * 1024));
      return NextResponse.json(
        { error: 'fileTooLarge', errorParams: { maxMb, maxSize: formatUploadLimitForDisplay(maxFileBytes) } },
        { status: 400 }
      );
    }

    // 检查存储限制（仅登录用户）
    if (userId) {
      const storageLimit = getStorageLimit(plan, planTier, customStorageLimit);

      const [photoStorage] = await db
        .select({ s: sum(userResource.fileSize) })
        .from(userResource)
        .where(eq(userResource.userId, userId));
      const [docStorage] = await db
        .select({ s: sum(userDocument.fileSize) })
        .from(userDocument)
        .where(eq(userDocument.userId, userId));
      const storageUsed = Number(photoStorage?.s ?? 0) + Number(docStorage?.s ?? 0);

      if (storageUsed + file.size > storageLimit) {
        return NextResponse.json(
          {
            error: `storageLimitReached`,
            errorParams: { used: formatBytes(storageUsed), limit: formatBytes(storageLimit) },
            plan,
            storageUsed,
            storageLimit,
          },
          { status: 413 }
        );
      }
    }

    const resolved = resolveVideoExt(file);
    if (!resolved) {
      return NextResponse.json(
        {
          error:
            'Unsupported file type. Use MP4, MOV, AVI, WebM, MKV, MPEG, OGG, 3GP, or FLV.',
        },
        { status: 400 }
      );
    }
    const { ext, contentType } = resolved;

    if (!r2Enabled || !r2Client || !r2Bucket || !r2PublicBase) {
      return NextResponse.json(
        {
          error: 'Upload service is under maintenance. Please try again later.',
        },
        { status: 500 }
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const fileName = buildFileName(ext);
    const key = `${folderPath}${fileName}`;

    await r2Client.send(
      new PutObjectCommand({
        Bucket: r2Bucket,
        Key: key,
        Body: buffer,
        ContentType: contentType,
        CacheControl: R2_CACHE_CONTROL,
      })
    );

    const url = `${r2PublicBase}/${key}`;

    // 保存到数据库（登录用户 + 匿名用户固定归档）
    const userIdForDb = userId ?? ANON_DB_USER_ID;
    const resourceId = randomUUID();
    if (userIdForDb) {
      await db.insert(userResource).values({
        id: resourceId,
        userId: userIdForDb,
        filename: file.name,
        originalUrl: url,
        processedUrl: processedUrlMarker,
        fileSize: file.size,
        mimeType: contentType,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }

    return NextResponse.json({
      url,
      storage: 'r2',
      plan,
      id: resourceId,
    });
  } catch (error) {
    console.error('Upload error', error);
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json(
      {
        error: 'Upload failed. Please try again later.',
        details: message,
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Upload service is under maintenance. Please try again later.',
  });
}
