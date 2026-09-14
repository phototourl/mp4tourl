'use client';

import { AuthCard } from '@/components/auth/auth-card';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';
import { authClient } from '@/lib/auth-client';
import {
  PENDING_USER_TYPE_STORAGE_KEY,
  USER_TYPE_ART_FIGHT,
} from '@/lib/constants/user-type';
import { Routes } from '@/routes';
import { EyeIcon, EyeOffIcon, Loader2Icon } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useSearchParams } from 'next/navigation';
import { useMemo, useState } from 'react';

const GoogleIcon = () => (
  <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24" aria-hidden>
    <path
      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      fill="#4285F4"
    />
    <path
      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      fill="#34A853"
    />
    <path
      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
      fill="#FBBC05"
    />
    <path
      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      fill="#EA4335"
    />
  </svg>
);

function shouldDefaultArtFight(
  userTypeParam: string | null,
  callbackUrl: string
): boolean {
  if (userTypeParam === USER_TYPE_ART_FIGHT) return true;
  return callbackUrl.includes('art-fight-image-hosting');
}

export interface RegisterFormProps {
  className?: string;
  callbackUrl?: string;
  embedded?: boolean;
  showLogo?: boolean;
  /** 弹框内切回登录 */
  onSwitchToLogin?: () => void;
}

