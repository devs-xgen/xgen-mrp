"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";
import { getQualityMetrics } from "@/lib/actions/quality-checks";
import { ClipboardCheck, AlertCircle, Activity } from "lucide-react";

interface QualityCheck {
  id: string;
  checkDate: Date;
  status: string;
  defectsFound: string | null;
  productionOrder: {
    product: {
      name: string;
      sku: string;
    };
  };
}

interface QualityMetrics {
  totalChecks: number;
  pendingChecks: number;
  defectsFound: number;
  passRate: number;
  recentChecks: QualityCheck[];
}

export function QualityMetricsDisplay() {
  const [metrics, setMetrics] = useState<QualityMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        setLoading(true);
        const data = await getQualityMetrics();
        setMetrics(data);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to load quality metrics"
        );
      } finally {
        setLoading(false);
      }
    };

    fetchMetrics();
  }, []);

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="grid gap-4 md:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="pb-2">
                <div className="h-5 w-1/2 bg-muted rounded"></div>
              </CardHeader>
              <CardContent>
                <div className="h-10 w-16 bg-muted rounded mb-2"></div>
                <div className="h-4 w-full bg-muted rounded"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Card className="border-red-300">
        <CardHeader>
          <CardTitle className="text-red-500">
            Error Loading Quality Metrics
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p>{error}</p>
        </CardContent>
      </Card>
    );
  }

  if (!metrics) {
    return null;
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Checks</CardTitle>
            <ClipboardCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.totalChecks}</div>
            <p className="text-xs text-muted-foreground">
              {metrics.pendingChecks} pending checks
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Defects Found</CardTitle>
            <AlertCircle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.defectsFound}</div>
            <p className="text-xs text-muted-foreground">
              {metrics.defectsFound > 0
                ? `${(
                    (metrics.defectsFound / metrics.totalChecks) *
                    100
                  ).toFixed(1)}% defect rate`
                : "No defects found"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pass Rate</CardTitle>
            <Activity className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2">
              <div className="text-2xl font-bold">
                {metrics.passRate.toFixed(1)}%
              </div>
            </div>
            <div className="mt-2">
              <Progress value={metrics.passRate} className="h-2" />
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              Overall quality pass rate
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Quality Checks</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {metrics.recentChecks.length > 0 ? (
              metrics.recentChecks.map((check) => (
                <div
                  key={check.id}
                  className="flex items-center justify-between border-b pb-3"
                >
                  <div>
                    <h4 className="font-medium">
                      {check.productionOrder.product.name}
                    </h4>
                    <p className="text-sm text-muted-foreground">
                      {formatDate(check.checkDate)} - SKU:{" "}
                      {check.productionOrder.product.sku}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge
                      variant={check.defectsFound ? "destructive" : "success"}
                    >
                      {check.defectsFound ? "Defects Found" : "Passed"}
                    </Badge>
                    <Badge
                      variant={
                        check.status === "COMPLETED"
                          ? "default"
                          : check.status === "IN_PROGRESS"
                          ? "secondary"
                          : "outline"
                      }
                    >
                      {check.status.toLowerCase().replace("_", " ")}
                    </Badge>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-center text-muted-foreground">
                No recent quality checks
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
