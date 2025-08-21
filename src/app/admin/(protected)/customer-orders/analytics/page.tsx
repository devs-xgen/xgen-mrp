import { Metadata } from "next";
import { getCustomerOrdersWithFulfillment } from "@/lib/actions/customer-order";
import { getOrdersRequiringAnalysis } from "@/lib/actions/order-analysis";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AnalyticsCard, analyticsCardVariants } from "@/components/ui/analytics-card";
import { formatCurrencyPHP } from "@/lib/constant";
import { OverallOrderStatus } from "@/types/admin/order-analysis";

export const metadata: Metadata = {
  title: "Customer Analytics",
  description: "Overview of customer order statistics and business analytics",
};

export default async function CustomerAnalyticsPage() {
  // Fetch customer orders and analysis data
  const [customerOrders, orderAnalyses] = await Promise.all([
    getCustomerOrdersWithFulfillment(),
    getOrdersRequiringAnalysis().catch(() => []),
  ]);

  // Calculate statistics
  const totalOrders = customerOrders.length;
  const totalRevenue = customerOrders.reduce((sum, order) => {
    const amount = order.totalAmount ?? 0;
    return sum + Number(amount);
  }, 0);

  const statusCounts = {
    COMPLETED: 0,
    IN_PROGRESS: 0,
    PENDING: 0,
    CANCELLED: 0,
  };
  customerOrders.forEach((order) => {
    if (order.status in statusCounts) {
      statusCounts[order.status as keyof typeof statusCounts]++;
    }
  });

  const ordersRequiringAnalysis = orderAnalyses.length;
  const ordersCanFulfillImmediately = orderAnalyses.filter(
    (analysis) => analysis.overallStatus === OverallOrderStatus.CAN_FULFILL_IMMEDIATELY
  ).length;
  const ordersMixed = orderAnalyses.filter(
    (analysis) => analysis.overallStatus === OverallOrderStatus.MIXED
  ).length;
  const ordersRequireProduction = orderAnalyses.filter(
    (analysis) => analysis.overallStatus === OverallOrderStatus.REQUIRES_PRODUCTION
  ).length;
  const ordersWithMaterialShortages = orderAnalyses.filter(
    (analysis) => analysis.overallStatus === OverallOrderStatus.MATERIAL_SHORTAGE
  ).length;

  const fulfillmentStats = customerOrders.reduce(
    (stats, order) => {
      const orderLines = order.orderLines || [];
      const totalQuantity = orderLines.reduce((sum, line) => sum + line.quantity, 0);
      const totalAllocated = orderLines.reduce(
        (sum, line) => sum + (line.stockAllocated || 0) + (line.productionQuantity || 0),
        0
      );
      const overallCompletion = totalQuantity > 0 ? Math.round((totalAllocated / totalQuantity) * 100) : 0;

      if (overallCompletion >= 100) {
        stats.fullyFulfilledOrders++;
      } else if (overallCompletion > 0) {
        stats.partiallyFulfilledOrders++;
      }
      return stats;
    },
    {
      fullyFulfilledOrders: 0,
      partiallyFulfilledOrders: 0,
      totalCompletion: 0,
      totalFromStock: 0,
      totalFromProduction: 0,
      totalFulfilledItems: 0,
      totalPendingItems: 0,
    }
  );

  return (
    <div className="flex flex-col gap-6 p-8">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Analytics Dashboard</h2>
        <p className="text-muted-foreground">
          High-level overview of customer order and fulfillment metrics.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Overall Metrics</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <AnalyticsCard
            title="Total Orders"
            value={totalOrders}
            icon="ShoppingCart"
            {...analyticsCardVariants.blue}
          />
          <AnalyticsCard
            title="Completed"
            value={statusCounts["COMPLETED"]}
            icon="CheckCircle"
            {...analyticsCardVariants.green}
          />
          <AnalyticsCard
            title="Revenue"
            value={formatCurrencyPHP(totalRevenue)}
            icon="Package"
            {...analyticsCardVariants.amber}
          />
          <AnalyticsCard
            title="Need Analysis"
            value={ordersRequiringAnalysis}
            icon="Search"
            {...analyticsCardVariants.purple}
          />
        </CardContent>
      </Card>

      {ordersRequiringAnalysis > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Stock & Production</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <AnalyticsCard
              title="Can Fulfill Immediately"
              value={ordersCanFulfillImmediately}
              icon="CheckCircle"
              {...analyticsCardVariants.green}
            />
            <AnalyticsCard
              title="Mixed (Stock + Production)"
              value={ordersMixed}
              icon="GitBranch"
              {...analyticsCardVariants.blue}
            />
            <AnalyticsCard
              title="Require Production"
              value={ordersRequireProduction}
              icon="Factory"
              {...analyticsCardVariants.orange}
            />
            <AnalyticsCard
              title="Material Shortages"
              value={ordersWithMaterialShortages}
              icon="AlertTriangle"
              {...analyticsCardVariants.red}
            />
          </CardContent>
        </Card>
      )}

      {customerOrders.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Fulfillment Overview</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <AnalyticsCard
              title="Fully Fulfilled"
              value={fulfillmentStats.fullyFulfilledOrders}
              icon="CheckCircle"
              {...analyticsCardVariants.green}
            />
            <AnalyticsCard
              title="Partially Fulfilled"
              value={fulfillmentStats.partiallyFulfilledOrders}
              icon="GitBranch"
              {...analyticsCardVariants.blue}
            />
            <AnalyticsCard
              title="From Stock"
              value={fulfillmentStats.totalFromStock}
              icon="Package"
              {...analyticsCardVariants.amber}
            />
            <AnalyticsCard
              title="From Production"
              value={fulfillmentStats.totalFromProduction}
              icon="Factory"
              {...analyticsCardVariants.orange}
            />
          </CardContent>
        </Card>
      )}
    </div>
  );
}