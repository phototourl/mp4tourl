'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { Loader2Icon, AlertTriangleIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface AlertDialogProps {
  open: boolean;
  title: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel: () => void;
  loading?: boolean;
  destructive?: boolean;
  /** When false, only the confirm button is shown (notice / OK dialog). Default true. */
  showCancel?: boolean;
}

export function AlertDialog({
  open,
  title,
  description,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  onConfirm,
  onCancel,
  loading = false,
  destructive = true,
  showCancel = true,
}: AlertDialogProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || !open) return null;

  const showIcon = destructive || !showCancel;

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
        onClick={loading ? undefined : onCancel}
        aria-hidden
      />

      {/* Dialog */}
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="ptu-alert-dialog-title"
        aria-describedby="ptu-alert-dialog-desc"
        className="relative z-10 w-full max-w-md mx-4 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-50 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-700 animate-in zoom-in-95 fade-in duration-200"
      >
        <div className="flex flex-col items-center p-6 text-center">
          {showIcon && (
            <div
              className={
                destructive
                  ? 'w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/20 flex items-center justify-center mb-4'
                  : 'w-12 h-12 rounded-full bg-amber-100 dark:bg-amber-900/20 flex items-center justify-center mb-4'
              }
            >
              <AlertTriangleIcon
                className={
                  destructive
                    ? 'w-6 h-6 text-red-600 dark:text-red-400'
                    : 'w-6 h-6 text-amber-600 dark:text-amber-400'
                }
              />
            </div>
          )}

          <h2 id="ptu-alert-dialog-title" className="text-lg font-semibold mb-2">
            {title}
          </h2>
          <p id="ptu-alert-dialog-desc" className="text-sm text-muted-foreground mb-6">
            {description}
          </p>

          <div className="flex gap-3 w-full">
            {showCancel && (
              <Button
                variant="outline"
                className="flex-1"
                onClick={onCancel}
                disabled={loading}
              >
                {cancelText}
              </Button>
            )}
            <Button
              variant={destructive ? 'destructive' : 'default'}
              className="flex-1"
              onClick={onConfirm}
              disabled={loading}
            >
              {loading ? (
                <Loader2Icon className="w-4 h-4 animate-spin" />
              ) : (
                confirmText
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
