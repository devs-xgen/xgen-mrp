"use client";

// src/components/module/admin/dashboard/production-status.tsx
import { useEffect, useState } from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { getProductionStatus } from "@/lib/actions/dashboard";
import { ProductionStatus } from "@/types/admin/dashboard";

export function ProductionStatusChart() {
  const [status, setStatus] = useState<ProductionStatus | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const data = await getProductionStatus();
        setStatus(data);
      } catch (error) {
        console.error("Error fetching production status:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchStatus();
  }, []);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Production Status</CardTitle>
        <CardDescription>Current state of production orders</CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-4 w-full mt-4" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-4 w-full mt-4" />
            <Skeleton className="h-12 w-full" />
          </div>
        ) : (
          <div className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <div>Pending</div>
                <div className="font-medium">
                  {status?.pendingOrders || 0} (
                  {Math.round(status?.pendingPercentage || 0)}%)
                </div>
              </div>
              <div className="h-2 w-full rounded-full bg-muted">
                <div
                  className="h-2 rounded-full bg-yellow-500"
                  style={{ width: `${status?.pendingPercentage || 0}%` }}
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <div>In Progress</div>
                <div className="font-medium">
                  {status?.inProgressOrders || 0} (
                  {Math.round(status?.inProgressPercentage || 0)}%)
                </div>
              </div>
              <div className="h-2 w-full rounded-full bg-muted">
                <div
                  className="h-2 rounded-full bg-blue-500"
                  style={{ width: `${status?.inProgressPercentage || 0}%` }}
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <div>Completed</div>
                <div className="font-medium">
                  {status?.completedOrders || 0} (
                  {Math.round(status?.completedPercentage || 0)}%)
                </div>
              </div>
              <div className="h-2 w-full rounded-full bg-muted">
                <div
                  className="h-2 rounded-full bg-green-500"
                  style={{ width: `${status?.completedPercentage || 0}%` }}
                />
              </div>
            </div>

            <div className="pt-2 text-xs text-muted-foreground">
              Total Orders: {status?.totalOrders || 0}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
