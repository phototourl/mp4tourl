"use client";

import NextImage from "next/image";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import {
  Copy,
  ExternalLink,
  FileText,
  FolderOpen,
  LayoutDashboard,
  Link2,
  Loader2,
  RefreshCw,
  Upload,
  X,
  Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { authClient } from "@/lib/auth-client";
import { useLocaleRouter } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";
import { UploadUpgradeDialog } from "@/components/shared/upload-upgrade-dialog";
import { LoginRequiredDialog } from "@/components/shared/login-required-dialog";
import { PLAN_PAID, formatBytes } from "@/lib/constants/plans";
import {
  interpretDashboardDocumentUploadApiFailure,
  messageForDocumentUploadApiFailure,
  messageForDocumentUploadPrecheckFailure,
  precheckDashboardDocumentUpload,
} from "@/lib/dashboard-document-upload-flow";
import { useDashboardDocumentPlanInfo } from "@/hooks/use-dashboard-document-plan-info";

type UploadPhase = "idle" | "uploading" | "success" | "error";

function loginCallbackPath(locale: string): string {
  return locale === routing.defaultLocale ? "/pdf-to-url" : `/${locale}/pdf-to-url`;
}

export function PdfToUrlTool() {
  const t = useTranslations("pdfToUrl.tool");
  const tPage = useTranslations("pdfToUrl.page");
  const tCommon = useTranslations("common");
  const tDashboard = useTranslations("Dashboard");
  const tRm = useTranslations("Dashboard.resourceModule");
  const locale = useLocale();
  const router = useLocaleRouter();
  const inputRef = useRef<HTMLInputElement | null>(null);

  const [loggedIn, setLoggedIn] = useState<boolean | null>(null);
  const [phase, setPhase] = useState<UploadPhase>("idle");
  const [isDragging, setIsDragging] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [url, setUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [showUpgradeDialog, setShowUpgradeDialog] = useState(false);
  const [showLoginDialog, setShowLoginDialog] = useState(false);

  const { planInfo, metaReady, refetchPlanInfo } = useDashboardDocumentPlanInfo(loggedIn === true);

  const authReturnPath = useMemo(() => loginCallbackPath(locale), [locale]);

  const documentUploadUpgradeDescription = useMemo(() => {
    if (!planInfo) return tDashboard("uploadUpgradeDescription");
    const shouldUseRenewCopy = Boolean(planInfo.plan === PLAN_PAID && !planInfo.subscriptionActive);
    return shouldUseRenewCopy && tDashboard.has("uploadRenewDescription")
      ? tDashboard("uploadRenewDescription")
      : tDashboard("uploadUpgradeDescription");
  }, [planInfo, tDashboard]);

  const refreshSession = useCallback(async () => {
    const { data } = await authClient.getSession();
    setLoggedIn(Boolean(data?.user?.id));
  }, []);

  useEffect(() => {
    void refreshSession();
  }, [refreshSession]);

  useEffect(() => {
    if (!copied) return;
    const id = setTimeout(() => setCopied(false), 1500);
    return () => clearTimeout(id);
  }, [copied]);

  const pickFile = (f: File | null | undefined) => {
    setError(null);
    setUrl(null);
    if (!f) {
      setFile(null);
      return;
    }
    if (f.type !== "application/pdf" && !f.name.toLowerCase().endsWith(".pdf")) {
      setFile(null);
      setError(t("errorBadType"));
      setPhase("error");
      return;
    }
    setFile(f);
    setPhase("idle");
  };

  const onInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    e.target.value = "";
    pickFile(f);
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const f = e.dataTransfer.files?.[0];
    pickFile(f);
  };

  const onDragEnter = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const onDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const x = e.clientX;
    const y = e.clientY;
    if (x < rect.left || x > rect.right || y < rect.top || y > rect.bottom) {
      setIsDragging(false);
    }
  };

  const upload = async () => {
    if (phase === "uploading") return;
    if (loggedIn === null) {
      await refreshSession();
    }
    if (!loggedIn) {
      setShowLoginDialog(true);
      return;
    }
    if (!file) return;
    if (!metaReady) return;
    setPhase("uploading");
    setError(null);
    setUrl(null);
    setShowUpgradeDialog(false);
    try {
      const preFail = precheckDashboardDocumentUpload(planInfo, file.size);
      if (preFail) {
        const ui = messageForDocumentUploadPrecheckFailure(preFail, tRm);
        setError(ui.message);
        if (ui.showUpgradeDialog) setShowUpgradeDialog(true);
        setPhase("error");
        return;
      }
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/documents/upload", { method: "POST", body: formData });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        if (res.status === 401) {
          setLoggedIn(false);
          setPhase("idle");
          setShowLoginDialog(true);
          return;
        }
        const body = data && typeof data === "object" ? (data as Record<string, unknown>) : {};
        const interpreted = interpretDashboardDocumentUploadApiFailure(res.status, body);
        const ui = messageForDocumentUploadApiFailure(interpreted, tRm);
        setError(ui.message);
        if (ui.showUpgradeDialog) setShowUpgradeDialog(true);
        setPhase("error");
        return;
      }
      if (typeof data?.url === "string") {
        setUrl(data.url);
        setPhase("success");
        void refreshSession();
        void refetchPlanInfo();
        return;
      }
      setError(tRm("uploadErrorGeneric"));
      setPhase("error");
    } catch {
      setError(tRm("uploadErrorGeneric"));
      setPhase("error");
    }
  };

  const copyUrl = async () => {
    if (!url) return;
    await navigator.clipboard.writeText(url);
    setCopied(true);
  };

  const reset = () => {
    setFile(null);
    setUrl(null);
    setError(null);
    setPhase("idle");
  };

  const goAuthLogin = () => {
    setShowLoginDialog(false);
    router.push(`/auth/login?callbackUrl=${encodeURIComponent(authReturnPath)}`);
  };

  const goAuthRegister = () => {
    setShowLoginDialog(false);
    router.push(`/auth/register?callbackUrl=${encodeURIComponent(authReturnPath)}`);
  };

  return (
    <div className="mx-auto max-w-3xl">
      <div className="text-center">
        <h1 className="flex items-center justify-center gap-3 text-xl font-semibold tracking-tight text-slate-900 sm:text-3xl lg:text-4xl">
          <div className="h-8 w-8 overflow-hidden rounded-xl sm:h-10 sm:w-10 lg:h-12 lg:w-12">
            <NextImage
              src="/pdf_to_url.png"
              alt={t("heroTitle")}
              width={48}
              height={48}
              className="h-full w-full object-contain"
            />
          </div>
          {t("heroTitle")}
        </h1>
        <p className="mx-auto mt-3 max-w-2xl text-base text-slate-600 sm:text-lg">{t("heroSubtitle")}</p>
      </div>

      <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { icon: Zap, title: t("featureFastTitle"), desc: t("featureFastDesc") },
          { icon: FolderOpen, title: t("featureHostingTitle"), desc: t("featureHostingDesc") },
          { icon: Link2, title: t("featureLinkTitle"), desc: t("featureLinkDesc") },
          { icon: LayoutDashboard, title: t("featureDashboardTitle"), desc: t("featureDashboardDesc") },
        ].map(({ icon: Icon, title, desc }) => (
          <div
            key={title}
            className="rounded-2xl border border-slate-200/90 bg-white p-4 text-left shadow-sm dark:border-border dark:bg-card"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-50 text-brand-teal dark:bg-teal-950/40">
              <Icon className="h-5 w-5" aria-hidden />
            </div>
            <h2 className="mt-3 text-sm font-semibold text-slate-900 dark:text-foreground">{title}</h2>
            <p className="mt-1 text-xs leading-relaxed text-slate-600 dark:text-muted-foreground">{desc}</p>
          </div>
        ))}
      </div>

      <>
        <input
            id="pdf-to-url-file-input"
            ref={inputRef}
            type="file"
            accept="application/pdf,.pdf"
            className="hidden"
            onChange={onInputChange}
          />
          <div
            className={cn(
              "relative mt-10 flex min-h-[240px] flex-col items-center justify-center rounded-2xl border-2 border-dashed p-10 text-center transition-colors sm:min-h-[280px] sm:p-14",
              "cursor-pointer hover:bg-teal-100/50 dark:hover:bg-teal-950/20",
              isDragging ? "border-brand-teal bg-teal-50/60 dark:border-brand-teal" : "border-slate-200 bg-white dark:border-slate-600",
              phase === "uploading" && "pointer-events-none cursor-not-allowed opacity-80"
            )}
            onDrop={onDrop}
            onDragOver={(e) => e.preventDefault()}
            onDragEnter={onDragEnter}
            onDragLeave={onDragLeave}
            onClick={() => {
              if (phase === "uploading") return;
              inputRef.current?.click();
            }}
            onKeyDown={(e) => {
              if (phase === "uploading") return;
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                inputRef.current?.click();
              }
            }}
            role="button"
            tabIndex={phase === "uploading" ? -1 : 0}
            aria-label={t("dropzoneTitle")}
          >
            <Upload className="mx-auto h-10 w-10 text-brand-teal" aria-hidden />
            <p className="mt-4 text-lg font-semibold text-slate-900">{t("dropzoneTitle")}</p>
            <p className="mt-2 text-sm text-slate-500">{t("dropzoneHint")}</p>
            <p className="mt-2 text-xs text-slate-500/90 dark:text-muted-foreground">{t("dropzoneFootnote")}</p>
            {file && (
              <div
                className="mt-4 flex w-full max-w-lg flex-wrap items-center gap-2.5 rounded-xl border-2 border-brand-teal/45 bg-gradient-to-r from-teal-50/95 to-white px-3 py-2.5 text-left shadow-sm ring-1 ring-teal-100/90 dark:border-brand-teal/55 dark:from-teal-950/55 dark:to-card dark:ring-teal-900/50"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-teal/15 text-brand-teal dark:bg-teal-900/70">
                  <FileText className="h-4 w-4" aria-hidden />
                </div>
                <div className="min-w-0 flex-1 basis-[min(100%,12rem)]">
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-brand-teal dark:text-teal-300/95">
                    {t("selectedFileLabel")}
                  </p>
                  <p className="truncate text-sm font-semibold text-slate-900 dark:text-foreground" title={file.name}>
                    {file.name}
                  </p>
                </div>
                <span className="shrink-0 rounded-md border border-slate-200/90 bg-white/95 px-2 py-1 text-xs tabular-nums text-slate-600 dark:border-border dark:bg-muted dark:text-muted-foreground">
                  {formatBytes(file.size, locale)}
                </span>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 shrink-0 p-0 text-slate-500 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/40"
                  aria-label={t("removeSelectedFile")}
                  onClick={(e) => {
                    e.stopPropagation();
                    setFile(null);
                    setError(null);
                    setPhase("idle");
                  }}
                >
                  <X className="h-4 w-4" aria-hidden />
                </Button>
              </div>
            )}
            <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={(e) => {
                  e.stopPropagation();
                  inputRef.current?.click();
                }}
              >
                {t("browse")}
              </Button>
              <Button
                type="button"
                className="bg-brand-teal text-white hover:bg-brand-teal/90"
                disabled={phase === "uploading" || (loggedIn === true && (!file || !metaReady))}
                onClick={(e) => {
                  e.stopPropagation();
                  void upload();
                }}
              >
                {phase === "uploading" ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {t("uploading")}
                  </>
                ) : (
                  t("uploadBtn")
                )}
              </Button>
            </div>
            {error && phase !== "uploading" && phase !== "success" && (
              <p className="mt-4 text-sm font-medium text-red-600" role="alert">
                {error}
              </p>
            )}
          </div>

          {phase === "success" && url && (
            <div className="mt-8 rounded-2xl border border-slate-200 bg-slate-50/80 p-6 dark:border-border dark:bg-muted/30">
              <h2 className="text-center text-base font-semibold text-slate-900 dark:text-foreground">
                {t("resultTitle")}
              </h2>
              <div className="mt-4 flex min-w-0 flex-col gap-3 sm:flex-row sm:items-center">
                <code className="min-w-0 flex-1 truncate rounded-lg border border-slate-200 bg-white px-3 py-2 text-left text-xs text-slate-800 dark:border-border dark:bg-card">
                  {url}
                </code>
                <div className="flex shrink-0 flex-wrap justify-center gap-2">
                  <Button type="button" size="sm" variant="outline" onClick={() => void copyUrl()}>
                    <Copy className="mr-1.5 h-4 w-4" />
                    {copied ? t("copied") : t("copy")}
                  </Button>
                  <Button type="button" size="sm" variant="outline" asChild>
                    <a href={url} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="mr-1.5 h-4 w-4" />
                      {t("open")}
                    </a>
                  </Button>
                  <Button type="button" size="sm" onClick={reset}>
                    <RefreshCw className="mr-1.5 h-4 w-4" />
                    {t("reset")}
                  </Button>
                </div>
              </div>
              <p className="mx-auto mt-4 max-w-xl text-center text-sm leading-relaxed text-slate-600 dark:text-muted-foreground">
                {t("resultDashboardHint")}
              </p>
              <div className="mt-4 flex justify-center">
                <Button type="button" variant="outline" size="sm" onClick={() => router.push("/dashboard")}>
                  <LayoutDashboard className="mr-2 h-4 w-4" />
                  {t("dashboardCta")}
                </Button>
              </div>
            </div>
          )}
      </>

      <div className="mt-16 space-y-4 text-center">
        <h2 className="text-2xl font-semibold text-slate-900 dark:text-foreground">{t("howTitle")}</h2>
        <div className="mx-auto grid max-w-3xl gap-6 text-left sm:grid-cols-3">
          <div>
            <p className="text-sm font-semibold text-brand-teal">{t("step1Title")}</p>
            <p className="mt-2 text-sm text-slate-600 dark:text-muted-foreground">{t("step1Desc")}</p>
          </div>
          <div>
            <p className="text-sm font-semibold text-brand-teal">{t("step2Title")}</p>
            <p className="mt-2 text-sm text-slate-600 dark:text-muted-foreground">{t("step2Desc")}</p>
          </div>
          <div>
            <p className="text-sm font-semibold text-brand-teal">{t("step3Title")}</p>
            <p className="mt-2 text-sm text-slate-600 dark:text-muted-foreground">{t("step3Desc")}</p>
          </div>
        </div>
      </div>

      <div className="mt-14 rounded-2xl border border-slate-200/90 bg-white p-6 text-left shadow-sm dark:border-border dark:bg-card sm:p-8">
        <h2 className="text-center text-xl font-semibold text-slate-900 dark:text-foreground">{tPage("sectionTitle")}</h2>
        <p className="mx-auto mt-3 max-w-2xl text-center text-sm leading-relaxed text-slate-600 dark:text-muted-foreground">
          {tPage("sectionLead")}
        </p>
        <ul className="mx-auto mt-6 max-w-2xl list-disc space-y-2.5 pl-5 text-sm leading-relaxed text-slate-600 marker:text-brand-teal dark:text-muted-foreground sm:pl-6">
          <li>{tPage("bullet1")}</li>
          <li>{tPage("bullet2")}</li>
          <li>{tPage("bullet3")}</li>
          <li>{tPage("bullet4")}</li>
        </ul>
        <p className="mx-auto mt-6 max-w-2xl text-center text-xs leading-relaxed text-slate-500 dark:text-muted-foreground">
          {tPage("footnote")}
        </p>
      </div>

      <LoginRequiredDialog
        open={showLoginDialog}
        onOpenChange={setShowLoginDialog}
        siteName={tCommon("siteName")}
        title={t("loginRequiredTitle")}
        description={t("loginRequiredDescription")}
        detail={t("loginRequiredDetail")}
        loginText={t("loginCta")}
        registerText={t("signUpCta")}
        cancelText={tDashboard("cancel")}
        onLogin={goAuthLogin}
        onRegister={goAuthRegister}
      />

      <UploadUpgradeDialog
        open={showUpgradeDialog}
        onOpenChange={setShowUpgradeDialog}
        siteName={tCommon("siteName")}
        title={tDashboard("uploadUpgradeTitle")}
        description={documentUploadUpgradeDescription}
        errorMessage={showUpgradeDialog ? error : null}
        confirmText={tDashboard("upgrade.button")}
        cancelText={tDashboard("cancel")}
        onConfirm={() => {
          setShowUpgradeDialog(false);
          router.push("/pricing");
        }}
      />
    </div>
  );
}
