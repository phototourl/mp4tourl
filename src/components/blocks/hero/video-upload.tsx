'use client';

import { Button } from '@/components/ui/button';
import { VIDEO_STORAGE_FOLDER } from '@/lib/constants';
import { cn } from '@/lib/utils';
import { isVideoFile, VIDEO_ACCEPT } from '@/lib/video-upload';
import { uploadFileFromBrowser } from '@/storage/client';
import { Check, Copy, Film, Loader2, Upload } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useCallback, useState } from 'react';

type UploadState = 'idle' | 'uploading' | 'success' | 'error';

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

  return (
    <div className="relative mx-auto mt-10 max-w-2xl overflow-hidden rounded-2xl border bg-background p-6 text-left shadow-sm">
      <div className="mb-4 text-center">
        <h2 className="text-xl font-semibold">{t('uploadHeading')}</h2>
        <p className="mt-1 text-sm text-muted-foreground">{t('uploadHint')}</p>
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

      <button
        type="button"
        className={cn(
          'flex w-full flex-col items-center rounded-xl border-2 border-dashed px-6 py-10 text-center transition-colors',
          dragging ? 'border-primary bg-primary/5' : 'border-muted-foreground/25',
          status === 'uploading' ? 'cursor-wait opacity-80' : 'hover:bg-muted/40'
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
        <div className="mb-4 flex size-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          {status === 'uploading' ? (
            <Loader2 className="size-7 animate-spin" />
          ) : (
            <Upload className="size-7" />
          )}
        </div>
        <p className="text-base font-medium">
          {status === 'uploading'
            ? t('uploading')
            : pendingFile
              ? fileName
              : t('uploadTitle')}
        </p>
        <p className="mt-2 text-sm text-muted-foreground">{t('maxSize')}</p>
      </button>

      {error ? (
        <p className="mt-4 text-center text-sm text-destructive">{error}</p>
      ) : null}

      {preview && status !== 'success' ? (
        <div className="mt-4 overflow-hidden rounded-lg bg-black/5">
          <video
            src={preview}
            controls
            playsInline
            className="max-h-48 w-full object-contain"
            aria-label={fileName ?? undefined}
          />
        </div>
      ) : null}

      {status !== 'success' ? (
        <Button
          type="button"
          size="lg"
          className="mt-5 w-full"
          disabled={status === 'uploading'}
          onClick={() => void handleUpload()}
        >
          {status === 'uploading' ? (
            <>
              <Loader2 className="mr-2 size-4 animate-spin" />
              {t('uploading')}
            </>
          ) : (
            t('convert')
          )}
        </Button>
      ) : null}

      {status === 'success' && url ? (
        <div className="mt-5 space-y-3">
          <div className="flex min-w-0 items-center gap-2 rounded-lg border bg-muted/40 px-3 py-2">
            <input
              readOnly
              value={url}
              className="min-w-0 flex-1 bg-transparent text-sm outline-none"
            />
            <Button type="button" size="sm" onClick={copyUrl}>
              {copied ? (
                <Check className="mr-1 size-4" />
              ) : (
                <Copy className="mr-1 size-4" />
              )}
              {copied ? t('copied') : t('copy')}
            </Button>
          </div>
          {preview ? (
            <div className="overflow-hidden rounded-lg bg-black/5">
              <video
                src={preview}
                controls
                playsInline
                className="max-h-56 w-full object-contain"
                aria-label={fileName ?? undefined}
              />
              {fileName ? (
                <p className="flex items-center gap-2 px-3 py-2 text-xs text-muted-foreground">
                  <Film className="size-3.5" />
                  {fileName}
                </p>
              ) : null}
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
