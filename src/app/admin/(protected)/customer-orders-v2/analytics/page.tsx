import { PageContainer, PageHeader, PageHeaderMain, PageTitle, PageDescription, PageBody } from "@/components/shared/page-layout";
import { Metadata } from "next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AnalyticsCard, analyticsCardVariants } from "@/components/ui/analytics-card";
import { formatCurrencyPHP } from "@/lib/constant";
import { getCustomerOrdersWithFulfillment } from "@/lib/actions/customer-order";
import { getOrdersRequiringAnalysis } from "@/lib/actions/order-analysis";
import { OverallOrderStatus } from "@/types/admin/order-analysis";
import { CustomerOrderAnalyticsCharts } from "@/components/module/admin/customer-order-ver/CustomerOrderAnalyticsCharts";

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
        <div className="flex flex-col gap-4 md:gap-6">
          {/* Key Metrics Row */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
            <div className="bg-card border rounded-lg p-3 md:p-4">
              <div className="text-xs md:text-sm font-medium text-muted-foreground truncate">Total Orders</div>
              <div className="text-lg md:text-2xl font-bold text-blue-600">{totalOrders}</div>
            </div>
            <div className="bg-card border rounded-lg p-3 md:p-4">
              <div className="text-xs md:text-sm font-medium text-muted-foreground truncate">Completed</div>
              <div className="text-lg md:text-2xl font-bold text-green-600">{statusCounts["COMPLETED"]}</div>
            </div>
            <div className="bg-card border rounded-lg p-3 md:p-4">
              <div className="text-xs md:text-sm font-medium text-muted-foreground truncate">Revenue</div>
              <div className="text-sm md:text-lg font-bold text-amber-600 truncate" title={formatCurrencyPHP(totalRevenue)}>
                {totalRevenue > 1000000 ? `₱${(totalRevenue / 1000000).toFixed(1)}M` : formatCurrencyPHP(totalRevenue)}
              </div>
            </div>
            <div className="bg-card border rounded-lg p-3 md:p-4">
              <div className="text-xs md:text-sm font-medium text-muted-foreground truncate">Need Analysis</div>
              <div className="text-lg md:text-2xl font-bold text-purple-600">{ordersRequiringAnalysis}</div>
            </div>
          </div>

          {/* Status Breakdown */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base md:text-lg">Order Status Breakdown</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
                <div className="text-center p-2 md:p-3">
                  <div className="text-xs md:text-sm text-muted-foreground">Pending</div>
                  <div className="text-lg md:text-xl font-bold text-orange-600">{statusCounts["PENDING"]}</div>
                </div>
                <div className="text-center p-2 md:p-3">
                  <div className="text-xs md:text-sm text-muted-foreground">In Progress</div>
                  <div className="text-lg md:text-xl font-bold text-blue-600">{statusCounts["IN_PROGRESS"]}</div>
                </div>
                <div className="text-center p-2 md:p-3">
                  <div className="text-xs md:text-sm text-muted-foreground">Completed</div>
                  <div className="text-lg md:text-xl font-bold text-green-600">{statusCounts["COMPLETED"]}</div>
                </div>
                <div className="text-center p-2 md:p-3">
                  <div className="text-xs md:text-sm text-muted-foreground">Cancelled</div>
                  <div className="text-lg md:text-xl font-bold text-red-600">{statusCounts["CANCELLED"]}</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Production Analysis - Compact Layout */}
          {ordersRequiringAnalysis > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base md:text-lg">Production Analysis</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div className="bg-green-50 dark:bg-green-950/50 border border-green-200 dark:border-green-800 rounded-lg p-3 text-center">
                    <div className="text-xs text-green-700 dark:text-green-300 font-medium truncate">Fulfill Now</div>
                    <div className="text-lg font-bold text-green-600">{ordersCanFulfillImmediately}</div>
                  </div>
                  <div className="bg-blue-50 dark:bg-blue-950/50 border border-blue-200 dark:border-blue-800 rounded-lg p-3 text-center">
                    <div className="text-xs text-blue-700 dark:text-blue-300 font-medium truncate">Mixed</div>
                    <div className="text-lg font-bold text-blue-600">{ordersMixed}</div>
                  </div>
                  <div className="bg-orange-50 dark:bg-orange-950/50 border border-orange-200 dark:border-orange-800 rounded-lg p-3 text-center">
                    <div className="text-xs text-orange-700 dark:text-orange-300 font-medium truncate">Production</div>
                    <div className="text-lg font-bold text-orange-600">{ordersRequireProduction}</div>
                  </div>
                  <div className="bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800 rounded-lg p-3 text-center">
                    <div className="text-xs text-red-700 dark:text-red-300 font-medium truncate">Shortages</div>
                    <div className="text-lg font-bold text-red-600">{ordersWithMaterialShortages}</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Fulfillment Summary - Compact Layout */}
          {customerOrders.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base md:text-lg">Fulfillment Status</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Fully Fulfilled</span>
                      <span className="font-semibold text-green-600">{fulfillmentAggregates.fullyFulfilledOrders}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Partially Fulfilled</span>
                      <span className="font-semibold text-blue-600">{fulfillmentAggregates.partiallyFulfilledOrders}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base md:text-lg">Fulfillment Sources</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">From Stock</span>
                      <span className="font-semibold text-amber-600">{fulfillmentAggregates.totalFromStock.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">From Production</span>
                      <span className="font-semibold text-orange-600">{fulfillmentAggregates.totalFromProduction.toLocaleString()}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Charts Section */}
          {customerOrders.length > 0 && (
            <CustomerOrderAnalyticsCharts 
              orders={customerOrders}
              statusCounts={statusCounts}
              fulfillmentData={fulfillmentAggregates}
            />
          )}
        </div>
      </PageBody>
    </PageContainer>
  );
}
