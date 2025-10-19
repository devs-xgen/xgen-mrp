"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { format } from "date-fns";
import { RevenueAnalytics } from "@/lib/actions/superadmin/analytics/financial";
import { TrendingUp, TrendingDown } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface RevenueAnalyticsProps {
  data: RevenueAnalytics;
}

const TENANT_COLORS = [
  "#3b82f6", // blue
  "#10b981", // green
  "#f59e0b", // amber
  "#ef4444", // red
  "#8b5cf6", // violet
  "#ec4899", // pink
  "#14b8a6", // teal
  "#f97316", // orange
];

export function RevenueAnalyticsComponent({ data }: RevenueAnalyticsProps) {
  const isGrowthPositive = data.growth >= 0;

  return (
    <div className="space-y-4">
      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${data.total.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground mt-1">Selected period</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">This Month</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${data.thisMonth.toLocaleString()}</div>
            <div className="flex items-center gap-1 mt-1">
              {isGrowthPositive ? (
                <Badge variant="default" className="gap-1 bg-green-600">
                  <TrendingUp className="h-3 w-3" />
                  {data.growth}%
                </Badge>
              ) : (
                <Badge variant="destructive" className="gap-1">
                  <TrendingDown className="h-3 w-3" />
                  {Math.abs(data.growth)}%
                </Badge>
              )}
              <span className="text-xs text-muted-foreground">vs last month</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Avg Order Value</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${data.avgOrderValue.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground mt-1">Per order</p>
          </CardContent>
        </Card>
      </div>

      {/* Revenue Trend Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Revenue Trend</CardTitle>
          <CardDescription>Revenue over time</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={data.trend}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis
                dataKey="date"
                tickFormatter={(date) => format(new Date(date), "MMM dd")}
                className="text-xs"
              />
              <YAxis
                className="text-xs"
                tickFormatter={(value) => `$${(value / 1000).toFixed(0)}K`}
              />
              <Tooltip
                content={({ active, payload }) => {
                  if (!active || !payload || !payload.length) return null;
                  return (
                    <div className="rounded-lg border bg-background p-3 shadow-md">
                      <p className="text-sm font-medium mb-2">
                        {format(new Date(payload[0].payload.date), "MMM dd, yyyy")}
                      </p>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 text-sm">
                          <div className="w-3 h-3 rounded-full bg-blue-500" />
                          <span>Revenue: ${payload[0].value?.toLocaleString()}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <div className="w-3 h-3 rounded-full bg-green-500" />
                          <span>Orders: {payload[0].payload.count}</span>
                        </div>
                      </div>
                    </div>
                  );
                }}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="amount"
                stroke="#3b82f6"
                strokeWidth={2}
                name="Revenue ($)"
                dot={{ fill: "#3b82f6" }}
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Revenue by Tenant & Category */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* By Tenant */}
        <Card>
          <CardHeader>
            <CardTitle>Revenue by Tenant</CardTitle>
            <CardDescription>Distribution across tenants</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={data.byTenant}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="tenantName" className="text-xs" angle={-45} textAnchor="end" height={80} />
                <YAxis
                  className="text-xs"
                  tickFormatter={(value) => `$${(value / 1000).toFixed(0)}K`}
                />
                <Tooltip
                  content={({ active, payload }) => {
                    if (!active || !payload || !payload.length) return null;
                    return (
                      <div className="rounded-lg border bg-background p-3 shadow-md">
                        <p className="text-sm font-medium mb-1">{payload[0].payload.tenantName}</p>
                        <p className="text-sm">Revenue: ${payload[0].value?.toLocaleString()}</p>
                        <p className="text-sm text-muted-foreground">
                          {payload[0].payload.orderCount} orders
                        </p>
                      </div>
                    );
                  }}
                />
                <Bar dataKey="revenue" radius={[4, 4, 0, 0]}>
                  {data.byTenant.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={TENANT_COLORS[index % TENANT_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* By Product Category */}
        <Card>
          <CardHeader>
            <CardTitle>Revenue by Category</CardTitle>
            <CardDescription>Product category breakdown</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={data.byProductCategory}
                  dataKey="revenue"
                  nameKey="category"
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  label={({ category, revenue }) =>
                    `${category}: $${(revenue / 1000).toFixed(0)}K`
                  }
                >
                  {data.byProductCategory.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={TENANT_COLORS[index % TENANT_COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip
                  content={({ active, payload }) => {
                    if (!active || !payload || !payload.length) return null;
                    return (
                      <div className="rounded-lg border bg-background p-3 shadow-md">
                        <p className="text-sm font-medium mb-1">{payload[0].name}</p>
                        <p className="text-sm">Revenue: ${payload[0].value?.toLocaleString()}</p>
                        <p className="text-sm text-muted-foreground">
                          {payload[0].payload.orderCount} orders
                        </p>
                      </div>
                    );
                  }}
                />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
