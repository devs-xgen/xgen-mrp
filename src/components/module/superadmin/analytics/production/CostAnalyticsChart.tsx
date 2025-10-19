"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { CostAnalysis } from "@/lib/actions/superadmin/analytics/production";
import { TrendingUp, TrendingDown, DollarSign, AlertCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface CostAnalyticsChartProps {
  costData: CostAnalysis;
}

export function CostAnalyticsChart({ costData }: CostAnalyticsChartProps) {
  const isOverBudget = costData.variance > 0;
  const varianceIcon = isOverBudget ? TrendingUp : TrendingDown;
  const varianceColor = isOverBudget ? "text-red-600" : "text-green-600";
  const varianceBgColor = isOverBudget
    ? "bg-red-100 dark:bg-red-900"
    : "bg-green-100 dark:bg-green-900";

  // Summary data for planned vs actual
  const summaryData = [
    {
      name: "Planned",
      value: costData.totalPlannedCost,
    },
    {
      name: "Actual",
      value: costData.totalActualCost,
    },
  ];

  // Top 10 products by cost per unit
  const topProducts = [...costData.byProduct]
    .sort((a, b) => b.avgCostPerUnit - a.avgCostPerUnit)
    .slice(0, 10);

  return (
    <div className="space-y-4">
      {/* Cost Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Planned Cost</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${costData.totalPlannedCost.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Budgeted amount</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Actual Cost</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${costData.totalActualCost.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Spent amount</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Variance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${varianceColor}`}>
              ${Math.abs(costData.variance).toLocaleString()}
            </div>
            <div className="flex items-center gap-1 mt-1">
              {isOverBudget ? (
                <Badge variant="destructive" className="gap-1">
                  <TrendingUp className="h-3 w-3" />
                  Over Budget
                </Badge>
              ) : (
                <Badge variant="default" className="gap-1 bg-green-600">
                  <TrendingDown className="h-3 w-3" />
                  Under Budget
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Variance %</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${varianceColor}`}>
              {Math.abs(costData.variancePercentage)}%
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {isOverBudget ? "Above" : "Below"} planned
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Planned vs Actual Bar Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Planned vs Actual Costs</CardTitle>
          <CardDescription>Overall cost comparison</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={summaryData}>
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
                      <p className="text-sm">${Number(payload[0].value).toLocaleString()}</p>
                    </div>
                  );
                }}
              />
              <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                {summaryData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={index === 0 ? "#3b82f6" : "#10b981"} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Cost Per Unit by Product */}
      <Card>
        <CardHeader>
          <CardTitle>Average Cost Per Unit by Product</CardTitle>
          <CardDescription>Top 10 products by unit cost</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={topProducts} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis type="number" className="text-xs" />
              <YAxis
                dataKey="productSKU"
                type="category"
                width={100}
                className="text-xs"
              />
              <Tooltip
                content={({ active, payload }) => {
                  if (!active || !payload || !payload.length) return null;
                  return (
                    <div className="rounded-lg border bg-background p-3 shadow-md">
                      <p className="text-sm font-medium mb-2">{payload[0].payload.productName}</p>
                      <div className="space-y-1 text-sm">
                        <p>SKU: {payload[0].payload.productSKU}</p>
                        <p>Avg Cost/Unit: ${payload[0].value?.toLocaleString()}</p>
                        <p>Total Produced: {payload[0].payload.totalProduced}</p>
                      </div>
                    </div>
                  );
                }}
              />
              <Bar dataKey="avgCostPerUnit" fill="#f59e0b" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Variance Alert */}
      {Math.abs(costData.variancePercentage) > 15 && (
        <Card className="border-amber-200 bg-amber-50 dark:bg-amber-950">
          <CardHeader>
            <CardTitle className="text-amber-900 dark:text-amber-100 flex items-center gap-2">
              <AlertCircle className="h-5 w-5" />
              Cost Variance Alert
            </CardTitle>
            <CardDescription className="text-amber-800 dark:text-amber-200">
              {isOverBudget
                ? `Production costs are ${Math.abs(costData.variancePercentage)}% over budget`
                : `Production costs are ${Math.abs(costData.variancePercentage)}% under budget`}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between p-3 bg-white dark:bg-gray-900 rounded-md">
              <div>
                <p className="text-sm font-medium">Total Variance</p>
                <p className="text-xs text-muted-foreground">
                  {isOverBudget ? "Additional" : "Savings"} amount
                </p>
              </div>
              <div className={`text-xl font-bold ${varianceColor}`}>
                ${Math.abs(costData.variance).toLocaleString()}
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
