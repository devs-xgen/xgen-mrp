import { Metadata } from "next";
import { 
  getOrderAnalyticsSummary, 
  getFulfillmentAnalytics, 
  getProductionPlanningMetrics 
} from "@/lib/actions/order-analytics";
import { OrderAnalyticsDashboard } from "@/components/module/admin/analytics/OrderAnalyticsDashboard";
import { Breadcrumbs } from "@/components/shared/Breadcrumbs";

export const metadata: Metadata = {
  title: "Order Analytics",
  description: "Comprehensive analytics dashboard for customer orders, fulfillment tracking, and production planning insights",
};

interface OrderAnalyticsPageProps {
  searchParams: Promise<{
    dateFrom?: string;
    dateTo?: string;
    period?: string;
  }>;
}

export default async function OrderAnalyticsPage({ searchParams }: OrderAnalyticsPageProps) {
  const params = await searchParams;
  
  // Build date range from search params
  let dateRange: { from: Date; to: Date } | undefined;
  
  if (params.dateFrom && params.dateTo) {
    dateRange = {
      from: new Date(params.dateFrom),
      to: new Date(params.dateTo),
    };
  } else if (params.period) {
    const now = new Date();
    switch (params.period) {
      case "7d":
        dateRange = {
          from: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000),
          to: now,
        };
        break;
      case "30d":
        dateRange = {
          from: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000),
          to: now,
        };
        break;
      case "90d":
        dateRange = {
          from: new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000),
          to: now,
        };
        break;
      case "1y":
        dateRange = {
          from: new Date(now.getFullYear() - 1, now.getMonth(), now.getDate()),
          to: now,
        };
        break;
    }
  }

  // Fetch all analytics data
  const [analyticsSummary, fulfillmentAnalytics, productionMetrics] = await Promise.all([
    getOrderAnalyticsSummary(dateRange).catch((error) => {
      console.error("Error fetching analytics summary:", error);
      return null;
    }),
    getFulfillmentAnalytics(dateRange).catch((error) => {
      console.error("Error fetching fulfillment analytics:", error);
      return null;
    }),
    getProductionPlanningMetrics(dateRange).catch((error) => {
      console.error("Error fetching production metrics:", error);
      return null;
    }),
  ]);

  const breadcrumbItems = [
    { label: "Analytics", href: "/admin/analytics" },
    { label: "Order Analytics", href: "/admin/analytics/orders" },
  ];

  return (
    <div className="flex flex-col gap-6 p-8">
      <div className="space-y-4">
        <Breadcrumbs items={breadcrumbItems} />
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Order Analytics</h1>
          <p className="text-muted-foreground">
            Comprehensive insights into customer orders, fulfillment performance, and production planning
          </p>
        </div>
      </div>

      <OrderAnalyticsDashboard
        analyticsSummary={analyticsSummary}
        fulfillmentAnalytics={fulfillmentAnalytics}
        productionMetrics={productionMetrics}
        dateRange={dateRange}
        currentPeriod={params.period}
      />
    </div>
  );
}
