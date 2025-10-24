import { Suspense } from "react";
import { getTopProductsAnalytics } from "@/lib/actions/superadmin/dashboard-analytics";
import { TopProductsChart } from "./TopProductsChart";
import { ChartSkeleton } from "./ChartSkeleton";
import { ChartError } from "./ChartError";

async function TopProductsData() {
  const data = await getTopProductsAnalytics();

  if (!data || data.length === 0) {
    return (
      <ChartError
        title="Top 5 Products"
        description="Best performing products by order count and revenue"
        error="No product data available"
      />
    );
  }

  return <TopProductsChart data={data} />;
}

export function TopProductsSection() {
  return (
    <Suspense
      fallback={
        <ChartSkeleton
          title="Top 5 Products"
          description="Best performing products by order count and revenue"
        />
      }
    >
      <TopProductsData />
    </Suspense>
  );
}
