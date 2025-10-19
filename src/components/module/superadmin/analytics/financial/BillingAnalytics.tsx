"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
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
import { BillingAnalytics } from "@/lib/actions/superadmin/analytics/financial";
import { AlertTriangle, TrendingUp, DollarSign, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

interface BillingAnalyticsProps {
  data: BillingAnalytics;
}

const STATUS_COLORS: Record<string, string> = {
  PAID: "#10b981", // green
  SENT: "#3b82f6", // blue
  DRAFT: "#6b7280", // gray
  OVERDUE: "#ef4444", // red
  CANCELLED: "#64748b", // slate
};

const AGING_COLORS = {
  current: "#10b981", // green
  days30: "#3b82f6", // blue
  days60: "#f59e0b", // amber
  days90: "#f97316", // orange
  days90Plus: "#ef4444", // red
};

export function BillingAnalyticsComponent({ data }: BillingAnalyticsProps) {
  const collectionHealthy = data.collectionRate >= 80;

  // Aging data for chart
  const agingData = [
    { name: "Current", value: data.agingReport.current, label: "Not due" },
    { name: "1-30 Days", value: data.agingReport.days30, label: "Overdue" },
    { name: "31-60 Days", value: data.agingReport.days60, label: "Overdue" },
    { name: "61-90 Days", value: data.agingReport.days90, label: "Overdue" },
    { name: "90+ Days", value: data.agingReport.days90Plus, label: "Critical" },
  ];

  return (
    <div className="space-y-4">
      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Total Outstanding</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600">
              ${data.totalOutstanding.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Unpaid invoices</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Overdue Amount</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              ${data.overdueAmount.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Past due date</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Paid This Month</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              ${data.paidThisMonth.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Collections</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Collection Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.collectionRate}%</div>
            <div className="mt-1">
              {collectionHealthy ? (
                <Badge variant="default" className="gap-1 bg-green-600">
                  <TrendingUp className="h-3 w-3" />
                  Healthy
                </Badge>
              ) : (
                <Badge variant="destructive" className="gap-1">
                  <AlertTriangle className="h-3 w-3" />
                  Needs Attention
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Additional Metrics */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Avg Days to Payment</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold flex items-center gap-2">
              <Clock className="h-6 w-6 text-blue-600" />
              {data.avgDaysToPayment} days
            </div>
            <p className="text-xs text-muted-foreground mt-1">Average collection time</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Collection Progress</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Collection Rate</span>
                <span className="font-bold">{data.collectionRate}%</span>
              </div>
              <Progress value={data.collectionRate} className="h-2" />
              <p className="text-xs text-muted-foreground">Target: 80%+</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Invoices by Status */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Invoices by Status</CardTitle>
            <CardDescription>Count and value distribution</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={data.invoicesByStatus}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="status" className="text-xs" />
                <YAxis className="text-xs" />
                <Tooltip
                  content={({ active, payload }) => {
                    if (!active || !payload || !payload.length) return null;
                    return (
                      <div className="rounded-lg border bg-background p-3 shadow-md">
                        <p className="text-sm font-medium mb-1">{payload[0].payload.status}</p>
                        <p className="text-sm">Count: {payload[0].payload.count}</p>
                        <p className="text-sm">Amount: ${payload[0].value?.toLocaleString()}</p>
                      </div>
                    );
                  }}
                />
                <Bar dataKey="amount" radius={[4, 4, 0, 0]}>
                  {data.invoicesByStatus.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={STATUS_COLORS[entry.status] || "#6b7280"} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Invoice Count by Status</CardTitle>
            <CardDescription>Distribution breakdown</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={data.invoicesByStatus}
                  dataKey="count"
                  nameKey="status"
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  label={({ status, count }) => `${status}: ${count}`}
                >
                  {data.invoicesByStatus.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={STATUS_COLORS[entry.status] || "#6b7280"} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Aging Report */}
      <Card>
        <CardHeader>
          <CardTitle>Accounts Receivable Aging</CardTitle>
          <CardDescription>Outstanding invoices by age</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={agingData}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis dataKey="name" className="text-xs" />
              <YAxis
                className="text-xs"
                tickFormatter={(value) => `$${(value / 1000).toFixed(0)}K`}
              />
              <Tooltip
                content={({ active, payload }) => {
                  if (!active || !payload || !payload.length) return null;
                  return (
                    <div className="rounded-lg border bg-background p-3 shadow-md">
                      <p className="text-sm font-medium mb-1">{payload[0].payload.name}</p>
                      <p className="text-sm">Amount: ${payload[0].value?.toLocaleString()}</p>
                      <p className="text-sm text-muted-foreground">{payload[0].payload.label}</p>
                    </div>
                  );
                }}
              />
              <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                {agingData.map((entry, index) => {
                  const colors = Object.values(AGING_COLORS);
                  return <Cell key={`cell-${index}`} fill={colors[index]} />;
                })}
              </Bar>
            </BarChart>
          </ResponsiveContainer>

          {/* Aging Summary Table */}
          <div className="mt-4 grid grid-cols-5 gap-2">
            {agingData.map((item, index) => (
              <div
                key={index}
                className="p-3 rounded-lg border"
                style={{
                  borderColor: Object.values(AGING_COLORS)[index],
                  backgroundColor: `${Object.values(AGING_COLORS)[index]}10`,
                }}
              >
                <p className="text-xs font-medium mb-1">{item.name}</p>
                <p className="text-lg font-bold">${(item.value / 1000).toFixed(0)}K</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Overdue Alert */}
      {data.overdueAmount > 0 && (
        <Card className="border-red-200 bg-red-50 dark:bg-red-950">
          <CardHeader>
            <CardTitle className="text-red-900 dark:text-red-100 flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Overdue Invoices Alert
            </CardTitle>
            <CardDescription className="text-red-800 dark:text-red-200">
              ${data.overdueAmount.toLocaleString()} in overdue invoices requires collection action
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-3">
              <div className="p-3 bg-white dark:bg-gray-900 rounded-md">
                <p className="text-sm font-medium mb-1">Priority Collection</p>
                <p className="text-2xl font-bold text-red-600">
                  ${(data.agingReport.days90 + data.agingReport.days90Plus).toLocaleString()}
                </p>
                <p className="text-xs text-muted-foreground">60+ days overdue</p>
              </div>
              <div className="p-3 bg-white dark:bg-gray-900 rounded-md">
                <p className="text-sm font-medium mb-1">Follow-up Required</p>
                <p className="text-2xl font-bold text-amber-600">
                  ${data.agingReport.days30.toLocaleString()}
                </p>
                <p className="text-xs text-muted-foreground">1-30 days overdue</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
