'use client';

import { Suspense } from 'react';
import { DashboardHeader } from '@/components/dashboard/dashboard-header';
import { DashboardHomeOverview } from '@/components/dashboard/dashboard-home-overview';
import { useTranslations } from 'next-intl';

function DashboardContent() {
  const t = useTranslations('Dashboard.dashboard');

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <DashboardHeader
        breadcrumbs={[{ label: t('title'), isCurrentPage: true }]}
      />
      <div className="@container/main flex min-h-0 flex-1 flex-col">
        <DashboardHomeOverview />
      </div>
    </div>
  );
}

/**
 * Workbench — same shell pattern as editstamp dashboard home.
 */
export default function DashboardPage() {
  return (
    <Suspense>
      <DashboardContent />
    </Suspense>
  );
}
