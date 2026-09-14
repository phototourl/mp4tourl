import { NextResponse } from 'next/server';
import { getAuth } from '@/lib/auth';
import { getDb } from '@/db';
import { user, userResource } from '@/db/schema';
import { eq, lt } from 'drizzle-orm';
import { S3Client, DeleteObjectCommand } from '@aws-sdk/client-s3';

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

function extractR2Key(url: string): string | null {
  try {
    const urlObj = new URL(url);
    const pathname = urlObj.pathname;
    if (pathname.startsWith('/uploads/')) {
      return pathname.slice(1); // remove leading slash
    }
    return pathname.slice(1);
  } catch {
    return null;
  }
}

async function deleteFromR2(url: string): Promise<boolean> {
  if (!r2Enabled || !r2Client || !r2Bucket) return false;

  const key = extractR2Key(url);
  if (!key) return false;

  try {
    await r2Client.send(
      new DeleteObjectCommand({
        Bucket: r2Bucket,
        Key: key,
      })
    );
    return true;
  } catch (error) {
    console.error('Failed to delete from R2:', error);
    return false;
  }
}

/**
 * POST - Purge resources that have passed their deleteAt date
 * Should be called by a cron job daily
 */
export async function POST() {
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

    const [adminUser] = await db
      .select({ role: user.role })
      .from(user)
      .where(eq(user.id, session.user.id));

    if (adminUser?.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const now = new Date();

    // Find all resources where deleteAt < now
    const expiredResources = await db
      .select()
      .from(userResource)
      .where(lt(userResource.deleteAt, now));

    let deleted = 0;
    let failed = 0;

    for (const resource of expiredResources) {
      // Delete from R2
      if (resource.originalUrl) {
        await deleteFromR2(resource.originalUrl);
      }

      // Delete from database
      await db
        .delete(userResource)
        .where(eq(userResource.id, resource.id));

      deleted++;
    }

    return NextResponse.json({
      success: true,
      deleted,
      failed,
      message: `Purged ${deleted} expired resources`,
    });
  } catch (error) {
    console.error('Purge error:', error);
    return NextResponse.json({ error: 'Purge failed' }, { status: 500 });
  }
}
