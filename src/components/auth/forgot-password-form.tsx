'use client';

import { AuthCard } from '@/components/auth/auth-card';
import { Button } from '@/components/ui/button';
import { authClient } from '@/lib/auth-client';
import { Routes } from '@/routes';
import { Loader2Icon } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';

export function ForgotPasswordForm({ className }: { className?: string }) {
  const t = useTranslations('AuthPage.forgotPassword');
  const tLogin = useTranslations('AuthPage.login');
  const searchParams = useSearchParams();
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | undefined>('');
  const [success, setSuccess] = useState<string | undefined>('');
  const [isPending, setIsPending] = useState(false);

  useEffect(() => {
    const emailFromUrl = searchParams.get('email');
    if (emailFromUrl) setEmail(emailFromUrl);
  }, [searchParams]);

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setIsPending(true);

    // better-auth：POST /api/auth/request-password-reset（旧路径 /forget-password 已 404）
    authClient.requestPasswordReset(
      {
        email,
        redirectTo: Routes.ResetPassword,
      },
      {
        onRequest: () => {
          setIsPending(true);
        },
        onResponse: () => {
          setIsPending(false);
        },
        onSuccess: () => {
          setSuccess(t('checkEmail'));
        },
        onError: (ctx) => {
          const errorCode = ctx.error.code;
          const errorStatus = ctx.error.status;
          let errorMessage: string;
          if (
            errorCode === 'USER_NOT_FOUND' ||
            errorCode === 'CREDENTIAL_ACCOUNT_NOT_FOUND' ||
            errorStatus === 404
          ) {
            // Avoid account enumeration — same message as success path copy.
            setSuccess(t('checkEmail'));
            setError('');
            setIsPending(false);
            return;
          } else if (errorCode === 'RATE_LIMIT_EXCEEDED' || errorStatus === 429) {
            errorMessage = t('error.tooManyRequests');
          } else if (errorStatus === 500) {
            errorMessage = t('error.serverError');
          } else {
            errorMessage = ctx.error.message;
          }
          setError(errorMessage);
          setIsPending(false);
        },
      }
    );
  };

  return (
    <AuthCard
      headerLabel={t('title')}
      bottomButtonLabel={t('backToLoginHint')}
      bottomButtonHref={Routes.Login}
      bottomLinkText={tLogin('signIn')}
      className={`w-full ptu-auth-card ${className ?? ''}`}
    >
      <form onSubmit={onSubmit} className="space-y-6">
        <p className="text-sm text-slate-500 dark:text-slate-400">
          {t('description')}
        </p>
        <div>
          <label
            htmlFor="forgot-email"
            className="mb-2 block text-sm font-medium"
          >
            {t('email')}
          </label>
          <input
            id="forgot-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={isPending}
            placeholder="name@example.com"
            required
            autoComplete="email"
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:border-[#0abab5] focus-visible:ring-2 focus-visible:ring-[#0abab5]/25 focus-visible:ring-offset-2 disabled:opacity-50"
          />
        </div>

        {error ? (
          <p className="rounded-md bg-red-50 p-3 text-sm text-red-600">{error}</p>
        ) : null}
        {success ? (
          <p className="rounded-md bg-teal-50 p-3 text-sm text-[#0abab5]">
            {success}
          </p>
        ) : null}

        <Button
          type="submit"
          variant="outline"
          disabled={isPending}
          className="h-11 w-full rounded-lg text-[15px] font-semibold"
        >
          {isPending ? (
            <Loader2Icon className="mr-2 size-4 animate-spin" />
          ) : null}
          {t('send')}
        </Button>
      </form>
    </AuthCard>
  );
}
