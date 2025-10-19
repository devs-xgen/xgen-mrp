"use client";

import { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
import { AlertCircle } from "lucide-react";
import { subDays, startOfMonth, endOfMonth } from "date-fns";
import {
  getFinancialAnalytics,
  FinancialAnalyticsFilters,
  FinancialAnalyticsData,
} from "@/lib/actions/superadmin/analytics/financial";
import { FinancialKPICards } from "./FinancialKPICards";
import { RevenueAnalyticsComponent } from "./RevenueAnalytics";
import { ProfitabilityAnalyticsComponent } from "./ProfitabilityAnalytics";
import { BillingAnalyticsComponent } from "./BillingAnalytics";
import { CashFlowForecastComponent } from "./CashFlowForecast";
import { AnalyticsFilters } from "../production/AnalyticsFilters";

interface FinancialAnalyticsClientProps {
  tenants: Array<{ id: string; name: string }>;
}

export function FinancialAnalyticsClient({ tenants }: FinancialAnalyticsClientProps) {
  const [filters, setFilters] = useState<FinancialAnalyticsFilters>({
    startDate: startOfMonth(new Date()), // This month
    endDate: endOfMonth(new Date()),
  });

  const [analyticsData, setAnalyticsData] = useState<FinancialAnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch analytics data
  const fetchAnalytics = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await getFinancialAnalytics(filters);

      if (result.success && result.data) {
        setAnalyticsData(result.data);
      } else {
        setError(result.error || "Failed to load financial analytics");
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

  const handleFiltersChange = (newFilters: any) => {
    setFilters({
      startDate: newFilters.startDate,
      endDate: newFilters.endDate,
      tenantId: newFilters.tenantId,
    });
  };

  const handleRefresh = () => {
    fetchAnalytics();
  };

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error Loading Financial Analytics</AlertTitle>
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
          <FinancialKPICards data={analyticsData} />

          {/* Tabs for Different Analytics Views */}
          <Tabs defaultValue="revenue" className="space-y-4">
            <TabsList>
              <TabsTrigger value="revenue">Revenue</TabsTrigger>
              <TabsTrigger value="profitability">Profitability</TabsTrigger>
              <TabsTrigger value="billing">Billing & AR</TabsTrigger>
              <TabsTrigger value="cashflow">Cash Flow</TabsTrigger>
            </TabsList>

            {/* Revenue Tab */}
            <TabsContent value="revenue" className="space-y-4">
              <RevenueAnalyticsComponent data={analyticsData.revenue} />
            </TabsContent>

            {/* Profitability Tab */}
            <TabsContent value="profitability" className="space-y-4">
              <ProfitabilityAnalyticsComponent data={analyticsData.profitability} />
            </TabsContent>

            {/* Billing Tab */}
            <TabsContent value="billing" className="space-y-4">
              <BillingAnalyticsComponent data={analyticsData.billing} />
            </TabsContent>

            {/* Cash Flow Tab */}
            <TabsContent value="cashflow" className="space-y-4">
              <CashFlowForecastComponent data={analyticsData.cashFlow} />
            </TabsContent>
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
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
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
