'use client';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { VIDEO_STORAGE_FOLDER } from '@/lib/constants';
import { formatBytes } from '@/lib/storage-limits';
import { cn } from '@/lib/utils';
import { isVideoFile, VIDEO_ACCEPT } from '@/lib/video-upload';
import { uploadFileFromBrowser } from '@/storage/client';
import {
  Download,
  Eye,
  HardDrive,
  LayoutGrid,
  Link2,
  List,
  Loader2,
  Plus,
  Trash2,
  Upload,
} from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { useCallback, useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import { ShareCodesPanel } from '@/components/share/share-codes-panel';

type ResourceItem = {
  id: string;
  title: string;
  filename: string;
  mimeType: string | null;
  fileSize: number;
  createdAt: string | Date;
  url: string;
};

type ListResponse = {
  items: ResourceItem[];
  total: number;
  page: number;
  pageSize: number;
  storageUsed?: number;
  storageLimit?: number;
};

const PAGE_SIZE = 24;

const VIDEO_FORMAT_KEYS = [
  'mp4',
  'mov',
  'avi',
  'webm',
  'mkv',
  'mpeg',
  'flv',
  '3gp',
] as const;

type VideoFormatKey = (typeof VIDEO_FORMAT_KEYS)[number] | 'all';

const filterControlClass =
  'h-8 w-full rounded-md border border-input bg-background px-2.5 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring';

const fileCardClass =
  'group relative flex h-full w-full flex-col overflow-hidden rounded-xl border border-slate-200/80 bg-card text-card-foreground shadow-sm dark:border-border sm:aspect-square';
const fileThumbClass =
  'relative aspect-[4/3] w-full shrink-0 overflow-hidden bg-muted/40 sm:aspect-auto sm:min-h-0 sm:flex-1';
const fileMetaClass =
  'flex shrink-0 flex-col justify-center gap-0.5 border-t border-slate-200/70 bg-card px-2 py-1.5 text-left dark:border-border';

const overlayBtnClass =
  'h-6 w-6 cursor-pointer rounded-md border border-slate-200/80 bg-white p-0 text-blue-600 shadow-sm hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700 sm:h-7 sm:w-7 dark:border-slate-600/80 dark:bg-slate-900/90 dark:text-blue-400 dark:hover:border-blue-500/40 dark:hover:bg-blue-500/15 dark:hover:text-blue-300';
const overlayDangerBtnClass =
  'h-6 w-6 cursor-pointer rounded-md border border-slate-200/80 bg-white p-0 text-red-600 shadow-sm hover:border-red-200 hover:bg-red-50 hover:text-red-700 sm:h-7 sm:w-7 dark:border-slate-600/80 dark:bg-slate-900/90 dark:text-red-400 dark:hover:border-red-500/40 dark:hover:bg-red-500/15 dark:hover:text-red-300';

function resolveVideoExt(
  filename: string,
  mimeType: string | null
): string {
  const fromName = /\.([a-z0-9]+)$/i.exec(filename)?.[1]?.toLowerCase();
  if (fromName) return fromName === 'jpeg' ? 'jpg' : fromName;
  if (mimeType?.includes('mp4')) return 'mp4';
  if (mimeType?.includes('webm')) return 'webm';
  if (mimeType?.includes('quicktime')) return 'mov';
  if (mimeType?.includes('x-msvideo') || mimeType?.includes('avi')) return 'avi';
  if (mimeType?.includes('matroska')) return 'mkv';
  if (mimeType?.includes('mpeg')) return 'mpeg';
  if (mimeType?.includes('flv')) return 'flv';
  if (mimeType?.includes('3gpp')) return '3gp';
  return '';
}

function fileExtLabel(filename: string, mimeType: string | null): string {
  const ext = resolveVideoExt(filename, mimeType);
  return ext ? ext.toUpperCase() : 'VIDEO';
}

/** Type watermark icon — same role as editstamp office icons */
function videoTypeIconSrc(
  filename: string,
  mimeType: string | null
): string {
  const ext = resolveVideoExt(filename, mimeType);
  if (ext === 'mp4' || ext === 'm4v') return '/dashboard/mp4.svg';
  if (ext === 'mov' || ext === 'qt') return '/dashboard/mov.svg';
  if (ext === 'avi') return '/dashboard/avi.svg';
  if (ext === 'webm') return '/dashboard/webm.svg';
  if (ext === 'mkv') return '/dashboard/mkv.svg';
  return '/dashboard/video.svg';
}

function VideoTypeWatermark({
  filename,
  mimeType,
}: {
  filename: string;
  mimeType: string | null;
}) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      aria-hidden
      src={videoTypeIconSrc(filename, mimeType)}
      alt=""
      className="pointer-events-none absolute left-1/2 top-1/2 z-0 h-auto w-auto max-h-[42%] max-w-[42%] -translate-x-1/2 -translate-y-1/2 object-contain select-none sm:max-h-[48%] sm:max-w-[48%]"
      draggable={false}
    />
  );
}

