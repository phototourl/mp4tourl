'use client';

import { getBaseUrl } from '@/lib/urls';
import { useEffect, useState } from 'react';

type LinkedAccount = { providerId: string };

/**
 * 是否已绑定邮箱密码登录（credential），用于决定显示「改密」还是「通过邮件设密码」。
 */
export function useHasCredentialProvider(userId: string | undefined) {
  const [hasCredentialProvider, setHasCredentialProvider] = useState(false);
  const [isLoading, setIsLoading] = useState(Boolean(userId));
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!userId) {
      setIsLoading(false);
      setHasCredentialProvider(false);
      setError(null);
      return;
    }

    let cancelled = false;
    setIsLoading(true);
    setError(null);

    (async () => {
      try {
        const res = await fetch(`${getBaseUrl()}/api/auth/list-accounts`, {
          credentials: 'include',
        });
        if (!res.ok) {
          throw new Error(`list-accounts: ${res.status}`);
        }
        const accounts = (await res.json()) as LinkedAccount[];
        if (cancelled) return;
        setHasCredentialProvider(
          accounts.some((a) => a.providerId === 'credential'),
        );
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e : new Error('list-accounts failed'));
          setHasCredentialProvider(false);
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [userId]);

  return { hasCredentialProvider, isLoading, error };
}
