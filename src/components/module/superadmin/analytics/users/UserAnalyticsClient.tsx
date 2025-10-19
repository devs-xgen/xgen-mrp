"use client";

import { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AlertCircle, RefreshCw } from "lucide-react";
import { subDays } from "date-fns";
import { cn } from "@/lib/utils";
import {
  getUserAnalytics,
  UserAnalyticsFilters,
  UserAnalyticsData,
} from "@/lib/actions/superadmin/analytics/user";
import { UserAnalyticsKPICards } from "./UserAnalyticsKPICards";
import { UserActivityAnalytics } from "./UserActivityAnalytics";
import { InactiveAccountsTable } from "./InactiveAccountsTable";
import { PerformanceMetrics } from "./PerformanceMetrics";

interface UserAnalyticsClientProps {
  tenants: Array<{ id: string; name: string }>;
}

export function UserAnalyticsClient({ tenants }: UserAnalyticsClientProps) {
  const [filters, setFilters] = useState<UserAnalyticsFilters>({
    startDate: subDays(new Date(), 30), // Last 30 days
    endDate: new Date(),
  });

  const [analyticsData, setAnalyticsData] = useState<UserAnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch analytics data
  const fetchAnalytics = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await getUserAnalytics(filters);

      if (result.success && result.data) {
        setAnalyticsData(result.data);
      } else {
        setError(result.error || "Failed to load user analytics");
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

  const handleRefresh = () => {
    fetchAnalytics();
  };

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error Loading User Analytics</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Role Filter */}
            <div className="space-y-2">
              <Label>Role</Label>
              <Select
                value={filters.role || "all"}
                onValueChange={(value) =>
                  setFilters({ ...filters, role: value === "all" ? undefined : value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="All Roles" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Roles</SelectItem>
                  <SelectItem value="WORKER">Worker</SelectItem>
                  <SelectItem value="INSPECTOR">Inspector</SelectItem>
                  <SelectItem value="ADMIN">Admin</SelectItem>
                  <SelectItem value="DELIVERY">Delivery</SelectItem>
                  <SelectItem value="SUPER_ADMIN">Super Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Tenant Filter */}
            <div className="space-y-2">
              <Label>Tenant</Label>
              <Select
                value={filters.tenantId || "all"}
                onValueChange={(value) =>
                  setFilters({ ...filters, tenantId: value === "all" ? undefined : value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="All Tenants" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Tenants</SelectItem>
                  {tenants.map((tenant) => (
                    <SelectItem key={tenant.id} value={tenant.id}>
                      {tenant.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Period Filter */}
            <div className="space-y-2">
              <Label>Time Period</Label>
              <Select
                value="30days"
                onValueChange={(value) => {
                  const now = new Date();
                  let startDate: Date;
                  switch (value) {
                    case "7days":
                      startDate = subDays(now, 7);
                      break;
                    case "30days":
                      startDate = subDays(now, 30);
                      break;
                    case "90days":
                      startDate = subDays(now, 90);
                      break;
                    default:
                      startDate = subDays(now, 30);
                  }
                  setFilters({ ...filters, startDate, endDate: now });
                }}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7days">Last 7 Days</SelectItem>
                  <SelectItem value="30days">Last 30 Days</SelectItem>
                  <SelectItem value="90days">Last 90 Days</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Refresh Button */}
            <div className="space-y-2">
              <Label>Actions</Label>
              <Button
                variant="default"
                onClick={handleRefresh}
                disabled={isLoading}
                className="w-full"
              >
                <RefreshCw className={cn("h-4 w-4 mr-2", isLoading && "animate-spin")} />
                {isLoading ? "Loading..." : "Refresh"}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Loading State */}
      {isLoading && !analyticsData && <LoadingSkeleton />}

      {/* Analytics Content */}
      {analyticsData && (
        <>
          {/* KPI Cards */}
          <UserAnalyticsKPICards data={analyticsData} />

          {/* Tabs for Different Analytics Views */}
          <Tabs defaultValue="activity" className="space-y-4">
            <TabsList>
              <TabsTrigger value="activity">User Activity</TabsTrigger>
              <TabsTrigger value="inactive">Inactive Accounts</TabsTrigger>
              <TabsTrigger value="performance">Performance</TabsTrigger>
            </TabsList>

            {/* Activity Tab */}
            <TabsContent value="activity" className="space-y-4">
              <UserActivityAnalytics
                loginActivity={analyticsData.loginActivity}
                usersByRole={analyticsData.usersByRole}
              />
            </TabsContent>

            {/* Inactive Accounts Tab */}
            <TabsContent value="inactive" className="space-y-4">
              <InactiveAccountsTable accounts={analyticsData.inactiveAccounts} />
            </TabsContent>

            {/* Performance Tab */}
            <TabsContent value="performance" className="space-y-4">
              <PerformanceMetrics
                workerPerformance={analyticsData.workerPerformance}
                inspectorPerformance={analyticsData.inspectorPerformance}
              />
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
