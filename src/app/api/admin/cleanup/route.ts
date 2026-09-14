import { NextResponse } from 'next/server';
import { getAuth } from '@/lib/auth';
import { getDb } from '@/db';
import { user, userResource } from '@/db/schema';
import { eq, and, lt, isNull } from 'drizzle-orm';
import { DEFAULT_STORAGE_LIMITS, PLAN_FREE, GRACE_PERIOD_MS } from '@/lib/constants/plans';

/**
 * Admin API to cleanup expired paid plans and mark resources for deletion.
 * Should be called by a cron job daily.
 *
 * Flow:
 * 1. Find users whose paid plan has expired
 * 2. Downgrade them to 'free' plan
 * 3. Calculate their total storage usage
 * 4. If over 100MB limit, mark oldest resources for deletion (30 days grace period)
 */
export async function POST() {
  try {
    const auth = await getAuth();
    if (!auth) {
      return NextResponse.json({ error: 'Auth not initialized' }, { status: 500 });
    }

    const session = await auth.getSession();

    // Only allow admin users to call this endpoint
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const db = await getDb();

    const [adminUser] = await db
      .select({ role: user.role })
      .from(user)
      .where(eq(user.id, session.user.id));

    if (adminUser?.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const now = new Date();

    // Find users with expired paid plans (planExpiresAt is set and in the past)
    const expiredUsers = await db
      .select()
      .from(user)
      .where(
        and(
          eq(user.plan, 'paid'),
          lt(user.planExpiresAt, now)
        )
      );

    let processedUsers = 0;
    let markedForDeletion = 0;

    for (const expiredUser of expiredUsers) {
      // Downgrade to free
      await db
        .update(user)
        .set({ plan: PLAN_FREE })
        .where(eq(user.id, expiredUser.id));

      // Calculate storage usage
      const resources = await db
        .select()
        .from(userResource)
        .where(
          and(
            eq(userResource.userId, expiredUser.id),
            isNull(userResource.deleteAt)
          )
        );

      const storageUsed = resources.reduce((sum: number, r: typeof userResource.$inferSelect) => sum + (r.fileSize || 0), 0);
      const storageLimit = DEFAULT_STORAGE_LIMITS[PLAN_FREE]; // Free plan storage limit (from shared config)

      if (storageUsed > storageLimit) {
        // Sort by creation date (oldest first)
        const sortedResources = [...resources].sort(
          (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        );

        // Calculate how much we need to delete
        let bytesToDelete = storageUsed - storageLimit;
        const deleteAt = new Date(now.getTime() + GRACE_PERIOD_MS);

        for (const resource of sortedResources) {
          if (bytesToDelete <= 0) break;

          // Mark resource for deletion
          await db
            .update(userResource)
            .set({ deleteAt })
            .where(eq(userResource.id, resource.id));

          bytesToDelete -= resource.fileSize || 0;
          markedForDeletion++;
        }
      }

      processedUsers++;
    }

    return NextResponse.json({
      success: true,
      processedUsers,
      markedForDeletion,
      message: `Processed ${processedUsers} expired users, marked ${markedForDeletion} resources for deletion`,
    });
  } catch (error) {
    console.error('Cleanup error:', error);
    return NextResponse.json({ error: 'Cleanup failed' }, { status: 500 });
  }
}

/**
 * GET - Check cleanup status (for monitoring)
 */
export async function GET() {
  try {
    const auth = await getAuth();
    if (!auth) {
      return NextResponse.json({ error: 'Auth not initialized' }, { status: 500 });
    }

    const session = await auth.getSession();

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const db = await getDb();
    const now = new Date();

    // Count expired paid users
    const expiredUsers = await db
      .select({ id: user.id })
      .from(user)
      .where(
        and(
          eq(user.plan, 'paid'),
          lt(user.planExpiresAt, now)
        )
      );

    // Count resources marked for deletion (deleteAt is set and in the past)
    const markedForDeletion = await db
      .select({ id: userResource.id })
      .from(userResource)
      .where(lt(userResource.deleteAt, now));

    return NextResponse.json({
      expiredPaidUsers: expiredUsers.length,
      pendingDeletionResources: markedForDeletion.length,
      now: now.toISOString(),
    });
  } catch (error) {
    console.error('Status check error:', error);
    return NextResponse.json({ error: 'Status check failed' }, { status: 500 });
  }
}
