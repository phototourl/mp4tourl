'use client';

import { UpdatePasswordCard } from '@/components/settings/security/update-password-card';
import { ResetPasswordCard } from '@/components/settings/security/reset-password-card';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useHasCredentialProvider } from '@/hooks/use-has-credential-provider';
import { authClient } from '@/lib/auth-client';
import { settingsCard } from '@/components/settings/settings-card-classes';
import { useTranslations } from 'next-intl';

export function PasswordCardWrapper() {
  const { data: session } = authClient.useSession();
  const { hasCredentialProvider, isLoading, error } = useHasCredentialProvider(
    session?.user?.id,
  );

  if (error) {
    console.error('credential provider check:', error);
    return null;
  }

  if (isLoading) {
    return <PasswordSkeletonCard />;
  }

  if (hasCredentialProvider) {
    return <UpdatePasswordCard />;
  }

  if (session?.user?.email) {
    return <ResetPasswordCard />;
  }

  return null;
}

function PasswordSkeletonCard() {
  const t = useTranslations('Dashboard.settings.security.updatePassword');
  return (
    <Card className={settingsCard}>
      <CardHeader>
        <CardTitle className="text-lg font-semibold">{t('title')}</CardTitle>
        <CardDescription>{t('description')}</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col space-y-3">
        <Skeleton className="h-5 w-1/2" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-5 w-1/2" />
        <Skeleton className="h-10 w-full" />
      </CardContent>
      <CardFooter className="flex items-center justify-end rounded-none bg-muted px-6 py-4">
        <Skeleton className="h-9 w-24" />
      </CardFooter>
    </Card>
  );
}
