'use client';

import { Button } from '@/components/ui/button';
import { useTranslations } from 'next-intl';
import { useSearchParams } from 'next/navigation';
import { LocaleLink } from '@/i18n/navigation';
import { Suspense } from 'react';

function AuthErrorContent() {
	const t = useTranslations('AuthPage.error');
	const searchParams = useSearchParams();
	const error = searchParams.get('error');

	return (
		<div className="flex min-h-svh flex-col items-center justify-center gap-6 p-6 md:p-10">
			<div className="flex w-full max-w-sm flex-col gap-6">
				<div className="rounded-lg border bg-card p-6 text-center">
					<h1 className="mb-2 text-xl font-semibold">{t('title')}</h1>
					<p className="mb-4 text-sm text-muted-foreground">
						{error || t('defaultError')}
					</p>
					<Button asChild className="w-full">
						<LocaleLink href="/auth/login">{t('backToLogin')}</LocaleLink>
					</Button>
				</div>
			</div>
		</div>
	);
}

export default function AuthErrorPage() {
	return (
		<Suspense fallback={<div className="flex min-h-svh flex-col items-center justify-center"><div className="animate-spin h-8 w-8 border-4 border-brand-teal border-t-transparent rounded-full" /></div>}>
			<AuthErrorContent />
		</Suspense>
	);
}
