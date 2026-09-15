'use client';

import { ShareCodesPanel } from '@/components/share/share-codes-panel';
import { Button } from '@/components/ui/button';
import { LocaleLink } from '@/i18n/navigation';
import { authClient } from '@/lib/auth-client';
import { VIDEO_STORAGE_FOLDER } from '@/lib/constants';
import { cn } from '@/lib/utils';
import { isVideoFile, VIDEO_ACCEPT } from '@/lib/video-upload';
import { Routes } from '@/routes';
import { uploadFileFromBrowser } from '@/storage/client';
import { Check, Copy, ExternalLink, Loader2, Upload, UserPlus } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { useTranslations } from 'next-intl';
import { useCallback, useState } from 'react';

type UploadState = 'idle' | 'uploading' | 'success' | 'error';

/**
 * Clear upload dropzone + convert action, with light motion.
 * Anonymous: plain URL + register CTA. Signed-in: full share codes.
 */
export default function VideoUpload() {
  const t = useTranslations('HomePage.hero');
  const tShare = useTranslations('ShareCodes');
  const { data: session } = authClient.useSession();
  const isLoggedIn = !!session?.user;

  const [status, setStatus] = useState<UploadState>('idle');
  const [error, setError] = useState<string | null>(null);
  const [url, setUrl] = useState<string | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [pendingFile, setPendingFile] = useState<File | null>(null);

  const pickFile = useCallback(
    (file: File) => {
      if (!isVideoFile(file)) {
        setStatus('error');
        setError(t('unsupportedType'));
        setPendingFile(null);
        return;
      }
      setError(null);
      setUrl(null);
      setStatus('idle');
      setPendingFile(file);
      setFileName(file.name);
      setPreview(URL.createObjectURL(file));
    },
    [t]
  );

  const handleUpload = useCallback(async () => {
    if (!pendingFile) {
      document.getElementById('video-file-input')?.click();
      return;
    }

    setStatus('uploading');
    setError(null);

    try {
      const result = await uploadFileFromBrowser(
        pendingFile,
        VIDEO_STORAGE_FOLDER
      );
      setUrl(result.url);
      setStatus('success');
    } catch (err) {
      setStatus('error');
      const message = err instanceof Error ? err.message : t('error');
      setError(
        message.includes('fileTooLarge') || message.includes('size')
          ? t('fileTooLarge')
          : message || t('error')
      );
    }
  }, [pendingFile, t]);

  const copyUrl = async () => {
    if (!url) return;
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const lampActive = dragging || status === 'uploading' || status === 'success';
  const idleBounce = status === 'idle' && !pendingFile && !dragging;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.12, margin: '0px 0px -20px 0px' }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      className="relative overflow-hidden rounded-2xl border border-border/80 bg-muted/20 shadow-sm"
    >
      <div className="flex items-center justify-between border-b border-border/70 px-4 py-3.5 sm:px-6">
        <p className="font-mono text-xs uppercase tracking-[0.14em] text-muted-foreground sm:text-sm">
          MP4TOURL · VIDEO PIPE
        </p>
        <div className="flex items-center gap-2.5">
          <span className="font-mono text-xs uppercase tracking-wider text-muted-foreground sm:text-sm">
            {status === 'success'
              ? 'LINK READY'
              : status === 'uploading'
                ? 'PROCESSING'
                : 'STANDBY'}
          </span>
          <span
            aria-hidden
            className={cn(
              'size-2.5 rounded-full transition-all duration-300',
              lampActive
                ? 'bg-amber-400 shadow-[0_0_8px_2px_rgba(251,191,36,0.65)]'
                : 'bg-muted-foreground/35',
              status === 'uploading' && 'animate-pulse'
            )}
          />
        </div>
      </div>

      <div className="p-5 text-left sm:p-7 md:p-8">
        {status !== 'success' ? (
          <>
            <div className="mb-5">
              <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">
                {t('uploadHeading')}
              </h2>
              <p className="mt-2 text-base text-muted-foreground sm:text-lg">
                {t('uploadHint')}
              </p>
            </div>

            <input
              id="video-file-input"
              type="file"
              accept={VIDEO_ACCEPT}
              className="hidden"
              disabled={status === 'uploading'}
              onChange={(e) => {
                const file = e.target.files?.[0];
                e.target.value = '';
                if (file) pickFile(file);
              }}
            />

            <motion.button
              type="button"
              animate={dragging ? { scale: 1.015 } : { scale: 1 }}
              transition={{ type: 'spring', stiffness: 320, damping: 24 }}
              className={cn(
                'group relative flex w-full flex-col items-center justify-center gap-4',
                'rounded-2xl border-2 border-dashed px-6 py-12 text-center sm:py-14',
                'transition-colors duration-200',
                dragging
                  ? 'border-primary bg-primary/5'
                  : 'border-border/80 bg-gradient-to-b from-muted/40 to-background hover:border-primary/45 hover:from-primary/5',
                status === 'uploading' && 'cursor-wait opacity-85'
              )}
              disabled={status === 'uploading'}
              onClick={() =>
                document.getElementById('video-file-input')?.click()
              }
              onDragOver={(e) => {
                e.preventDefault();
                setDragging(true);
              }}
              onDragLeave={() => setDragging(false)}
              onDrop={(e) => {
                e.preventDefault();
                setDragging(false);
                const file = e.dataTransfer.files?.[0];
                if (file) pickFile(file);
              }}
            >
              <motion.div
                animate={
                  idleBounce
                    ? { y: [0, -5, 0] }
                    : dragging
                      ? { scale: 1.08, y: -2 }
                      : { y: 0, scale: 1 }
                }
                transition={
                  idleBounce
                    ? { duration: 2.2, repeat: Infinity, ease: 'easeInOut' }
                    : { type: 'spring', stiffness: 360, damping: 22 }
                }
                className="flex size-16 items-center justify-center rounded-2xl bg-primary/10 text-primary shadow-sm ring-1 ring-primary/15 transition-shadow group-hover:shadow-md group-hover:ring-primary/25"
              >
                {status === 'uploading' ? (
                  <Loader2 className="size-8 animate-spin" />
                ) : (
                  <Upload className="size-8" strokeWidth={1.75} />
                )}
              </motion.div>
              <div className="max-w-md space-y-2">
                <p className="max-w-full truncate px-2 text-lg font-semibold tracking-tight sm:text-xl">
                  {status === 'uploading'
                    ? t('uploading')
                    : pendingFile
                      ? fileName
                      : t('uploadTitle')}
                </p>
                <p className="text-base leading-relaxed text-muted-foreground">
                  {t('maxSize')}
                </p>
              </div>
            </motion.button>

            <AnimatePresence>
              {error ? (
                <motion.p
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="mt-3 text-base text-destructive"
                >
                  {error}
                </motion.p>
              ) : null}
            </AnimatePresence>

            <AnimatePresence>
              {preview ? (
                <motion.div
                  key="preview"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.3 }}
                  className="mt-4 overflow-hidden rounded-lg border bg-black/5"
                >
                  <video
                    src={preview}
                    controls
                    playsInline
                    className="max-h-52 w-full object-contain"
                    aria-label={fileName ?? undefined}
                  />
                </motion.div>
              ) : null}
            </AnimatePresence>

            <motion.button
              type="button"
              disabled={status === 'uploading'}
              onClick={() => void handleUpload()}
              whileHover={{ scale: status === 'uploading' ? 1 : 1.01 }}
              whileTap={{ scale: status === 'uploading' ? 1 : 0.98 }}
              className={cn(
                'mt-5 flex w-full items-center justify-center gap-2',
                'rounded-xl px-4 py-3.5 text-base font-semibold',
                'bg-primary text-primary-foreground',
                'hover:brightness-110',
                'disabled:cursor-wait disabled:opacity-60'
              )}
            >
              {status === 'uploading' ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  {t('uploading')}
                </>
              ) : (
                t('convert')
              )}
            </motion.button>
          </>
        ) : url ? (
          <motion.div
            key="success"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            className="space-y-5"
          >
            {isLoggedIn ? (
              <ShareCodesPanel
                url={url}
                showSuccessHeader
                showPrimary
              />
            ) : (
              <>
                <div className="flex flex-col items-center gap-2 text-center">
                  <span className="flex size-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-300">
                    <Check className="size-6" strokeWidth={2.5} />
                  </span>
                  <h3 className="text-lg font-semibold tracking-tight sm:text-xl">
                    {tShare('successTitle')}
                  </h3>
                  <p className="max-w-md text-sm text-muted-foreground">
                    {t('guestSuccessHint')}
                  </p>
                </div>

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
                      onClick={() => void copyUrl()}
                    >
                      {copied ? (
                        <Check className="size-4" />
                      ) : (
                        <Copy className="size-4" />
                      )}
                      {copied ? t('copied') : t('copy')}
                    </Button>
                    <Button
                      type="button"
                      variant="secondary"
                      className="flex-1 gap-1.5 sm:flex-none"
                      asChild
                    >
                      <a href={url} target="_blank" rel="noreferrer">
                        <ExternalLink className="size-4" />
                        {tShare('openTab')}
                      </a>
                    </Button>
                  </div>
                </div>

                <div className="rounded-xl border border-sky-200/80 bg-gradient-to-br from-sky-50 to-blue-50/80 p-4 dark:border-sky-500/30 dark:from-sky-500/10 dark:to-blue-500/5">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="min-w-0 space-y-1">
                      <p className="flex items-center gap-2 text-sm font-semibold text-sky-950 dark:text-sky-100">
                        <UserPlus className="size-4 shrink-0" />
                        {t('registerForCodesTitle')}
                      </p>
                      <p className="text-xs leading-relaxed text-sky-800/80 dark:text-sky-200/75">
                        {t('registerForCodesDesc')}
                      </p>
                    </div>
                    <Button asChild className="shrink-0 gap-1.5">
                      <LocaleLink href={Routes.Register}>
                        {t('registerCta')}
                      </LocaleLink>
                    </Button>
                  </div>
                </div>
              </>
            )}

            {preview ? (
              <div className="overflow-hidden rounded-xl border bg-black/5">
                <video
                  src={preview}
                  controls
                  playsInline
                  className="max-h-56 w-full object-contain"
                  aria-label={fileName ?? undefined}
                />
                {fileName ? (
                  <p className="truncate px-3 py-2 font-mono text-xs text-muted-foreground">
                    {fileName}
                  </p>
                ) : null}
              </div>
            ) : null}

            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={() => {
                setStatus('idle');
                setUrl(null);
                setPendingFile(null);
                setPreview(null);
                setFileName(null);
                setError(null);
              }}
            >
              {t('uploadAnother')}
            </Button>
          </motion.div>
        ) : null}
      </div>
    </motion.div>
  );
}
