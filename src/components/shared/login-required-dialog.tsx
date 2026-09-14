"use client";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { LogIn } from "lucide-react";

export interface LoginRequiredDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  siteName: string;
  title: string;
  /** 主说明（首段） */
  description: string;
  /** 补充说明（第二段），可选 */
  detail?: string;
  loginText: string;
  registerText: string;
  cancelText: string;
  onLogin: () => void;
  onRegister: () => void;
}

/** Compact login prompt; layout aligned with {@link UploadUpgradeDialog}. */
export function LoginRequiredDialog({
  open,
  onOpenChange,
  siteName,
  title,
  description,
  detail,
  loginText,
  registerText,
  cancelText,
  onLogin,
  onRegister,
}: LoginRequiredDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[min(90dvh,520px)] overflow-hidden overflow-y-auto border-0 bg-background p-0 shadow-2xl shadow-slate-900/15 ring-1 ring-slate-200/80 dark:bg-card dark:ring-border sm:max-w-md">
        <div className="relative border-b border-slate-100/90 dark:border-border">
          <div className="px-5 py-5 sm:px-6 sm:py-5">
            <div className="flex items-start gap-3">
              <div
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-[#0abab5] to-[#089590] text-white shadow-lg shadow-[#0abab5]/25 ring-4 ring-[#0abab5]/10 dark:shadow-[#0abab5]/20"
                aria-hidden
              >
                <LogIn className="h-5 w-5" strokeWidth={2.25} />
              </div>
              <div className="min-w-0 flex-1 space-y-2">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">{siteName}</p>
                <h2 className="text-lg font-semibold leading-snug tracking-tight text-foreground">{title}</h2>
                <div className="space-y-2 text-[13px] leading-relaxed text-muted-foreground sm:text-sm">
                  <p>{description}</p>
                  {detail?.trim() ? <p>{detail}</p> : null}
                </div>
                <button
                  type="button"
                  className="block w-full text-left text-[13px] font-medium text-[#0abab5] hover:text-[#089590] hover:underline dark:text-[#0abab5]"
                  onClick={onRegister}
                >
                  {registerText}
                </button>
              </div>
            </div>
          </div>
        </div>
        <div className="border-t border-slate-100 bg-slate-50/90 px-5 py-4 dark:border-border dark:bg-muted/30 sm:px-6">
          <div className="flex w-full flex-col gap-3">
            <Button
              type="button"
              className="h-11 w-full rounded-xl text-sm font-semibold bg-[#02c7c7] text-white shadow-md shadow-[#02c7c7]/40 hover:bg-[#00b3b3] sm:text-base"
              onClick={onLogin}
            >
              <LogIn className="mr-2 h-4 w-4" />
              {loginText}
            </Button>
            <Button
              type="button"
              variant="outline"
              className="h-11 w-full rounded-xl border border-slate-200/90 bg-transparent text-sm font-medium text-slate-500 shadow-none hover:border-slate-300 hover:bg-slate-100/80 hover:text-slate-700 dark:border-slate-600/50 dark:text-slate-400 dark:hover:border-slate-500 dark:hover:bg-slate-800/50 dark:hover:text-slate-200 sm:text-base"
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
