import { PageContainer, PageHeader, PageHeaderMain, PageTitle, PageDescription, PageBody } from "@/components/shared/page-layout";
import { Metadata } from "next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AnalyticsCard, analyticsCardVariants } from "@/components/ui/analytics-card";
import { formatCurrencyPHP } from "@/lib/constant";
import { getCustomerOrdersWithFulfillment } from "@/lib/actions/customer-order";
import { getOrdersRequiringAnalysis } from "@/lib/actions/order-analysis";
import { OverallOrderStatus } from "@/types/admin/order-analysis";

export const metadata: Metadata = {
  title: "Customer Orders V2 — Analytics",
  description: "Overview of customer order statistics and fulfillment analytics",
};

export default async function CustomerOrdersV2AnalyticsPage() {
  // Fetch customer orders and analysis data
  const [customerOrders, orderAnalyses] = await Promise.all([
    getCustomerOrdersWithFulfillment(),
    getOrdersRequiringAnalysis().catch(() => []),
  ]);

  // Calculate headline statistics
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
  } as Record<string, number>;

  customerOrders.forEach((order) => {
    if (order.status in statusCounts) {
      statusCounts[order.status]++;
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

  // Fulfillment overview aggregates
  const fulfillmentAggregates = customerOrders.reduce(
    (agg, order) => {
      const lines = order.orderLines || [];
      const totalQty = lines.reduce((s, l) => s + (l.quantity || 0), 0);
      const totalAllocatedForOrder = lines.reduce(
        (s, l) => s + Number(l.stockAllocated || 0) + Number(l.productionQuantity || 0),
        0
      );
      const completion = totalQty > 0 ? Math.round((totalAllocatedForOrder / totalQty) * 100) : 0;
      if (completion >= 100) agg.fullyFulfilledOrders++;
      else if (completion > 0) agg.partiallyFulfilledOrders++;

      for (const l of lines) {
        agg.totalFromStock += Number(l.stockAllocated || 0);
        agg.totalFromProduction += Number(l.productionQuantity || 0);
      }
      return agg;
    },
    {
      fullyFulfilledOrders: 0,
      partiallyFulfilledOrders: 0,
      totalFromStock: 0,
      totalFromProduction: 0,
    }
  );

  return (
    <PageContainer>
      <PageHeader>
        <PageHeaderMain>
          <PageTitle>Customer Orders V2 — Analytics</PageTitle>
          <PageDescription>High-level overview of orders and fulfillment metrics.</PageDescription>
        </PageHeaderMain>
      </PageHeader>
      <PageBody>
        <div className="flex flex-col gap-6 p-2 md:p-4">
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
                  value={fulfillmentAggregates.fullyFulfilledOrders}
                  icon="CheckCircle"
                  {...analyticsCardVariants.green}
                />
                <AnalyticsCard
                  title="Partially Fulfilled"
                  value={fulfillmentAggregates.partiallyFulfilledOrders}
                  icon="GitBranch"
                  {...analyticsCardVariants.blue}
                />
                <AnalyticsCard
                  title="From Stock"
                  value={fulfillmentAggregates.totalFromStock}
                  icon="Package"
                  {...analyticsCardVariants.amber}
                />
                <AnalyticsCard
                  title="From Production"
                  value={fulfillmentAggregates.totalFromProduction}
                  icon="Factory"
                  {...analyticsCardVariants.orange}
                />
              </CardContent>
            </Card>
          )}
        </div>
      </PageBody>
    </PageContainer>
  );
}
