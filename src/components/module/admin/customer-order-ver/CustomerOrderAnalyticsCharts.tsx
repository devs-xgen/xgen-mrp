"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  PieChart,
  Pie,
  LineChart,
  Line,
  Area,
  AreaChart,
} from "recharts";
import { formatCurrencyPHP } from "@/lib/constant";
import { format, subDays, eachDayOfInterval } from "date-fns";

interface CustomerOrderAnalyticsChartsProps {
  orders: any[];
  statusCounts: Record<string, number>;
  fulfillmentData: {
    fullyFulfilledOrders: number;
    partiallyFulfilledOrders: number;
    totalFromStock: number;
    totalFromProduction: number;
  };
}

const chartConfig = {
  pending: {
    label: "Pending",
    color: "hsl(var(--chart-1))",
  },
  inProgress: {
    label: "In Progress", 
    color: "hsl(var(--chart-2))",
  },
  completed: {
    label: "Completed",
    color: "hsl(var(--chart-3))",
  },
  cancelled: {
    label: "Cancelled",
    color: "hsl(var(--chart-4))",
  },
  stock: {
    label: "From Stock",
    color: "hsl(var(--chart-1))",
  },
  production: {
    label: "From Production",
    color: "hsl(var(--chart-2))",
  },
  revenue: {
    label: "Revenue",
    color: "hsl(var(--chart-3))",
  },
  orders: {
    label: "Orders",
    color: "hsl(var(--chart-4))",
  },
} satisfies ChartConfig;

