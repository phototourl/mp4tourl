import { PlanCard } from '@/components/settings/billing/plan-card';
import { StorageUsageCard } from '@/components/settings/billing/storage-usage-card';

export default function BillingPage() {
  return (
    <div className="flex flex-col gap-8">
      <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
        <PlanCard />
        <StorageUsageCard />
      </div>
    </div>
  );
}
