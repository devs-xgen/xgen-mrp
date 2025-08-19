"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { AnalyticsCard, analyticsCardVariants } from "@/components/ui/analytics-card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Calendar,
  TrendingUp,
  TrendingDown,
  Package,
  Factory,
  Users,
  DollarSign,
  Clock,
  CheckCircle,
  AlertCircle,
  BarChart3,
  PieChart,
  LineChart,
  RefreshCw,
  Download,
  Filter,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
} from "lucide-react";
import { formatCurrencyPHP } from "@/lib/constant";
import { formatDate } from "@/lib/utils";
import type {
  OrderAnalyticsSummary,
  FulfillmentAnalytics,
  ProductionPlanningMetrics,
} from "@/lib/actions/order-analytics";

interface OrderAnalyticsDashboardProps {
  analyticsSummary: OrderAnalyticsSummary | null;
  fulfillmentAnalytics: FulfillmentAnalytics | null;
  productionMetrics: ProductionPlanningMetrics | null;
  dateRange?: { from: Date; to: Date };
  currentPeriod?: string;
}

export function OrderAnalyticsDashboard({
  analyticsSummary,
  fulfillmentAnalytics,
  productionMetrics,
  dateRange,
  currentPeriod,
}: OrderAnalyticsDashboardProps) {
  const [activeTab, setActiveTab] = useState("overview");
  const router = useRouter();

  const handlePeriodChange = (period: string) => {
    const params = new URLSearchParams();
    if (period !== "all") {
      params.set("period", period);
    }
    router.push(`/admin/analytics/orders?${params.toString()}`);
  };

  const getTrendIcon = (value: number) => {
    if (value > 0) return <ArrowUpRight className="h-4 w-4 text-green-500" />;
    if (value < 0) return <ArrowDownRight className="h-4 w-4 text-red-500" />;
    return <Minus className="h-4 w-4 text-muted-foreground" />;
  };

  const formatTrend = (value: number) => {
    const absValue = Math.abs(value);
    const sign = value >= 0 ? "+" : "-";
    return `${sign}${absValue.toFixed(1)}%`;
  };

  if (!analyticsSummary || !fulfillmentAnalytics || !productionMetrics) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-4">
          <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto" />
          <div>
            <h3 className="text-lg font-medium">Analytics Unavailable</h3>
            <p className="text-muted-foreground">
              Unable to load analytics data. Please try again later.
            </p>
          </div>
          <Button onClick={() => router.refresh()}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <Select value={currentPeriod || "all"} onValueChange={handlePeriodChange}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Select period" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Time</SelectItem>
                <SelectItem value="7d">Last 7 Days</SelectItem>
                <SelectItem value="30d">Last 30 Days</SelectItem>
                <SelectItem value="90d">Last 90 Days</SelectItem>
                <SelectItem value="1y">Last Year</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          {dateRange && (
            <Badge variant="outline">
              {formatDate(dateRange.from)} - {formatDate(dateRange.to)}
            </Badge>
          )}
        </div>

        <div className="flex gap-2">
          <Button variant="outline" onClick={() => router.refresh()}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Key Metrics Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <AnalyticsCard
          title="Total Orders"
          value={analyticsSummary.totalOrders.toLocaleString()}
          icon="ShoppingCart"
          trend={getTrendIcon(5.2)}
          trendText={formatTrend(5.2)}
          {...analyticsCardVariants.blue}
        />
        <AnalyticsCard
          title="Total Revenue"
          value={formatCurrencyPHP(analyticsSummary.totalRevenue)}
          icon="DollarSign"
          trend={getTrendIcon(12.8)}
          trendText={formatTrend(12.8)}
          {...analyticsCardVariants.green}
        />
        <AnalyticsCard
          title="Avg Order Value"
          value={formatCurrencyPHP(analyticsSummary.averageOrderValue)}
          icon="TrendingUp"
          trend={getTrendIcon(3.4)}
          trendText={formatTrend(3.4)}
          {...analyticsCardVariants.amber}
        />
        <AnalyticsCard
          title="Fulfillment Rate"
          value={`${fulfillmentAnalytics.fulfillmentAccuracy.overallAccuracy}%`}
          icon="CheckCircle"
          trend={getTrendIcon(8.9)}
          trendText={formatTrend(8.9)}
          {...analyticsCardVariants.purple}
        />
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="fulfillment">Fulfillment</TabsTrigger>
          <TabsTrigger value="production">Production</TabsTrigger>
          <TabsTrigger value="customers">Customers</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Order Status Breakdown */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PieChart className="h-5 w-5" />
                  Order Status Distribution
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {Object.entries(analyticsSummary.ordersByStatus).map(([status, count]) => {
                    const percentage = Math.round((count / analyticsSummary.totalOrders) * 100);
                    const getStatusColor = (status: string) => {
                      const colors = {
                        COMPLETED: "bg-green-500",
                        IN_PROGRESS: "bg-blue-500",
                        PENDING: "bg-yellow-500",
                        CANCELLED: "bg-red-500",
                        ARCHIVED: "bg-gray-500",
                      };
                      return colors[status as keyof typeof colors] || "bg-gray-400";
                    };

                    return (
                      <div key={status} className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`w-3 h-3 rounded-full ${getStatusColor(status)}`} />
                          <span className="capitalize">{status.toLowerCase().replace("_", " ")}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium">{count}</span>
                          <span className="text-xs text-muted-foreground">({percentage}%)</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Fulfillment Breakdown */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Fulfillment Method Breakdown
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="flex items-center gap-2">
                        <Package className="h-4 w-4 text-blue-500" />
                        From Stock
                      </span>
                      <span className="font-medium">
                        {analyticsSummary.fulfillmentBreakdown.percentageFromStock}%
                      </span>
                    </div>
                    <Progress 
                      value={analyticsSummary.fulfillmentBreakdown.percentageFromStock} 
                      className="h-2" 
                    />
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="flex items-center gap-2">
                        <Factory className="h-4 w-4 text-orange-500" />
                        From Production
                      </span>
                      <span className="font-medium">
                        {analyticsSummary.fulfillmentBreakdown.percentageFromProduction}%
                      </span>
                    </div>
                    <Progress 
                      value={analyticsSummary.fulfillmentBreakdown.percentageFromProduction} 
                      className="h-2" 
                    />
                  </div>

                  <div className="pt-4 border-t">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-blue-600">
                          {analyticsSummary.fulfillmentBreakdown.fromStock}
                        </div>
                        <p className="text-muted-foreground">Stock Items</p>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-orange-600">
                          {analyticsSummary.fulfillmentBreakdown.fromProduction}
                        </div>
                        <p className="text-muted-foreground">Production Items</p>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Performance Metrics */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Performance Metrics
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {analyticsSummary.performanceMetrics.averageCompletionRate}%
                  </div>
                  <p className="text-sm text-muted-foreground">Avg Completion Rate</p>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">
                    {analyticsSummary.performanceMetrics.ordersCompletedOnTime}
                  </div>
                  <p className="text-sm text-muted-foreground">On-Time Orders</p>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-red-600">
                    {analyticsSummary.performanceMetrics.ordersOverdue}
                  </div>
                  <p className="text-sm text-muted-foreground">Overdue Orders</p>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">
                    {analyticsSummary.performanceMetrics.averageProcessingTime}d
                  </div>
                  <p className="text-sm text-muted-foreground">Avg Processing Time</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="fulfillment" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <AnalyticsCard
              title="Stock Fulfillment"
              value={`${Math.round((fulfillmentAnalytics.stockFulfilledLines / fulfillmentAnalytics.totalOrderLines) * 100)}%`}
              icon="Package"
              description={`${fulfillmentAnalytics.stockFulfilledLines} of ${fulfillmentAnalytics.totalOrderLines} lines`}
              {...analyticsCardVariants.blue}
            />
            <AnalyticsCard
              title="Production Fulfillment"
              value={`${Math.round((fulfillmentAnalytics.productionFulfilledLines / fulfillmentAnalytics.totalOrderLines) * 100)}%`}
              icon="Factory"
              description={`${fulfillmentAnalytics.productionFulfilledLines} of ${fulfillmentAnalytics.totalOrderLines} lines`}
              {...analyticsCardVariants.orange}
            />
            <AnalyticsCard
              title="Avg Stock Time"
              value={`${Math.round(fulfillmentAnalytics.avgFulfillmentTime.stock)}h`}
              icon="Clock"
              description="Average stock fulfillment time"
              {...analyticsCardVariants.green}
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Fulfillment Accuracy */}
            <Card>
              <CardHeader>
                <CardTitle>Fulfillment Accuracy</CardTitle>
                <CardDescription>Success rates by fulfillment method</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span>Stock Accuracy</span>
                    <Badge variant="secondary">
                      {fulfillmentAnalytics.fulfillmentAccuracy.stockAccuracy}%
                    </Badge>
                  </div>
                  <Progress 
                    value={fulfillmentAnalytics.fulfillmentAccuracy.stockAccuracy} 
                    className="h-2" 
                  />
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span>Production Accuracy</span>
                    <Badge variant="secondary">
                      {fulfillmentAnalytics.fulfillmentAccuracy.productionAccuracy}%
                    </Badge>
                  </div>
                  <Progress 
                    value={fulfillmentAnalytics.fulfillmentAccuracy.productionAccuracy} 
                    className="h-2" 
                  />
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span>Overall Accuracy</span>
                    <Badge>
                      {fulfillmentAnalytics.fulfillmentAccuracy.overallAccuracy}%
                    </Badge>
                  </div>
                  <Progress 
                    value={fulfillmentAnalytics.fulfillmentAccuracy.overallAccuracy} 
                    className="h-2" 
                  />
                </div>
              </CardContent>
            </Card>

            {/* Stock vs Production Trend */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <LineChart className="h-5 w-5" />
                  Fulfillment Trend
                </CardTitle>
                <CardDescription>Stock vs production fulfillment over time</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {fulfillmentAnalytics.stockVsProductionTrend.map((trend, index) => (
                    <div key={index} className="space-y-2">
                      <div className="flex justify-between text-sm font-medium">
                        <span>{trend.period}</span>
                        <span className="text-muted-foreground">
                          {trend.stockPercentage}% / {trend.productionPercentage}%
                        </span>
                      </div>
                      <div className="flex h-2 rounded-full overflow-hidden bg-muted">
                        <div 
                          className="bg-blue-500" 
                          style={{ width: `${trend.stockPercentage}%` }} 
                        />
                        <div 
                          className="bg-orange-500" 
                          style={{ width: `${trend.productionPercentage}%` }} 
                        />
                        <div 
                          className="bg-purple-500" 
                          style={{ width: `${trend.hybridPercentage}%` }} 
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="production" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <AnalyticsCard
              title="Production Orders"
              value={productionMetrics.totalProductionOrders.toLocaleString()}
              icon="Factory"
              {...analyticsCardVariants.orange}
            />
            <AnalyticsCard
              title="Avg Lead Time"
              value={`${Math.round(productionMetrics.averageLeadTime)}d`}
              icon="Clock"
              {...analyticsCardVariants.blue}
            />
            <AnalyticsCard
              title="On-Time Delivery"
              value={`${productionMetrics.onTimeDelivery}%`}
              icon="CheckCircle"
              {...analyticsCardVariants.green}
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Production Status Breakdown */}
            <Card>
              <CardHeader>
                <CardTitle>Production Order Status</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {Object.entries(productionMetrics.productionOrdersByStatus).map(([status, count]) => {
                    const percentage = Math.round((count / productionMetrics.totalProductionOrders) * 100);
                    return (
                      <div key={status} className="flex items-center justify-between">
                        <span className="capitalize">{status.toLowerCase().replace("_", " ")}</span>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{count}</span>
                          <Badge variant="outline">{percentage}%</Badge>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Top Produced Products */}
            <Card>
              <CardHeader>
                <CardTitle>Top Produced Products</CardTitle>
                <CardDescription>Most produced items by quantity</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {productionMetrics.topProducedProducts.slice(0, 5).map((product, index) => (
                    <div key={product.productId} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-xs font-medium">
                          {index + 1}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="font-medium truncate">{product.productName}</p>
                          <p className="text-xs text-muted-foreground">
                            {product.totalQuantityProduced} units
                          </p>
                        </div>
                      </div>
                      <Badge variant="outline">{product.successRate}%</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="customers" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <AnalyticsCard
              title="Total Customers"
              value={(analyticsSummary.customerInsights.newCustomers + analyticsSummary.customerInsights.returningCustomers).toLocaleString()}
              icon="Users"
              {...analyticsCardVariants.purple}
            />
            <AnalyticsCard
              title="New Customers"
              value={analyticsSummary.customerInsights.newCustomers.toLocaleString()}
              icon="UserPlus"
              {...analyticsCardVariants.green}
            />
            <AnalyticsCard
              title="Returning Customers"
              value={analyticsSummary.customerInsights.returningCustomers.toLocaleString()}
              icon="RefreshCw"
              {...analyticsCardVariants.blue}
            />
          </div>

          {/* Top Customers Table */}
          <Card>
            <CardHeader>
              <CardTitle>Top Customers</CardTitle>
              <CardDescription>Highest value customers by total revenue</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Customer</TableHead>
                    <TableHead>Orders</TableHead>
                    <TableHead>Revenue</TableHead>
                    <TableHead>Avg Order</TableHead>
                    <TableHead>Preferred Method</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {analyticsSummary.customerInsights.topCustomers.map((customer) => (
                    <TableRow key={customer.customerId}>
                      <TableCell className="font-medium">{customer.customerName}</TableCell>
                      <TableCell>{customer.totalOrders}</TableCell>
                      <TableCell>{formatCurrencyPHP(customer.totalRevenue)}</TableCell>
                      <TableCell>{formatCurrencyPHP(customer.avgOrderValue)}</TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {customer.preferredFulfillmentType}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