export function CustomerOrderAnalyticsCharts({
  orders,
  statusCounts,
  fulfillmentData,
}: CustomerOrderAnalyticsChartsProps) {
  // Prepare order status data for bar chart
  const statusData = [
    { status: "Pending", count: statusCounts.PENDING || 0, fill: "var(--color-pending)" },
    { status: "In Progress", count: statusCounts.IN_PROGRESS || 0, fill: "var(--color-inProgress)" },
    { status: "Completed", count: statusCounts.COMPLETED || 0, fill: "var(--color-completed)" },
    { status: "Cancelled", count: statusCounts.CANCELLED || 0, fill: "var(--color-cancelled)" },
  ].filter((item) => item.count > 0);

  // Prepare fulfillment source data for pie chart
  const fulfillmentSourceData = [
    { 
      name: "From Stock", 
      value: fulfillmentData.totalFromStock, 
      fill: "var(--color-stock)",
      percentage: Math.round(
        (fulfillmentData.totalFromStock / 
        (fulfillmentData.totalFromStock + fulfillmentData.totalFromProduction)) * 100
      )
    },
    { 
      name: "From Production", 
      value: fulfillmentData.totalFromProduction, 
      fill: "var(--color-production)",
      percentage: Math.round(
        (fulfillmentData.totalFromProduction / 
        (fulfillmentData.totalFromStock + fulfillmentData.totalFromProduction)) * 100
      )
    },
  ].filter((item) => item.value > 0);

  // Prepare daily orders trend (last 30 days)
  const last30Days = eachDayOfInterval({
    start: subDays(new Date(), 29),
    end: new Date(),
  });

  const dailyOrdersData = last30Days.map((date) => {
    const dayOrders = orders.filter((order) => {
      const orderDate = new Date(order.orderDate);
      return format(orderDate, 'yyyy-MM-dd') === format(date, 'yyyy-MM-dd');
    });

    const dayRevenue = dayOrders.reduce((sum, order) => sum + (order.totalAmount || 0), 0);

    return {
      date: format(date, 'MMM dd'),
      orders: dayOrders.length,
      revenue: dayRevenue,
    };
  });

  // Revenue by customer (top 10)
  const customerRevenueData = Object.entries(
    orders.reduce((acc: Record<string, number>, order) => {
      const customerName = order.customer?.name || 'Unknown';
      acc[customerName] = (acc[customerName] || 0) + (order.totalAmount || 0);
      return acc;
    }, {})
  )
    .sort(([,a], [,b]) => b - a)
    .slice(0, 10)
    .map(([customer, revenue]) => ({
      customer: customer.length > 20 ? customer.substring(0, 20) + '...' : customer,
      revenue,
      fill: "var(--color-revenue)",
    }));

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
      {/* Order Status Chart */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base md:text-lg">Order Status Distribution</CardTitle>
        </CardHeader>
        <CardContent>
          <ChartContainer config={chartConfig} className="min-h-[200px] w-full">
            <BarChart data={statusData}>
              <CartesianGrid vertical={false} />
              <XAxis
                dataKey="status"
                tickLine={false}
                tickMargin={10}
                axisLine={false}
                tick={{ fontSize: 12 }}
              />
              <ChartTooltip 
                content={<ChartTooltipContent hideLabel />} 
              />
              <Bar dataKey="count" radius={4} />
            </BarChart>
          </ChartContainer>
        </CardContent>
      </Card>

      {/* Fulfillment Sources Pie Chart */}
      {fulfillmentSourceData.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base md:text-lg">Fulfillment Sources</CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="min-h-[200px] w-full">
              <PieChart>
                <ChartTooltip 
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="rounded-lg border bg-background p-2 shadow-sm">
                          <div className="grid grid-cols-2 gap-2">
                            <div className="flex flex-col">
                              <span className="text-[0.70rem] uppercase text-muted-foreground">
                                {data.name}
                              </span>
                              <span className="font-bold text-muted-foreground">
                                {data.value.toLocaleString()} units
                              </span>
                              <span className="text-[0.70rem] text-muted-foreground">
                                {data.percentage}%
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Pie
                  data={fulfillmentSourceData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percentage }) => `${name} (${percentage}%)`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                />
              </PieChart>
            </ChartContainer>
          </CardContent>
        </Card>
      )}

      {/* Daily Orders Trend */}
      <Card className="lg:col-span-2">
        <CardHeader className="pb-3">
          <CardTitle className="text-base md:text-lg">Orders & Revenue Trend (Last 30 Days)</CardTitle>
        </CardHeader>
        <CardContent>
          <ChartContainer config={chartConfig} className="min-h-[250px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={dailyOrdersData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="date" 
                  tick={{ fontSize: 11 }}
                  interval="preserveStartEnd"
                />
                <YAxis 
                  yAxisId="orders"
                  orientation="left"
                  tick={{ fontSize: 11 }}
                />
                <YAxis 
                  yAxisId="revenue"
                  orientation="right"
                  tick={{ fontSize: 11 }}
                  tickFormatter={(value) => `₱${(value / 1000).toFixed(0)}k`}
                />
                <ChartTooltip 
                  content={({ active, payload, label }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="rounded-lg border bg-background p-3 shadow-sm">
                          <p className="font-medium">{label}</p>
                          <div className="space-y-1">
                            <p className="text-sm">
                              <span className="font-medium text-blue-600">Orders:</span> {payload[0]?.value}
                            </p>
                            <p className="text-sm">
                              <span className="font-medium text-green-600">Revenue:</span> {formatCurrencyPHP(Number(payload[1]?.value || 0))}
                            </p>
                          </div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Area
                  yAxisId="orders"
                  type="monotone"
                  dataKey="orders"
                  stackId="1"
                  stroke="var(--color-orders)"
                  fill="var(--color-orders)"
                  fillOpacity={0.6}
                />
                <Line
                  yAxisId="revenue"
                  type="monotone"
                  dataKey="revenue"
                  stroke="var(--color-revenue)"
                  strokeWidth={2}
                  dot={{ fill: "var(--color-revenue)", strokeWidth: 2, r: 4 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </ChartContainer>
        </CardContent>
      </Card>

      {/* Top Customers by Revenue */}
      {customerRevenueData.length > 0 && (
        <Card className="lg:col-span-2">
          <CardHeader className="pb-3">
            <CardTitle className="text-base md:text-lg">Top Customers by Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="min-h-[300px] w-full">
              <BarChart data={customerRevenueData} layout="horizontal">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  type="number" 
                  tick={{ fontSize: 11 }}
                  tickFormatter={(value) => formatCurrencyPHP(value)}
                />
                <YAxis 
                  type="category" 
                  dataKey="customer" 
                  tick={{ fontSize: 10 }}
                  width={120}
                />
                <ChartTooltip 
                  content={({ active, payload, label }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="rounded-lg border bg-background p-3 shadow-sm">
                          <p className="font-medium">{label}</p>
                          <p className="text-sm">
                            <span className="font-medium text-green-600">Revenue:</span> {formatCurrencyPHP(Number(payload[0]?.value || 0))}
                          </p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar dataKey="revenue" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
