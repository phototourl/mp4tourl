import { authClient } from '@/lib/auth-client';

export const useCurrentUser = () => {
  const { data: session, error } = authClient.useSession();
  if (error) {
    if (
      process.env.NODE_ENV === 'development' &&
      error &&
      typeof error === 'object' &&
      Object.keys(error).length > 0
    ) {
      console.warn('useCurrentUser, error:', error);
    }
    return null;
  }
  return session?.user ?? null;
};
