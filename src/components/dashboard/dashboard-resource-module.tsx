'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { CopyIcon, DownloadIcon, LayoutGridIcon, ListIcon, Loader2Icon, PlusIcon, TrashIcon, UploadIcon } from 'lucide-react';
import { formatBytes, PLAN_PAID } from '@/lib/constants/plans';
import { DOCUMENT_UPLOAD_ACCEPT } from '@/lib/document-upload-allowlist';
import {
  interpretDashboardDocumentUploadApiFailure,
  messageForDocumentUploadApiFailure,
  messageForDocumentUploadPrecheckFailure,
  precheckDashboardDocumentUpload,
} from '@/lib/dashboard-document-upload-flow';
import { DashboardResourcesPagination } from '@/components/dashboard/dashboard-resources-pagination';
import { DOCUMENT_LIST_PAGE_SIZE_DEFAULT } from '@/lib/constants/resource-pagination';
import { UploadUpgradeDialog } from '@/components/shared/upload-upgrade-dialog';
import { AlertDialog } from '@/components/ui/alert-dialog';
import { useLocaleRouter } from '@/i18n/navigation';
import { trackPricingRedirect } from '@/lib/analytics/pricing-redirect';
import type { DashboardDocumentPlanSnapshot } from '@/lib/dashboard-document-plan';
// 日期筛选暂不启用（有分页，后续如需再加会走服务端 SQL）。

function FileTypeWatermark({ ext }: { ext: string }) {
  const normalized = ext.toLowerCase();
  const src =
    normalized === 'pdf'
      ? '/dashboard/pdf.svg'
      : normalized === 'doc' || normalized === 'docx'
        ? '/dashboard/word.svg'
        : normalized === 'ppt' || normalized === 'pptx'
          ? '/dashboard/ppt.svg'
          : normalized === 'xls' || normalized === 'xlsx'
            ? '/dashboard/execl.svg'
            : null;

  if (!src) return null;

  return (
    <img
      aria-hidden
      src={src}
      alt=""
      className="pointer-events-none absolute left-1/2 top-1/2 z-0 h-14 w-14 -translate-x-1/2 -translate-y-1/2 object-contain opacity-100 select-none mix-blend-normal filter-none sm:h-20 sm:w-20"
      draggable={false}
    />
  );
}

interface DocumentItem {
  id: number;
  filename: string;
  path: string;
  originalUrl: string;
  fileExt?: string;
  mimeType?: string;
  fileSize: number;
  createdAt: string;
}

interface DashboardResourceModuleProps {
  locale: string;
  cardClassName?: string;
  planInfo?: DashboardDocumentPlanSnapshot | null;
  onUsageChanged?: () => void;
}

