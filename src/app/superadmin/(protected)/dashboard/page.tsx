import { getSystemMetrics } from "@/lib/actions/superadmin";
import { Suspense } from "react";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { DashboardStatsClient } from "@/components/module/superadmin/dashboard/DashboardStatsClient";

// Import async section components
import { ProductionOrdersSection } from "@/components/module/superadmin/dashboard/ProductionOrdersSection";
import { RevenueSection } from "@/components/module/superadmin/dashboard/RevenueSection";
import { QualityMetricsSection } from "@/components/module/superadmin/dashboard/QualityMetricsSection";
import { AlertsSection } from "@/components/module/superadmin/dashboard/AlertsSection";
import { InventoryHealthSection } from "@/components/module/superadmin/dashboard/InventoryHealthSection";
import { MaterialConsumptionSection } from "@/components/module/superadmin/dashboard/MaterialConsumptionSection";
import { TopProductsSection } from "@/components/module/superadmin/dashboard/TopProductsSection";

export const dynamic = "force-dynamic";

// Stat cards loading skeleton
function StatsLoading() {
  return (
    <>
      <div className={cn("grid gap-4", "grid-cols-1 sm:grid-cols-2 xl:grid-cols-4")}>
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-[120px]" />
        ))}
      </div>
      <div className={cn("grid gap-4", "grid-cols-1 sm:grid-cols-2 xl:grid-cols-4")}>
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={`stat-${i}`} className="h-[120px]" />
        ))}
      </div>
    </>
  );
}

// Stats component with data fetching
async function DashboardStats() {
  const metrics = await getSystemMetrics();
  return <DashboardStatsClient metrics={metrics} />;
}

export default function SuperAdminDashboardPage() {
  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Super Admin Dashboard</h1>
        <p className="text-sm text-muted-foreground">System-wide overview and key performance indicators</p>
      </div>

      <Suspense fallback={<StatsLoading />}>
        <DashboardStats />
      </Suspense>

      {/* Production & Revenue Analytics */}
      <div className="grid gap-6 grid-cols-1 lg:grid-cols-2">
        <ProductionOrdersSection />
        <RevenueSection />
      </div>

      {/* Quality Metrics & Alerts */}
      <div className="grid gap-6 grid-cols-1 lg:grid-cols-2">
        <QualityMetricsSection />
        <AlertsSection />
      </div>

      {/* Inventory & Material Analysis */}
      <div className="grid gap-6 grid-cols-1 lg:grid-cols-2">
        <InventoryHealthSection />
        <MaterialConsumptionSection />
      </div>

      {/* Top Products */}
      <div className="grid gap-6 grid-cols-1">
        <TopProductsSection />
      </div>
    </div>
  );
}
