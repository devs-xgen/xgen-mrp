import { Suspense } from "react";
import { getInventoryHealthAnalytics } from "@/lib/actions/superadmin/dashboard-analytics";
import { InventoryHealthChart } from "./InventoryHealthChart";
import { ChartSkeleton } from "./ChartSkeleton";
import { ChartError } from "./ChartError";

async function InventoryHealthData() {
  const data = await getInventoryHealthAnalytics();

  if (!data || data.length === 0) {
    return (
      <ChartError
        title="Inventory Health"
        description="Materials and products distribution by category"
        error="No inventory data available"
      />
    );
  }

  return <InventoryHealthChart data={data} />;
}

export function InventoryHealthSection() {
  return (
    <Suspense
      fallback={
        <ChartSkeleton
          title="Inventory Health"
          description="Materials and products distribution by category"
        />
      }
    >
      <InventoryHealthData />
    </Suspense>
  );
}
