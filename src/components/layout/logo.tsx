'use client';

import { websiteConfig } from '@/config/website';
import { cn } from '@/lib/utils';

/**
 * 用原生 img：真机（尤其 iOS）在 Dialog Portal 里 next/image 包裹层偶发高度为 0，
 * 浏览器桌面模拟往往正常，表现为「模拟有 Logo、真机没有」。
 */
export function Logo({ className }: { className?: string }) {
  const logoLight =
    websiteConfig.metadata.images?.logoLight ?? '/icons/light_logo.png';

  return (
    // eslint-disable-next-line @next/next/no-img-element -- Portal/真机稳定性
    <img
      src={logoLight}
      alt={websiteConfig.metadata.name ?? 'Logo'}
      title={websiteConfig.metadata.name ?? 'Logo'}
      width={40}
      height={40}
      decoding="async"
      className={cn('h-8 w-8 shrink-0 object-contain rounded-md', className)}
    />
  );
}
