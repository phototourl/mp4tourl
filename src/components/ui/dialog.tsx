'use client';

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';
import { createPortal } from 'react-dom';
import { XIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DialogContextValue {
  onOpenChange: (open: boolean) => void;
}

const DialogContext = createContext<DialogContextValue | null>(null);

interface DialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: ReactNode;
}

interface DialogContentProps {
  children: ReactNode;
  className?: string;
  /** 默认 true；图片预览等自带关闭钮时可关掉 */
  showCloseButton?: boolean;
  /** 铺满视口（去掉外层 padding，移动端全屏预览用） */
  fullScreen?: boolean;
}

interface DialogHeaderProps {
  children: ReactNode;
  className?: string;
}

interface DialogFooterProps {
  children: ReactNode;
  className?: string;
}

interface DialogTitleProps {
  children: ReactNode;
  className?: string;
}

interface DialogDescriptionProps {
  children: ReactNode;
  className?: string;
}

/**
 * Portal 弹层。内容用 flex 居中，避免 zoom 动画覆盖 translate 导致错位。
 */
export function Dialog({ open, onOpenChange, children }: DialogProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  if (!mounted || !open || typeof document === 'undefined') {
    return null;
  }

  return createPortal(
    <DialogContext.Provider value={{ onOpenChange }}>
      <div data-slot="dialog-portal-root">{children}</div>
    </DialogContext.Provider>,
    document.body
  );
}

export function DialogContent({
  children,
  className,
  showCloseButton = true,
  fullScreen = false,
}: DialogContentProps) {
  const ctx = useContext(DialogContext);

  return (
    <>
      <div
        className="fixed inset-0 z-[200] bg-black/50 animate-in fade-in-0"
        onClick={() => ctx?.onOpenChange(false)}
        aria-hidden
      />
      <div
        className={cn(
          'pointer-events-none fixed inset-0 z-[200] flex items-center justify-center',
          fullScreen ? 'p-0' : 'p-3 sm:p-4'
        )}
      >
        <div
          data-slot="dialog-content"
          className={cn(
            'pointer-events-auto relative grid w-full max-w-[calc(100%-2rem)] gap-4 rounded-lg border bg-background p-6 shadow-lg duration-200 animate-in fade-in-0 zoom-in-95 sm:max-w-lg',
            fullScreen &&
              'h-full max-h-none w-full max-w-none rounded-none border-0 sm:max-w-none',
            className
          )}
        >
          {children}
          {showCloseButton ? (
            <button
              type="button"
              onClick={() => ctx?.onOpenChange(false)}
              className="ring-offset-background focus:ring-ring absolute top-4 right-4 rounded-xs opacity-70 transition-opacity hover:opacity-100 focus:ring-2 focus:ring-offset-2 focus:outline-hidden disabled:pointer-events-none [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4"
              aria-label="Close"
            >
              <XIcon className="size-4" />
              <span className="sr-only">Close</span>
            </button>
          ) : null}
        </div>
      </div>
    </>
  );
}

export function DialogHeader({ children, className }: DialogHeaderProps) {
  return (
    <div
      data-slot="dialog-header"
      className={cn('flex flex-col gap-2 text-center sm:text-left', className)}
    >
      {children}
    </div>
  );
}

export function DialogFooter({ children, className }: DialogFooterProps) {
  return (
    <div
      data-slot="dialog-footer"
      className={cn(
        'flex flex-col-reverse gap-2 sm:flex-row sm:justify-end',
        className
      )}
    >
      {children}
    </div>
  );
}

export function DialogTitle({ children, className }: DialogTitleProps) {
  return (
    <h2
      data-slot="dialog-title"
      className={cn('text-lg leading-none font-semibold', className)}
    >
      {children}
    </h2>
  );
}

export function DialogDescription({
  children,
  className,
}: DialogDescriptionProps) {
  return (
    <p
      data-slot="dialog-description"
      className={cn('text-muted-foreground text-sm', className)}
    >
      {children}
    </p>
  );
}
