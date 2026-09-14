'use client';

import { Logo } from '@/components/layout/logo';
import { Button } from '@/components/ui/button';
import {
	Card,
	CardContent,
	CardFooter,
	CardHeader,
	CardTitle,
} from '@/components/ui/card';
import { LocaleLink } from '@/i18n/navigation';
import { cn } from '@/lib/utils';
import { useTranslations } from 'next-intl';

interface AuthCardProps {
	headerLabel: string;
	bottomButtonLabel: string;
	/** Full-page navigation; ignored when onBottomButtonClick is set */
	bottomButtonHref?: string;
	/** Dialog 内切换登录/注册，不跳转 */
	onBottomButtonClick?: () => void;
	/** 底部链接文案；不传则按 href 推断 */
	bottomLinkText?: string;
	className?: string;
	/** 弹框内展示产品 Logo */
	showLogo?: boolean;
	children: React.ReactNode;
}

export function AuthCard({
	headerLabel,
	bottomButtonLabel,
	bottomButtonHref,
	onBottomButtonClick,
	bottomLinkText,
	className,
	showLogo = false,
	children,
}: AuthCardProps) {
	const t = useTranslations('AuthPage.login');
	const linkText =
		bottomLinkText ??
		(bottomButtonHref?.includes('/auth/login') ? t('signIn') : t('signUp'));

	return (
		<Card className={cn('border-border shadow-xs', className)}>
			{/* 覆盖 CardHeader 默认 grid/items-start，整组 Logo+标题水平居中（不刻意拆标题绝对定位） */}
			<CardHeader className="flex flex-col items-center justify-center text-center">
				{showLogo ? (
					<div className="flex items-center justify-center gap-2.5 sm:gap-3">
						<LocaleLink href="/" prefetch={false} className="inline-flex shrink-0">
							<Logo className="h-9 w-9 sm:h-10 sm:w-10" />
						</LocaleLink>
						<CardTitle className="text-xl">{headerLabel}</CardTitle>
					</div>
				) : (
					<CardTitle className="text-xl">{headerLabel}</CardTitle>
				)}
			</CardHeader>
			<CardContent>{children}</CardContent>
			<CardFooter className="flex justify-center">
				<p className="text-sm text-muted-foreground">
					{bottomButtonLabel}{' '}
					{onBottomButtonClick ? (
						<Button
							type="button"
							variant="link"
							className="px-1 text-sm"
							onClick={onBottomButtonClick}
						>
							{linkText}
						</Button>
					) : bottomButtonHref ? (
						<Button variant="link" className="px-1 text-sm" asChild>
							<LocaleLink href={bottomButtonHref}>{linkText}</LocaleLink>
						</Button>
					) : null}
				</p>
			</CardFooter>
		</Card>
	);
}
