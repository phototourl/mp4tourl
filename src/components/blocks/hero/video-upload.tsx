'use client';

import { VIDEO_STORAGE_FOLDER } from '@/lib/constants';
import { cn } from '@/lib/utils';
import { isVideoFile, VIDEO_ACCEPT } from '@/lib/video-upload';
import { uploadFileFromBrowser } from '@/storage/client';
import { Check, Copy, Loader2, Upload } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { useTranslations } from 'next-intl';
import { useCallback, useState } from 'react';

type UploadState = 'idle' | 'uploading' | 'success' | 'error';

/**
 * Clear upload dropzone + convert action, with light motion.
 */
export default function VideoUpload() {
  const t = useTranslations('HomePage.hero');
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
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.25 }}
      transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
      className="relative overflow-hidden rounded-2xl border border-border/80 bg-muted/20 shadow-sm"
    >
      <div className="flex items-center justify-between border-b border-border/70 px-4 py-2.5 sm:px-5">
        <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground sm:text-xs">
          MP4TOURL · VIDEO PIPE
        </p>
        <div className="flex items-center gap-2">
          <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
            {status === 'success'
              ? 'LINK READY'
              : status === 'uploading'
                ? 'PROCESSING'
                : 'STANDBY'}
          </span>
          <span
            aria-hidden
            className={cn(
              'size-2 rounded-full transition-all duration-300',
              lampActive
                ? 'bg-amber-400 shadow-[0_0_8px_2px_rgba(251,191,36,0.65)]'
                : 'bg-muted-foreground/35',
              status === 'uploading' && 'animate-pulse'
            )}
          />
        </div>
      </div>

      <div className="p-5 text-left sm:p-6 md:p-7">
        <div className="mb-4">
          <h2 className="text-xl font-semibold tracking-tight sm:text-2xl">
            {t('uploadHeading')}
          </h2>
          <p className="mt-1.5 text-sm text-muted-foreground">
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
          onClick={() => document.getElementById('video-file-input')?.click()}
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
            className="flex size-14 items-center justify-center rounded-2xl bg-primary/10 text-primary shadow-sm ring-1 ring-primary/15 transition-shadow group-hover:shadow-md group-hover:ring-primary/25"
          >
            {status === 'uploading' ? (
              <Loader2 className="size-7 animate-spin" />
            ) : (
              <Upload className="size-7" strokeWidth={1.75} />
            )}
          </motion.div>
          <div className="max-w-sm space-y-1.5">
            <p className="max-w-full truncate px-2 text-base font-semibold tracking-tight">
              {status === 'uploading'
                ? t('uploading')
                : pendingFile
                  ? fileName
                  : t('uploadTitle')}
            </p>
            <p className="text-sm leading-relaxed text-muted-foreground">
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
              className="mt-3 text-sm text-destructive"
            >
              {error}
            </motion.p>
          ) : null}
        </AnimatePresence>

        <AnimatePresence>
          {preview && status !== 'success' ? (
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

        <AnimatePresence mode="wait">
          {status !== 'success' ? (
            <motion.button
              key="convert"
              type="button"
              disabled={status === 'uploading'}
              onClick={() => void handleUpload()}
              whileHover={{ scale: status === 'uploading' ? 1 : 1.01 }}
              whileTap={{ scale: status === 'uploading' ? 1 : 0.98 }}
              className={cn(
                'mt-4 flex w-full items-center justify-center gap-2',
                'rounded-lg px-4 py-3 text-sm font-semibold',
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
          ) : url ? (
            <motion.div
              key="success"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
              className="mt-4 space-y-3"
            >
              <div className="flex min-w-0 items-center gap-2 rounded-lg border bg-muted/30 px-3 py-2">
                <input
                  readOnly
                  value={url}
                  className="min-w-0 flex-1 bg-transparent font-mono text-sm outline-none"
                />
                <button
                  type="button"
                  onClick={copyUrl}
                  className={cn(
                    'inline-flex shrink-0 items-center gap-1.5 rounded-md px-2.5 py-1.5',
                    'bg-primary text-xs font-medium text-primary-foreground',
                    'hover:brightness-110'
                  )}
                >
                  {copied ? (
                    <Check className="size-3.5" />
                  ) : (
                    <Copy className="size-3.5" />
                  )}
                  {copied ? t('copied') : t('copy')}
                </button>
              </div>
              {preview ? (
                <div className="overflow-hidden rounded-lg border bg-black/5">
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
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
