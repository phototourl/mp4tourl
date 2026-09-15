import { DashboardHeader } from '@/components/dashboard/dashboard-header';
import { ResourcesManager } from '@/components/resources/resources-manager';
import { getTranslations } from 'next-intl/server';
import { Suspense } from 'react';

/**
 * My Resources — file-manager style list of the user's uploaded videos.
 */
export default async function ResourcesPage() {
  const t = await getTranslations('Dashboard.resources');

  return (
    <>
      <DashboardHeader
        breadcrumbs={[{ label: t('title'), isCurrentPage: true }]}
      />
      <div className="flex flex-1 flex-col gap-4 px-4 py-4 lg:px-6">
        <Suspense>
          <ResourcesManager />
        </Suspense>
      </div>
    </>
  );
}
