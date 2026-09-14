'use client';

import { AuthDialog } from '@/components/auth/auth-dialog';
import { Routes } from '@/routes';
import {
  cloneElement,
  isValidElement,
  useEffect,
  useState,
  type ReactElement,
  type ReactNode,
} from 'react';

interface LoginWrapperProps {
  children: ReactNode;
  callbackUrl?: string;
}

/**
 * 导航栏登录入口：点击后打开登录/注册弹框。
 */
export function LoginWrapper({
  children,
  callbackUrl = Routes.Dashboard,
}: LoginWrapperProps) {
  const [mounted, setMounted] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <>{children}</>;
  }

  const trigger = isValidElement(children)
    ? cloneElement(children as ReactElement<{ onClick?: (e: React.MouseEvent) => void }>, {
        onClick: (e: React.MouseEvent) => {
          (children as ReactElement<{ onClick?: (e: React.MouseEvent) => void }>).props
            .onClick?.(e);
          setOpen(true);
        },
      })
    : (
        <button type="button" onClick={() => setOpen(true)}>
          {children}
        </button>
      );

  return (
    <>
      {trigger}
      <AuthDialog open={open} onOpenChange={setOpen} callbackUrl={callbackUrl} />
    </>
  );
}
