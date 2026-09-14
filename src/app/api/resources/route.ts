import { NextResponse } from 'next/server';
import { getDb } from '@/db';
import { userResource, user, userDocument } from '@/db/schema';
import { and, count, desc, eq, gte, like, lt, sum } from 'drizzle-orm';
import { S3Client, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getSessionFromRequest } from '@/lib/auth-api-session';
import {
  getStorageLimit,
  isPaidSubscriptionActive,
  LOGGED_IN_FREE_LIMIT,
  PAID_UPLOAD_LIMITS,
  PLAN_FREE,
  PLAN_TIER_MONTHLY,
  PLAN_TIER_YEARLY,
  type Plan,
  type PlanTier,
} from '@/lib/constants/plans';
import {
  RESOURCE_BULK_FETCH_PAGE_SIZE,
  RESOURCE_LIST_PAGE_SIZE_DEFAULT,
} from '@/lib/constants/resource-pagination';
import { ANON_DB_USER_ID } from '@/lib/constants/anonymous-upload';

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

const MAX_RESOURCE_PAGE_SIZE = 1000;

// Helper to extract R2 key from URL
function extractR2Key(url: string): string | null {
  try {
    const urlObj = new URL(url);
    // pathname is like /uploads/2024-01-15-xxx.jpg
    // R2 key should be uploads/2024-01-15-xxx.jpg (no leading slash)
    const pathname = urlObj.pathname;
    if (pathname.startsWith('/uploads/')) {
      return pathname.slice(1); // remove leading slash -> "uploads/..."
    }
    return pathname.slice(1); // remove leading slash
  } catch {
    return null;
  }
}

async function deleteFromR2(url: string): Promise<boolean> {
  console.log('[deleteFromR2] === Starting delete ===');
  console.log('[deleteFromR2] URL:', url);
  console.log('[deleteFromR2] R2_BUCKET:', process.env.R2_BUCKET);
  console.log('[deleteFromR2] R2_ENDPOINT:', process.env.R2_ENDPOINT);
  console.log('[deleteFromR2] r2Enabled:', r2Enabled);
  console.log('[deleteFromR2] r2Client exists:', !!r2Client);
  console.log('[deleteFromR2] r2Bucket:', r2Bucket);

  if (!r2Enabled || !r2Client || !r2Bucket) {
    console.log('[deleteFromR2] R2 not enabled or client not initialized - returning false');
    return false;
  }

  const key = extractR2Key(url);
  console.log('[deleteFromR2] Extracted key:', key);

  if (!key) {
    console.log('[deleteFromR2] No key extracted - returning false');
    return false;
  }

  try {
    console.log('[deleteFromR2] Sending DeleteObjectCommand...');
    console.log('[deleteFromR2] Bucket:', r2Bucket, 'Key:', key);

    const command = new DeleteObjectCommand({
      Bucket: r2Bucket,
      Key: key,
    });

    console.log('[deleteFromR2] Command created, sending to R2...');
    const result = await r2Client.send(command);
    console.log('[deleteFromR2] Delete result:', JSON.stringify(result));
    return true;
  } catch (error: unknown) {
    console.error('[deleteFromR2] Failed to delete from R2:', error);
    console.error('[deleteFromR2] Error name:', (error as Error)?.name);
    console.error('[deleteFromR2] Error message:', (error as Error)?.message);
    console.error('[deleteFromR2] Error code:', (error as { code?: string })?.code);
    return false;
  }
}

