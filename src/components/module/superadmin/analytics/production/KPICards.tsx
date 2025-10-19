"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  TrendingUp,
  TrendingDown,
  Package,
  Play,
  CheckCircle2,
  Clock,
  DollarSign,
  Target,
} from "lucide-react";
import { KPIMetrics } from "@/lib/actions/superadmin/analytics/production";

interface KPICardsProps {
  metrics: KPIMetrics;
}

export function KPICards({ metrics }: KPICardsProps) {
  const kpiItems = [
    {
      title: "Total Orders",
      value: metrics.totalOrders.toLocaleString(),
      icon: Package,
      description: "All production orders",
      color: "text-blue-600",
      bgColor: "bg-blue-100 dark:bg-blue-900",
    },
    {
      title: "Active Orders",
      value: metrics.activeOrders.toLocaleString(),
      icon: Play,
      description: "Pending & In Progress",
      color: "text-orange-600",
      bgColor: "bg-orange-100 dark:bg-orange-900",
    },
    {
      title: "Completed",
      value: metrics.completedThisMonth.toLocaleString(),
      icon: CheckCircle2,
      description: "In selected period",
      color: "text-green-600",
      bgColor: "bg-green-100 dark:bg-green-900",
    },
    {
      title: "Avg Cycle Time",
      value: `${metrics.avgCompletionTimeDays}d`,
      icon: Clock,
      description: "Average completion time",
      color: "text-purple-600",
      bgColor: "bg-purple-100 dark:bg-purple-900",
    },
    {
      title: "Total Value",
      value: `$${(metrics.totalValue / 1000).toFixed(1)}K`,
      icon: DollarSign,
      description: "Production value",
      color: "text-emerald-600",
      bgColor: "bg-emerald-100 dark:bg-emerald-900",
    },
    {
      title: "On-Time Rate",
      value: `${metrics.onTimeRate}%`,
      icon: Target,
      description: "Delivered on time",
      color: metrics.onTimeRate >= 80 ? "text-green-600" : "text-amber-600",
      bgColor:
        metrics.onTimeRate >= 80
          ? "bg-green-100 dark:bg-green-900"
          : "bg-amber-100 dark:bg-amber-900",
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
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
