import { Suspense } from "react";
import { getRevenueAnalytics } from "@/lib/actions/superadmin/dashboard-analytics";
import { RevenueChart } from "./RevenueChart";
import { ChartSkeleton } from "./ChartSkeleton";
import { ChartError } from "./ChartError";

async function RevenueData() {
  const data = await getRevenueAnalytics();

  if (!data || data.length === 0) {
    return (
      <ChartError
        title="Revenue Trends"
        description="Monthly revenue and order count (last 6 months)"
        error="No revenue data available"
      />
    );
  }

  return <RevenueChart data={data} />;
}

export function RevenueSection() {
  return (
    <Suspense
      fallback={
        <ChartSkeleton
          title="Revenue Trends"
          description="Monthly revenue and order count (last 6 months)"
        />
      }
    >
      <RevenueData />
    </Suspense>
  );
}
