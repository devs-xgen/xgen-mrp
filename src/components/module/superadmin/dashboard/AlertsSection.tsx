import { Suspense } from "react";
import { getLowStockAlerts, getProductionEfficiency } from "@/lib/actions/superadmin/dashboard-analytics";
import { AlertsCard } from "./AlertsCard";
import { ChartSkeleton } from "./ChartSkeleton";

async function AlertsData() {
  const [lowStockAlerts, productionEfficiency] = await Promise.all([
    getLowStockAlerts(),
    getProductionEfficiency(),
  ]);

  return (
    <AlertsCard
      lowStockAlerts={lowStockAlerts}
      productionEfficiency={productionEfficiency}
    />
  );
}

export function AlertsSection() {
  return (
    <Suspense
      fallback={
        <ChartSkeleton
          title="System Alerts & Efficiency"
          description="Critical alerts and production performance"
          height={250}
        />
      }
    >
      <AlertsData />
    </Suspense>
  );
}
