"use client";

import { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
import { AlertCircle } from "lucide-react";
import { subDays } from "date-fns";
import {
  getProductionAnalytics,
  ProductionAnalyticsFilters,
  ProductionAnalyticsData,
} from "@/lib/actions/superadmin/analytics/production";
import { KPICards } from "./KPICards";
import { ProductionVolumeChart } from "./ProductionVolumeChart";
import { EfficiencyMetrics } from "./EfficiencyMetrics";
import { CostAnalyticsChart } from "./CostAnalyticsChart";
import { TenantComparisonTable } from "./TenantComparisonTable";
import { AnalyticsFilters } from "./AnalyticsFilters";

interface ProductionAnalyticsClientProps {
  tenants: Array<{ id: string; name: string }>;
}

export function ProductionAnalyticsClient({ tenants }: ProductionAnalyticsClientProps) {
  const [filters, setFilters] = useState<ProductionAnalyticsFilters>({
    startDate: subDays(new Date(), 30), // Last 30 days
    endDate: new Date(),
  });

  const [analyticsData, setAnalyticsData] = useState<ProductionAnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch analytics data
  const fetchAnalytics = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await getProductionAnalytics(filters);

      if (result.success && result.data) {
        setAnalyticsData(result.data);
      } else {
        setError(result.error || "Failed to load analytics");
      }
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  // Load analytics on mount and when filters change
  useEffect(() => {
    fetchAnalytics();
  }, [filters]);

  const handleFiltersChange = (newFilters: ProductionAnalyticsFilters) => {
    setFilters(newFilters);
  };

  const handleRefresh = () => {
    fetchAnalytics();
  };

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error Loading Analytics</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filters */}
      <AnalyticsFilters
        filters={filters}
        tenants={tenants}
        onFiltersChange={handleFiltersChange}
        onRefresh={handleRefresh}
        isLoading={isLoading}
      />

      {/* Loading State */}
      {isLoading && !analyticsData && <LoadingSkeleton />}

      {/* Analytics Content */}
      {analyticsData && (
        <>
          {/* KPI Cards */}
          <KPICards metrics={analyticsData.kpis} />

          {/* Tabs for Different Analytics Views */}
          <Tabs defaultValue="overview" className="space-y-4">
            <TabsList>
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="efficiency">Efficiency</TabsTrigger>
              <TabsTrigger value="costs">Costs</TabsTrigger>
              {analyticsData.tenantComparison.length > 0 && (
                <TabsTrigger value="tenants">Tenant Comparison</TabsTrigger>
              )}
            </TabsList>

            {/* Overview Tab */}
            <TabsContent value="overview" className="space-y-4">
              <ProductionVolumeChart
                volumeData={analyticsData.volumeOverTime}
                statusData={analyticsData.ordersByStatus}
                priorityData={analyticsData.ordersByPriority}
              />
            </TabsContent>

            {/* Efficiency Tab */}
            <TabsContent value="efficiency" className="space-y-4">
              <EfficiencyMetrics workCenterData={analyticsData.workCenterUtilization} />
            </TabsContent>

            {/* Costs Tab */}
            <TabsContent value="costs" className="space-y-4">
              <CostAnalyticsChart costData={analyticsData.costAnalysis} />
            </TabsContent>

            {/* Tenant Comparison Tab */}
            {analyticsData.tenantComparison.length > 0 && (
              <TabsContent value="tenants" className="space-y-4">
                <TenantComparisonTable tenants={analyticsData.tenantComparison} />
              </TabsContent>
            )}
          </Tabs>
        </>
      )}
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="space-y-6">
      {/* KPI Cards Skeleton */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <Skeleton className="h-16 w-full" />
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts Skeleton */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardContent className="p-6">
            <Skeleton className="h-[300px] w-full" />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <Skeleton className="h-[300px] w-full" />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
