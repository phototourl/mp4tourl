'use client';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { settingsButtonPrimary } from '@/components/settings/settings-button-classes';
import { settingsCard } from '@/components/settings/settings-card-classes';
import { authClient } from '@/lib/auth-client';
import { cn } from '@/lib/utils';
import { Routes } from '@/routes';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { toast } from 'sonner';

interface ResetPasswordCardProps {
  className?: string;
}

/**
 * 仅社交登录时：请求向邮箱发送重置链接（需在服务端配置 sendResetPassword）。
 */
export function ResetPasswordCard({ className }: ResetPasswordCardProps) {
  const t = useTranslations('Dashboard.settings.security.resetPassword');
  const { data: session } = authClient.useSession();
  const [pending, setPending] = useState(false);

  const user = session?.user;
  if (!user?.email) {
    return null;
  }

  const handleRequest = async () => {
    setPending(true);
    try {
      // 与 EditStamp / forgot-password 一致：传相对路径，避免绝对 URL 被拼成 /zh/https://...
      const res = await fetch('/api/auth/request-password-reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          email: user.email,
          redirectTo: Routes.ResetPassword,
        }),
      });
      const data = (await res.json().catch(() => ({}))) as {
        message?: string;
        code?: string;
      };
      if (!res.ok) {
        if (data?.code === 'RESET_PASSWORD_DISABLED' || res.status === 400) {
          toast.error(t('disabled'));
        } else {
          toast.error(t('fail'));
        }
        return;
      }
      toast.success(t('sent'));
    } catch {
      toast.error(t('fail'));
    } finally {
      setPending(false);
    }
  };

  return (
    <Card
      className={cn(settingsCard, className)}
    >
      <CardHeader>
        <CardTitle className="text-lg font-semibold text-red-600 dark:text-red-400">{t('title')}</CardTitle>
        <CardDescription className="text-red-500 dark:text-red-400">{t('description')}</CardDescription>
      </CardHeader>
      <CardContent className="flex-1 space-y-4">
        <p className="text-sm text-red-600 dark:text-red-400">{t('info')}</p>
      </CardContent>
      <CardFooter className="mt-auto flex items-center justify-end rounded-none bg-muted px-6 py-4">
        <Button
          type="button"
          onClick={handleRequest}
          disabled={pending}
          className={cn('cursor-pointer', settingsButtonPrimary)}
        >
          {pending ? t('sending') : t('button')}
        </Button>
      </CardFooter>
    </Card>
  );
}
