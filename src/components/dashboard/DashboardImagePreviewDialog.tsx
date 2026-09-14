"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { RefreshCw, RotateCcw, RotateCw, X, ZoomIn, ZoomOut } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

const MIN_ZOOM = 0.25;
const MAX_ZOOM = 4;
const ZOOM_STEP = 0.25;

type DashboardImagePreviewDialogProps = {
  url: string | null;
  onClose: () => void;
};

type Offset = { x: number; y: number };

function dist(
  a: { clientX: number; clientY: number },
  b: { clientX: number; clientY: number }
) {
  return Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY);
}

function clampZoom(z: number) {
  return Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, +z.toFixed(2)));
}

/**
 * 简单预览：滚轮/按钮缩放；放大后拖拽平移；手机单指拖、双指捏合。
 * 触摸与鼠标分流，避免双指时 pointer/touch 互相抢导致闪没。
 */
export function DashboardImagePreviewDialog({ url, onClose }: DashboardImagePreviewDialogProps) {
  const t = useTranslations("Dashboard");
  const [rotation, setRotation] = useState(0);
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState<Offset>({ x: 0, y: 0 });
  const [gesturing, setGesturing] = useState(false);

  const offsetRef = useRef<Offset>({ x: 0, y: 0 });
  const zoomRef = useRef(1);
  const stageRef = useRef<HTMLDivElement>(null);
  const touchRef = useRef<
    | { mode: "pan"; x: number; y: number; ox: number; oy: number }
    | { mode: "pinch"; distance: number; zoom: number }
    | null
  >(null);
  const mousePanRef = useRef<{
    x: number;
    y: number;
    ox: number;
    oy: number;
  } | null>(null);

  useEffect(() => {
    zoomRef.current = zoom;
  }, [zoom]);

  const setOffsetBoth = useCallback((next: Offset) => {
    offsetRef.current = next;
    setOffset(next);
  }, []);

  const setZoomBoth = useCallback((z: number) => {
    const next = clampZoom(z);
    zoomRef.current = next;
    setZoom(next);
  }, []);

  const resetView = useCallback(() => {
    setRotation(0);
    setZoomBoth(1);
    setOffsetBoth({ x: 0, y: 0 });
  }, [setOffsetBoth, setZoomBoth]);

  useEffect(() => {
    if (!url) resetView();
  }, [url, resetView]);

  const handleOpenChange = (open: boolean) => {
    if (!open) onClose();
  };

  const zoomIn = () => setZoomBoth(zoomRef.current + ZOOM_STEP);
  const zoomOut = () => {
    const next = clampZoom(zoomRef.current - ZOOM_STEP);
    setZoomBoth(next);
    if (next <= 1) setOffsetBoth({ x: 0, y: 0 });
  };
  const rotateLeft = () => setRotation((r) => r - 90);
  const rotateRight = () => setRotation((r) => r + 90);

  const onWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    e.preventDefault();
    const next = clampZoom(
      zoomRef.current + (e.deltaY < 0 ? ZOOM_STEP : -ZOOM_STEP)
    );
    setZoomBoth(next);
    if (next <= 1) setOffsetBoth({ x: 0, y: 0 });
  };

  /** 仅鼠标；手指交给 touch，避免双指时两套事件打架 */
  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.pointerType !== "mouse" || e.button !== 0) return;
    if (zoomRef.current <= 1) return;
    e.preventDefault();
    mousePanRef.current = {
      x: e.clientX,
      y: e.clientY,
      ox: offsetRef.current.x,
      oy: offsetRef.current.y,
    };
    setGesturing(true);
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const pan = mousePanRef.current;
    if (!pan) return;
    setOffsetBoth({
      x: pan.ox + (e.clientX - pan.x),
      y: pan.oy + (e.clientY - pan.y),
    });
  };

  const onPointerUp = () => {
    mousePanRef.current = null;
    setGesturing(false);
  };

  const onTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    if (e.touches.length === 2) {
      const d = dist(e.touches[0], e.touches[1]);
      if (d < 8) return;
      touchRef.current = {
        mode: "pinch",
        distance: d,
        zoom: zoomRef.current,
      };
      setGesturing(true);
      return;
    }
    if (e.touches.length === 1 && zoomRef.current > 1) {
      touchRef.current = {
        mode: "pan",
        x: e.touches[0].clientX,
        y: e.touches[0].clientY,
        ox: offsetRef.current.x,
        oy: offsetRef.current.y,
      };
      setGesturing(true);
    }
  };

  const onTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    const g = touchRef.current;
    if (!g) return;
    if (g.mode === "pinch" && e.touches.length === 2) {
      const d = dist(e.touches[0], e.touches[1]);
      if (d < 8 || g.distance < 8) return;
      setZoomBoth(g.zoom * (d / g.distance));
      return;
    }
    if (g.mode === "pan" && e.touches.length === 1) {
      setOffsetBoth({
        x: g.ox + (e.touches[0].clientX - g.x),
        y: g.oy + (e.touches[0].clientY - g.y),
      });
    }
  };

  const onTouchEnd = (e: React.TouchEvent<HTMLDivElement>) => {
    if (e.touches.length === 0) {
      touchRef.current = null;
      setGesturing(false);
      if (zoomRef.current <= 1) setOffsetBoth({ x: 0, y: 0 });
      return;
    }
    if (e.touches.length === 1 && zoomRef.current > 1) {
      touchRef.current = {
        mode: "pan",
        x: e.touches[0].clientX,
        y: e.touches[0].clientY,
        ox: offsetRef.current.x,
        oy: offsetRef.current.y,
      };
    }
  };

  useEffect(() => {
    const el = stageRef.current;
    if (!el || !url) return;
    const block = (ev: TouchEvent) => {
      if (ev.touches.length >= 1) ev.preventDefault();
    };
    el.addEventListener("touchmove", block, { passive: false });
    return () => el.removeEventListener("touchmove", block);
  }, [url]);

  const canPan = zoom > 1;
  const toolbarBtn =
    "h-10 w-10 touch-manipulation rounded-full p-0 text-white hover:bg-white/20 hover:text-white sm:h-9 sm:w-9";

  return (
    <Dialog open={url !== null} onOpenChange={handleOpenChange}>
      <DialogContent
        fullScreen
        showCloseButton={false}
        className={cn(
          "flex flex-col overflow-hidden bg-black/80 p-0 shadow-none sm:bg-transparent",
          "h-[100dvh] max-h-[100dvh] w-screen max-w-none",
          "sm:h-[92vh] sm:max-h-[92vh] sm:w-[min(96vw,72rem)] sm:max-w-[min(96vw,72rem)]"
        )}
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute right-2 top-[max(0.5rem,env(safe-area-inset-top))] z-50 rounded-full bg-black/50 p-2.5 text-white touch-manipulation hover:bg-black/70 sm:right-4 sm:top-4 sm:p-2"
          aria-label={t("previewClose")}
        >
          <X className="h-5 w-5" />
        </button>

        <div
          ref={stageRef}
          className={cn(
            "relative min-h-0 flex-1 touch-none overflow-hidden",
            "px-2 pb-[5.5rem] pt-14 sm:px-4 sm:pb-20 sm:pt-12",
            canPan && (gesturing ? "cursor-grabbing" : "cursor-grab")
          )}
          onWheel={onWheel}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={onTouchEnd}
          onTouchCancel={onTouchEnd}
        >
          {url ? (
            <div className="flex h-full w-full items-center justify-center">
              <img
                src={url}
                alt={t("previewImageAlt")}
                draggable={false}
                className="max-h-full max-w-full select-none object-contain sm:max-h-[78vh]"
                style={{
                  transform: `translate3d(${offset.x}px, ${offset.y}px, 0) rotate(${rotation}deg) scale(${zoom})`,
                  transformOrigin: "center center",
                  transition: gesturing ? "none" : "transform 0.15s ease-out",
                }}
              />
            </div>
          ) : null}
        </div>

        <div
          className="pointer-events-none absolute inset-x-0 z-10 flex justify-center px-3"
          style={{ bottom: "max(0.75rem, env(safe-area-inset-bottom))" }}
        >
          <div className="pointer-events-auto flex max-w-full flex-wrap items-center justify-center gap-0.5 rounded-full bg-black/55 px-2 py-1.5 backdrop-blur-sm sm:gap-1 sm:px-3 sm:py-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className={toolbarBtn}
              onClick={rotateLeft}
              aria-label={t("previewRotateLeft")}
              title={t("previewRotateLeft")}
            >
              <RotateCcw className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className={toolbarBtn}
              onClick={rotateRight}
              aria-label={t("previewRotateRight")}
              title={t("previewRotateRight")}
            >
              <RotateCw className="h-4 w-4" />
            </Button>
            <span className="mx-0.5 min-w-[2.75rem] text-center text-xs tabular-nums text-white/70 sm:mx-1 sm:min-w-[3rem]">
              {Math.round(zoom * 100)}%
            </span>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className={cn(toolbarBtn, zoom <= MIN_ZOOM && "opacity-40")}
              onClick={zoomOut}
              disabled={zoom <= MIN_ZOOM}
              aria-label={t("previewZoomOut")}
              title={t("previewZoomOut")}
            >
              <ZoomOut className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className={cn(toolbarBtn, zoom >= MAX_ZOOM && "opacity-40")}
              onClick={zoomIn}
              disabled={zoom >= MAX_ZOOM}
              aria-label={t("previewZoomIn")}
              title={t("previewZoomIn")}
            >
              <ZoomIn className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className={toolbarBtn}
              onClick={resetView}
              aria-label={t("previewReset")}
              title={t("previewReset")}
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