function VideoCard({
  item,
  locale,
  deletingId,
  onPreview,
  onShare,
  onDownload,
  onDelete,
  labels,
}: {
  item: ResourceItem;
  locale: string;
  deletingId: string | null;
  onPreview: (item: ResourceItem) => void;
  onShare: (item: ResourceItem) => void;
  onDownload: (item: ResourceItem) => void;
  onDelete: (id: string) => void;
  labels: {
    preview: string;
    share: string;
    download: string;
    delete: string;
  };
}) {
  const ext = fileExtLabel(item.filename, item.mimeType);

  return (
    <article className={fileCardClass}>
      <div className={fileThumbClass}>
        <VideoTypeWatermark
          filename={item.filename}
          mimeType={item.mimeType}
        />

        <div className="absolute right-1 top-1 z-10 flex max-w-[calc(100%-0.5rem)] flex-wrap justify-end gap-1">
          <button
            type="button"
            className={cn(
              'inline-flex items-center justify-center',
              overlayBtnClass
            )}
            onClick={() => onPreview(item)}
            aria-label={labels.preview}
            title={labels.preview}
          >
            <Eye className="size-3 sm:size-3.5" />
          </button>
          <button
            type="button"
            className={cn(
              'inline-flex items-center justify-center',
              overlayBtnClass
            )}
            onClick={() => onShare(item)}
            aria-label={labels.share}
            title={labels.share}
          >
            <Link2 className="size-3 sm:size-3.5" />
          </button>
          <button
            type="button"
            className={cn(
              'inline-flex items-center justify-center',
              overlayBtnClass
            )}
            onClick={() => onDownload(item)}
            aria-label={labels.download}
            title={labels.download}
          >
            <Download className="size-3 sm:size-3.5" />
          </button>
          <button
            type="button"
            className={cn(
              'inline-flex items-center justify-center disabled:opacity-50',
              overlayDangerBtnClass
            )}
            disabled={deletingId === item.id}
            onClick={() => onDelete(item.id)}
            aria-label={labels.delete}
            title={labels.delete}
          >
            {deletingId === item.id ? (
              <Loader2 className="size-3 animate-spin sm:size-3.5" />
            ) : (
              <Trash2 className="size-3 sm:size-3.5" />
            )}
          </button>
        </div>
      </div>

      <div className={fileMetaClass}>
        <p className="truncate text-xs font-semibold leading-tight text-foreground">
          {item.title}
        </p>
        <p className="truncate text-[11px] leading-tight text-muted-foreground">
          {ext}
          <span className="mx-1 text-muted-foreground/50">·</span>
          {formatBytes(item.fileSize, locale)}
        </p>
      </div>
    </article>
  );
}

/**
 * My Resources — File Manager style grid with upload + action buttons.
 */
