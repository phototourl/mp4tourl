import { getTranslations } from 'next-intl/server';
import Image from 'next/image';

export default async function NotificationsPage() {
  const t = await getTranslations('Dashboard.settings.notification');
  const hasPreviewCopy = t.has('productPreview.title');
  const hasLine4 = t.has('productPreview.announcement.line4');

  return (
    <div className="mx-auto w-full max-w-5xl space-y-5">
      <div className="overflow-hidden rounded-xl border border-slate-200/80 bg-muted dark:border-slate-700/60">
        <Image
          src="/og-image.png"
          alt="Photo To URL product preview"
          width={2400}
          height={1260}
          className="h-auto w-full object-cover"
          priority
        />
      </div>

      <div className="space-y-2">
        <p className="rounded-lg border border-white/20 bg-gradient-to-r from-[#60a5fa] to-[#3b82f6] px-4 py-3 text-sm font-medium leading-relaxed text-white whitespace-normal break-words md:whitespace-nowrap shadow-[inset_0_1px_0_0_rgba(255,255,255,0.18)]">
          {hasPreviewCopy
            ? t('productPreview.announcement.line1')
            : 'We are continuously delivering more powerful features and membership benefits.'}
        </p>
        <p className="rounded-lg border border-white/20 bg-gradient-to-r from-[#22c55e] to-[#10b981] px-4 py-3 text-sm font-medium leading-relaxed text-white whitespace-normal break-words md:whitespace-nowrap shadow-[inset_0_1px_0_0_rgba(255,255,255,0.18)]">
          {hasPreviewCopy
            ? t('productPreview.announcement.line2')
            : 'Newly released upgrade capabilities are prioritized for existing users, with no price changes.'}
        </p>
        <p className="rounded-lg border border-white/20 bg-gradient-to-r from-[#f59e0b] to-[#ea580c] px-4 py-3 text-sm font-medium leading-relaxed text-white whitespace-normal break-words md:whitespace-nowrap shadow-[inset_0_1px_0_1px_rgba(255,255,255,0.18)]">
          {hasLine4
            ? t('productPreview.announcement.line4')
            : 'Built for global teams: faster iteration, clearer value, and a better product experience.'}
        </p>
        <p className="rounded-lg border border-white/20 bg-gradient-to-r from-[#a78bfa] to-[#a259ec] px-4 py-3 text-sm font-medium leading-relaxed text-white whitespace-normal break-words md:whitespace-nowrap shadow-[inset_0_1px_0_0_rgba(255,255,255,0.18)]">
          {hasPreviewCopy
            ? t('productPreview.announcement.line3')
            : 'Thank you for your support. More updates are on the way.'}
        </p>
      </div>
    </div>
  );
}
