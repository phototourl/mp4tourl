import { DashboardHeader } from '@/components/dashboard/dashboard-header';
import { getTranslations } from 'next-intl/server';

interface ProfileLayoutProps {
  children: React.ReactNode;
}

export default async function ProfileLayout({ children }: ProfileLayoutProps) {
  const t = await getTranslations('Dashboard.settings');

  return (
    <>
      <DashboardHeader
        breadcrumbs={[
          { label: t('title'), isCurrentPage: false },
          { label: t('profile.title'), isCurrentPage: true },
        ]}
      />

      <div className="flex min-h-0 flex-1 flex-col">
        <div className="flex min-h-0 flex-1 flex-col gap-2">
          <div className="flex min-h-0 flex-1 flex-col gap-4 py-4 md:gap-6 md:py-6">
            <div data-settings-shell className="flex min-h-0 flex-1 flex-col space-y-8 px-4 lg:px-6">
              <div>
                <h1 className="text-3xl font-bold tracking-tight">
                  {t('profile.title')}
                </h1>
                <p className="text-muted-foreground mt-2">
                  {t('profile.description')}
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
