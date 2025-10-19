"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, UserCheck, UserX, Activity, Clock, Award } from "lucide-react";
import { UserAnalyticsData } from "@/lib/actions/superadmin/analytics/user";

interface UserAnalyticsKPICardsProps {
  data: UserAnalyticsData;
}

export function UserAnalyticsKPICards({ data }: UserAnalyticsKPICardsProps) {
  const activeRate =
    data.activeUsers.total > 0
      ? Math.round((data.activeUsers.monthly / data.activeUsers.total) * 100)
      : 0;

  const avgWorkerScore =
    data.workerPerformance.length > 0
      ? Math.round(
          data.workerPerformance.reduce((sum, w) => sum + w.efficiencyScore, 0) /
            data.workerPerformance.length
        )
      : 0;

  const avgApprovalRate =
    data.inspectorPerformance.length > 0
      ? Math.round(
          data.inspectorPerformance.reduce((sum, i) => sum + i.approvalRate, 0) /
            data.inspectorPerformance.length
        )
      : 0;

  const kpiItems = [
    {
      title: "Total Users",
      value: data.activeUsers.total.toLocaleString(),
      icon: Users,
      description: "All registered users",
      color: "text-blue-600",
      bgColor: "bg-blue-100 dark:bg-blue-900",
    },
    {
      title: "Daily Active",
      value: data.activeUsers.daily.toLocaleString(),
      icon: Activity,
      description: "Last 24 hours",
      color: "text-green-600",
      bgColor: "bg-green-100 dark:bg-green-900",
    },
    {
      title: "Monthly Active",
      value: data.activeUsers.monthly.toLocaleString(),
      icon: UserCheck,
      description: `${activeRate}% of total`,
      color: "text-emerald-600",
      bgColor: "bg-emerald-100 dark:bg-emerald-900",
    },
    {
      title: "Inactive Accounts",
      value: data.inactiveAccounts.length.toLocaleString(),
      icon: UserX,
      description: "30+ days no login",
      color: "text-red-600",
      bgColor: "bg-red-100 dark:bg-red-900",
    },
    {
      title: "Active Workers",
      value: data.workerPerformance.length.toLocaleString(),
      icon: Users,
      description: "With completed tasks",
      color: "text-purple-600",
      bgColor: "bg-purple-100 dark:bg-purple-900",
    },
    {
      title: "Avg Worker Score",
      value: avgWorkerScore.toLocaleString(),
      icon: Award,
      description: "Efficiency score",
      color: "text-amber-600",
      bgColor: "bg-amber-100 dark:bg-amber-900",
    },
    {
      title: "Active Inspectors",
      value: data.inspectorPerformance.length.toLocaleString(),
      icon: Users,
      description: "With inspections",
      color: "text-teal-600",
      bgColor: "bg-teal-100 dark:bg-teal-900",
    },
    {
      title: "Avg Approval Rate",
      value: `${avgApprovalRate}%`,
      icon: Clock,
      description: "Inspector approval",
      color: avgApprovalRate >= 80 ? "text-green-600" : "text-amber-600",
      bgColor:
        avgApprovalRate >= 80
          ? "bg-green-100 dark:bg-green-900"
          : "bg-amber-100 dark:bg-amber-900",
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
