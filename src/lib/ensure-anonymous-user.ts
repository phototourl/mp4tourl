import { getDb } from '@/db';
import { user } from '@/db/schema';
import {
  ANON_DB_USER_EMAIL,
  ANON_DB_USER_ID,
} from '@/lib/constants/anonymous-upload';
import { eq } from 'drizzle-orm';

/**
 * Ensure the fixed anonymous archive user exists (FK target for guest uploads).
 */
export async function ensureAnonymousUser(): Promise<string> {
  const db = await getDb();
  const [existing] = await db
    .select({ id: user.id })
    .from(user)
    .where(eq(user.id, ANON_DB_USER_ID))
    .limit(1);

  if (existing) {
    return existing.id;
  }

  const now = new Date();
  try {
    await db.insert(user).values({
      id: ANON_DB_USER_ID,
      name: 'Anonymous',
      email: ANON_DB_USER_EMAIL,
      emailVerified: false,
      createdAt: now,
      updatedAt: now,
      plan: 'free',
      filesGuideSeen: false,
    });
  } catch {
    // Concurrent create — treat as success
  }

  return ANON_DB_USER_ID;
}