export function ResourcesManager() {
  const t = useTranslations('Dashboard.resources');
  const locale = useLocale();
  const inputRef = useRef<HTMLInputElement>(null);
  const lastUploadWasTileRef = useRef(false);

  const [q, setQ] = useState('');
  const [query, setQuery] = useState('');
  const [format, setFormat] = useState<VideoFormatKey>('all');
  const [formatFilter, setFormatFilter] = useState<VideoFormatKey>('all');
  const [page, setPage] = useState(1);
  const [items, setItems] = useState<ResourceItem[]>([]);
  const [total, setTotal] = useState(0);
  const [storageUsed, setStorageUsed] = useState(0);
  const [storageLimit, setStorageLimit] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const [toolbarUploading, setToolbarUploading] = useState(false);
  const [tileUploading, setTileUploading] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [previewItem, setPreviewItem] = useState<ResourceItem | null>(null);
  const [shareItem, setShareItem] = useState<ResourceItem | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const params = new URLSearchParams({
        page: String(page),
        pageSize: String(PAGE_SIZE),
      });
      if (query) params.set('q', query);
      if (formatFilter !== 'all') params.set('format', formatFilter);
      const res = await fetch(`/api/files?${params.toString()}`);
      if (!res.ok) throw new Error('load failed');
      const json = (await res.json()) as ListResponse;
      setItems(json.items ?? []);
      setTotal(json.total ?? 0);
      if (typeof json.storageUsed === 'number') setStorageUsed(json.storageUsed);
      if (typeof json.storageLimit === 'number')
        setStorageLimit(json.storageLimit);
    } catch {
      setError(true);
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [page, query, formatFilter]);

  useEffect(() => {
    void load();
  }, [load]);

  const onSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    setQuery(q.trim());
    setFormatFilter(format);
  };

  const onReset = () => {
    setQ('');
    setQuery('');
    setFormat('all');
    setFormatFilter('all');
    setPage(1);
  };

  const openToolbarPicker = () => {
    if (toolbarUploading || tileUploading) return;
    lastUploadWasTileRef.current = false;
    inputRef.current?.click();
  };

  const openTilePicker = () => {
    if (toolbarUploading || tileUploading) return;
    lastUploadWasTileRef.current = true;
    inputRef.current?.click();
  };

  const onUpload = async (fileList: FileList | null) => {
    const file = fileList?.[0];
    if (!file) return;
    if (!isVideoFile(file)) {
      toast.error(t('unsupportedType'));
      return;
    }

    const fromTile = lastUploadWasTileRef.current;
    if (fromTile) setTileUploading(true);
    else setToolbarUploading(true);

    try {
      await uploadFileFromBrowser(file, VIDEO_STORAGE_FOLDER);
      toast.success(t('uploadSuccess'));
      setQ('');
      if (page === 1 && !query) {
        await load();
      } else {
        setPage(1);
        setQuery('');
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : '';
      toast.error(
        message.includes('fileTooLarge') || message.includes('size')
          ? t('fileTooLarge')
          : t('uploadFailed')
      );
    } finally {
      setToolbarUploading(false);
      setTileUploading(false);
    }
  };

  const onPreview = (item: ResourceItem) => {
    setPreviewItem(item);
  };

  const onDownload = (item: ResourceItem) => {
    // Same-origin proxy with Content-Disposition: attachment.
    // Cross-origin CDN URLs ignore `download` and open a new tab instead.
    const a = document.createElement('a');
    a.href = `/api/files/${encodeURIComponent(item.id)}/download`;
    a.rel = 'noopener';
    document.body.appendChild(a);
    a.click();
    a.remove();
  };

  const confirmDelete = async () => {
    if (!deleteId) return;
    setDeletingId(deleteId);
    try {
      const res = await fetch(
        `/api/files?id=${encodeURIComponent(deleteId)}`,
        { method: 'DELETE' }
      );
      if (!res.ok) throw new Error('delete failed');
      toast.success(t('deleteSuccess'));
      setDeleteId(null);
      await load();
    } catch {
      toast.error(t('deleteFailed'));
    } finally {
      setDeletingId(null);
    }
  };

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const uploading = toolbarUploading || tileUploading;

  const tileShellClass =
    'group/tile relative flex w-full flex-col overflow-hidden rounded-xl border border-dashed border-sky-300/80 bg-gradient-to-br from-sky-50 to-blue-100/80 text-sky-700 transition-all duration-200 ease-out hover:border-sky-400 hover:shadow-[0_10px_24px_-16px_rgba(14,116,144,0.45)] sm:aspect-square dark:border-sky-500/40 dark:from-slate-800 dark:to-slate-900 dark:text-sky-300 dark:hover:border-sky-400/70';
  const tileIconClass =
    'size-14 shrink-0 transition-transform duration-200 group-hover/tile:scale-[1.04] sm:size-16 md:size-[42%] md:max-h-20 md:max-w-20';
  const tileMetaSpacer = (
    <div
      className={cn(
        fileMetaClass,
        'pointer-events-none invisible border-0 bg-transparent'
      )}
      aria-hidden
    >
      <p className="truncate text-xs font-semibold leading-tight">&nbsp;</p>
      <p className="truncate text-[11px] leading-tight">&nbsp;</p>
    </div>
  );

  const uploadTile = (
    <article className={tileShellClass}>
      <div className={cn(fileThumbClass, 'border-0 bg-transparent')} aria-hidden />
      {tileMetaSpacer}
      <button
        type="button"
        aria-label={tileUploading ? t('uploading') : t('upload')}
        className="absolute inset-0 z-10 flex cursor-pointer items-center justify-center"
        onClick={() => void openTilePicker()}
      >
        {tileUploading ? (
          <Loader2 className={cn(tileIconClass, 'animate-spin')} aria-hidden />
        ) : (
          <Plus className={tileIconClass} aria-hidden strokeWidth={1.75} />
        )}
      </button>
    </article>
  );

  const actionLabels = {
    preview: t('preview'),
    share: t('shareCodes'),
    download: t('download'),
    delete: t('delete'),
  };

  const emptyHint = (
    <div className="space-y-1">
      <p className="font-medium text-foreground">{t('empty')}</p>
      <p className="text-sm text-muted-foreground">{t('emptyHint')}</p>
    </div>
  );

  return (
    <div className="flex flex-col gap-5">
      <input
        ref={inputRef}
        type="file"
        className="hidden"
        accept={VIDEO_ACCEPT}
        disabled={uploading}
        onChange={(e) => {
          void onUpload(e.target.files);
          e.target.value = '';
        }}
      />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-6">
        <div className="min-w-0">
          <h1 className="text-xl font-semibold tracking-tight">{t('title')}</h1>
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
            {t('description')}
          </p>
        </div>
        {storageLimit > 0 ? (
          <div className="w-full shrink-0 rounded-lg border border-sky-200 bg-sky-50 px-3.5 py-2.5 sm:w-56 dark:border-sky-500/35 dark:bg-sky-500/15">
            <div className="flex items-center gap-1.5 text-xs font-medium text-sky-800 dark:text-sky-200">
              <HardDrive className="size-3.5 shrink-0 text-sky-600 dark:text-sky-400" />
              {t('usageStorage')}
            </div>
            <p className="mt-1 text-sm font-semibold tabular-nums text-sky-950 dark:text-sky-50">
              {formatBytes(storageUsed, locale)}
              <span className="font-normal text-sky-700/80 dark:text-sky-300/80">
                {' '}
                / {formatBytes(storageLimit, locale)}
              </span>
            </p>
            <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-sky-200 dark:bg-sky-400/25">
              <div
                className="h-full rounded-full bg-sky-600 transition-all dark:bg-sky-400"
                style={{
                  width: `${Math.min((storageUsed / Math.max(storageLimit, 1)) * 100, 100)}%`,
                }}
              />
            </div>
          </div>
        ) : null}
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
        <Button
          type="button"
          size="sm"
          className="h-8 cursor-pointer gap-1.5"
          disabled={uploading}
          onClick={() => void openToolbarPicker()}
        >
          {toolbarUploading ? (
            <Loader2 className="size-3.5 animate-spin" />
          ) : (
            <Upload className="size-3.5" />
          )}
          {toolbarUploading ? t('uploading') : t('upload')}
        </Button>

        <form
          onSubmit={onSearch}
          className="flex min-w-0 flex-1 flex-wrap items-center gap-2"
        >
          <select
            value={format}
            onChange={(e) => {
              setFormat(e.target.value as VideoFormatKey);
              setPage(1);
              setFormatFilter(e.target.value as VideoFormatKey);
            }}
            aria-label={t('filterFormat')}
            className={cn(
              filterControlClass,
              'w-auto min-w-[7.5rem] cursor-pointer sm:w-36'
            )}
          >
            <option value="all">{t('formatAll')}</option>
            {VIDEO_FORMAT_KEYS.map((key) => (
              <option key={key} value={key}>
                {t(`format.${key}`)}
              </option>
            ))}
          </select>

          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={t('searchPlaceholder')}
            className={cn(
              filterControlClass,
              'min-w-0 w-full sm:w-52 sm:max-w-xs'
            )}
          />

          <Button type="submit" size="sm" className="h-8">
            {t('search')}
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-8"
            onClick={onReset}
          >
            {t('reset')}
          </Button>
        </form>

        <div className="flex shrink-0 items-center gap-0.5 rounded-md bg-muted p-1 sm:ml-auto">
          <button
            type="button"
            onClick={() => setViewMode('grid')}
            className={cn(
              'inline-flex size-7 cursor-pointer items-center justify-center rounded-sm transition-colors',
              viewMode === 'grid'
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            )}
            aria-label={t('viewGrid')}
            title={t('viewGrid')}
          >
            <LayoutGrid className="size-3.5" />
          </button>
          <button
            type="button"
            onClick={() => setViewMode('table')}
            className={cn(
              'inline-flex size-7 cursor-pointer items-center justify-center rounded-sm transition-colors',
              viewMode === 'table'
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            )}
            aria-label={t('viewList')}
            title={t('viewList')}
          >
            <List className="size-3.5" />
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex h-28 items-center justify-center text-muted-foreground">
          <Loader2 className="size-5 animate-spin" />
        </div>
      ) : error ? (
        <p className="py-12 text-center text-sm text-destructive">
          {t('loadError')}
        </p>
      ) : viewMode === 'grid' ? (
        <div className="rounded-xl border border-slate-200/70 bg-slate-50 p-4 dark:border-border dark:bg-muted/30">
          {items.length === 0 ? (
            <>
              <div className="flex flex-col items-center justify-center gap-4 px-3 py-8 sm:hidden">
                <div className="w-[42%] max-w-[9.5rem]">{uploadTile}</div>
                <div className="w-full max-w-sm text-center">{emptyHint}</div>
              </div>
              <div className="relative hidden min-h-28 sm:block">
                <div className="grid grid-cols-2 items-start gap-2.5 sm:grid-cols-4 sm:gap-3 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7">
                  {uploadTile}
                </div>
                <div className="pointer-events-none absolute inset-0 z-[1] flex items-center justify-center px-4">
                  <div className="max-w-prose text-center">{emptyHint}</div>
                </div>
              </div>
            </>
          ) : (
            <div className="grid grid-cols-2 items-start gap-2.5 sm:grid-cols-4 sm:gap-3 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7">
              {uploadTile}
              {items.map((item) => (
                <VideoCard
                  key={item.id}
                  item={item}
                  locale={locale}
                  deletingId={deletingId}
                  onPreview={onPreview}
                  onShare={setShareItem}
                  onDownload={onDownload}
                  onDelete={setDeleteId}
                  labels={actionLabels}
                />
              ))}
            </div>
          )}
        </div>
      ) : items.length === 0 ? (
        <div className="flex flex-col items-center gap-4 rounded-xl border border-dashed py-16 text-center">
          {emptyHint}
          <Button
            type="button"
            disabled={uploading}
            onClick={() => void openToolbarPicker()}
          >
            <Upload className="size-4" />
            {t('upload')}
          </Button>
        </div>
      ) : (
        <ul className="divide-y rounded-xl border">
          {items.map((item) => (
            <li
              key={item.id}
              className="flex flex-col gap-3 p-3 sm:flex-row sm:items-center sm:justify-between sm:px-4"
            >
              <div className="flex min-w-0 items-center gap-3">
                <div className="relative flex size-14 shrink-0 items-center justify-center overflow-hidden rounded-md bg-muted/50">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={videoTypeIconSrc(item.filename, item.mimeType)}
                    alt=""
                    className="max-h-[70%] max-w-[70%] object-contain"
                    draggable={false}
                  />
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{item.title}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {fileExtLabel(item.filename, item.mimeType)} ·{' '}
                    {formatBytes(item.fileSize, locale)}
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap gap-1">
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  className="h-8 w-8 p-0 text-blue-600"
                  onClick={() => onPreview(item)}
                  title={t('preview')}
                >
                  <Eye className="size-4" />
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  className="h-8 w-8 p-0 text-blue-600"
                  onClick={() => setShareItem(item)}
                  title={t('shareCodes')}
                >
                  <Link2 className="size-4" />
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  className="h-8 w-8 p-0 text-blue-600"
                  onClick={() => onDownload(item)}
                  title={t('download')}
                >
                  <Download className="size-4" />
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  className="h-8 w-8 p-0 text-red-600"
                  disabled={deletingId === item.id}
                  onClick={() => setDeleteId(item.id)}
                  title={t('delete')}
                >
                  <Trash2 className="size-4" />
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}

      {!loading && !error && total > 0 ? (
        <div className="flex items-center justify-between gap-3">
          <p className="text-xs text-muted-foreground">
            {t('totalCount', { total })}
          </p>
          {totalPages > 1 ? (
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                {t('pagePrev')}
              </Button>
              <span className="text-xs text-muted-foreground">
                {page} / {totalPages}
              </span>
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              >
                {t('pageNext')}
              </Button>
            </div>
          ) : null}
        </div>
      ) : null}

      <AlertDialog
        open={!!deleteId}
        onOpenChange={(open) => {
          if (!open && !deletingId) setDeleteId(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('deleteTitle')}</AlertDialogTitle>
            <AlertDialogDescription>{t('deleteConfirm')}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={!!deletingId}>
              {t('cancel')}
            </AlertDialogCancel>
            <AlertDialogAction
              disabled={!!deletingId}
              onClick={(e) => {
                e.preventDefault();
                void confirmDelete();
              }}
              className="bg-destructive text-white hover:bg-destructive/90"
            >
              {deletingId ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                t('delete')
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog
        open={!!previewItem}
        onOpenChange={(open) => {
          if (!open) setPreviewItem(null);
        }}
      >
        <AlertDialogContent className="max-w-3xl gap-3 sm:max-w-3xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="truncate">
              {previewItem?.title ?? t('preview')}
            </AlertDialogTitle>
            <AlertDialogDescription className="sr-only">
              {t('preview')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          {previewItem ? (
            <video
              key={previewItem.id}
              src={previewItem.url}
              controls
              playsInline
              className="max-h-[70vh] w-full rounded-lg bg-black"
            />
          ) : null}
          <AlertDialogFooter>
            <AlertDialogCancel>{t('previewClose')}</AlertDialogCancel>
            {previewItem ? (
              <>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => {
                    setShareItem(previewItem);
                    setPreviewItem(null);
                  }}
                  className="gap-1.5"
                >
                  <Link2 className="size-4" />
                  {t('shareCodes')}
                </Button>
                <Button
                  type="button"
                  onClick={() => onDownload(previewItem)}
                  className="gap-1.5"
                >
                  <Download className="size-4" />
                  {t('download')}
                </Button>
              </>
            ) : null}
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog
        open={!!shareItem}
        onOpenChange={(open) => {
          if (!open) setShareItem(null);
        }}
      >
        <AlertDialogContent className="flex max-h-[90vh] max-w-2xl flex-col gap-0 overflow-hidden p-0 sm:max-w-2xl">
          <AlertDialogHeader className="shrink-0 border-b px-5 py-4 text-left">
            <AlertDialogTitle className="truncate pr-8">
              {shareItem?.title ?? t('shareCodes')}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {t('shareCodesDesc')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
            {shareItem ? (
              <ShareCodesPanel
                url={shareItem.url}
                showPrimary
                showSuccessHeader={false}
                compact
              />
            ) : null}
          </div>
          <AlertDialogFooter className="shrink-0 border-t px-5 py-3 sm:justify-between">
            {shareItem ? (
              <Button
                type="button"
                variant="outline"
                className="gap-1.5"
                onClick={() => onDownload(shareItem)}
              >
                <Download className="size-4" />
                {t('download')}
              </Button>
            ) : (
              <span />
            )}
            <AlertDialogCancel>{t('previewClose')}</AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