export function DashboardResourceModule({
  locale,
  cardClassName,
  planInfo,
  onUsageChanged,
}: DashboardResourceModuleProps) {
  const t = useTranslations('Dashboard.resourceModule');
  const tDash = useTranslations('Dashboard');
  const tCommon = useTranslations('common');
  const router = useLocaleRouter();
  const shouldUseRenewCopy = Boolean(planInfo?.plan === PLAN_PAID && !planInfo?.subscriptionActive);
  const uploadUpgradeDescription =
    shouldUseRenewCopy && tDash.has('uploadRenewDescription')
      ? tDash('uploadRenewDescription')
      : tDash('uploadUpgradeDescription');
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DOCUMENT_LIST_PAGE_SIZE_DEFAULT);
  const [q, setQ] = useState('');
  const [type, setType] = useState('');
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);
  const [copiedId, setCopiedId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('grid');
  const [showUpgradeDialog, setShowUpgradeDialog] = useState(false);

  /** 查询条内：搜索 / 类型 / 日期 / 重置 统一高度与边框（原生 select 收起态一致；展开由系统绘制） */
  const filterControlClass =
    'ptu-doc-filter-control h-9 min-h-9 w-full min-w-0 rounded-md border border-slate-200 bg-white px-3 text-sm text-foreground shadow-none outline-none ring-0 placeholder:text-slate-400 focus:border-slate-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-200/70';
  const filterSelectClass = `${filterControlClass} cursor-pointer pr-8`;
  const filterResetClass =
    'ptu-doc-filter-reset inline-flex w-auto items-center justify-center h-9 min-h-9 shrink-0 cursor-pointer select-none whitespace-nowrap rounded-md border border-slate-200 bg-slate-50 px-3 text-sm font-semibold leading-none text-slate-700 shadow-sm transition-colors active:translate-y-px hover:bg-slate-100 hover:border-slate-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-200/70 disabled:cursor-not-allowed disabled:opacity-55';
  const actionBtnClass =
    'h-8 w-8 p-0 rounded-md ptu-action-btn';
  const actionDangerBtnClass =
    'h-8 w-8 p-0 rounded-md ptu-action-btn ptu-action-danger';

  /** 仅请求服务端 `/api/documents`（SQL 筛选 + 分页），不在此对列表做前端过滤 */
  const fetchDocumentsPage = useCallback(async (targetPage: number) => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      params.set('page', String(targetPage));
      params.set('pageSize', String(pageSize));
      if (q.trim()) params.set('q', q.trim());
      if (type) params.set('type', type);
      const res = await fetch(`/api/documents?${params.toString()}`);
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        console.error('[Documents] fetch failed', res.status, data);
        const msg =
          (typeof data?.details === 'string' && data.details) ||
          (typeof data?.error === 'string' && data.error) ||
          `HTTP ${res.status}`;
        setDocuments([]);
        setTotal(0);
        throw new Error(msg);
      }
      setDocuments(data?.documents || []);
      setTotal(data?.total || 0);
    } catch (err) {
      setError(err instanceof Error ? err.message : t('fetchError'));
    } finally {
      setLoading(false);
    }
  }, [t, pageSize, q, type]);

  const groupedDocuments = useMemo(() => {
    const groups: Record<'pdf' | 'word' | 'ppt' | 'excel' | 'other', DocumentItem[]> = {
      pdf: [],
      word: [],
      ppt: [],
      excel: [],
      other: [],
    };
    for (const d of documents) {
      const ext = (d.fileExt || '').toLowerCase();
      if (ext === 'pdf') groups.pdf.push(d);
      else if (ext === 'doc' || ext === 'docx') groups.word.push(d);
      else if (ext === 'ppt' || ext === 'pptx') groups.ppt.push(d);
      else if (ext === 'xls' || ext === 'xlsx') groups.excel.push(d);
      else groups.other.push(d);
    }
    return groups;
  }, [documents]);

  /** 筛选/每页条数变化时已请求第 1 页，跳过后续一次「仅因 setPage(1) 触发的重复请求」 */
  const skipNextPageFetchRef = useRef(false);
  const fetchDocumentsPageRef = useRef(fetchDocumentsPage);
  fetchDocumentsPageRef.current = fetchDocumentsPage;

  const filterKey = useMemo(
    () => `${q}|${type}|${pageSize}`,
    [q, type, pageSize]
  );

  useEffect(() => {
    const totalPages = Math.max(1, Math.ceil(total / pageSize));
    if (page > totalPages) {
      setPage(totalPages);
    }
  }, [total, page, pageSize]);

  // 仅当关键词 / 类型 / 每页条数变化：服务端从第 1 页重查（用 filterKey，避免 t 变化误重置页码）
  useEffect(() => {
    void fetchDocumentsPageRef.current(1);
    setPage(1);
    skipNextPageFetchRef.current = true;
  }, [filterKey]);

  // 页码或 fetchDocumentsPage 变化：服务端 LIMIT/OFFSET；上一条 effect 已请求则跳过重复
  useEffect(() => {
    if (skipNextPageFetchRef.current) {
      skipNextPageFetchRef.current = false;
      return;
    }
    void fetchDocumentsPage(page);
  }, [page, pageSize, fetchDocumentsPage]);

  const handleUpload = async (file: File) => {
    const preFail = precheckDashboardDocumentUpload(planInfo, file.size);
    if (preFail) {
      const ui = messageForDocumentUploadPrecheckFailure(preFail, t);
      setError(ui.message);
      if (ui.showUpgradeDialog) setShowUpgradeDialog(true);
      return;
    }
    setUploading(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch('/api/documents/upload', { method: 'POST', body: formData });
      const data = await res.json();
      if (!res.ok) {
        const body = data && typeof data === 'object' ? (data as Record<string, unknown>) : {};
        const interpreted = interpretDashboardDocumentUploadApiFailure(res.status, body);
        const ui = messageForDocumentUploadApiFailure(interpreted, t);
        setError(ui.message);
        if (ui.showUpgradeDialog) setShowUpgradeDialog(true);
        return;
      }
      await fetchDocumentsPage(1);
      setPage(1);
      skipNextPageFetchRef.current = true;
      onUsageChanged?.();
    } catch {
      setError(t('uploadErrorGeneric'));
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      setDeletingId(id);
      const res = await fetch(`/api/documents?id=${id}`, { method: 'DELETE' });
      if (!res.ok) {
        setError(t('deleteFailed'));
        return;
      }
      await fetchDocumentsPage(page);
      onUsageChanged?.();
    } finally {
      setDeletingId(null);
    }
  };

  const handleDeleteConfirm = async () => {
    if (deleteConfirmId == null) return;
    const id = deleteConfirmId;
    setDeleteConfirmId(null);
    await handleDelete(id);
  };

  return (
    <Card className={cardClassName}>
      <CardHeader>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap items-center gap-2">
            <CardTitle className="text-base font-semibold">{t('title')}</CardTitle>
            <span className="text-sm text-muted-foreground">{t('count', { count: total })}</span>
          </div>
        </div>

          <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:gap-x-3 sm:gap-y-2">
          <div className="flex shrink-0 items-center gap-2 sm:self-center">
            <>
              <input
                type="file"
                id="dashboard-document-upload-input"
                className="hidden"
                accept={DOCUMENT_UPLOAD_ACCEPT}
                disabled={uploading}
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleUpload(file);
                  e.target.value = '';
                }}
              />
              <Button
                type="button"
                size="sm"
                variant="default"
                className="h-7 shrink-0 gap-1 rounded-md px-3 text-xs bg-[#02c7c7] text-white shadow-sm shadow-[#02c7c7]/40 hover:bg-[#00b3b3] [&_svg]:h-3 [&_svg]:w-3"
                onClick={() => {
                  if (uploading) return;
                  if (planInfo && planInfo.storageUsed >= planInfo.storageLimit) {
                    setError(t('uploadErrorStorageLimit'));
                    setShowUpgradeDialog(true);
                    return;
                  }
                  const input = document.getElementById('dashboard-document-upload-input') as HTMLInputElement | null;
                  input?.click();
                }}
              >
                {uploading ? (
                  <>
                    <Loader2Icon className="h-3 w-3 shrink-0 animate-spin" aria-hidden />
                    {t('uploading')}
                  </>
                ) : (
                  <>
                    <UploadIcon className="h-3 w-3 shrink-0" aria-hidden />
                    {t('upload')}
                  </>
                )}
              </Button>
            </>
          </div>

          <div className="grid min-w-0 flex-1 grid-cols-1 gap-2 sm:grid-cols-[minmax(0,20rem)_10rem_5.5rem] sm:items-center sm:gap-3 sm:justify-start">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={t('searchPlaceholder')}
            className={filterControlClass}
          />
          <select
            value={type}
            onChange={(e) => setType(e.target.value)}
            className={cn(filterSelectClass, 'ptu-doc-type-select ptu-doc-filter-select')}
            aria-label={t('tableType')}
          >
            <option value="">{t('typeAll')}</option>
            <option value="pdf">{t('typePdf')}</option>
            <option value="word">{t('typeWord')}</option>
            <option value="ppt">{t('typePpt')}</option>
            <option value="excel">{t('typeExcel')}</option>
          </select>
          <button
            type="button"
            className={filterResetClass}
            disabled={!q && !type}
            onClick={() => {
              setQ('');
              setType('');
            }}
          >
            {t('reset')}
          </button>
          </div>

          <div className="ptu-view-toggle flex items-center gap-1 self-start rounded-md bg-slate-200/80 p-1 sm:ml-auto dark:bg-slate-700/80 sm:self-auto">
            <button
              type="button"
              onClick={() => setViewMode('grid')}
              className={cn(
                'flex items-center gap-1 rounded-sm px-2 py-1 text-xs transition-colors',
                viewMode === 'grid'
                  ? 'bg-white text-foreground shadow-sm dark:bg-slate-800'
                  : 'text-muted-foreground hover:text-foreground'
              )}
              aria-label={t.has('viewCard') ? t('viewCard') : tDash('viewGrid')}
            >
              <LayoutGridIcon className="h-3 w-3" aria-hidden />
              <span>{t.has('viewCard') ? t('viewCard') : tDash('viewGrid')}</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('table')}
              className={cn(
                'flex items-center gap-1 rounded-sm px-2 py-1 text-xs transition-colors',
                viewMode === 'table'
                  ? 'bg-white text-foreground shadow-sm dark:bg-slate-800'
                  : 'text-muted-foreground hover:text-foreground'
              )}
              aria-label={tDash('viewTable')}
            >
              <ListIcon className="h-3 w-3" aria-hidden />
              <span>{tDash('viewTable')}</span>
            </button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        {loading ? (
          <div className="flex h-24 items-center justify-center text-muted-foreground">
            <Loader2Icon className="h-5 w-5 animate-spin" />
          </div>
        ) : viewMode === 'grid' ? (
          <div className="ptu-photo-wall rounded-xl border border-slate-200/70 bg-slate-50 p-4 dark:border-border dark:bg-muted/30">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7">
              <div className="ptu-thumb ptu-upload-tile group relative aspect-square overflow-hidden rounded-lg border border-dashed border-sky-300/80 bg-gradient-to-br from-sky-50 to-blue-100/80 p-0 text-sky-700 transition-all duration-200 ease-out motion-safe:hover:-translate-y-0.5 motion-safe:hover:shadow-[0_10px_24px_-16px_rgba(14,116,144,0.45)] motion-safe:hover:border-sky-400 dark:border-slate-500/50 dark:bg-slate-800/40 dark:text-slate-200 dark:motion-safe:hover:border-cyan-300/60 dark:motion-safe:hover:shadow-[0_12px_28px_-18px_rgba(34,211,238,0.45)]">
                <button
                  type="button"
                  aria-label={uploading ? t('uploading') : t('upload')}
                  className={cn(
                    'flex h-full w-full items-center justify-center transition-all duration-200 group-hover:scale-[1.02] hover:text-sky-800 dark:hover:text-white',
                    uploading && 'pointer-events-none opacity-60'
                  )}
                  onClick={() => {
                    if (uploading) return;
                    if (planInfo && planInfo.storageUsed >= planInfo.storageLimit) {
                      setError(t('uploadErrorStorageLimit'));
                      setShowUpgradeDialog(true);
                      return;
                    }
                    const input = document.getElementById('dashboard-document-upload-input') as HTMLInputElement | null;
                    input?.click();
                  }}
                >
                  {uploading ? (
                    <Loader2Icon className="h-20 w-20 animate-spin" aria-hidden />
                  ) : (
                    <PlusIcon className="h-20 w-20" aria-hidden />
                  )}
                </button>
              </div>

              {documents.length === 0 ? (
                <div className="col-span-2 flex min-h-[4.5rem] min-w-0 items-center justify-center px-2 sm:col-span-3 md:col-span-4 lg:col-span-5 xl:col-span-6">
                  <p className="max-w-prose break-words text-center text-sm leading-snug text-muted-foreground">
                    {t('empty')}
                  </p>
                </div>
              ) : null}

              {documents.map((doc) => {
                const ext = (doc.fileExt || '').toLowerCase();
                return (
                  <div
                    key={doc.id}
                    className="ptu-thumb ptu-doc-card group relative aspect-square overflow-hidden rounded-lg border border-slate-200/80 bg-transparent p-3 dark:border-border dark:bg-transparent"
                  >
                    <FileTypeWatermark ext={ext} />
                    <div className="absolute left-1 top-1 right-1 z-10 flex flex-wrap justify-center gap-1 sm:hidden">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="ptu-grid-action-btn h-7 w-7 p-0 bg-white/90 hover:bg-white text-blue-600 rounded-md opacity-90"
                        onClick={async () => {
                          await navigator.clipboard.writeText(doc.originalUrl);
                          setCopiedId(doc.id);
                          setTimeout(() => setCopiedId(null), 1500);
                        }}
                        aria-label={t('copy')}
                      >
                        {copiedId === doc.id ? (
                          <CopyIcon className="h-3.5 w-3.5 text-green-600" />
                        ) : (
                          <CopyIcon className="h-3.5 w-3.5" />
                        )}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="ptu-grid-action-btn h-7 w-7 p-0 bg-white/90 hover:bg-white text-blue-600 rounded-md opacity-90"
                        onClick={() => window.open(doc.originalUrl, '_blank')}
                        aria-label="Download"
                      >
                        <DownloadIcon className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="ptu-grid-action-btn ptu-grid-action-danger h-7 w-7 p-0 bg-white/90 hover:bg-white text-red-600 rounded-md opacity-90"
                        onClick={() => setDeleteConfirmId(doc.id)}
                        disabled={deletingId === doc.id}
                        aria-label={t('delete')}
                      >
                        {deletingId === doc.id ? (
                          <Loader2Icon className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <TrashIcon className="h-3.5 w-3.5" />
                        )}
                      </Button>
                    </div>
                    {/* Mobile: date + filename like "My Photos" bottom overlay */}
                    <div className="pointer-events-none absolute bottom-0 left-0 right-0 z-10 p-2 sm:hidden">
                      <p className="text-[11px] text-muted-foreground dark:text-white/75">
                        {new Date(doc.createdAt).toLocaleDateString(locale, { timeZone: 'UTC' })}
                      </p>
                      <p className="ptu-doc-card-filename truncate text-xs font-medium text-foreground dark:text-white">
                        {doc.filename}
                      </p>
                    </div>

                    {/* Desktop: keep original centered layout */}
                    <div className="relative z-10 hidden h-full flex-col items-center justify-between gap-2 text-center sm:flex">
                      <div className="flex flex-col items-center gap-2">
                        <p className="text-[11px] text-muted-foreground dark:text-white/70">
                          {new Date(doc.createdAt).toLocaleDateString(locale, { timeZone: 'UTC' })}
                        </p>
                        <p className="ptu-doc-card-filename max-w-[9rem] truncate pl-3 pr-2 text-left text-xs font-semibold text-foreground">
                          {doc.filename}
                        </p>
                      </div>

                      <div className="ptu-doc-card-actions flex items-center justify-center gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          className={actionBtnClass}
                          onClick={async () => {
                            await navigator.clipboard.writeText(doc.originalUrl);
                            setCopiedId(doc.id);
                            setTimeout(() => setCopiedId(null), 1500);
                          }}
                          aria-label={t('copy')}
                        >
                          {copiedId === doc.id ? (
                            <CopyIcon className="h-4 w-4 text-green-600" />
                          ) : (
                            <CopyIcon className="h-4 w-4" />
                          )}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className={actionBtnClass}
                          onClick={() => window.open(doc.originalUrl, '_blank')}
                          aria-label="Download"
                        >
                          <DownloadIcon className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className={actionDangerBtnClass}
                          onClick={() => setDeleteConfirmId(doc.id)}
                          disabled={deletingId === doc.id}
                          aria-label={t('delete')}
                        >
                          {deletingId === doc.id ? (
                            <Loader2Icon className="h-4 w-4 animate-spin" />
                          ) : (
                            <TrashIcon className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="ptu-table-shell overflow-hidden rounded-lg border border-slate-200/80 bg-white/60 backdrop-blur-sm dark:border-border dark:bg-transparent">
            <div className="ptu-table-head hidden border-b border-slate-200/80 bg-slate-50/80 px-4 py-2.5 text-xs font-medium text-muted-foreground sm:grid sm:grid-cols-[minmax(0,1.2fr)_minmax(0,2.6fr)_minmax(0,0.8fr)_minmax(5rem,6rem)_minmax(10rem,12rem)] dark:border-border dark:bg-muted/30">
              <span>{t('tableFile')}</span>
              <span>{t('tablePath')}</span>
              <span>{t('tableType')}</span>
              <span>{t('tableSize')}</span>
              <span className="text-right">{t('tableActions')}</span>
            </div>
            <ul className="divide-y divide-slate-100 dark:divide-border">
              {documents.length === 0 ? (
                <li className="px-4 py-8 text-center text-sm text-muted-foreground">{t('empty')}</li>
              ) : (
                documents.map((doc) => (
                <li
                  key={doc.id}
                  className="ptu-table-row grid grid-cols-1 gap-2 px-4 py-3 transition-colors hover:bg-slate-50/80 dark:hover:bg-muted/20 sm:grid-cols-[minmax(0,1.2fr)_minmax(0,2.6fr)_minmax(0,0.8fr)_minmax(5rem,6rem)_minmax(10rem,12rem)] sm:items-center sm:gap-3"
                >
                  <div className="min-w-0 self-start">
                    <p className="text-xs text-muted-foreground">
                      {new Date(doc.createdAt).toLocaleDateString(locale, { timeZone: 'UTC' })}
                    </p>
                    <p className="ptu-doc-filename break-all whitespace-normal text-sm font-medium text-foreground sm:truncate sm:whitespace-nowrap">
                      {doc.filename}
                    </p>
                    <p className="text-xs text-muted-foreground sm:hidden">
                      {t('typeLabel')}: {(doc.fileExt || doc.mimeType || '-').toString().toUpperCase()}
                    </p>
                  </div>
                  <div className="hidden min-w-0 self-start sm:block">
                    <pre className="ptu-doc-path m-0 whitespace-pre-wrap break-all [overflow-wrap:anywhere] leading-5 text-xs text-muted-foreground font-sans">
                      {doc.path}
                    </pre>
                  </div>
                  <div className="hidden h-full items-center sm:flex">
                    <span className="whitespace-nowrap text-xs leading-5 text-muted-foreground">
                      {(doc.fileExt || doc.mimeType || '-').toString().toUpperCase()}
                    </span>
                  </div>
                  <div className="flex h-full items-center">
                    <span className="text-xs leading-5 text-muted-foreground sm:text-sm">
                      {formatBytes(doc.fileSize, locale)}
                    </span>
                  </div>
                  <div className="ptu-doc-table-actions flex h-full items-center justify-start gap-1 sm:justify-end">
                    <Button
                      variant="ghost"
                      size="sm"
                      className={actionBtnClass}
                      onClick={async () => {
                        await navigator.clipboard.writeText(doc.originalUrl);
                        setCopiedId(doc.id);
                        setTimeout(() => setCopiedId(null), 1500);
                      }}
                      aria-label={t('copy')}
                    >
                      {copiedId === doc.id ? (
                        <CopyIcon className="h-4 w-4 text-green-600" />
                      ) : (
                        <CopyIcon className="h-4 w-4" />
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className={actionBtnClass}
                      onClick={() => window.open(doc.originalUrl, '_blank')}
                      aria-label="Download"
                    >
                      <DownloadIcon className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className={actionDangerBtnClass}
                      onClick={() => setDeleteConfirmId(doc.id)}
                      disabled={deletingId === doc.id}
                      aria-label={t('delete')}
                    >
                      {deletingId === doc.id ? (
                        <Loader2Icon className="h-4 w-4 animate-spin" />
                      ) : (
                        <TrashIcon className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </li>
              ))
              )}
            </ul>
          </div>
        )}

        <DashboardResourcesPagination
          total={total}
          page={page}
          pageSize={pageSize}
          onPageChange={setPage}
          onPageSizeChange={(size) => {
            setPageSize(size);
            setPage(1);
          }}
        />
      </CardContent>
      <UploadUpgradeDialog
        open={showUpgradeDialog}
        onOpenChange={setShowUpgradeDialog}
        siteName={tCommon('siteName')}
        title={tDash('uploadUpgradeTitle')}
        description={uploadUpgradeDescription}
        errorMessage={error}
        confirmText={tDash('upgrade.button')}
        cancelText={tDash('cancel')}
        onConfirm={() => {
          setShowUpgradeDialog(false);
          trackPricingRedirect({
            sourceModule: 'dashboard_documents',
            sourceAction: 'click_upgrade_btn',
            toPath: '/pricing',
            meta: { reason: 'documents_upload_or_limit' },
          });
          router.push('/pricing');
        }}
      />
      <AlertDialog
        open={deleteConfirmId !== null}
        title={tDash('deleteResource')}
        description={tDash('deleteConfirm')}
        confirmText={tDash('delete')}
        cancelText={tDash('cancel')}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteConfirmId(null)}
        loading={deletingId !== null}
        destructive
      />
    </Card>
  );
}

