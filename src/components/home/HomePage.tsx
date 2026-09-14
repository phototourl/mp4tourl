"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  Upload,
  Link as LinkIcon,
  Loader2,
  Film,
  ArrowUpRight,
  Copy,
  FileText,
  X,
  LogIn,
  LayoutDashboard,
  Check,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { useTranslations, useLocale } from "next-intl";
import dynamic from "next/dynamic";
import { useLocaleRouter } from "@/i18n/navigation";
import { addUploadRecord, removeUploadRecord } from "@/lib/upload-history";
import {
  isAnonymousUploadLimitReached,
  recordAnonymousUpload,
} from "@/lib/anonymous-upload-client";
import { authClient } from "@/lib/auth-client";
import { UploadUpgradeDialog } from "@/components/shared/upload-upgrade-dialog";
import { AlertDialog } from "@/components/ui/alert-dialog";

// 延迟加载演示组件以提升首屏性能
const HeroLeftFlowDemo = dynamic(() => import("@/components/home/HeroLeftFlowDemo"), {
  loading: () => (
    <div className="relative w-full max-w-xl" aria-hidden>
      <div className="relative h-[min(55vh,380px)] sm:h-[400px] md:h-[450px] rounded-xl bg-slate-50/70" />
    </div>
  ),
});

const HomePageBelowFold = dynamic(() => import("@/components/home/HomePageBelowFold"), {
  loading: () => <div className="min-h-16 w-full" aria-hidden />,
  // SSR on: FAQ / HowTo copy must be in HTML for GEO + schema alignment
});

type UploadState = "idle" | "uploading" | "success" | "error";

/** 这些语言允许 hero 标题换行，不强制 nowrap */
const HERO_WRAP_LOCALES: string[] = ["ru", "uk", "vi", "pl", "tr", "fr", "fi", "bg"];

/** Video formats accepted on homepage (aligned with videotourl.com) */
const VIDEO_ACCEPT =
  "video/mp4,video/webm,video/quicktime,video/x-msvideo,video/x-matroska,video/mpeg,video/ogg,video/3gpp,.mp4,.mov,.avi,.webm,.mkv,.mpeg,.mpg,.ogv,.3gp,.flv";

const VIDEO_EXT_RE =
  /\.(mp4|webm|mov|avi|mkv|mpeg|mpg|ogv|3gp|flv)$/i;

function isVideoFile(file: File): boolean {
  if (file.type.startsWith("video/")) return true;
  return VIDEO_EXT_RE.test(file.name);
}

// 参考你 PhotoToUrlLandingPage.jsx 里的老照片示例（演示用，三张照片轮播）
const OLD_PHOTO_URLS = [
  "/projects/demo1.jpeg",
  "/projects/demo2.jpg",
  "/projects/demo3.jpg",
];

