import { DashboardHeader } from '@/components/dashboard/dashboard-header';
import { useTranslations } from 'next-intl';

/**
 * Dashboard home.
 */
export default function DashboardPage() {
  const t = useTranslations();

  const breadcrumbs = [
    {
      label: t('Dashboard.dashboard.title'),
      isCurrentPage: true,
    },
  ];

  return (
    <>
      <DashboardHeader breadcrumbs={breadcrumbs} />
      <div className="flex flex-1 flex-col gap-4 p-4 md:p-6">
        <p className="text-muted-foreground text-sm">
          {t('Dashboard.dashboard.title')}
        </p>
      </div>
    </>
  );
}
