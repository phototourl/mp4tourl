import { ResetTechnologyTheme } from '@/components/theme/ResetTechnologyTheme';
import { Logo } from '@/components/layout/logo';
import { LocaleLink } from '@/i18n/navigation';
import { getTranslations, setRequestLocale } from 'next-intl/server';

export const dynamic = 'force-dynamic';

export default async function AuthLayout({
	children,
	params,
}: {
	children: React.ReactNode;
	params: Promise<{ locale: string }>;
}) {
	const { locale } = await params;
	setRequestLocale(locale);
	const tCommon = await getTranslations({ locale, namespace: 'common' });

	return (
		<div className="relative flex min-h-svh flex-col overflow-x-hidden bg-[#f6f8fb]">
			<div aria-hidden className="fixed inset-0 -z-10 bg-[#f6f8fb]" />
			<ResetTechnologyTheme />
			<div className="relative h-[120px] overflow-visible hero-gradient">
				{/* A) Tech grid + light beams (original, not circle-based) */}
				<div
					aria-hidden
					className="pointer-events-none absolute inset-0 opacity-70"
					style={{
						backgroundImage:
							"linear-gradient(to right, rgba(255,255,255,0.14) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.10) 1px, transparent 1px)",
						backgroundSize: "24px 24px",
						maskImage: "radial-gradient(120% 140% at 50% 0%, #000 55%, transparent 100%)",
						WebkitMaskImage: "radial-gradient(120% 140% at 50% 0%, #000 55%, transparent 100%)",
					}}
				/>
				<div
					aria-hidden
					className="pointer-events-none absolute -left-1/3 -top-1/2 h-[240%] w-[120%] rotate-[-18deg] bg-gradient-to-r from-transparent via-white/18 to-transparent blur-[1px] opacity-80"
				/>
				<div
					aria-hidden
					className="pointer-events-none absolute -right-1/2 -top-1/3 h-[220%] w-[120%] rotate-[16deg] bg-gradient-to-r from-transparent via-white/12 to-transparent blur-[1px] opacity-70"
				/>
				<div
					aria-hidden
					className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/40 to-transparent"
				/>
				<div
					aria-hidden
					className="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-white/25 to-transparent"
				/>
				<div
					aria-hidden
					className="pointer-events-none absolute inset-0 opacity-[0.10] mix-blend-overlay"
					style={{
						backgroundImage:
							"radial-gradient(circle at 20% 30%, rgba(255,255,255,0.55) 1px, transparent 1px), radial-gradient(circle at 70% 40%, rgba(255,255,255,0.45) 1px, transparent 1px), radial-gradient(circle at 45% 70%, rgba(255,255,255,0.5) 1px, transparent 1px)",
						backgroundSize: "180px 180px",
					}}
				/>
				<div className="absolute inset-x-0 bottom-0 translate-y-[58%] px-3 sm:px-4">
					<LocaleLink
						href="/"
						aria-label={`${tCommon('siteName')} home`}
						className="group relative mx-auto flex w-full max-w-3xl cursor-pointer select-none items-center rounded-[14px] border-[2.5px] border-slate-900 bg-white px-4 py-4 shadow-[5px_5px_0_0_rgba(15,23,42,1),0_14px_28px_-18px_rgba(15,23,42,0.42)] sm:rounded-[16px] sm:border-[3px] sm:px-6 sm:py-5 sm:shadow-[6px_6px_0_0_rgba(15,23,42,1),0_18px_32px_-20px_rgba(15,23,42,0.45)]"
					>
						<div className="flex min-w-0 flex-1 items-center gap-2.5 sm:gap-3">
							<Logo className="h-9 w-9 shrink-0 rounded-none sm:h-10 sm:w-10 md:h-12 md:w-12" />
							<div className="min-w-0">
								<div className="truncate text-[28px] font-black leading-[0.95] tracking-[-0.04em] text-slate-900 sm:text-[36px] md:text-[40px]">
									mp4tourl
								</div>
							</div>
						</div>
						{/* 默认右侧展示返回（登录/注册页共用此 layout） */}
						<span
							aria-hidden
							className="ml-auto shrink-0"
						>
							<span className="inline-flex h-9 w-9 items-center justify-center rounded-full border-2 border-slate-900 bg-white text-base font-semibold leading-none text-slate-900 shadow-[2px_2px_0_0_#0f172a] transition-[transform,box-shadow] duration-150 group-hover:translate-x-px group-hover:translate-y-px group-hover:shadow-[1.5px_1.5px_0_0_#0f172a] group-active:translate-x-1 group-active:translate-y-1 group-active:shadow-none sm:h-10 sm:w-10 sm:border-[2.5px] sm:shadow-[3px_3px_0_0_#0f172a]">
								↩
							</span>
						</span>
					</LocaleLink>
				</div>
			</div>
			<div className="flex flex-1 items-start justify-center px-4 pb-20 pt-28 sm:px-6 sm:pb-24 sm:pt-24 md:px-10 md:pt-24">
				<div className="flex w-full max-w-[420px] flex-col gap-5">
					{children}
				</div>
			</div>
			<footer className="pointer-events-none fixed inset-x-0 bottom-0 z-10 bg-gradient-to-t from-[#f6f8fb] via-[#f6f8fb]/95 to-transparent pb-[max(1rem,env(safe-area-inset-bottom))] pt-6 text-center text-xs text-slate-400">
				© {new Date().getFullYear()} mp4tourl.com. All rights reserved.
			</footer>
		</div>
	);
}