export default function HomePage() {
  const locale = useLocale() as string;
  const t = useTranslations("home");
  const tDashboard = useTranslations("Dashboard");
  const tCommon = useTranslations("common");
  const tImages = useTranslations("images");
  const router = useLocaleRouter();
  const isRTL = locale === "ar";
  const isBgLocale = locale === "bg";

  const [status, setStatus] = useState<UploadState>("idle");
  const [error, setError] = useState<string | null>(null);
  const [url, setUrl] = useState<string | null>(null);
  const [resourceId, setResourceId] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [originalFile, setOriginalFile] = useState<File | null>(null);
  const [copied, setCopied] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [animatingSample, setAnimatingSample] = useState<{ src: string; key: string } | null>(null);
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);
  const [showUpgradeDialog, setShowUpgradeDialog] = useState(false);
  const [upgradeDescription, setUpgradeDescription] = useState("");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const { data: session } = authClient.useSession();
  const isLoggedIn = Boolean(session?.user?.id);
  const resultSaveHint = isLoggedIn
    ? t.has("result.saveHintLoggedIn")
      ? t("result.saveHintLoggedIn")
      : t("result.saveHint")
    : t("result.saveHint");
  const uploadingRef = useRef(false);

  const resolveUpgradeDescription = useCallback(async () => {
    const fallback = tDashboard('uploadUpgradeDescription');
    try {
      const { data: sessionData } = await authClient.getSession();
      if (!sessionData?.user?.id) return fallback;
      const res = await fetch('/api/resources?metaOnly=1');
      if (!res.ok) return fallback;
      const data = await res.json();
      const shouldUseRenewCopy = Boolean(data?.plan === 'paid' && !data?.subscriptionActive);
      if (shouldUseRenewCopy && tDashboard.has('uploadRenewDescription')) {
        return tDashboard('uploadRenewDescription');
      }
      return fallback;
    } catch {
      return fallback;
    }
  }, [tDashboard]);

  useEffect(() => {
    if (!copied) return;
    const t = setTimeout(() => setCopied(false), 1500);
    return () => clearTimeout(t);
  }, [copied]);

  // 上传成功后移动端滚回顶部，露出标题 + 结果卡片（用户刚在下方上传区操作）
  useEffect(() => {
    if (status !== "success") return;
    if (typeof window === "undefined") return;
    if (window.matchMedia("(min-width: 1024px)").matches) return;
    const frame = window.requestAnimationFrame(() => {
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
    return () => window.cancelAnimationFrame(frame);
  }, [status]);

  // 组件挂载时：从 sessionStorage 恢复图片状态（切换语言后）
  useEffect(() => {
    // 检查是否是语言切换
    const isLanguageSwitch = sessionStorage.getItem('homePageLanguageSwitch') === 'true';
    
    // 如果不是语言切换，清空缓存
    if (!isLanguageSwitch) {
      sessionStorage.removeItem('homePageStatus');
      sessionStorage.removeItem('homePageUrl');
      sessionStorage.removeItem('homePageFileName');
      sessionStorage.removeItem('homePagePreview');
      sessionStorage.removeItem('homePageImageBase64');
      sessionStorage.removeItem('homePageFileType');
      sessionStorage.removeItem('homePageResourceId');
      return;
    }
    
    // 清除语言切换标记
    sessionStorage.removeItem('homePageLanguageSwitch');
    
    const savedStatus = sessionStorage.getItem('homePageStatus');
    const savedUrl = sessionStorage.getItem('homePageUrl');
    const savedFileName = sessionStorage.getItem('homePageFileName');
    const savedPreview = sessionStorage.getItem('homePagePreview');
    const savedImageBase64 = sessionStorage.getItem('homePageImageBase64');
    const savedFileType = sessionStorage.getItem('homePageFileType');
    const savedFileSize = sessionStorage.getItem('homePageFileSize');
    const savedResourceId = sessionStorage.getItem('homePageResourceId');

    if (savedStatus === 'success' && savedUrl && savedFileName && savedImageBase64 && savedFileType) {
      // 恢复文件对象
      const base64Data = savedImageBase64.includes(',') ? savedImageBase64.split(',')[1] : savedImageBase64;
      const byteString = atob(base64Data);
      const ab = new ArrayBuffer(byteString.length);
      const ia = new Uint8Array(ab);
      for (let i = 0; i < byteString.length; i++) {
        ia[i] = byteString.charCodeAt(i);
      }
      const blob = new Blob([ab], { type: savedFileType });
      const file = new File([blob], savedFileName, { type: savedFileType });
      
      // 验证文件大小是否匹配（确保是同一张图片）
      if (savedFileSize && file.size.toString() !== savedFileSize) {
        // 文件大小不匹配，可能是旧缓存，清空并返回
        sessionStorage.removeItem('homePageStatus');
        sessionStorage.removeItem('homePageUrl');
        sessionStorage.removeItem('homePageFileName');
        sessionStorage.removeItem('homePagePreview');
        sessionStorage.removeItem('homePageImageBase64');
        sessionStorage.removeItem('homePageFileType');
        sessionStorage.removeItem('homePageFileSize');
        sessionStorage.removeItem('homePageTimestamp');
        sessionStorage.removeItem('homePageResourceId');
        return;
      }
      
      // 恢复状态
      setStatus('success');
      setUrl(savedUrl);
      setFileName(savedFileName);
      setPreview(savedPreview);
      setOriginalFile(file);
      setResourceId(savedResourceId);
    }
  }, []);

  // 当状态变化时，保存到 sessionStorage（用于切换语言时恢复）
  // 使用 URL 作为唯一标识符，确保缓存的是最新上传的图片
  useEffect(() => {
    if (status === 'success' && url && fileName && originalFile) {
      // 将文件转换为 base64 保存
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        // 使用 URL 作为唯一标识符，确保是同一张图片
        sessionStorage.setItem('homePageStatus', status);
        sessionStorage.setItem('homePageUrl', url); // URL 是唯一的，每次上传都会生成新的
        sessionStorage.setItem('homePageFileName', fileName);
        sessionStorage.setItem('homePagePreview', preview || '');
        sessionStorage.setItem('homePageImageBase64', base64);
        sessionStorage.setItem('homePageFileType', originalFile.type);
        sessionStorage.setItem('homePageFileSize', originalFile.size.toString()); // 添加文件大小作为验证
        sessionStorage.setItem('homePageTimestamp', Date.now().toString()); // 添加时间戳
        if (resourceId) {
          sessionStorage.setItem('homePageResourceId', resourceId);
        } else {
          sessionStorage.removeItem('homePageResourceId');
        }
      };
      reader.readAsDataURL(originalFile);
    } else if (status === 'idle') {
      // 清空缓存
      sessionStorage.removeItem('homePageStatus');
      sessionStorage.removeItem('homePageUrl');
      sessionStorage.removeItem('homePageFileName');
      sessionStorage.removeItem('homePagePreview');
      sessionStorage.removeItem('homePageImageBase64');
      sessionStorage.removeItem('homePageFileType');
      sessionStorage.removeItem('homePageFileSize');
      sessionStorage.removeItem('homePageTimestamp');
      sessionStorage.removeItem('homePageResourceId');
    }
  }, [status, url, fileName, preview, originalFile, resourceId]);



  const handleUpload = useCallback(async (file: File) => {
    if (uploadingRef.current) return;
    if (!isVideoFile(file)) {
      setStatus("error");
      setError(t("result.unsupportedType"));
      return;
    }
    uploadingRef.current = true;
    setStatus("uploading");
    setError(null);
    setUrl(null);
    setResourceId(null);
    setFileName(file.name);
    setOriginalFile(file);

    try {
      const { data: sessionData } = await authClient.getSession();
      const loggedIn = Boolean(sessionData?.user?.id);

      if (!loggedIn && isAnonymousUploadLimitReached()) {
        setStatus("idle");
        setError(null);
        setShowLoginPrompt(true);
        return;
      }

      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) {
        setStatus("idle");
        if (res.status === 429 && loggedIn) {
          // 登录用户达到次数限额，显示升级引导
          const limit = data?.errorParams?.limit || 100;
          const message = t("result.dailyLimitReached", { limit });
          const upgradeDesc = await resolveUpgradeDescription();
          setUpgradeDescription(upgradeDesc);
          setError(message);
          setShowUpgradeDialog(true);
        } else if (res.status === 413 && loggedIn) {
          // 登录用户达到存储限额，统一使用升级引导弹窗（避免突兀跳转）
          const used = data?.errorParams?.used ?? '?';
          const limit = data?.errorParams?.limit ?? '?';
          const message = t("result.storageLimitReached", { used, limit });
          const upgradeDesc = await resolveUpgradeDescription();
          setUpgradeDescription(upgradeDesc);
          setError(message);
          setShowUpgradeDialog(true);
        } else if (res.status === 400 && data?.error === "fileTooLarge") {
          setStatus("error");
          const message = tDashboard("uploadErrorTooLarge", { maxMb: data?.errorParams?.maxMb ?? 5 });
          const upgradeDesc = await resolveUpgradeDescription();
          setError(message);
          setUpgradeDescription(upgradeDesc);
          setShowUpgradeDialog(true);
        } else {
          setStatus("error");
          setError(typeof data?.error === "string" ? data.error : t("result.error"));
        }
        return;
      }

      setStatus("success");
      setUrl(data.url);
      setResourceId(typeof data.id === "string" ? data.id : null);
      setPreview(URL.createObjectURL(file));
      addUploadRecord({ url: data.url, fileName: file.name, timestamp: Date.now() });
      if (!loggedIn) {
        recordAnonymousUpload();
      }
    } catch (err) {
      setStatus("error");
      setError(err instanceof Error ? err.message : t("result.error"));
    } finally {
      uploadingRef.current = false;
    }
  }, [resolveUpgradeDescription, t, tDashboard]);

  const uploadSample = useCallback(
    async (src: string, fileNameForUi: string) => {
      if (uploadingRef.current || status === "uploading") return;

      uploadingRef.current = true;
      setAnimatingSample({ src, key: fileNameForUi });
      setStatus("uploading");

      try {
        await new Promise((resolve) => setTimeout(resolve, 1000));
        const res = await fetch(src);
        if (!res.ok) throw new Error("Sample fetch failed");
        const blob = await res.blob();
        const extFromType = blob.type?.split("/")?.[1];
        const ext = extFromType && extFromType.length <= 5 ? extFromType : "png";
        const file = new File([blob], `sample-${fileNameForUi}.${ext}`, {
          type: blob.type || "image/png",
        });
        // release so handleUpload can take the lock
        uploadingRef.current = false;
        await handleUpload(file);
      } catch {
        setStatus("error");
        setError(t("result.error"));
        uploadingRef.current = false;
      } finally {
        setAnimatingSample(null);
      }
    },
    [handleUpload, status, t]
  );

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    // Allow selecting the same file repeatedly (important after closing upgrade dialog).
    e.target.value = "";
    if (file && !uploadingRef.current && status !== "uploading") {
      void handleUpload(file);
    }
  };

  const onDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    if (uploadingRef.current || status === "uploading") return;
    const file = e.dataTransfer.files?.[0];
    if (file) {
      void handleUpload(file);
    }
  };

  const onDragEnter = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (uploadingRef.current || status === "uploading") return;
    setIsDragging(true);
  };

  const onDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    // 只有当离开整个上传区域时才取消拖拽状态
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const x = e.clientX;
    const y = e.clientY;
    if (x < rect.left || x > rect.right || y < rect.top || y > rect.bottom) {
      setIsDragging(false);
    }
  };

  const onPaste = (e: React.ClipboardEvent<HTMLDivElement>) => {
    if (uploadingRef.current || status === "uploading") return;
    const file = Array.from(e.clipboardData.files || [])[0];
    if (file) {
      void handleUpload(file);
    }
  };

  const openFilePicker = () => {
    if (uploadingRef.current || status === "uploading") return;
    document.getElementById("file-input")?.click();
  };

  const copyUrl = async (e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (!url) return;
    await navigator.clipboard.writeText(url);
    setCopied(true);
  };

  const saveUrlAsTxt = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (!url) return;
    const blob = new Blob([url], { type: "text/plain;charset=utf-8" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "mp4tourl-link.txt";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(link.href);
  };

  /** 移动端点击左侧演示区 → 滚到上传卡片（避开固定顶栏，避免滑过头） */
  const scrollToUploadOnMobile = useCallback(() => {
    if (typeof window === "undefined") return;
    if (window.matchMedia("(min-width: 1024px)").matches) return;
    const el = document.getElementById("upload-card");
    if (!el) return;
    const headerH =
      document.querySelector("header")?.getBoundingClientRect().height ?? 48;
    const top =
      el.getBoundingClientRect().top + window.scrollY - headerH - 12;
    window.scrollTo({ top: Math.max(0, top), behavior: "smooth" });
  }, []);

  const clearUpload = useCallback(() => {
    if (preview) {
      URL.revokeObjectURL(preview);
    }
    if (url) {
      removeUploadRecord(url);
    }
    setStatus("idle");
    setError(null);
    setUrl(null);
    setResourceId(null);
    setFileName(null);
    setPreview(null);
    setOriginalFile(null);
    setCopied(false);
    setShowDeleteConfirm(false);
    const fileInput = document.getElementById("file-input") as HTMLInputElement;
    if (fileInput) {
      fileInput.value = "";
    }
  }, [preview, url]);

  /** Clear：直接删资源，不弹确认；不占用删除按钮的 loading */
  const clearWithSilentDelete = useCallback(async () => {
    const idToDelete = resourceId;
    // 先清空界面，后台静默删云端（避免 Clear 时结果区删除按钮跟着转圈）
    clearUpload();
    if (!idToDelete) return;
    try {
      await fetch(`/api/resources?id=${encodeURIComponent(idToDelete)}`, {
        method: "DELETE",
      });
    } catch {
      // Clear 不阻塞、不提示
    }
  }, [resourceId, clearUpload]);

  /** 结果区删除：弹确认后再删 */
  const requestDeleteUpload = useCallback(() => {
    if (!resourceId || deleting) return;
    setShowDeleteConfirm(true);
  }, [resourceId, deleting]);

  const confirmDeleteUpload = useCallback(async () => {
    if (!resourceId) {
      clearUpload();
      return;
    }
    setDeleting(true);
    try {
      const res = await fetch(`/api/resources?id=${encodeURIComponent(resourceId)}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        setError(
          typeof data?.error === "string" ? data.error : tDashboard("deleteFailed")
        );
        return;
      }
      clearUpload();
    } catch {
      setError(tDashboard("deleteFailed"));
    } finally {
      setDeleting(false);
      setShowDeleteConfirm(false);
    }
  }, [resourceId, clearUpload, tDashboard]);

  return (
    <div className="flex flex-col overflow-x-hidden">
      {/* 登录提示弹窗 */}
      <Dialog open={showLoginPrompt} onOpenChange={setShowLoginPrompt}>
        <DialogContent className="sm:max-w-md border-0 shadow-2xl">
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-white to-slate-50 p-8">
            {/* 背景装饰 */}
            <div className="absolute -top-16 -right-16 h-32 w-32 rounded-full bg-[#0abab5]/10" />
            <div className="absolute -bottom-8 -left-8 h-24 w-24 rounded-full bg-[#0abab5]/5" />

            <div className="relative">
              {/* 大图标 */}
              <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-[#0abab5] to-[#089590] shadow-lg">
                <LogIn className="h-10 w-10 text-white" />
              </div>

              <div className="text-center mb-6">
                <DialogTitle className="text-2xl font-bold text-slate-900 mb-2">
                  {t("loginPrompt.title")}
                </DialogTitle>
                <DialogDescription className="text-base text-slate-600">
                  {t("loginPrompt.description")}
                </DialogDescription>
              </div>

              <div className="mb-8 rounded-xl bg-white p-5 shadow-sm ring-1 ring-slate-200/50">
                <p className="mb-3 text-sm font-semibold text-slate-900">{t("loginPrompt.benefits")}</p>
                <ul className="space-y-3">
                  <li className="flex items-center gap-3">
                    <div className="flex h-7 w-7 items-center justify-center rounded-full bg-green-100">
                      <Check className="h-4 w-4 text-green-600" />
                    </div>
                    <span className="text-sm text-slate-700">{t("loginPrompt.benefit1")}</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <div className="flex h-7 w-7 items-center justify-center rounded-full bg-green-100">
                      <Check className="h-4 w-4 text-green-600" />
                    </div>
                    <span className="text-sm text-slate-700">{t("loginPrompt.benefit2")}</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <div className="flex h-7 w-7 items-center justify-center rounded-full bg-green-100">
                      <Check className="h-4 w-4 text-green-600" />
                    </div>
                    <span className="text-sm text-slate-700">{t("loginPrompt.benefit3")}</span>
                  </li>
                </ul>
              </div>

              <div className="flex gap-4">
                <Button
                  variant="outline"
                  className="flex-1 h-12 text-base font-medium border-2 hover:bg-slate-50"
                  onClick={() => setShowLoginPrompt(false)}
                >
                  {t("loginPrompt.later")}
                </Button>
                <Button
                  className="flex-1 h-12 text-base font-medium bg-gradient-to-r from-[#0abab5] to-[#089590] hover:from-[#089590] hover:to-[#077a78] text-white shadow-md hover:shadow-lg transition-all"
                  onClick={() => {
                    setShowLoginPrompt(false);
                    router.push('/auth/login');
                  }}
                >
                  <LogIn className="h-5 w-5 mr-2" />
                  {t("loginPrompt.login")}
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <UploadUpgradeDialog
        open={showUpgradeDialog}
        onOpenChange={setShowUpgradeDialog}
        siteName={tCommon('siteName')}
        title={tDashboard('uploadUpgradeTitle')}
        description={upgradeDescription || tDashboard('uploadUpgradeDescription')}
        errorMessage={error}
        confirmText={tDashboard('upgrade.button')}
        cancelText={tDashboard('cancel')}
        onConfirm={() => {
          setShowUpgradeDialog(false);
          router.push('/pricing');
        }}
      />

      <AlertDialog
        open={showDeleteConfirm}
        title={tDashboard("deleteResource")}
        description={tDashboard("deleteConfirm")}
        confirmText={tDashboard("delete")}
        cancelText={tDashboard("cancel")}
        loading={deleting}
        onConfirm={() => {
          void confirmDeleteUpload();
        }}
        onCancel={() => {
          if (!deleting) setShowDeleteConfirm(false);
        }}
      />

      {/* ezremove-like hero layout: 白底首屏（不使用渐变） + 左文案/演示 + 右上传卡片 */}
      <section className="relative min-h-0 overflow-x-hidden bg-white lg:min-h-[100vh]">
        <div className="mx-auto grid max-w-6xl gap-8 px-6 pt-16 pb-10 sm:gap-10 sm:pt-20 sm:pb-14 lg:max-w-7xl lg:grid-cols-2 lg:items-stretch lg:gap-16 lg:px-10 lg:pt-24 lg:pb-20">
          {/* Left */}
          <div className="min-w-0 max-w-full space-y-5 text-slate-900 sm:space-y-6 lg:h-full lg:pr-6 flex flex-col">
            <div className="space-y-4">
              <h1
                className={cn(
                  "text-4xl font-extrabold leading-[1.06] tracking-tight sm:text-5xl lg:text-6xl",
                  !HERO_WRAP_LOCALES.includes(locale) && "whitespace-nowrap"
                )}
              >
                {isRTL ? (
                  <>
                    <span className={cn("text-brand-teal", isBgLocale && "block")}>{t("hero.title2")}</span>
                    {!isBgLocale && " "}
                    <span className={cn("text-slate-900", isBgLocale && "block")}>{t("hero.title1")}</span>
                  </>
                ) : (
                  <>
                    <span className={cn("text-slate-900", isBgLocale && "block")}>{t("hero.title1")}</span>
                    {!isBgLocale && " "}
                    <span className={cn("text-brand-teal", isBgLocale && "block")}>{t("hero.title2")}</span>
                  </>
                )}
              </h1>
              <p className="text-sm leading-relaxed text-brand-teal sm:text-base">
                {t("hero.subtitle")}
              </p>
            </div>
            <div className="pt-4 lg:flex-1 lg:flex lg:flex-col">
              {status === "success" ? (
                <div
                  className="min-w-0 max-w-full space-y-3 rounded-xl border border-slate-200 bg-white p-4 text-left"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="flex items-center justify-between gap-3 text-sm text-slate-600">
                    <div className="flex min-w-0 items-center gap-2">
                      <LinkIcon className="h-5 w-5 shrink-0 text-brand-teal" />
                      <span className="truncate">{t("result.generated")}</span>
                    </div>
                    <a
                      href={url ?? "#"}
                      target="_blank"
                      rel="noreferrer"
                      onClick={(e) => {
                        if (!url) e.preventDefault();
                        e.stopPropagation();
                      }}
                      className={cn(
                        "inline-flex shrink-0 items-center gap-1.5 text-sm font-semibold underline underline-offset-4",
                        url ? "text-brand-teal hover:opacity-80" : "text-slate-400 cursor-not-allowed"
                      )}
                    >
                      <ArrowUpRight className="h-4 w-4" />
                      {t("result.open")}
                    </a>
                  </div>

                  <div className="space-y-3">
                    <div className="flex min-w-0 items-center gap-3">
                      <div
                        className="min-w-0 flex-1 overflow-hidden whitespace-nowrap text-ellipsis rounded border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800"
                        title={url ?? t("result.placeholder")}
                      >
                        {url ?? t("result.placeholder")}
                      </div>
                      <Button
                        onClick={(e) => void copyUrl(e)}
                        disabled={!url}
                        variant={undefined}
                        className={cn(
                          "h-10 shrink-0 rounded-lg px-4 text-sm font-semibold transition-all whitespace-nowrap",
                          !url
                            ? "bg-slate-200 text-slate-500 cursor-not-allowed"
                            : "bg-brand-teal text-white hover:bg-brand-teal hover:scale-105 hover:shadow-lg"
                        )}
                      >
                        <Copy className="mr-2 h-4 w-4" />
                        {copied ? t("result.copied") : t("result.copy")}
                      </Button>
                    </div>

                    <div className="flex min-w-0 flex-col gap-2 sm:flex-row sm:items-center sm:justify-between sm:gap-3">
                      <p className="min-w-0 text-sm font-medium leading-snug text-slate-700 sm:flex-1">
                        💡 {resultSaveHint}
                      </p>
                      <div className="flex shrink-0 items-center justify-end gap-2">
                        {!isLoggedIn ? (
                          <Button
                            variant="outline"
                            size="sm"
                            disabled={!url || deleting}
                            className={cn(
                              "h-10 shrink-0 rounded-lg border px-4 text-sm font-semibold whitespace-nowrap transition",
                              !url
                                ? "border-slate-200 bg-white text-slate-400 cursor-not-allowed"
                                : "border-slate-200 bg-white text-slate-800"
                            )}
                            onClick={saveUrlAsTxt}
                          >
                            <FileText className="mr-2 h-4 w-4" />
                            .txt
                          </Button>
                        ) : (
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            disabled={deleting}
                            className="h-10 shrink-0 rounded-lg border border-brand-teal/40 bg-white px-4 text-sm font-semibold text-brand-teal whitespace-nowrap transition hover:bg-brand-teal/5"
                            onClick={() => router.push("/dashboard")}
                          >
                            <LayoutDashboard className="mr-2 h-4 w-4" />
                            {t("upgradePrompt.goDashboard")}
                          </Button>
                        )}
                        {resourceId ? (
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            disabled={deleting}
                            className="h-10 shrink-0 rounded-lg border border-red-200 bg-white px-4 text-sm font-semibold text-red-600 whitespace-nowrap transition hover:bg-red-50"
                            onClick={requestDeleteUpload}
                          >
                            {deleting ? (
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            ) : (
                              <Trash2 className="mr-2 h-4 w-4" />
                            )}
                            {tDashboard("delete")}
                          </Button>
                        ) : null}
                      </div>
                    </div>
                  </div>

                  {preview && (
                    <div className="space-y-3 border-t border-slate-100 pt-3">
                      <div className="flex min-w-0 items-center gap-2 text-sm text-slate-500">
                        <Film className="h-4 w-4 shrink-0" />
                        <span className="min-w-0 truncate">{fileName}</span>
                      </div>
                      <div className="relative h-48 w-full overflow-hidden rounded-lg bg-slate-950/5 sm:h-56">
                        <video
                          src={preview}
                          controls
                          playsInline
                          className="h-full w-full object-contain"
                          aria-label={fileName ?? tImages("previewAlt")}
                        />
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div
                  className="cursor-pointer lg:flex-1 lg:flex lg:cursor-default lg:items-start"
                  onClick={scrollToUploadOnMobile}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      scrollToUploadOnMobile();
                    }
                  }}
                  role="button"
                  tabIndex={0}
                  aria-label={t("hero.upload")}
                >
                  <HeroLeftFlowDemo oldPhotoUrls={OLD_PHOTO_URLS} />
                </div>
              )}
            </div>
          </div>

          {/* Right */}
          <section
            id="upload-card"
            className="min-w-0 max-w-full scroll-mt-16 flex justify-center lg:h-full lg:justify-end"
          >
            <div
              className={cn(
                "ez-shadow-card group relative min-w-0 w-full max-w-xl rounded-3xl border border-slate-200 p-7 sm:p-8 lg:h-full lg:flex lg:flex-col"
              )}
              style={{ backgroundColor: 'transparent' }}
            >
              <input
                id="file-input"
                type="file"
                accept={VIDEO_ACCEPT}
                className="hidden"
                disabled={status === "uploading"}
                onChange={onFileChange}
              />

              <div
                className={cn(
                  "relative rounded-2xl border-2 border-dashed border-slate-200 p-12 text-center transition-colors sm:p-16 min-h-[320px] sm:min-h-[360px] lg:flex-1",
                  status === "uploading"
                    ? "cursor-not-allowed opacity-80"
                    : "cursor-pointer hover:bg-teal-100/50",
                  isDragging || animatingSample ? "bg-teal-50/50" : "bg-white"
                )}
                onDrop={onDrop}
                onDragOver={(e) => e.preventDefault()}
                onDragEnter={onDragEnter}
                onDragLeave={onDragLeave}
                onPaste={onPaste}
                onClick={openFilePicker}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    openFilePicker();
                  }
                }}
                role="button"
                tabIndex={status === "uploading" ? -1 : 0}
                aria-busy={status === "uploading"}
                aria-disabled={status === "uploading"}
                aria-label={t("upload.title")}
              >
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-teal-50 text-brand-teal relative overflow-hidden">
                  {animatingSample ? (
                    <img
                      key={animatingSample.key}
                      src={animatingSample.src}
                      alt={tImages("animatingSampleAlt")}
                      className="absolute inset-0 h-full w-full rounded-2xl object-cover ptu-home-sample-pop-in"
                    />
                  ) : (
                    <Upload className="h-7 w-7 relative z-10" />
                  )}
                </div>
                <div className="mt-4 space-y-2">
                  <div className="flex items-center justify-center gap-2">
                    <Button
                      size="lg"
                      className="bg-brand-teal h-11 rounded-full px-7 text-sm font-semibold text-white hover:bg-brand-teal/70 transition-all"
                      onClick={(e) => {
                        e.stopPropagation();
                        openFilePicker();
                      }}
                      disabled={status === "uploading"}
                    >
                      {status === "uploading" ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          {t("demo.processing")}
                        </>
                      ) : (
                        t("hero.upload")
                      )}
                    </Button>
                    {status === "success" && (
                      <Button
                        size="lg"
                        variant="outline"
                        className="h-11 rounded-full px-4 text-sm font-semibold border-slate-300 bg-white text-slate-700 hover:bg-slate-200"
                        onClick={(e) => {
                          e.stopPropagation();
                          void clearWithSilentDelete();
                        }}
                        disabled={deleting}
                      >
                        <X className="h-4 w-4 mr-1.5" />
                        {t("upload.clear")}
                      </Button>
                    )}
                  </div>
                  <p className="text-sm text-slate-500">{t("upload.orDrop")}</p>
                </div>
              </div>

              <p className="mt-3 text-center text-xs text-slate-500 sm:text-sm">{t("upload.hint")}</p>

          </div>
        </section>
        </div>
      </section>

      <HomePageBelowFold />
    </div>
  );
}
