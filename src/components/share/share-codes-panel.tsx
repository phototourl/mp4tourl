'use client';

import { Button } from '@/components/ui/button';
import {
  buildShareCodes,
  type ShareCodeKind,
} from '@/lib/share-codes';
import { cn } from '@/lib/utils';
import { Check, Copy, ExternalLink } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { toast } from 'sonner';

type ShareCodesPanelProps = {
  url: string;
  /** Compact mode for dialogs */
  compact?: boolean;
  className?: string;
  /** Show primary URL row + open tab */
  showPrimary?: boolean;
  /** Show success header */
  showSuccessHeader?: boolean;
};

const KIND_ORDER: ShareCodeKind[] = [
  'shareLink',
  'markdown',
  'markdownLink',
  'html',
  'htmlLink',
  'bbcode',
  'bbcodeLink',
];

/**
 * Copy-ready share / embed codes — VideoToURL-style layout for signed-in users.
 */
export function ShareCodesPanel({
  url,
  compact = false,
  className,
  showPrimary = true,
  showSuccessHeader = false,
}: ShareCodesPanelProps) {
  const t = useTranslations('ShareCodes');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const items = buildShareCodes(url, {
    video: t('videoLabel'),
    watch: t('watchLabel'),
  });

  const copyText = async (key: string, value: string) => {
    try {
      await navigator.clipboard.writeText(value);
      setCopiedKey(key);
      toast.success(t('copied'));
      window.setTimeout(() => {
        setCopiedKey((cur) => (cur === key ? null : cur));
      }, 1500);
    } catch {
      toast.error(t('copyFailed'));
    }
  };

  return (
    <div className={cn('space-y-5', className)}>
      {showSuccessHeader ? (
        <div className="flex flex-col items-center gap-2 text-center">
          <span className="flex size-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-300">
            <Check className="size-6" strokeWidth={2.5} />
          </span>
          <h3 className="text-lg font-semibold tracking-tight sm:text-xl">
            {t('successTitle')}
          </h3>
          <p className="max-w-md text-sm text-muted-foreground">
            {t('successSubtitle')}
          </p>
        </div>
      ) : null}

      {showPrimary ? (
        <div className="flex flex-col gap-2 sm:flex-row sm:items-stretch">
          <div className="flex min-w-0 flex-1 items-center rounded-xl border border-border/80 bg-muted/40 px-3 py-2.5">
            <input
              readOnly
              value={url}
              className="min-w-0 flex-1 bg-transparent font-mono text-xs outline-none sm:text-sm"
            />
          </div>
          <div className="flex shrink-0 gap-2">
            <Button
              type="button"
              className="flex-1 gap-1.5 sm:flex-none"
              onClick={() => void copyText('primary', url)}
            >
              {copiedKey === 'primary' ? (
                <Check className="size-4" />
              ) : (
                <Copy className="size-4" />
              )}
              {copiedKey === 'primary' ? t('copied') : t('copyUrl')}
            </Button>
            <Button
              type="button"
              variant="secondary"
              className="flex-1 gap-1.5 bg-violet-600 text-white hover:bg-violet-600/90 hover:text-white sm:flex-none dark:bg-violet-500"
              asChild
            >
              <a href={url} target="_blank" rel="noreferrer">
                <ExternalLink className="size-4" />
                {t('openTab')}
              </a>
            </Button>
          </div>
        </div>
      ) : null}

      <div className="space-y-3">
        <p
          className={cn(
            'font-mono text-[11px] font-semibold tracking-[0.14em] text-muted-foreground',
            compact ? 'px-0.5' : ''
          )}
        >
          {t('sectionTitle')}
        </p>

        <div className="space-y-2.5">
          {KIND_ORDER.map((kind) => {
            const item = items.find((x) => x.kind === kind)!;
            const isCopied = copiedKey === kind;
            return (
              <div
                key={kind}
                className="overflow-hidden rounded-xl border border-border/70 bg-card shadow-xs"
              >
                <div className="flex items-start justify-between gap-3 px-3.5 pt-3 sm:px-4">
                  <div className="min-w-0">
                    <p className="text-[11px] font-semibold tracking-wide text-foreground uppercase">
                      {t(`${kind}.title`)}
                    </p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {t(`${kind}.desc`)}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => void copyText(kind, item.value)}
                    className="inline-flex shrink-0 items-center gap-1 pt-0.5 text-xs font-medium text-sky-600 hover:text-sky-700 dark:text-sky-400 dark:hover:text-sky-300"
                  >
                    {isCopied ? (
                      <Check className="size-3.5" />
                    ) : (
                      <Copy className="size-3.5" />
                    )}
                    {isCopied ? t('copied') : t('copyUrl')}
                  </button>
                </div>
                <div className="m-3 mt-2 rounded-lg bg-muted/70 px-3 py-2.5 dark:bg-muted/40 sm:mx-4 sm:mb-3.5">
                  <pre className="overflow-x-auto whitespace-pre-wrap break-all font-mono text-[11px] leading-relaxed text-foreground/90 sm:text-xs">
                    {item.value}
                  </pre>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
