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
import { WorkerPerformance, InspectorPerformance } from "@/lib/actions/superadmin/analytics/user";
import { Award, TrendingUp, Target, CheckCircle2 } from "lucide-react";

interface PerformanceMetricsProps {
  workerPerformance: WorkerPerformance[];
  inspectorPerformance: InspectorPerformance[];
}

export function PerformanceMetrics({
  workerPerformance,
  inspectorPerformance,
}: PerformanceMetricsProps) {
  const getEfficiencyBadge = (score: number) => {
    if (score >= 80) {
      return (
        <Badge variant="default" className="gap-1 bg-green-600">
          <Award className="h-3 w-3" />
          Excellent
        </Badge>
      );
    }
    if (score >= 60) {
      return (
        <Badge variant="default" className="gap-1 bg-blue-600">
          <TrendingUp className="h-3 w-3" />
          Good
        </Badge>
      );
    }
    if (score >= 40) {
      return <Badge variant="secondary">Average</Badge>;
    }
    return <Badge variant="outline">Needs Improvement</Badge>;
  };

  const getApprovalBadge = (rate: number) => {
    if (rate >= 90) {
      return (
        <Badge variant="default" className="gap-1 bg-green-600">
          <CheckCircle2 className="h-3 w-3" />
          Excellent
        </Badge>
      );
    }
    if (rate >= 75) {
      return <Badge variant="default">Good</Badge>;
    }
    if (rate >= 60) {
      return <Badge variant="secondary">Fair</Badge>;
    }
    return <Badge variant="destructive">Low</Badge>;
  };

  return (
    <div className="space-y-4">
      {/* Worker Performance */}
      <Card>
        <CardHeader>
          <CardTitle>Worker Performance</CardTitle>
          <CardDescription>
            Task completion and efficiency metrics (Sorted by efficiency score)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">#</TableHead>
                  <TableHead>Worker</TableHead>
                  <TableHead>Tenant</TableHead>
                  <TableHead className="text-right">Tasks</TableHead>
                  <TableHead className="text-right">Operations</TableHead>
                  <TableHead className="text-right">Materials</TableHead>
                  <TableHead className="text-right">Avg Time</TableHead>
                  <TableHead className="text-right">Efficiency</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {workerPerformance.length > 0 ? (
                  workerPerformance.map((worker, index) => (
                    <TableRow key={worker.workerId}>
                      <TableCell className="font-medium">{index + 1}</TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{worker.name}</div>
                          <div className="text-xs text-muted-foreground">{worker.email}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm">{worker.tenantName || "N/A"}</span>
                      </TableCell>
                      <TableCell className="text-right font-mono">
                        {worker.tasksCompleted}
                      </TableCell>
                      <TableCell className="text-right font-mono">
                        {worker.operationsCompleted}
                      </TableCell>
                      <TableCell className="text-right font-mono">
                        {worker.materialsConsumed}
                      </TableCell>
                      <TableCell className="text-right font-mono">
                        {worker.avgTaskTime}h
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex flex-col items-end gap-1">
                          <span className="font-mono font-bold text-sm">
                            {worker.efficiencyScore}
                          </span>
                          <Progress value={worker.efficiencyScore} className="h-1.5 w-16" />
                        </div>
                      </TableCell>
                      <TableCell>{getEfficiencyBadge(worker.efficiencyScore)}</TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={9} className="h-24 text-center">
                      No worker performance data available.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Inspector Performance */}
      <Card>
        <CardHeader>
          <CardTitle>Inspector Performance</CardTitle>
          <CardDescription>
            Quality inspection metrics (Sorted by inspections completed)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">#</TableHead>
                  <TableHead>Inspector</TableHead>
                  <TableHead>Tenant</TableHead>
                  <TableHead className="text-right">Inspections</TableHead>
                  <TableHead className="text-right">Approved</TableHead>
                  <TableHead className="text-right">Rejected</TableHead>
                  <TableHead className="text-right">Approval Rate</TableHead>
                  <TableHead className="text-right">Avg Time</TableHead>
                  <TableHead className="text-right">Defects Found</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {inspectorPerformance.length > 0 ? (
                  inspectorPerformance.map((inspector, index) => (
                    <TableRow key={inspector.inspectorId}>
                      <TableCell className="font-medium">{index + 1}</TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{inspector.name}</div>
                          <div className="text-xs text-muted-foreground">{inspector.email}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm">{inspector.tenantName || "N/A"}</span>
                      </TableCell>
                      <TableCell className="text-right font-mono">
                        {inspector.inspectionsCompleted}
                      </TableCell>
                      <TableCell className="text-right font-mono text-green-600">
                        {inspector.approvedCount}
                      </TableCell>
                      <TableCell className="text-right font-mono text-red-600">
                        {inspector.rejectedCount}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex flex-col items-end gap-1">
                          <span className="font-mono font-bold text-sm">
                            {inspector.approvalRate}%
                          </span>
                          <Progress value={inspector.approvalRate} className="h-1.5 w-16" />
                        </div>
                      </TableCell>
                      <TableCell className="text-right font-mono">
                        {inspector.avgInspectionTime}h
                      </TableCell>
                      <TableCell className="text-right font-mono">
                        {inspector.defectsIdentified}
                      </TableCell>
                      <TableCell>{getApprovalBadge(inspector.approvalRate)}</TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={10} className="h-24 text-center">
                      No inspector performance data available.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Top Performers */}
      {(workerPerformance.length > 0 || inspectorPerformance.length > 0) && (
        <Card className="border-blue-200 bg-blue-50 dark:bg-blue-950">
          <CardHeader>
            <CardTitle className="text-blue-900 dark:text-blue-100 flex items-center gap-2">
              <Award className="h-5 w-5" />
              Top Performers
            </CardTitle>
            <CardDescription className="text-blue-800 dark:text-blue-200">
              Highest performing workers and inspectors
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-4">
              {/* Top Worker */}
              {workerPerformance.length > 0 && (
                <div className="p-3 bg-white dark:bg-gray-900 rounded-md">
                  <p className="text-sm font-medium mb-1 flex items-center gap-1">
                    <Target className="h-4 w-4" />
                    Top Worker
                  </p>
                  <p className="text-lg font-bold">{workerPerformance[0].name}</p>
                  <div className="mt-2 space-y-1 text-xs">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Efficiency Score:</span>
                      <span className="font-bold">{workerPerformance[0].efficiencyScore}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Tasks Completed:</span>
                      <span className="font-medium">{workerPerformance[0].tasksCompleted}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Top Inspector */}
              {inspectorPerformance.length > 0 && (
                <div className="p-3 bg-white dark:bg-gray-900 rounded-md">
                  <p className="text-sm font-medium mb-1 flex items-center gap-1">
                    <CheckCircle2 className="h-4 w-4" />
                    Top Inspector
                  </p>
                  <p className="text-lg font-bold">{inspectorPerformance[0].name}</p>
                  <div className="mt-2 space-y-1 text-xs">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Inspections:</span>
                      <span className="font-bold">{inspectorPerformance[0].inspectionsCompleted}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Approval Rate:</span>
                      <span className="font-medium">{inspectorPerformance[0].approvalRate}%</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
