'use client';

import { AuthCard } from '@/components/auth/auth-card';
import { Button } from '@/components/ui/button';
import { useLocaleRouter } from '@/i18n/navigation';
import { authClient } from '@/lib/auth-client';
import { Routes } from '@/routes';
import { EyeIcon, EyeOffIcon, Loader2Icon } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useSearchParams } from 'next/navigation';
import { useState } from 'react';

export function ResetPasswordForm() {
  const t = useTranslations('AuthPage.resetPassword');
  const tLogin = useTranslations('AuthPage.login');
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  const invalidToken = searchParams.get('error') === 'invalid_token';
  const router = useLocaleRouter();

  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | undefined>('');
  const [isPending, setIsPending] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  if (!token || invalidToken) {
    return (
      <AuthCard
        headerLabel={t('title')}
        bottomButtonLabel={t('backToLoginHint')}
        bottomButtonHref={Routes.Login}
        bottomLinkText={tLogin('signIn')}
        className="w-full ptu-auth-card"
      >
        <p className="rounded-md bg-red-50 p-3 text-sm text-red-600">
          {invalidToken ? t('error.invalidToken') : t('error.missingToken')}
        </p>
        <Button
          type="button"
          variant="outline"
          className="mt-4 h-11 w-full rounded-lg text-[15px] font-semibold"
          onClick={() => router.push(Routes.ForgotPassword)}
        >
          {t('requestNewLink')}
        </Button>
      </AuthCard>
    );
  }

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password.length < 6) {
      setError(t('minLength'));
      return;
    }

    setIsPending(true);
    authClient.resetPassword(
      {
        newPassword: password,
        token,
      },
      {
        onRequest: () => {
          setIsPending(true);
        },
        onResponse: () => {
          setIsPending(false);
        },
        onSuccess: () => {
          router.push(Routes.Login);
        },
        onError: (ctx) => {
          const errorCode = ctx.error.code;
          const errorStatus = ctx.error.status;
          let errorMessage: string;
          if (errorCode === 'TOKEN_EXPIRED' || errorCode === 'EXPIRED_TOKEN') {
            errorMessage = t('error.expiredToken');
          } else if (
            errorCode === 'INVALID_TOKEN' ||
            errorCode === 'INVALID_VERIFICATION_TOKEN'
          ) {
            errorMessage = t('error.invalidToken');
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
      className="w-full ptu-auth-card"
    >
      <form onSubmit={onSubmit} className="space-y-6">
        <div>
          <label
            htmlFor="reset-password"
            className="mb-2 block text-sm font-medium"
          >
            {t('password')}
          </label>
          <div className="relative">
            <input
              id="reset-password"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={isPending}
              placeholder="******"
              required
              minLength={6}
              autoComplete="new-password"
              className="w-full rounded-md border border-input bg-background px-3 py-2 pr-10 text-sm ring-offset-background focus-visible:outline-none focus-visible:border-[#0abab5] focus-visible:ring-2 focus-visible:ring-[#0abab5]/25 focus-visible:ring-offset-2 disabled:opacity-50"
            />
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
              onClick={() => setShowPassword((prev) => !prev)}
              disabled={isPending}
            >
              {showPassword ? (
                <EyeOffIcon className="size-4 text-muted-foreground" />
              ) : (
                <EyeIcon className="size-4 text-muted-foreground" />
              )}
              <span className="sr-only">
                {showPassword ? t('hidePassword') : t('showPassword')}
              </span>
            </Button>
          </div>
        </div>

        {error ? (
          <p className="rounded-md bg-red-50 p-3 text-sm text-red-600">{error}</p>
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
          {t('reset')}
        </Button>
      </form>
    </AuthCard>
  );
}
