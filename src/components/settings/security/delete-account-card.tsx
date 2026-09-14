'use client';

import { FormError } from '@/components/shared/form-error';
import { AlertDialog } from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { settingsButtonDestructive } from '@/components/settings/settings-button-classes';
import { settingsCard } from '@/components/settings/settings-card-classes';
import { useLocaleRouter } from '@/i18n/navigation';
import { authClient } from '@/lib/auth-client';
import { cn } from '@/lib/utils';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { toast } from 'sonner';

interface DeleteAccountCardProps {
  className?: string;
}

export function DeleteAccountCard({ className }: DeleteAccountCardProps) {
  const t = useTranslations('Dashboard.settings.security.deleteAccount');
  const [isDeleting, setIsDeleting] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [error, setError] = useState<string | undefined>('');
  const { data: session, refetch } = authClient.useSession();
  const router = useLocaleRouter();

  const user = session?.user;
  if (!user) {
    return null;
  }

  const handleDeleteAccount = async () => {
    await authClient.deleteUser(
      {},
      {
        onRequest: () => {
          setIsDeleting(true);
          setError('');
        },
        onResponse: () => {
          setIsDeleting(false);
          setShowConfirmation(false);
        },
        onSuccess: () => {
          toast.success(t('success'));
          refetch();
          router.replace('/');
        },
        onError: (ctx) => {
          console.error('deleteUser error:', ctx.error);
          setError(`${ctx.error.status}: ${ctx.error.message}`);
          toast.error(t('fail'));
        },
      },
    );
  };

  return (
    <Card
      className={cn(
        settingsCard,
        'ptu-settings-danger',
        'border-red-200 dark:border-red-900/50',
        className,
      )}
    >
      <CardHeader>
        <CardTitle className="text-lg font-bold text-red-600 dark:text-red-400">
          {t('title')}
        </CardTitle>
        <CardDescription className="text-red-500 dark:text-red-400">{t('description')}</CardDescription>
      </CardHeader>
      <CardContent className="flex-1">
        <p className="text-sm text-muted-foreground">{t('warning')}</p>
        {error ? (
          <div className="mt-4">
            <FormError message={error} />
          </div>
        ) : null}
      </CardContent>
      <CardFooter className="mt-2 flex items-center justify-end rounded-none bg-muted px-6 py-4">
        <Button
          variant="destructive"
          onClick={() => setShowConfirmation(true)}
          className={cn('cursor-pointer', settingsButtonDestructive)}
        >
          {t('button')}
        </Button>
      </CardFooter>

      <AlertDialog
        open={showConfirmation}
        title={t('confirmTitle')}
        description={t('confirmDescription')}
        confirmText={isDeleting ? t('deleting') : t('confirm')}
        cancelText={t('cancel')}
        onConfirm={handleDeleteAccount}
        onCancel={() => setShowConfirmation(false)}
        loading={isDeleting}
        destructive
      />
    </Card>
  );
}
