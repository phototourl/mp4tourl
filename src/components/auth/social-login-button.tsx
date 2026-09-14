'use client';

import { DividerWithText } from '@/components/auth/divider-with-text';
import { GoogleIcon } from '@/components/icons/google';
import { Button } from '@/components/ui/button';
import { websiteConfig } from '@/config/website';
import { authClient } from '@/lib/auth-client';
import { getUrlWithLocale } from '@/lib/urls/urls';
import { DEFAULT_LOGIN_REDIRECT, Routes } from '@/routes';
import { Loader2Icon } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { useSearchParams } from 'next/navigation';
import { useState } from 'react';

interface SocialLoginButtonProps {
  callbackUrl?: string;
  showDivider?: boolean;
}

/**
 * Social login buttons (Google only)
 */
export const SocialLoginButton = ({
  callbackUrl: propCallbackUrl,
  showDivider = true,
}: SocialLoginButtonProps) => {
  if (!websiteConfig.auth.enableGoogleLogin) {
    return null;
  }

  const t = useTranslations('AuthPage.login');
  const searchParams = useSearchParams();
  const paramCallbackUrl = searchParams.get('callbackUrl');
  const locale = useLocale();
  const defaultCallbackUrl = getUrlWithLocale(DEFAULT_LOGIN_REDIRECT, locale);
  const callbackUrl = propCallbackUrl || paramCallbackUrl || defaultCallbackUrl;
  const [isLoading, setIsLoading] = useState(false);

  const onClick = async () => {
    await authClient.signIn.social(
      {
        provider: 'google',
        callbackURL: callbackUrl,
        errorCallbackURL: Routes.AuthError,
      },
      {
        onRequest: () => {
          setIsLoading(true);
        },
        onResponse: () => {
          setIsLoading(false);
        },
        onSuccess: () => {
          setIsLoading(false);
        },
        onError: (ctx) => {
          console.log('social login error', ctx.error.message);
          setIsLoading(false);
        },
      }
    );
  };

  return (
    <div className="w-full flex flex-col gap-4">
      {showDivider && <DividerWithText text={t('or')} />}
      <Button
        size="lg"
        className="w-full cursor-pointer"
        variant="outline"
        onClick={() => void onClick()}
        disabled={isLoading}
      >
        {isLoading ? (
          <Loader2Icon className="mr-2 size-4 animate-spin" />
        ) : (
          <GoogleIcon className="size-4 mr-2" />
        )}
        <span>{t('signInWithGoogle')}</span>
      </Button>
    </div>
  );
};
