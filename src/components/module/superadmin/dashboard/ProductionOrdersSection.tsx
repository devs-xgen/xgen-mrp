import { Suspense } from "react";
import { getProductionOrdersAnalytics } from "@/lib/actions/superadmin/dashboard-analytics";
import { ProductionOrdersChart } from "./ProductionOrdersChart";
import { ChartSkeleton } from "./ChartSkeleton";
import { ChartError } from "./ChartError";

async function ProductionOrdersData() {
  const data = await getProductionOrdersAnalytics();

  if (!data || data.length === 0) {
    return (
      <ChartError
        title="Production Orders by Status"
        description="Overview of production orders across different statuses"
        error="No production order data available"
      />
    );
  }

  return <ProductionOrdersChart data={data} />;
}

export function ProductionOrdersSection() {
  return (
    <Suspense
      fallback={
        <ChartSkeleton
          title="Production Orders by Status"
          description="Overview of production orders across different statuses"
        />
      }
    >
      <ProductionOrdersData />
    </Suspense>
  );
}
