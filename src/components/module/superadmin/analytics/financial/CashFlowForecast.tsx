"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { CashFlowForecast } from "@/lib/actions/superadmin/analytics/financial";
import { TrendingUp, TrendingDown, AlertCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface CashFlowForecastProps {
  data: CashFlowForecast;
}

export function CashFlowForecastComponent({ data }: CashFlowForecastProps) {
  // Chart data
  const forecastData = [
    {
      period: "30 Days",
      revenue: data.projectedRevenue30,
      costs: data.projectedCosts30,
      netCashFlow: data.netCashFlow30,
    },
    {
      period: "60 Days",
      revenue: data.projectedRevenue60,
      costs: data.projectedCosts60,
      netCashFlow: data.netCashFlow60,
    },
    {
      period: "90 Days",
      revenue: data.projectedRevenue90,
      costs: data.projectedCosts90,
      netCashFlow: data.netCashFlow90,
    },
  ];

  const is30DaysPositive = data.netCashFlow30 >= 0;
  const is60DaysPositive = data.netCashFlow60 >= 0;
  const is90DaysPositive = data.netCashFlow90 >= 0;

  const getCashFlowBadge = (amount: number) => {
    if (amount >= 0) {
      return (
        <Badge variant="default" className="gap-1 bg-green-600">
          <TrendingUp className="h-3 w-3" />
          Positive
        </Badge>
      );
    }
    return (
      <Badge variant="destructive" className="gap-1">
        <TrendingDown className="h-3 w-3" />
        Negative
      </Badge>
    );
  };

  return (
    <div className="space-y-4">
      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">30-Day Forecast</CardTitle>
          </CardHeader>
          <CardContent>
            <div
              className={`text-2xl font-bold ${
                is30DaysPositive ? "text-green-600" : "text-red-600"
              }`}
            >
              ${Math.abs(data.netCashFlow30).toLocaleString()}
            </div>
            <div className="mt-1">{getCashFlowBadge(data.netCashFlow30)}</div>
            <div className="mt-2 text-xs space-y-1">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Revenue:</span>
                <span className="font-medium">${data.projectedRevenue30.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Costs:</span>
                <span className="font-medium">${data.projectedCosts30.toLocaleString()}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">60-Day Forecast</CardTitle>
          </CardHeader>
          <CardContent>
            <div
              className={`text-2xl font-bold ${
                is60DaysPositive ? "text-green-600" : "text-red-600"
              }`}
            >
              ${Math.abs(data.netCashFlow60).toLocaleString()}
            </div>
            <div className="mt-1">{getCashFlowBadge(data.netCashFlow60)}</div>
            <div className="mt-2 text-xs space-y-1">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Revenue:</span>
                <span className="font-medium">${data.projectedRevenue60.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Costs:</span>
                <span className="font-medium">${data.projectedCosts60.toLocaleString()}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">90-Day Forecast</CardTitle>
          </CardHeader>
          <CardContent>
            <div
              className={`text-2xl font-bold ${
                is90DaysPositive ? "text-green-600" : "text-red-600"
              }`}
            >
              ${Math.abs(data.netCashFlow90).toLocaleString()}
            </div>
            <div className="mt-1">{getCashFlowBadge(data.netCashFlow90)}</div>
            <div className="mt-2 text-xs space-y-1">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Revenue:</span>
                <span className="font-medium">${data.projectedRevenue90.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Costs:</span>
                <span className="font-medium">${data.projectedCosts90.toLocaleString()}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Cash Flow Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Net Cash Flow Forecast</CardTitle>
          <CardDescription>Projected cash flow over time</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={forecastData}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis dataKey="period" className="text-xs" />
              <YAxis
                className="text-xs"
                tickFormatter={(value) => `$${(value / 1000).toFixed(0)}K`}
              />
              <Tooltip
                content={({ active, payload }) => {
                  if (!active || !payload || !payload.length) return null;
                  const data = payload[0].payload;
                  return (
                    <div className="rounded-lg border bg-background p-3 shadow-md">
                      <p className="text-sm font-medium mb-2">{data.period}</p>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 text-sm">
                          <div className="w-3 h-3 rounded-full bg-blue-500" />
                          <span>Revenue: ${data.revenue.toLocaleString()}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <div className="w-3 h-3 rounded-full bg-red-500" />
                          <span>Costs: ${data.costs.toLocaleString()}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <div className="w-3 h-3 rounded-full bg-green-500" />
                          <span>Net: ${data.netCashFlow.toLocaleString()}</span>
                        </div>
                      </div>
                    </div>
                  );
                }}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="netCashFlow"
                stroke="#10b981"
                strokeWidth={2}
                name="Net Cash Flow"
                dot={{ fill: "#10b981" }}
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Revenue vs Costs Comparison */}
      <Card>
        <CardHeader>
          <CardTitle>Projected Revenue vs Costs</CardTitle>
          <CardDescription>Comparison over forecast periods</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={forecastData}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis dataKey="period" className="text-xs" />
              <YAxis
                className="text-xs"
                tickFormatter={(value) => `$${(value / 1000).toFixed(0)}K`}
              />
              <Tooltip
                content={({ active, payload }) => {
                  if (!active || !payload || !payload.length) return null;
                  return (
                    <div className="rounded-lg border bg-background p-3 shadow-md">
                      <p className="text-sm font-medium mb-2">{payload[0].payload.period}</p>
                      <div className="space-y-1">
                        <p className="text-sm">
                          Revenue: ${payload[0].payload.revenue.toLocaleString()}
                        </p>
                        <p className="text-sm">
                          Costs: ${payload[0].payload.costs.toLocaleString()}
                        </p>
                        <p className="text-sm font-medium">
                          Net: ${payload[0].payload.netCashFlow.toLocaleString()}
                        </p>
                      </div>
                    </div>
                  );
                }}
              />
              <Legend />
              <Bar dataKey="revenue" fill="#3b82f6" radius={[4, 4, 0, 0]} name="Projected Revenue" />
              <Bar dataKey="costs" fill="#ef4444" radius={[4, 4, 0, 0]} name="Projected Costs" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Cash Flow Warning */}
      {(!is30DaysPositive || !is60DaysPositive || !is90DaysPositive) && (
        <Card className="border-amber-200 bg-amber-50 dark:bg-amber-950">
          <CardHeader>
            <CardTitle className="text-amber-900 dark:text-amber-100 flex items-center gap-2">
              <AlertCircle className="h-5 w-5" />
              Cash Flow Alert
            </CardTitle>
            <CardDescription className="text-amber-800 dark:text-amber-200">
              Negative cash flow projected in upcoming periods
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {!is30DaysPositive && (
                <div className="flex items-center justify-between p-3 bg-white dark:bg-gray-900 rounded-md">
                  <div>
                    <p className="font-medium text-sm">30-Day Period</p>
                    <p className="text-xs text-muted-foreground">
                      Revenue shortfall: ${Math.abs(data.netCashFlow30).toLocaleString()}
                    </p>
                  </div>
                  <Badge variant="destructive">Deficit</Badge>
                </div>
              )}
              {!is60DaysPositive && (
                <div className="flex items-center justify-between p-3 bg-white dark:bg-gray-900 rounded-md">
                  <div>
                    <p className="font-medium text-sm">60-Day Period</p>
                    <p className="text-xs text-muted-foreground">
                      Revenue shortfall: ${Math.abs(data.netCashFlow60).toLocaleString()}
                    </p>
                  </div>
                  <Badge variant="destructive">Deficit</Badge>
                </div>
              )}
              {!is90DaysPositive && (
                <div className="flex items-center justify-between p-3 bg-white dark:bg-gray-900 rounded-md">
                  <div>
                    <p className="font-medium text-sm">90-Day Period</p>
                    <p className="text-xs text-muted-foreground">
                      Revenue shortfall: ${Math.abs(data.netCashFlow90).toLocaleString()}
                    </p>
                  </div>
                  <Badge variant="destructive">Deficit</Badge>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
