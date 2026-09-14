import { DashboardHeader } from '@/components/dashboard/dashboard-header';
import { getTranslations } from 'next-intl/server';
import type { PropsWithChildren } from 'react';

export default async function NotificationsLayout({
  children,
}: PropsWithChildren) {
  const t = await getTranslations('Dashboard.settings');

  return (
    <>
      <DashboardHeader
        breadcrumbs={[
          { label: t('title'), isCurrentPage: false },
          { label: t('notification.title'), isCurrentPage: true },
        ]}
      />
      <div className="flex min-h-0 flex-1 flex-col">
        <div className="flex min-h-0 flex-1 flex-col gap-2">
          <div className="flex min-h-0 flex-1 flex-col gap-4 py-4 md:gap-6 md:py-6">
            <div data-settings-shell className="flex min-h-0 flex-1 flex-col space-y-8 px-4 lg:px-6">
              <div>
                <h1 className="text-3xl font-bold tracking-tight">
                  {t('notification.title')}
                </h1>
                <p className="mt-2 text-muted-foreground">
                  {t('notification.description')}
                </p>
              </div>
              {children}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
