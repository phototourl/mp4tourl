'use client';

import { LoginForm } from '@/components/auth/login-form';
import { RegisterForm } from '@/components/auth/register-form';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useTranslations } from 'next-intl';
import { Suspense, useEffect, useState } from 'react';

export type AuthDialogMode = 'login' | 'register';

export interface AuthDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  callbackUrl?: string;
  /** 打开时默认 tab；关闭后重置 */
  initialMode?: AuthDialogMode;
}

/**
 * 登录/注册弹框：对齐 editstamp（内置右上角关闭，sm:max-w-[420px]）。
 */
export function AuthDialog({
  open,
  onOpenChange,
  callbackUrl,
  initialMode = 'login',
}: AuthDialogProps) {
  const tLogin = useTranslations('AuthPage.login');
  const tRegister = useTranslations('AuthPage.register');
  const [mode, setMode] = useState<AuthDialogMode>(initialMode);

  useEffect(() => {
    if (open) setMode(initialMode);
  }, [open, initialMode]);

  const handleOpenChange = (next: boolean) => {
    onOpenChange(next);
    if (!next) setMode(initialMode);
  };

  const a11yTitle =
    mode === 'register' ? tRegister('createAccount') : tLogin('welcomeBack');

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-h-[min(90dvh,840px)] w-[calc(100%-1.5rem)] overflow-y-auto p-0 gap-0 sm:max-w-[420px]">
        <DialogHeader className="sr-only">
          <DialogTitle>{a11yTitle}</DialogTitle>
        </DialogHeader>

        <Suspense fallback={null}>
          {mode === 'register' ? (
            <RegisterForm
              callbackUrl={callbackUrl}
              embedded
              showLogo
              onSwitchToLogin={() => setMode('login')}
            />
          ) : (
            <LoginForm
              callbackUrl={callbackUrl}
              embedded
              showLogo
              onSwitchToRegister={() => setMode('register')}
            />
          )}
        </Suspense>
      </DialogContent>
    </Dialog>
  );
}
