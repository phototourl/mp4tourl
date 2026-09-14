import type { Session } from '@/lib/auth-types';

/**
 * Resolve session in-process (no HTTP loopback to /api/auth/get-session).
 */
export async function getSessionFromRequest(
  req: Request
): Promise<Session | null> {
  try {
    const { getAuth } = await import('@/lib/auth');
    const auth = await getAuth();
    const session = await auth.api.getSession({
      headers: req.headers,
    });
    return (session as Session | null) ?? null;
  } catch {
    return null;
  }
}
