'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { websiteConfig } from '@/config/website';
import { settingsCard } from '@/components/settings/settings-card-classes';
import { cn } from '@/lib/utils';
import { useTranslations } from 'next-intl';

interface NewsletterFormCardProps {
  className?: string;
}

/**
 * 与 EditStamp 同款卡片布局；未接邮件服务时展示开关样式（禁用）+ 说明。
 */
export function NewsletterFormCard({ className }: NewsletterFormCardProps) {
  const t = useTranslations('Dashboard.settings.notification');

  return (
    <Card className={cn(settingsCard, className)}>
      <CardHeader>
        <CardTitle className="text-lg font-semibold">
          {t('newsletter.title')}
        </CardTitle>
        <CardDescription>{t('newsletter.description')}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-row items-center justify-between rounded-lg border border-slate-200 px-4 py-3">
          <div className="space-y-0.5">
            <Label htmlFor="newsletter-toggle" className="text-base">
              {t('newsletter.label')}
            </Label>
            {!websiteConfig.newsletter.enable ? (
              <p className="text-xs text-muted-foreground">
                {t('newsletter.disabledHint')}
              </p>
            ) : null}
          </div>
          <div
            id="newsletter-toggle"
            role="switch"
            aria-checked="false"
            aria-disabled="true"
            className="relative h-7 w-12 shrink-0 cursor-not-allowed rounded-full bg-muted opacity-70"
          >
            <span className="absolute top-1 left-1 h-5 w-5 rounded-full bg-background shadow-sm" />
          </div>
        </div>
      </CardContent>
      <CardFooter className="mt-6 rounded-none bg-muted px-6 py-4">
        <p className="text-sm text-muted-foreground">{t('newsletter.hint')}</p>
      </CardFooter>
    </Card>
  );
}
