"use client";

import { useCallback, useState } from "react";
import { useTranslations } from "next-intl";
import { authClient } from "@/lib/auth-client";
import { ART_FIGHT_RESOURCE_MARKER } from "@/lib/constants/resource-source";
import {
  isAnonymousUploadLimitReached,
  recordAnonymousUpload,
} from "@/lib/anonymous-upload-client";
import { addUploadRecord } from "@/lib/upload-history";

const IMAGE_ACCEPT = "image/png,image/jpeg,image/jpg,image/webp,image/gif";

export type ArtFightUploadPhase = "idle" | "uploading" | "success" | "error";

function isImageFile(file: File) {
  if (file.type.startsWith("image/")) return true;
  return /\.(png|jpe?g|webp|gif)$/i.test(file.name);
}

type UseArtFightUploadOptions = {
  onLoginRequired?: () => void;
  onUpgradeRequired?: (message: string, upgradeDescription: string) => void;
  resolveUpgradeDescription?: () => Promise<string>;
};

export function useArtFightUpload(options: UseArtFightUploadOptions = {}) {
  const t = useTranslations("artFight.upload");
  const tHome = useTranslations("home");
  const tDashboard = useTranslations("Dashboard");

  const [phase, setPhase] = useState<ArtFightUploadPhase>("idle");
  const [isDragging, setIsDragging] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const [url, setUrl] = useState<string | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const reset = useCallback(() => {
    setPhase("idle");
    setFileName(null);
    setUrl(null);
    setPreview(null);
    setError(null);
  }, []);

  const uploadFile = useCallback(
    async (file: File) => {
      if (!isImageFile(file)) {
        setError(t("errorBadType"));
        setPhase("error");
        return;
      }

      const { data: sessionData } = await authClient.getSession();
      const isLoggedIn = Boolean(sessionData?.user?.id);
      if (!isLoggedIn && isAnonymousUploadLimitReached()) {
        options.onLoginRequired?.();
        return;
      }

      setPhase("uploading");
      setError(null);
      setUrl(null);
      setFileName(file.name);
      setPreview(URL.createObjectURL(file));

      try {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("source", ART_FIGHT_RESOURCE_MARKER);
        const res = await fetch("/api/upload", { method: "POST", body: formData });
        const data = await res.json().catch(() => ({}));

        if (!res.ok) {
          const upgradeDesc = options.resolveUpgradeDescription
            ? await options.resolveUpgradeDescription()
            : tDashboard("uploadUpgradeDescription");

          if (res.status === 429 && isLoggedIn) {
            const limit = data?.errorParams?.limit || 100;
            options.onUpgradeRequired?.(tHome("result.dailyLimitReached", { limit }), upgradeDesc);
            setPhase("idle");
            return;
          }

          if (res.status === 413 && isLoggedIn) {
            const used = data?.errorParams?.used ?? "?";
            const limit = data?.errorParams?.limit ?? "?";
            options.onUpgradeRequired?.(
              tHome("result.storageLimitReached", { used, limit }),
              upgradeDesc,
            );
            setPhase("idle");
            return;
          }

          if (res.status === 400 && data?.error === "fileTooLarge") {
            options.onUpgradeRequired?.(
              tDashboard("uploadErrorTooLarge", { maxMb: data?.errorParams?.maxMb ?? 5 }),
              upgradeDesc,
            );
            setPhase("error");
            return;
          }

          setError(typeof data?.error === "string" ? data.error : t("errorGeneric"));
          setPhase("error");
          return;
        }

        if (typeof data?.url !== "string") {
          setError(t("errorGeneric"));
          setPhase("error");
          return;
        }

        setUrl(data.url);
        setPhase("success");
        addUploadRecord({ url: data.url, fileName: file.name, timestamp: Date.now() });

        if (!isLoggedIn) {
          recordAnonymousUpload();
        }
      } catch {
        setError(t("errorGeneric"));
        setPhase("error");
      }
    },
    [options, t, tDashboard, tHome],
  );

  const onInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      e.target.value = "";
      if (file) void uploadFile(file);
    },
    [uploadFile],
  );

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer.files?.[0];
      if (file) void uploadFile(file);
    },
    [uploadFile],
  );

  const onDragEnter = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const onDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const { clientX: x, clientY: y } = e;
    if (x < rect.left || x > rect.right || y < rect.top || y > rect.bottom) {
      setIsDragging(false);
    }
  }, []);

  const onPaste = useCallback(
    (e: React.ClipboardEvent<HTMLDivElement>) => {
      const file = Array.from(e.clipboardData.files || [])[0];
      if (file) void uploadFile(file);
    },
    [uploadFile],
  );

  return {
    IMAGE_ACCEPT,
    phase,
    isDragging,
    setIsDragging,
    fileName,
    url,
    preview,
    error,
    reset,
    uploadFile,
    onInputChange,
    onDrop,
    onDragEnter,
    onDragLeave,
    onPaste,
  };
}