export async function GET(req: Request) {
  try {
    const session = await getSessionFromRequest(req);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;
    const db = await getDb();

    const { searchParams } = new URL(req.url);
    /** 设置页等只需套餐/用量，不拉取资源列表（避免默认 limit 1000 的大查询） */
    const metaOnly =
      searchParams.get('metaOnly') === '1' ||
      searchParams.get('metaOnly') === 'true';
    /** 定价页等只需要订阅档位，跳过 count/sum 聚合 */
    const planOnly =
      searchParams.get('planOnly') === '1' ||
      searchParams.get('planOnly') === 'true';

    if (planOnly) {
      const [userRecord] = await db
        .select({
          plan: user.plan,
          planTier: user.planTier,
          storageLimit: user.storageLimit,
          planExpiresAt: user.planExpiresAt,
          userType: user.userType,
        })
        .from(user)
        .where(eq(user.id, userId));

      const rawPlan = (userRecord?.plan as Plan) || PLAN_FREE;
      const rawPlanTier = userRecord?.planTier || null;
      const subscriptionActive = isPaidSubscriptionActive(
        rawPlan,
        userRecord?.planExpiresAt ?? null
      );
      const effectivePlan = subscriptionActive ? rawPlan : PLAN_FREE;
      const effectivePlanTier = subscriptionActive ? rawPlanTier : null;
      const storageLimit = getStorageLimit(
        effectivePlan as Plan,
        (effectivePlanTier as PlanTier | null) ?? null,
        userRecord?.storageLimit ?? null
      );
      const uploadLimit =
        effectivePlan === PLAN_FREE
          ? LOGGED_IN_FREE_LIMIT
          : effectivePlanTier === PLAN_TIER_YEARLY
            ? PAID_UPLOAD_LIMITS[PLAN_TIER_YEARLY]
            : PAID_UPLOAD_LIMITS[PLAN_TIER_MONTHLY];

      return NextResponse.json({
        resources: [],
        total: 0,
        docTotal: 0,
        totalResources: 0,
        page: 1,
        pageSize: 0,
        storageUsed: 0,
        storageLimit,
        uploadLimit,
        plan: rawPlan,
        planTier: effectivePlanTier,
        planExpiresAt: userRecord?.planExpiresAt ?? null,
        subscriptionActive,
        uploadsToday: 0,
        userType: userRecord?.userType ?? null,
      });
    }

    const paginationTouched =
      searchParams.has('page') || searchParams.has('pageSize');
    const pageRaw = parseInt(searchParams.get('page') || '1', 10);
    const defaultPageSize = paginationTouched
      ? RESOURCE_LIST_PAGE_SIZE_DEFAULT
      : RESOURCE_BULK_FETCH_PAGE_SIZE;
    const pageSizeRaw = parseInt(
      searchParams.get('pageSize') || String(defaultPageSize),
      10
    );
    const page = Number.isFinite(pageRaw) && pageRaw >= 1 ? pageRaw : 1;
    const pageSize = Math.min(
      MAX_RESOURCE_PAGE_SIZE,
      Math.max(1, Number.isFinite(pageSizeRaw) ? pageSizeRaw : defaultPageSize)
    );
    const offset = (page - 1) * pageSize;
    const q = (searchParams.get('q') || '').trim();

    // Get start of today in UTC
    const now = new Date();
    const todayStart = new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())
    );
    const tomorrowStart = new Date(todayStart.getTime() + 24 * 60 * 60 * 1000);

    const userScope = q
      ? and(eq(userResource.userId, userId), like(userResource.filename, `%${q}%`))
      : eq(userResource.userId, userId);

    const [totalRow] = await db
      .select({ n: count() })
      .from(userResource)
      .where(userScope);
    const photoTotal = Number(totalRow?.n ?? 0);

    const [docTotalRow] = await db
      .select({ n: count() })
      .from(userDocument)
      .where(eq(userDocument.userId, userId));
    const docTotal = Number(docTotalRow?.n ?? 0);
    const totalResources = photoTotal + docTotal;

    const [sumRow] = await db
      .select({ s: sum(userResource.fileSize) })
      .from(userResource)
      .where(userScope);
    const [docSumRow] = await db
      .select({ s: sum(userDocument.fileSize) })
      .from(userDocument)
      .where(eq(userDocument.userId, userId));
    const storageUsed = Number(sumRow?.s ?? 0) + Number(docSumRow?.s ?? 0);

    const [uploadsTodayRow] = await db
      .select({ n: count() })
      .from(userResource)
      .where(
        and(
          userScope,
          gte(userResource.createdAt, todayStart),
          lt(userResource.createdAt, tomorrowStart)
        )
      );
    const [docUploadsTodayRow] = await db
      .select({ n: count() })
      .from(userDocument)
      .where(
        and(
          eq(userDocument.userId, userId),
          gte(userDocument.createdAt, todayStart),
          lt(userDocument.createdAt, tomorrowStart)
        )
      );
    const uploadsToday = Number(uploadsTodayRow?.n ?? 0) + Number(docUploadsTodayRow?.n ?? 0);

    const resources = metaOnly
      ? []
      : await db
          .select()
          .from(userResource)
          .where(userScope)
          .orderBy(desc(userResource.createdAt))
          .limit(pageSize)
          .offset(offset);

    // Fetch user's plan, planTier and custom storage limit from user table
    const [userRecord] = await db
      .select({
        plan: user.plan,
        planTier: user.planTier,
        storageLimit: user.storageLimit,
        planExpiresAt: user.planExpiresAt,
        userType: user.userType,
      })
      .from(user)
      .where(eq(user.id, userId));

    const rawPlan = (userRecord?.plan as Plan) || PLAN_FREE;
    const rawPlanTier = userRecord?.planTier || null;
    const subscriptionActive = isPaidSubscriptionActive(rawPlan, userRecord?.planExpiresAt ?? null);
    const effectivePlan = subscriptionActive ? rawPlan : PLAN_FREE;
    const effectivePlanTier = subscriptionActive ? rawPlanTier : null;
    const storageLimit = getStorageLimit(
      effectivePlan as Plan,
      (effectivePlanTier as PlanTier | null) ?? null,
      userRecord?.storageLimit ?? null
    );
    const uploadLimit =
      effectivePlan === PLAN_FREE
        ? LOGGED_IN_FREE_LIMIT
        : effectivePlanTier === PLAN_TIER_YEARLY
          ? PAID_UPLOAD_LIMITS[PLAN_TIER_YEARLY]
          : PAID_UPLOAD_LIMITS[PLAN_TIER_MONTHLY];

    return NextResponse.json({
      resources,
      total: photoTotal,
      docTotal,
      totalResources,
      page: metaOnly ? 1 : page,
      pageSize: metaOnly ? 0 : pageSize,
      storageUsed,
      storageLimit,
      uploadLimit,
      plan: rawPlan,
      // Only expose tier while subscription is active (avoids stale monthly/yearly on pricing).
      planTier: effectivePlanTier,
      planExpiresAt: userRecord?.planExpiresAt ?? null,
      subscriptionActive,
      uploadsToday,
      userType: userRecord?.userType ?? null,
    });
  } catch (error) {
    console.error('Failed to fetch resources:', error);
    return NextResponse.json({ error: 'Failed to fetch resources' }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  console.log('[Resources DELETE] === DELETE request received ===');
  console.log('[Resources DELETE] URL:', req.url);
  try {
    const db = await getDb();
    const { searchParams } = new URL(req.url);
    const resourceId = searchParams.get('id');

    if (!resourceId) {
      return NextResponse.json({ error: 'Resource ID required' }, { status: 400 });
    }

    const [resource] = await db
      .select()
      .from(userResource)
      .where(eq(userResource.id, resourceId));

    if (!resource) {
      return NextResponse.json({ error: 'Resource not found' }, { status: 404 });
    }

    const isAnonymousResource = resource.userId === ANON_DB_USER_ID;

    // 匿名归档资源：仅凭 id 可删（首页游客 Clear/Delete）
    // 登录用户资源：必须鉴权，且只能删自己的
    if (!isAnonymousResource) {
      const session = await getSessionFromRequest(req);

      if (!session?.user?.id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
      if (resource.userId !== session.user.id) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
    }

    console.log('[Resources DELETE] userId:', resource.userId, 'originalUrl:', resource.originalUrl);

    if (resource.originalUrl) {
      const deleted = await deleteFromR2(resource.originalUrl);
      console.log('[Resources DELETE] R2 original delete result:', deleted);
    }

    if (
      resource.processedUrl &&
      resource.processedUrl.startsWith('http') &&
      resource.processedUrl !== resource.originalUrl
    ) {
      const deletedProcessed = await deleteFromR2(resource.processedUrl);
      console.log('[Resources DELETE] R2 processed delete result:', deletedProcessed);
    }

    await db.delete(userResource).where(eq(userResource.id, resourceId));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to delete resource:', error);
    return NextResponse.json({ error: 'Failed to delete resource' }, { status: 500 });
  }
}
