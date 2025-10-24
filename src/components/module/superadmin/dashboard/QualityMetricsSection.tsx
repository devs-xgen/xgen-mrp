import { Suspense } from "react";
import { getQualityMetricsAnalytics } from "@/lib/actions/superadmin/dashboard-analytics";
import { QualityMetricsCard } from "./QualityMetricsCard";
import { ChartSkeleton } from "./ChartSkeleton";

async function QualityMetricsData() {
  const data = await getQualityMetricsAnalytics();
  return <QualityMetricsCard data={data} />;
}

export function QualityMetricsSection() {
  return (
    <Suspense
      fallback={
        <ChartSkeleton
          title="Quality Control Metrics"
          description="Quality checks performance overview"
          height={250}
        />
      }
    >
      <QualityMetricsData />
    </Suspense>
  );
}
