'use client';

import { Button } from '@/components/ui/button';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { UploadIcon } from 'lucide-react';

interface UploadUpgradeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  siteName: string;
  title: string;
  description: string;
  errorMessage?: string | null;
  confirmText: string;
  cancelText: string;
  onConfirm: () => void;
  /** 无顶部横幅、更窄，与文档上传等场景共用 */
  compact?: boolean;
}

export function UploadUpgradeDialog({
  open,
  onOpenChange,
  siteName,
  title,
  description,
  errorMessage,
  confirmText,
  cancelText,
  onConfirm,
  compact = false,
}: UploadUpgradeDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={cn(
          'ptu-upgrade-modal overflow-hidden overflow-y-auto border-0 bg-background p-0 shadow-2xl shadow-slate-900/15 ring-1 ring-slate-200/80 dark:bg-card dark:ring-border',
          compact
            ? 'max-h-[min(90dvh,440px)] sm:max-w-md'
            : 'max-h-[min(90dvh,520px)] sm:max-w-lg',
        )}
      >
        <div className="ptu-upgrade-modal-header relative border-b border-slate-100/90 dark:border-border">
          {!compact ? (
            <div
              aria-hidden
              className="ptu-upgrade-modal-hero h-32 w-full bg-[url('/og-image.png')] bg-cover bg-center bg-no-repeat sm:h-40"
            />
          ) : null}
          <div
            className={cn(
              'ptu-upgrade-modal-content',
              compact ? 'px-5 py-5 sm:px-6 sm:py-5' : 'px-5 py-5 sm:px-8 sm:py-6',
            )}
          >
            <div className={cn('flex gap-3', compact ? 'items-start' : 'items-center')}>
              <div
                className="ptu-upgrade-modal-icon flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-blue-700 text-white shadow-lg shadow-blue-600/30 ring-4 ring-blue-500/10 dark:from-blue-500 dark:to-blue-700 dark:shadow-blue-950/50"
                aria-hidden
              >
                <UploadIcon className="h-5 w-5" />
              </div>
              <div className="min-w-0 space-y-1">
                <p className="ptu-upgrade-modal-kicker text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                  {siteName}
                </p>
                <h2
                  className={cn(
                    'ptu-upgrade-modal-title text-lg font-semibold leading-snug tracking-tight text-foreground',
                    !compact && 'sm:text-xl',
                  )}
                >
                  {title}
                </h2>
                <p className="ptu-upgrade-modal-desc text-[13px] leading-relaxed text-muted-foreground sm:text-sm">
                  {description}
                </p>
                {errorMessage ? (
                  <p className="mt-2 text-[13px] leading-relaxed text-red-600 dark:text-red-400 sm:text-sm">
                    {errorMessage}
                  </p>
                ) : null}
              </div>
            </div>
          </div>
        </div>

        <div
          className={cn(
            'ptu-upgrade-modal-footer border-t border-slate-100 bg-slate-50/90 px-5 py-4 dark:border-border dark:bg-muted/30',
            compact ? 'sm:px-6' : 'sm:px-8',
          )}
        >
          <div className="flex w-full flex-col gap-3">
            <Button
              type="button"
              variant="default"
              className="ptu-upgrade-modal-primary-btn h-11 w-full rounded-xl text-sm font-semibold bg-[#02c7c7] hover:bg-[#00b3b3] text-white shadow-md shadow-[#02c7c7]/40 sm:text-base"
              onClick={onConfirm}
            >
              {confirmText}
            </Button>
            <Button
              type="button"
              variant="outline"
              className="ptu-upgrade-modal-secondary-btn h-11 w-full rounded-xl border border-slate-200/90 bg-transparent text-sm font-medium text-slate-500 shadow-none hover:border-slate-300 hover:bg-slate-100/80 hover:text-slate-700 dark:border-slate-600/50 dark:text-slate-400 dark:hover:border-slate-500 dark:hover:bg-slate-800/50 dark:hover:text-slate-200 sm:text-base"
              onClick={() => onOpenChange(false)}
            >
              {cancelText}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
