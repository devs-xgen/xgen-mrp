import { Metadata } from "next";
import { getCustomerOrders, getCustomerOrdersWithFulfillment } from "@/lib/actions/customer-order";
import { getOrdersRequiringAnalysis } from "@/lib/actions/order-analysis";
import { columns } from "@/components/module/admin/customer-orders/columns";
import { DataTable } from "@/components/module/admin/customer-orders/data-table";
import { Button } from "@/components/ui/button";
import { Plus, Search, BarChart, CheckCircle, GitBranch, Factory, AlertTriangle, TrendingUp, Archive } from "lucide-react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AnalyticsCard, analyticsCardVariants } from "@/components/ui/analytics-card";
import { formatCurrencyPHP } from "@/lib/constant";
import { CustomerOrderColumn } from "@/types/admin/customer-order";
import { OverallOrderStatus } from "@/types/admin/order-analysis";

export const metadata: Metadata = {
  title: "Customer Orders",
  description: "Manage customer orders and production planning",
};

export default async function CustomerOrdersPage() {
  // Fetch customer orders and analysis data
  const [customerOrders, orderAnalyses] = await Promise.all([
    getCustomerOrdersWithFulfillment(),
    getOrdersRequiringAnalysis().catch(() => []), // Don't fail if analysis fails
  ]);

  // Transform orders data for the table with fulfillment tracking
  const tableData: CustomerOrderColumn[] = customerOrders.map((order) => {
    // Calculate fulfillment overview
    const orderLines = order.orderLines || [];
    const totalQuantity = orderLines.reduce((sum, line) => sum + line.quantity, 0);
    
    const fulfilledItems = orderLines.filter(line => 
      line.fulfillmentStatus === "FULFILLED"
    ).length;
    
    const pendingItems = orderLines.filter(line => 
      line.fulfillmentStatus === "PENDING" || !line.fulfillmentStatus
    ).length;
    
    const totalAllocated = orderLines.reduce((sum, line) => 
      sum + (line.stockAllocated || 0) + (line.productionQuantity || 0), 0
    );
    
    const fromStock = orderLines.reduce((sum, line) => 
      sum + (line.stockAllocated || 0), 0
    );
    
    const fromProduction = orderLines.reduce((sum, line) => 
      sum + (line.productionQuantity || 0), 0
    );
    
    const overallCompletion = totalQuantity > 0 
      ? Math.round((totalAllocated / totalQuantity) * 100)
      : 0;

    return {
      id: order.id,
      orderNumber: order.orderNumber,
      customerName: order.customer.name,
      customerEmail: order.customer.email || null,
      orderDate: order.orderDate,
      requiredDate: order.requiredDate,
      status: order.status,
      totalAmount: order.totalAmount,
      itemCount: orderLines.length,
      totalQuantity: totalQuantity,
      productionOrderCount: order._count?.productionOrders || 0,
      billingStatementCount: order._count?.billingStatements || 0,
      billingStatements: order.billingStatements,
      notes: order.notes || null,
      lastUpdated: new Date(), // Using current date for now, will fix when schema is updated
      fulfillmentOverview: {
        overallCompletion,
        totalAllocated,
        fromStock,
        fromProduction,
        pendingItems,
        fulfilledItems,
      },
    };
  });

  // Calculate statistics
  const totalOrders = customerOrders.length;
  const totalRevenue = customerOrders.reduce((sum, order) => sum + order.totalAmount, 0);

  // Count statuses
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

  // Calculate orders requiring production (legacy method)
  const ordersNeedingProduction = customerOrders.filter((order) => {
    return order.status !== "COMPLETED" && order.status !== "CANCELLED" && 
           (!order._count?.productionOrders || order._count.productionOrders === 0);
  }).length;

  // Calculate stock analysis metrics
  const ordersRequiringAnalysis = orderAnalyses.length;
  const ordersCanFulfillImmediately = orderAnalyses.filter(
    analysis => analysis.overallStatus === OverallOrderStatus.CAN_FULFILL_IMMEDIATELY
  ).length;
  const ordersMixed = orderAnalyses.filter(
    analysis => analysis.overallStatus === OverallOrderStatus.MIXED
  ).length;
  const ordersRequireProduction = orderAnalyses.filter(
    analysis => analysis.overallStatus === OverallOrderStatus.REQUIRES_PRODUCTION
  ).length;
  const ordersWithMaterialShortages = orderAnalyses.filter(
    analysis => analysis.overallStatus === OverallOrderStatus.MATERIAL_SHORTAGE
  ).length;

  // Calculate fulfillment statistics
  const fulfillmentStats = tableData.reduce((stats, order) => {
    const overview = order.fulfillmentOverview;
    if (overview) {
      stats.totalOrdersWithFulfillment++;
      stats.totalCompletion += overview.overallCompletion;
      stats.totalFromStock += overview.fromStock;
      stats.totalFromProduction += overview.fromProduction;
      stats.totalFulfilledItems += overview.fulfilledItems;
      stats.totalPendingItems += overview.pendingItems;
      
      if (overview.overallCompletion >= 100) {
        stats.fullyFulfilledOrders++;
      } else if (overview.overallCompletion > 0) {
        stats.partiallyFulfilledOrders++;
      }
    }
    return stats;
  }, {
    totalOrdersWithFulfillment: 0,
    totalCompletion: 0,
    totalFromStock: 0,
    totalFromProduction: 0,
    totalFulfilledItems: 0,
    totalPendingItems: 0,
    fullyFulfilledOrders: 0,
    partiallyFulfilledOrders: 0,
  });

  const averageCompletion = fulfillmentStats.totalOrdersWithFulfillment > 0
    ? Math.round(fulfillmentStats.totalCompletion / fulfillmentStats.totalOrdersWithFulfillment)
    : 0;

  return (
    <div className="flex flex-col gap-6 p-8">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Customer Orders</h2>
          <p className="text-muted-foreground">
            Manage customer orders, stock analysis, and production planning
          </p>
        </div>
        <div className="flex gap-3">
          <Link href="/admin/customer-orders/archives">
            <Button variant="outline">
              <Archive className="mr-2 h-4 w-4" />
              View Archives
            </Button>
          </Link>
          <Link href="/admin/production/planning">
            <Button variant="outline">
              <BarChart className="mr-2 h-4 w-4" />
              Production Planning
            </Button>
          </Link>
          <Link href="/admin/customer-orders/create">
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Create Order
            </Button>
          </Link>
        </div>
      </div>

      {/* Customer Order Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
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
      </div>

      {/* Stock Analysis Statistics */}
      {ordersRequiringAnalysis > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
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
        </div>
      )}

      {/* Fulfillment Tracking Statistics */}
      {fulfillmentStats.totalOrdersWithFulfillment > 0 && (
        <div>
          <h3 className="text-lg font-semibold mb-3">Fulfillment Overview</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <AnalyticsCard
              title="Avg Completion"
              value={`${averageCompletion}%`}
              icon="TrendingUp"
              {...analyticsCardVariants.blue}
            />
            <AnalyticsCard
              title="Fully Fulfilled"
              value={fulfillmentStats.fullyFulfilledOrders}
              icon="CheckCircle"
              {...analyticsCardVariants.green}
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
          </div>
        </div>
      )}

      {/* Quick Filters */}
      <div className="space-y-3">
        <div>
          <p className="text-sm font-medium text-muted-foreground mb-2">Order Status</p>
          <div className="flex flex-wrap gap-2">
            <Badge variant="outline" className="cursor-pointer hover:bg-secondary">
              All ({totalOrders})
            </Badge>
            <Badge
              variant="secondary"
              className="cursor-pointer hover:bg-secondary"
            >
              In Progress ({statusCounts["IN_PROGRESS"]})
            </Badge>
            <Badge variant="outline" className="cursor-pointer hover:bg-secondary">
              Pending ({statusCounts["PENDING"]})
            </Badge>
            <Badge variant="outline" className="cursor-pointer hover:bg-secondary">
              Completed ({statusCounts["COMPLETED"]})
            </Badge>
          </div>
        </div>

        {ordersRequiringAnalysis > 0 && (
          <div>
            <p className="text-sm font-medium text-muted-foreground mb-2">Stock Analysis</p>
            <div className="flex flex-wrap gap-2">
              <Badge
                variant="default"
                className="cursor-pointer hover:bg-primary/90 bg-green-600"
              >
                Can Fulfill Immediately ({ordersCanFulfillImmediately})
              </Badge>
              <Badge
                variant="secondary"
                className="cursor-pointer hover:bg-secondary bg-blue-100 text-blue-800"
              >
                Mixed Fulfillment ({ordersMixed})
              </Badge>
              <Badge
                variant="outline"
                className="cursor-pointer hover:bg-secondary bg-orange-100 text-orange-800 border-orange-200"
              >
                Need Production ({ordersRequireProduction})
              </Badge>
              {ordersWithMaterialShortages > 0 && (
                <Badge
                  variant="destructive"
                  className="cursor-pointer hover:bg-destructive/90"
                >
                  Material Shortages ({ordersWithMaterialShortages})
                </Badge>
              )}
              <Badge
                variant="outline"
                className="cursor-pointer hover:bg-secondary bg-gray-100 text-gray-800"
              >
                Need Analysis ({ordersRequiringAnalysis})
              </Badge>
            </div>
          </div>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Customer Orders</CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable columns={columns} data={tableData} />
        </CardContent>
      </Card>
    </div>
  );
}
