"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign, TrendingUp, TrendingDown, Percent, Receipt, AlertCircle } from "lucide-react";
import { FinancialAnalyticsData } from "@/lib/actions/superadmin/analytics/financial";

interface FinancialKPICardsProps {
  data: FinancialAnalyticsData;
}

export function FinancialKPICards({ data }: FinancialKPICardsProps) {
  const kpiItems = [
    {
      title: "Total Revenue",
      value: `$${(data.revenue.total / 1000).toFixed(0)}K`,
      icon: DollarSign,
      description: "Selected period",
      color: "text-blue-600",
      bgColor: "bg-blue-100 dark:bg-blue-900",
    },
    {
      title: "Gross Profit",
      value: `$${(data.profitability.grossProfit / 1000).toFixed(0)}K`,
      icon: TrendingUp,
      description: `${data.profitability.grossMargin}% margin`,
      color: "text-green-600",
      bgColor: "bg-green-100 dark:bg-green-900",
    },
    {
      title: "Total Costs",
      value: `$${(data.costs.total / 1000).toFixed(0)}K`,
      icon: Receipt,
      description: "Material + Labor",
      color: "text-purple-600",
      bgColor: "bg-purple-100 dark:bg-purple-900",
    },
    {
      title: "Net Profit",
      value: `$${(data.profitability.netProfit / 1000).toFixed(0)}K`,
      icon: DollarSign,
      description: `${data.profitability.netMargin}% margin`,
      color: data.profitability.netProfit >= 0 ? "text-emerald-600" : "text-red-600",
      bgColor:
        data.profitability.netProfit >= 0
          ? "bg-emerald-100 dark:bg-emerald-900"
          : "bg-red-100 dark:bg-red-900",
    },
    {
      title: "Outstanding",
      value: `$${(data.billing.totalOutstanding / 1000).toFixed(0)}K`,
      icon: AlertCircle,
      description: "Unpaid invoices",
      color: "text-amber-600",
      bgColor: "bg-amber-100 dark:bg-amber-900",
    },
    {
      title: "Collection Rate",
      value: `${data.billing.collectionRate}%`,
      icon: Percent,
      description: "Payment efficiency",
      color: data.billing.collectionRate >= 80 ? "text-green-600" : "text-red-600",
      bgColor:
        data.billing.collectionRate >= 80
          ? "bg-green-100 dark:bg-green-900"
          : "bg-red-100 dark:bg-red-900",
    },
    {
      title: "30-Day Cash Flow",
      value: `$${Math.abs(data.cashFlow.netCashFlow30 / 1000).toFixed(0)}K`,
      icon: data.cashFlow.netCashFlow30 >= 0 ? TrendingUp : TrendingDown,
      description: data.cashFlow.netCashFlow30 >= 0 ? "Positive" : "Negative",
      color: data.cashFlow.netCashFlow30 >= 0 ? "text-green-600" : "text-red-600",
      bgColor:
        data.cashFlow.netCashFlow30 >= 0
          ? "bg-green-100 dark:bg-green-900"
          : "bg-red-100 dark:bg-red-900",
    },
    {
      title: "Revenue Growth",
      value: `${data.revenue.growth >= 0 ? "+" : ""}${data.revenue.growth}%`,
      icon: data.revenue.growth >= 0 ? TrendingUp : TrendingDown,
      description: "vs last month",
      color: data.revenue.growth >= 0 ? "text-green-600" : "text-red-600",
      bgColor:
        data.revenue.growth >= 0
          ? "bg-green-100 dark:bg-green-900"
          : "bg-red-100 dark:bg-red-900",
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {kpiItems.map((item, index) => {
        const Icon = item.icon;
        return (
          <Card key={index}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{item.title}</CardTitle>
              <div className={`p-2 rounded-lg ${item.bgColor}`}>
                <Icon className={`h-4 w-4 ${item.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{item.value}</div>
              <p className="text-xs text-muted-foreground mt-1">{item.description}</p>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
