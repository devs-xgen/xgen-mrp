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
import { Progress } from "@/components/ui/progress";
import { WorkCenterUtilization } from "@/lib/actions/superadmin/analytics/production";
import { Activity, TrendingUp, AlertTriangle } from "lucide-react";

interface EfficiencyMetricsProps {
  workCenterData: WorkCenterUtilization[];
}

export function EfficiencyMetrics({ workCenterData }: EfficiencyMetricsProps) {
  // Sort by utilization rate descending
  const sortedData = [...workCenterData].sort(
    (a, b) => b.utilizationRate - a.utilizationRate
  );

  // Identify bottlenecks (high utilization)
  const bottlenecks = sortedData.filter((wc) => wc.utilizationRate >= 90);
  const avgUtilization =
    workCenterData.length > 0
      ? Math.round(
          workCenterData.reduce((sum, wc) => sum + wc.utilizationRate, 0) /
            workCenterData.length
        )
      : 0;

  const getUtilizationColor = (rate: number) => {
    if (rate >= 90) return "text-red-600";
    if (rate >= 70) return "text-amber-600";
    if (rate >= 50) return "text-green-600";
    return "text-gray-600";
  };

  const getUtilizationBadge = (rate: number) => {
    if (rate >= 90)
      return (
        <Badge variant="destructive" className="gap-1">
          <AlertTriangle className="h-3 w-3" />
          Critical
        </Badge>
      );
    if (rate >= 70)
      return (
        <Badge variant="secondary" className="gap-1">
          <TrendingUp className="h-3 w-3" />
          High
        </Badge>
      );
    if (rate >= 50)
      return (
        <Badge variant="default" className="gap-1">
          <Activity className="h-3 w-3" />
          Moderate
        </Badge>
      );
    return <Badge variant="outline">Low</Badge>;
  };

  return (
    <div className="space-y-4">
      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Total Work Centers</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{workCenterData.length}</div>
            <p className="text-xs text-muted-foreground mt-1">Active work centers</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Average Utilization</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{avgUtilization}%</div>
            <Progress value={avgUtilization} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Bottlenecks</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{bottlenecks.length}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Work centers at {">"}90% capacity
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Work Center Table */}
      <Card>
        <CardHeader>
          <CardTitle>Work Center Utilization</CardTitle>
          <CardDescription>
            Real-time capacity and workload by work center
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Work Center</TableHead>
                  <TableHead>Tenant</TableHead>
                  <TableHead className="text-right">Capacity</TableHead>
                  <TableHead className="text-right">Active Ops</TableHead>
                  <TableHead className="text-right">Utilization</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedData.length > 0 ? (
                  sortedData.map((wc) => (
                    <TableRow key={wc.workCenterId}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{wc.name}</div>
                          {wc.description && (
                            <div className="text-xs text-muted-foreground line-clamp-1">
                              {wc.description}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm">{wc.tenantName || "N/A"}</span>
                      </TableCell>
                      <TableCell className="text-right">
                        <span className="font-mono text-sm">{wc.capacity}</span>
                      </TableCell>
                      <TableCell className="text-right">
                        <span className="font-mono text-sm font-medium">
                          {wc.activeOperations}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex flex-col items-end gap-1">
                          <span
                            className={`font-mono text-sm font-bold ${getUtilizationColor(
                              wc.utilizationRate
                            )}`}
                          >
                            {wc.utilizationRate}%
                          </span>
                          <Progress value={wc.utilizationRate} className="h-1.5 w-16" />
                        </div>
                      </TableCell>
                      <TableCell>{getUtilizationBadge(wc.utilizationRate)}</TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} className="h-24 text-center">
                      No work center data available.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Bottlenecks Alert */}
      {bottlenecks.length > 0 && (
        <Card className="border-red-200 bg-red-50 dark:bg-red-950">
          <CardHeader>
            <CardTitle className="text-red-900 dark:text-red-100 flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Bottleneck Alert
            </CardTitle>
            <CardDescription className="text-red-800 dark:text-red-200">
              {bottlenecks.length} work center{bottlenecks.length > 1 ? "s" : ""} at critical
              capacity
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {bottlenecks.map((wc) => (
                <div
                  key={wc.workCenterId}
                  className="flex items-center justify-between p-2 bg-white dark:bg-gray-900 rounded-md"
                >
                  <div>
                    <p className="font-medium text-sm">{wc.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {wc.activeOperations} / {wc.capacity} operations
                    </p>
                  </div>
                  <Badge variant="destructive">{wc.utilizationRate}%</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
