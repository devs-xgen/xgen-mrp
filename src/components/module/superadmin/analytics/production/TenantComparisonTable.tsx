"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { TenantComparison } from "@/lib/actions/superadmin/analytics/production";
import { Trophy, TrendingUp, TrendingDown, Clock, Target } from "lucide-react";

interface TenantComparisonTableProps {
  tenants: TenantComparison[];
}

export function TenantComparisonTable({ tenants }: TenantComparisonTableProps) {
  if (tenants.length === 0) {
    return null; // Don't render if tenant filter is applied
  }

  // Sort by total orders descending (already sorted from server)
  const sortedTenants = [...tenants];

  // Calculate averages for comparison
  const avgCompletionRate =
    tenants.length > 0
      ? Math.round(
          tenants.reduce((sum, t) => sum + t.completionRate, 0) / tenants.length
        )
      : 0;
  const avgCycleTime =
    tenants.length > 0
      ? Math.round(
          tenants.reduce((sum, t) => sum + t.avgCycleTimeDays, 0) / tenants.length
        )
      : 0;
  const avgOnTimeRate =
    tenants.length > 0
      ? Math.round(tenants.reduce((sum, t) => sum + t.onTimeRate, 0) / tenants.length)
      : 0;

  const getRankBadge = (index: number) => {
    if (index === 0)
      return (
        <Badge variant="default" className="gap-1 bg-yellow-500">
          <Trophy className="h-3 w-3" />
          #1
        </Badge>
      );
    if (index === 1)
      return (
        <Badge variant="secondary" className="gap-1">
          <Trophy className="h-3 w-3" />
          #2
        </Badge>
      );
    if (index === 2)
      return (
        <Badge variant="outline" className="gap-1">
          <Trophy className="h-3 w-3" />
          #3
        </Badge>
      );
    return <Badge variant="outline">#{index + 1}</Badge>;
  };

  const getComparisonIndicator = (value: number, avg: number, higher: boolean) => {
    const isGood = higher ? value > avg : value < avg;
    if (value === avg) return null;
    return isGood ? (
      <TrendingUp className="h-3 w-3 text-green-600" />
    ) : (
      <TrendingDown className="h-3 w-3 text-red-600" />
    );
  };

  return (
    <div className="space-y-4">
      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Total Tenants</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{tenants.length}</div>
            <p className="text-xs text-muted-foreground mt-1">Active tenants</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Avg Completion Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{avgCompletionRate}%</div>
            <p className="text-xs text-muted-foreground mt-1">Across all tenants</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Avg Cycle Time</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{avgCycleTime}d</div>
            <p className="text-xs text-muted-foreground mt-1">Average days</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Avg On-Time Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{avgOnTimeRate}%</div>
            <p className="text-xs text-muted-foreground mt-1">Delivery performance</p>
          </CardContent>
        </Card>
      </div>

      {/* Tenant Comparison Table */}
      <Card>
        <CardHeader>
          <CardTitle>Tenant Performance Comparison</CardTitle>
          <CardDescription>
            Side-by-side performance metrics across all tenants
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">Rank</TableHead>
                  <TableHead>Tenant</TableHead>
                  <TableHead className="text-right">Total Orders</TableHead>
                  <TableHead className="text-right">Completed</TableHead>
                  <TableHead className="text-right">Completion %</TableHead>
                  <TableHead className="text-right">Avg Cycle Time</TableHead>
                  <TableHead className="text-right">On-Time %</TableHead>
                  <TableHead className="text-right">Total Value</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedTenants.length > 0 ? (
                  sortedTenants.map((tenant, index) => (
                    <TableRow key={tenant.tenantId}>
                      <TableCell>{getRankBadge(index)}</TableCell>
                      <TableCell>
                        <span className="font-medium">{tenant.tenantName}</span>
                      </TableCell>
                      <TableCell className="text-right">
                        <span className="font-mono">{tenant.totalOrders}</span>
                      </TableCell>
                      <TableCell className="text-right">
                        <span className="font-mono">{tenant.completedOrders}</span>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <span className="font-mono font-medium">
                            {tenant.completionRate}%
                          </span>
                          {getComparisonIndicator(
                            tenant.completionRate,
                            avgCompletionRate,
                            true
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <span className="font-mono">{tenant.avgCycleTimeDays}d</span>
                          {getComparisonIndicator(
                            tenant.avgCycleTimeDays,
                            avgCycleTime,
                            false
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <span className="font-mono font-medium">
                            {tenant.onTimeRate}%
                          </span>
                          {getComparisonIndicator(tenant.onTimeRate, avgOnTimeRate, true)}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <span className="font-mono">${tenant.totalValue.toLocaleString()}</span>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={8} className="h-24 text-center">
                      No tenant data available.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Top Performer Highlight */}
      {sortedTenants.length > 0 && (
        <Card className="border-yellow-200 bg-yellow-50 dark:bg-yellow-950">
          <CardHeader>
            <CardTitle className="text-yellow-900 dark:text-yellow-100 flex items-center gap-2">
              <Trophy className="h-5 w-5" />
              Top Performer
            </CardTitle>
            <CardDescription className="text-yellow-800 dark:text-yellow-200">
              Highest production volume
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-3 gap-4">
              <div className="p-3 bg-white dark:bg-gray-900 rounded-md">
                <p className="text-sm font-medium mb-1">{sortedTenants[0].tenantName}</p>
                <p className="text-2xl font-bold">{sortedTenants[0].totalOrders}</p>
                <p className="text-xs text-muted-foreground">Total Orders</p>
              </div>
              <div className="p-3 bg-white dark:bg-gray-900 rounded-md">
                <p className="text-sm font-medium mb-1">Completion Rate</p>
                <p className="text-2xl font-bold text-green-600">
                  {sortedTenants[0].completionRate}%
                </p>
                <p className="text-xs text-muted-foreground">
                  {sortedTenants[0].completedOrders} completed
                </p>
              </div>
              <div className="p-3 bg-white dark:bg-gray-900 rounded-md">
                <p className="text-sm font-medium mb-1">Total Value</p>
                <p className="text-2xl font-bold text-blue-600">
                  ${sortedTenants[0].totalValue.toLocaleString()}
                </p>
                <p className="text-xs text-muted-foreground">Production value</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
