"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { useLocale, useTranslations } from "next-intl";
import { ExternalLink, Loader2, RefreshCw, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { buildArtFightRegisterHref } from "@/lib/constants/user-type";
import { cn } from "@/lib/utils";
import { EmbedCodeTabs } from "@/components/shared/EmbedCodeTabs";
import { UploadUpgradeDialog } from "@/components/shared/upload-upgrade-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { useLocaleRouter } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";
import { PLAN_PAID } from "@/lib/constants/plans";
import { authClient } from "@/lib/auth-client";
import { useArtFightUpload } from "@/components/art-fight/use-art-fight-upload";
import { ArtFightRetentionNotice } from "@/components/art-fight/ArtFightRetentionNotice";

function defaultAltFromFileName(fileName: string | null, fallback: string) {
  if (!fileName) return fallback;
  return fileName.replace(/\.[^.]+$/, "").replace(/[-_]+/g, " ").trim() || fallback;
}

export function ArtFightUploadSection() {
  const t = useTranslations("artFight.upload");
  const tCommon = useTranslations("common");
  const tDashboard = useTranslations("Dashboard");
  const locale = useLocale();
  const router = useLocaleRouter();
  const inputRef = useRef<HTMLInputElement | null>(null);

  const [altText, setAltText] = useState(() => t("defaultAlt"));
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);
  const [showUpgradeDialog, setShowUpgradeDialog] = useState(false);
  const [upgradeDescription, setUpgradeDescription] = useState("");
  const [upgradeError, setUpgradeError] = useState<string | null>(null);
  const [urlOnly, setUrlOnly] = useState(true);

  const resolveUpgradeDescription = useCallback(async () => {
    try {
      const res = await fetch("/api/resources?metaOnly=1");
      if (!res.ok) return tDashboard("uploadUpgradeDescription");
      const data = await res.json();
      const shouldUseRenewCopy = Boolean(data?.plan === PLAN_PAID && !data?.subscriptionActive);
      return shouldUseRenewCopy && tDashboard.has("uploadRenewDescription")
        ? tDashboard("uploadRenewDescription")
        : tDashboard("uploadUpgradeDescription");
    } catch {
      return tDashboard("uploadUpgradeDescription");
    }
  }, [tDashboard]);

  const {
    IMAGE_ACCEPT,
    phase,
    isDragging,
    fileName,
    url,
    preview,
    error,
    reset,
    onInputChange,
    onDrop,
    onDragEnter,
    onDragLeave,
    onPaste,
  } = useArtFightUpload({
    onLoginRequired: () => setShowLoginPrompt(true),
    onUpgradeRequired: (message, upgradeDesc) => {
      setUpgradeError(message);
      setUpgradeDescription(upgradeDesc);
      setShowUpgradeDialog(true);
    },
    resolveUpgradeDescription,
  });

  useEffect(() => {
    if (phase !== "success") return;
    let cancelled = false;
    authClient.getSession().then(({ data }) => {
      if (!cancelled) setUrlOnly(!data?.user?.id);
    });
    return () => {
      cancelled = true;
    };
  }, [phase]);

  useEffect(() => {
    if (fileName) {
      setAltText(defaultAltFromFileName(fileName, t("defaultAlt")));
    }
  }, [fileName, t]);

  const authReturnPath = useMemo(
    () =>
      locale === routing.defaultLocale
        ? "/art-fight-image-hosting"
        : `/${locale}/art-fight-image-hosting`,
    [locale],
  );
  const registerHref = useMemo(() => buildArtFightRegisterHref(authReturnPath), [authReturnPath]);

  return (
    <section id="art-fight-upload" aria-labelledby="art-fight-upload-title" className="mt-10 scroll-mt-24">
      <div className="mb-5 text-center sm:text-left">
        <h2 id="art-fight-upload-title" className="text-lg font-semibold text-slate-900 sm:text-xl">
          {t("sectionTitle")}
        </h2>
        <p className="mt-1.5 text-sm text-slate-600">{t("sectionLead")}</p>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept={IMAGE_ACCEPT}
        className="hidden"
        onChange={onInputChange}
      />

      {phase !== "success" ? (
        <div
          className={cn(
            "relative flex min-h-[260px] flex-col items-center justify-center rounded-2xl border-2 border-dashed p-10 text-center transition-colors sm:min-h-[300px] sm:p-14",
            "cursor-pointer hover:bg-orange-50/60 dark:hover:bg-orange-950/10",
            isDragging
              ? "border-orange-400 bg-orange-50/80"
              : "border-orange-200/90 bg-white/95 shadow-inner dark:border-orange-900/40",
            phase === "uploading" && "pointer-events-none cursor-not-allowed opacity-80",
          )}
          onDrop={onDrop}
          onDragOver={(e) => e.preventDefault()}
          onDragEnter={onDragEnter}
          onDragLeave={onDragLeave}
          onPaste={onPaste}
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
          {phase === "uploading" ? (
            <Loader2 className="mx-auto h-10 w-10 animate-spin text-orange-600" aria-hidden />
          ) : (
            <Upload className="mx-auto h-10 w-10 text-orange-600" aria-hidden />
          )}
          <p className="mt-4 text-lg font-semibold text-slate-900">{t("dropzoneTitle")}</p>
          <p className="mt-2 text-sm text-slate-500">{t("dropzoneHint")}</p>
          <p className="mt-2 text-xs text-slate-500/90">{t("dropzoneFootnote")}</p>
          {error ? <p className="mt-4 text-sm text-red-600">{error}</p> : null}
        </div>
      ) : (
        <div className="rounded-2xl border border-orange-200/80 bg-gradient-to-b from-orange-50/90 to-white p-5 shadow-md sm:p-6 dark:border-orange-900/40 dark:from-orange-950/30 dark:to-card">
          <p className="text-sm font-semibold text-orange-800 dark:text-orange-300">{t("resultTitle")}</p>
          <p className="mt-1 text-xs text-slate-600">
            {urlOnly ? t("resultHintAnonymous") : t("resultHint")}
          </p>
          {preview ? (
            <div className="mt-4 overflow-hidden rounded-xl border border-slate-200 bg-white dark:border-border">
              <Image
                src={preview}
                alt={altText}
                width={800}
                height={500}
                unoptimized
                className="mx-auto max-h-72 w-auto object-contain"
              />
            </div>
          ) : null}
          {url ? (
            <div className="mt-5">
              <EmbedCodeTabs
                url={url}
                alt={altText}
                onAltChange={urlOnly ? undefined : setAltText}
                defaultTab={urlOnly ? "url" : "html"}
                urlOnly={urlOnly}
                onRegisterClick={() => router.push(registerHref)}
              />
            </div>
          ) : null}
          <ArtFightRetentionNotice authReturnPath={authReturnPath} registerHref={registerHref} />
          <div className="mt-5 flex flex-wrap gap-2">
            {url ? (
              <Button type="button" variant="outline" size="sm" asChild>
                <a href={url} target="_blank" rel="noreferrer">
                  <ExternalLink className="mr-1.5 h-4 w-4" aria-hidden />
                  {t("open")}
                </a>
              </Button>
            ) : null}
            <Button type="button" variant="secondary" size="sm" onClick={reset}>
              <RefreshCw className="mr-1.5 h-4 w-4" aria-hidden />
              {t("reset")}
            </Button>
          </div>
        </div>
      )}

      <UploadUpgradeDialog
        open={showUpgradeDialog}
        onOpenChange={setShowUpgradeDialog}
        siteName={tCommon("siteName")}
        title={tDashboard("uploadUpgradeTitle")}
        description={upgradeDescription || tDashboard("uploadUpgradeDescription")}
        errorMessage={upgradeError}
        confirmText={tDashboard("upgrade.button")}
        cancelText={tDashboard("cancel")}
        onConfirm={() => {
          setShowUpgradeDialog(false);
          router.push("/pricing");
        }}
        compact
      />

      <Dialog open={showLoginPrompt} onOpenChange={setShowLoginPrompt}>
        <DialogContent className="sm:max-w-md">
          <DialogTitle>{t("loginRequiredTitle")}</DialogTitle>
          <DialogDescription>
            {t("loginRequiredDescription")} {t("loginRequiredDetail")}
          </DialogDescription>
          <div className="mt-4 flex flex-wrap gap-2">
            <Button
              type="button"
              onClick={() => {
                setShowLoginPrompt(false);
                router.push(`/auth/login?callbackUrl=${encodeURIComponent(authReturnPath)}`);
              }}
            >
              {tCommon("header.login")}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setShowLoginPrompt(false);
                router.push(registerHref);
              }}
            >
              {tCommon("header.signUp")}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </section>
  );
}