export function RegisterForm({
  className,
  callbackUrl: propCallbackUrl,
  embedded = false,
  showLogo = false,
  onSwitchToLogin,
}: RegisterFormProps) {
  const t = useTranslations('AuthPage');
  const tRegister = useTranslations('AuthPage.register');
  const tLogin = useTranslations('AuthPage.login');
  const tErrors = useTranslations('AuthPage.errors');
  const searchParams = useSearchParams();
  const paramCallbackUrl = searchParams.get('callbackUrl');
  const userTypeParam = searchParams.get('userType');
  const callbackUrl =
    propCallbackUrl || paramCallbackUrl || Routes.Dashboard;

  const defaultArtFight = useMemo(
    () => shouldDefaultArtFight(userTypeParam, callbackUrl),
    [userTypeParam, callbackUrl]
  );

  const [error, setError] = useState<string | undefined>('');
  const [isPending, setIsPending] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [artFightArtist, setArtFightArtist] = useState(defaultArtFight);

  const persistArtFightTypeIfNeeded = () => {
    if (artFightArtist) {
      sessionStorage.setItem(PENDING_USER_TYPE_STORAGE_KEY, USER_TYPE_ART_FIGHT);
    } else {
      sessionStorage.removeItem(PENDING_USER_TYPE_STORAGE_KEY);
    }
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsPending(true);
    persistArtFightTypeIfNeeded();

    await authClient.signUp.email(
      {
        email,
        password,
        name,
        callbackURL: callbackUrl,
        ...(artFightArtist ? { userType: USER_TYPE_ART_FIGHT } : {}),
      },
      {
        onRequest: () => {
          setIsPending(true);
        },
        onResponse: () => {
          setIsPending(false);
        },
        onSuccess: () => {
          sessionStorage.removeItem(PENDING_USER_TYPE_STORAGE_KEY);
          window.location.href = callbackUrl;
        },
        onError: (ctx) => {
          const errorCode = ctx.error.code;
          const status: number | string = ctx.error.status;
          let errorMessage = `${status}: ${ctx.error.message}`;

          if (errorCode === 'USER_ALREADY_EXISTS') {
            errorMessage = tErrors('USER_ALREADY_EXISTS');
          } else if (errorCode === 'INVALID_CREDENTIALS') {
            errorMessage = tErrors('INVALID_CREDENTIALS');
          } else if (errorCode === 'INVALID_EMAIL') {
            errorMessage = tErrors('INVALID_EMAIL');
          } else if (errorCode === 'INVALID_PASSWORD') {
            errorMessage = tErrors('INVALID_PASSWORD');
          } else if (errorCode === 'EMAIL_REQUIRED') {
            errorMessage = tErrors('EMAIL_REQUIRED');
          } else if (errorCode === 'PASSWORD_REQUIRED') {
            errorMessage = tErrors('PASSWORD_REQUIRED');
          } else if (errorCode === 'NAME_REQUIRED') {
            errorMessage = tErrors('NAME_REQUIRED');
          } else if (typeof status === 'number' && status >= 500) {
            errorMessage = tErrors('SERVER_ERROR');
          } else if (
            status === 0 ||
            (typeof status === 'string' && status === 'NETWORK_ERROR')
          ) {
            errorMessage = tErrors('NETWORK_ERROR');
          }

          setError(errorMessage);
          setIsPending(false);
        },
      }
    );
  };

  const onGoogleSignUp = () => {
    setError('');
    setIsPending(true);
    persistArtFightTypeIfNeeded();
    authClient.signIn.social(
      {
        provider: 'google',
        callbackURL: callbackUrl,
      },
      {
        onRequest: () => {
          setIsPending(true);
        },
        onResponse: () => {
          setIsPending(false);
        },
        onError: (ctx) => {
          console.error('Google sign up error:', ctx.error.message);
          setError(ctx.error.message);
          setIsPending(false);
        },
      }
    );
  };

  return (
    <AuthCard
      headerLabel={tRegister('createAccount')}
      bottomButtonLabel={tRegister('signInHint')}
      bottomButtonHref={onSwitchToLogin ? undefined : Routes.Login}
      onBottomButtonClick={onSwitchToLogin}
      bottomLinkText={tLogin('signIn')}
      showLogo={showLogo}
      className={
        embedded
          ? `w-full border-none shadow-none ${className ?? ''}`
          : `w-full ptu-auth-card ${className ?? ''}`
      }
    >
      <form onSubmit={onSubmit} className="space-y-6">
        <div className="space-y-4">
          <Button
            type="button"
            variant="outline"
            disabled={isPending}
            className="h-11 w-full rounded-lg text-[15px] font-semibold"
            onClick={onGoogleSignUp}
          >
            <GoogleIcon />
            {tRegister('signUpWithGoogle')}
          </Button>
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-slate-200" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white px-2 text-slate-400 dark:bg-slate-900">
                {t('orContinueWith')}
              </span>
            </div>
          </div>
          <div>
            <label htmlFor="register-name" className="mb-2 block text-sm font-medium">
              {tRegister('name')}
            </label>
            <input
              id="register-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={isPending}
              placeholder={tRegister('namePlaceholder')}
              required
              minLength={2}
              maxLength={50}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:border-[#0abab5] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0abab5]/25 focus-visible:ring-offset-2 disabled:opacity-50"
            />
          </div>
          <div>
            <label htmlFor="register-email" className="mb-2 block text-sm font-medium">
              {tRegister('email')}
            </label>
            <input
              id="register-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isPending}
              placeholder="name@example.com"
              required
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:border-[#0abab5] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0abab5]/25 focus-visible:ring-offset-2 disabled:opacity-50"
            />
          </div>
          <div>
            <label
              htmlFor="register-password"
              className="mb-2 block text-sm font-medium"
            >
              {tRegister('password')}
            </label>
            <div className="relative">
              <input
                id="register-password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isPending}
                placeholder="******"
                required
                minLength={6}
                className="w-full rounded-md border border-input bg-background px-3 py-2 pr-10 text-sm ring-offset-background focus-visible:border-[#0abab5] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0abab5]/25 focus-visible:ring-offset-2 disabled:opacity-50"
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
              </Button>
            </div>
          </div>

          <div className="rounded-lg border border-teal-200/80 bg-teal-50/50 p-3">
            <div className="flex items-start gap-3">
              <input
                type="checkbox"
                checked={artFightArtist}
                onChange={(e) => setArtFightArtist(e.target.checked)}
                disabled={isPending}
                aria-label={tRegister('artFightLabel')}
                className="mt-1 h-4 w-4 shrink-0 cursor-pointer rounded border-slate-300 text-teal-600 focus:ring-teal-500"
              />
              <Accordion className="min-w-0 flex-1">
                <AccordionItem value="art-fight-hint" className="border-none">
                  <AccordionTrigger className="py-0 hover:no-underline **:data-[slot=accordion-trigger-icon]:text-slate-500">
                    <span className="text-sm font-medium text-slate-900">
                      {tRegister('artFightLabel')}
                    </span>
                  </AccordionTrigger>
                  <AccordionContent className="pb-0 pt-1.5 text-xs leading-relaxed text-slate-600">
                    {tRegister('artFightHint')}
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </div>
          </div>
        </div>

        {error && (
          <p className="rounded-md bg-red-50 p-3 text-sm text-red-600">{error}</p>
        )}

        <Button
          type="submit"
          variant="outline"
          disabled={isPending}
          className="h-11 w-full rounded-lg text-[15px] font-semibold"
        >
          {isPending && <Loader2Icon className="mr-2 size-4 animate-spin" />}
          {tRegister('signUp')}
        </Button>
      </form>
    </AuthCard>
  );
}
