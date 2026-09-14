"use client";

import { useEffect, useRef, useState } from "react";
import NextImage from "next/image";
import { Button } from "@/components/ui/button";
import { Upload, Download, Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { MAX_UPLOAD_FILE_BYTES_YEARLY_PAID } from "@/lib/constants/plans";

type LoadedImage = {
  url: string;
  element: HTMLImageElement;
  originalFile: File;
};

interface RemoveBackgroundToolProps {
  showHeading?: boolean;
}

export function RemoveBackgroundTool({ showHeading = true }: RemoveBackgroundToolProps) {
  const t = useTranslations("removeBackground");
  const tDashboard = useTranslations("Dashboard");
  const uploadButtonRef = useRef<HTMLLabelElement | null>(null);
  const [loadedImage, setLoadedImage] = useState<LoadedImage | null>(null);
  const [processedImageUrl, setProcessedImageUrl] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isModelLoading, setIsModelLoading] = useState(false);
  const heartbeatIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const preloadAbortRef = useRef<AbortController | null>(null);
  const processAbortRef = useRef<AbortController | null>(null);
  const isMountedRef = useRef(true);

  // 组件卸载时清理所有资源
  useEffect(() => {
    isMountedRef.current = true;
    
    return () => {
      isMountedRef.current = false;
      
      // 清理心跳信号
      if (heartbeatIntervalRef.current) {
        clearInterval(heartbeatIntervalRef.current);
        heartbeatIntervalRef.current = null;
      }
      
      // 取消预加载
      if (preloadAbortRef.current) {
        preloadAbortRef.current.abort();
        preloadAbortRef.current = null;
      }
      
      // 取消处理
      if (processAbortRef.current) {
        processAbortRef.current.abort();
        processAbortRef.current = null;
      }
    };
  }, []); // 只在组件真正卸载时执行

  // 清理 Object URL（单独处理，避免影响 isMountedRef）
  useEffect(() => {
    return () => {
      if (loadedImage?.url) {
        URL.revokeObjectURL(loadedImage.url);
      }
      if (processedImageUrl) {
        URL.revokeObjectURL(processedImageUrl);
      }
    };
  }, [loadedImage, processedImageUrl]);

  // 页面可见性检测 - 页面不可见时暂停所有操作（但不取消正在进行的处理）
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        // 页面不可见时，只取消预加载，保留正在进行的处理
        if (preloadAbortRef.current) {
          preloadAbortRef.current.abort();
          preloadAbortRef.current = null;
        }
        // 不取消正在进行的处理，让用户可以切换标签页等待处理完成
        // if (processAbortRef.current) {
        //   processAbortRef.current.abort();
        //   processAbortRef.current = null;
        // }
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);
  
  // 禁用自动预加载 - 只在用户上传图片时才加载模型，避免阻塞页面切换

  // 组件挂载时：如果是刷新则清空缓存并重置滚动位置
  useEffect(() => {
    const isLanguageSwitch = sessionStorage.getItem('removeBackgroundLanguageSwitch') === 'true';
    const isFromHome = sessionStorage.getItem('removeBackgroundFromHome') === 'true';

    // 检查 URL 参数是否有图片地址
    const urlParams = new URLSearchParams(window.location.search);
    const hasUrlParam = urlParams.has('url');

    if (!isLanguageSwitch && !isFromHome) {
      // 刷新时清空缓存（除非是从 URL 参数传入的图片）
      if (!hasUrlParam) {
        sessionStorage.removeItem('removeBackgroundImage');
        sessionStorage.removeItem('removeBackgroundFileName');
        sessionStorage.removeItem('removeBackgroundFileType');
        sessionStorage.removeItem('removeBackgroundProcessed');
      }
      // 滚动条归位
      window.scrollTo({ top: 0, behavior: 'auto' });
    }
  }, []);

  // 图片加载后自动滚动到合适位置
  useEffect(() => {
    if (!loadedImage) return;

    const timer = setTimeout(() => {
      if (!uploadButtonRef.current) return;

      const header = document.querySelector('header');
      const headerHeight = header ? header.getBoundingClientRect().height : 64;
      
      const buttonRect = uploadButtonRef.current.getBoundingClientRect();
      const currentScrollY = window.scrollY;
      
      const spacing = 24;
      const targetScrollY = currentScrollY + buttonRect.top - headerHeight - spacing;
      
      window.scrollTo({
        top: Math.max(0, targetScrollY),
        behavior: 'smooth'
      });
    }, 600);

    return () => clearTimeout(timer);
  }, [loadedImage]);

  // 从 URL 参数加载图片
  useEffect(() => {
    if (loadedImage) return;

    const urlParams = new URLSearchParams(window.location.search);
    const imageUrl = urlParams.get('url');

    if (imageUrl) {
      console.log('Loading image from URL param:', imageUrl);
      // 通过代理接口获取图片，绕过 CORS
      const proxyUrl = `/api/proxy-image?url=${encodeURIComponent(imageUrl)}`;
      fetch(proxyUrl)
        .then(res => res.blob())
        .then(blob => {
          console.log('Proxy fetch blob success, size:', blob.size);
          const fileName = imageUrl.split('/').pop() || 'image.jpg';
          const file = new File([blob], fileName, { type: blob.type || 'image/jpeg' });
          const objectUrl = URL.createObjectURL(blob);
          const img = new Image();
          img.onload = () => {
            setLoadedImage({ url: objectUrl, element: img, originalFile: file });
            handleProcessImage(file);
          };
          img.src = objectUrl;
        })
        .catch(err => {
          console.error('Failed to fetch via proxy:', err);
        });
      return;
    }

    const base64 = sessionStorage.getItem('removeBackgroundImage');
    const fileName = sessionStorage.getItem('removeBackgroundFileName');
    const fileType = sessionStorage.getItem('removeBackgroundFileType');
    const processedBase64 = sessionStorage.getItem('removeBackgroundProcessed');

    if (base64 && fileName && fileType) {
      const base64Data = base64.includes(',') ? base64.split(',')[1] : base64;
      const mimeString = fileType || (base64.includes(',') ? base64.split(',')[0].split(':')[1].split(';')[0] : 'image/jpeg');

      const byteString = atob(base64Data);
      const ab = new ArrayBuffer(byteString.length);
      const ia = new Uint8Array(ab);
      for (let i = 0; i < byteString.length; i++) {
        ia[i] = byteString.charCodeAt(i);
      }
      const blob = new Blob([ab], { type: mimeString });
      const file = new File([blob], fileName, { type: mimeString });

      const objectUrl = URL.createObjectURL(file);
      const img = new Image();
      img.onload = () => {
        setLoadedImage({ url: objectUrl, element: img, originalFile: file });

        if (processedBase64) {
          setProcessedImageUrl(processedBase64);
        } else {
          handleProcessImage(file);
        }
      };
      img.src = objectUrl;
    }
  }, [loadedImage]);

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      alert(t("errorSelectFile"));
      return;
    }

    // Remove-background is paid-only; align with yearly image single-file limit.
    const maxSize = MAX_UPLOAD_FILE_BYTES_YEARLY_PAID;
    if (file.size > maxSize) {
      alert(tDashboard("uploadErrorTooLarge", { maxMb: maxSize / (1024 * 1024) }));
      return;
    }

    // 将文件转换为 base64 并保存到 sessionStorage
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = reader.result as string;
      sessionStorage.setItem('removeBackgroundImage', base64);
      sessionStorage.setItem('removeBackgroundFileName', file.name);
      sessionStorage.setItem('removeBackgroundFileType', file.type);
    };
    reader.readAsDataURL(file);

    const objectUrl = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      if (loadedImage?.url) {
        URL.revokeObjectURL(loadedImage.url);
      }
      if (processedImageUrl) {
        URL.revokeObjectURL(processedImageUrl);
      }
      setLoadedImage({ url: objectUrl, element: img, originalFile: file });
      setProcessedImageUrl(null);
      setError(null);
      
      // 自动开始处理
      handleProcessImage(file);
    };
    img.src = objectUrl;
  };

  const handleProcessImage = async (file: File) => {
    // 取消之前的处理（如果有）
    if (processAbortRef.current) {
      processAbortRef.current.abort();
    }

    const abortController = new AbortController();
    processAbortRef.current = abortController;

    setIsProcessing(true);
    setError(null);

    try {
      // 动态导入 rembg
      const { removeBackground } = await import("@imgly/background-removal");

      // 处理图片
      let blob;
      try {
        blob = await removeBackground(file, {
          progress: (key: string, args: any) => {
            console.log(`Progress: ${key}`, args);
            if (key === "fetch-backend" || key === "loading-backend") {
              setIsModelLoading(true);
            }
          },
        });
      } catch (innerErr: any) {
        // 如果是WASM错误，尝试使用备选方案
        if (innerErr?.message?.includes('wasm') || innerErr?.message?.includes('WASM')) {
          console.error("WASM loading failed, trying alternative method:", innerErr);
          setError(t("errorProcessing") + " (WASM failed)");
          return;
        }
        throw innerErr;
      }

      // 检查是否已取消
      if (abortController.signal.aborted) {
        return;
      }

      // 将处理后的 blob 转换为 URL
      const processedUrl = URL.createObjectURL(blob);
      setProcessedImageUrl(processedUrl);

      // 保存处理后的图片到 sessionStorage
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        sessionStorage.setItem('removeBackgroundProcessed', base64);
      };
      reader.readAsDataURL(blob);
    } catch (err: any) {
      // 如果是取消操作，不显示错误
      if (err?.name === 'AbortError' || abortController.signal.aborted || !isMountedRef.current) {
        return;
      }

      console.error("Background removal error:", err);
      setError(err?.message || t("errorProcessing"));
    } finally {
      if (!isMountedRef.current) {
        return;
      }

      setIsProcessing(false);
      setIsModelLoading(false);

      // 清理处理引用
      if (processAbortRef.current === abortController) {
        processAbortRef.current = null;
      }
    }
  };

  const handleDownload = () => {
    if (!processedImageUrl) {
      alert(t("errorUploadFirst"));
      return;
    }

    // 创建下载链接
    const a = document.createElement("a");
    a.href = processedImageUrl;
    
    // 生成时间戳文件名
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    const timestamp = `${year}${month}${day}${hours}${minutes}${seconds}`;
    
    a.download = `photo-remove-background-${timestamp}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div className="flex flex-col">
      {showHeading && (
        <div className="space-y-3 text-center mb-8">
          <h1 className="flex items-center justify-center gap-3 text-xl font-semibold tracking-tight text-slate-900 sm:text-3xl lg:text-4xl">
            <div className="h-8 w-8 flex items-center justify-center flex-shrink-0 sm:h-10 sm:w-10 lg:h-12 lg:w-12">
              <NextImage
                src="/remove-background.png"
                alt="Remove background tool - AI removes backgrounds from any photo instantly"
                width={48}
                height={48}
                className="h-full w-full object-contain"
              />
            </div>
            {t("title")}
          </h1>
          <p className="mx-auto max-w-2xl text-sm text-slate-600 sm:text-base">
            {t("description")}
          </p>
        </div>
      )}

      <div className="flex flex-col items-center">
        {/* 上传按钮 */}
        <div className={`w-full max-w-[480px] ${!loadedImage ? "flex items-center justify-center min-h-[250px] md:min-h-[300px]" : ""}`}>
          <label ref={uploadButtonRef} htmlFor="file-upload-remove-bg" className="w-full">
            <input
              id="file-upload-remove-bg"
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileChange}
            />
            <Button
              type="button"
              size="lg"
              className="w-full px-12 py-6 text-lg cursor-pointer bg-orange-500 text-white font-medium hover:bg-brand-teal hover:border-brand-teal transition-all border-2 border-orange-500"
              onClick={() => document.getElementById("file-upload-remove-bg")?.click()}
            >
              <Upload className="mr-3 h-5 w-5" />
              {t("upload")}
            </Button>
          </label>
        </div>

        {/* 错误提示 */}
        {error && (
          <div className="mt-4 w-full max-w-[480px] p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            {error}
          </div>
        )}

        {/* 处理中提示 */}
        {isProcessing && (
          <div className="mt-4 w-full max-w-[480px] p-4 bg-blue-50 border border-blue-200 rounded-lg text-blue-700 text-sm">
            <div className="flex items-center gap-2 mb-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>{t("processing")}</span>
            </div>
            <p className="text-xs text-blue-600 mt-1">
              {isModelLoading 
                ? t("processingModelLoading")
                : t("processingImage")}
            </p>
          </div>
        )}

        {/* 处理完成后直接显示透明背景效果 */}
        {loadedImage && processedImageUrl && !isProcessing && (
          <div className="mt-6 w-full max-w-[600px]">
            <div
              className="w-full rounded-lg overflow-hidden border border-slate-200 flex items-center justify-center"
              style={{
                backgroundColor: "#ffffff",
                backgroundImage: `
                  linear-gradient(45deg, #e0e0e0 25%, transparent 25%),
                  linear-gradient(-45deg, #e0e0e0 25%, transparent 25%),
                  linear-gradient(45deg, transparent 75%, #e0e0e0 75%),
                  linear-gradient(-45deg, transparent 75%, #e0e0e0 75%)
                `,
                backgroundSize: "20px 20px",
                backgroundPosition: "0 0, 0 10px, 10px -10px, -10px 0px",
                minHeight: "300px",
              }}
            >
              <img
                src={processedImageUrl}
                alt="Processed"
                className="max-w-full max-h-[600px] object-contain"
              />
            </div>
          </div>
        )}

        {/* 仅显示原图（处理中或处理失败时） */}
        {loadedImage && !processedImageUrl && !isProcessing && (
          <div className="mt-6 w-full max-w-[600px]">
            <img
              src={loadedImage.url}
              alt="Original"
              className="w-full rounded-lg border border-slate-200"
            />
          </div>
        )}

        {/* 下载按钮 */}
        {processedImageUrl && !isProcessing && (
          <div className="w-full max-w-[480px] mt-6">
            <Button
              type="button"
              size="lg"
              onClick={handleDownload}
              className="w-full px-12 py-6 text-lg cursor-pointer bg-brand-teal border-2 border-brand-teal text-white hover:bg-white hover:border-black hover:text-black transition-colors font-medium"
            >
              <Download className="mr-3 h-5 w-5" />
              {t("download")}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
