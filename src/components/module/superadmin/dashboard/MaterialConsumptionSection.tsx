import { Suspense } from "react";
import { getMaterialConsumptionAnalytics } from "@/lib/actions/superadmin/dashboard-analytics";
import { MaterialConsumptionChart } from "./MaterialConsumptionChart";
import { ChartSkeleton } from "./ChartSkeleton";
import { ChartError } from "./ChartError";

async function MaterialConsumptionData() {
  const data = await getMaterialConsumptionAnalytics();

  if (!data || data.length === 0) {
    return (
      <ChartError
        title="Top Material Consumption"
        description="Most consumed materials and current reservations"
        error="No material consumption data available"
      />
    );
  }

  return <MaterialConsumptionChart data={data} />;
}

export function MaterialConsumptionSection() {
  return (
    <Suspense
      fallback={
        <ChartSkeleton
          title="Top Material Consumption"
          description="Most consumed materials and current reservations"
        />
      }
    >
      <MaterialConsumptionData />
    </Suspense>
  );
}
