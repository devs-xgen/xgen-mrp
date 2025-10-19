import { Suspense } from "react";
import { FinancialAnalyticsClient } from "@/components/module/superadmin/analytics/financial";
import { getTenantsForAnalytics } from "@/lib/actions/superadmin/analytics/production";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export const metadata = {
  title: "Financial Analytics | SuperAdmin",
  description: "Revenue, costs, profitability, and cash flow analytics",
};

export default async function FinancialAnalyticsPage() {
  // Fetch tenants for filter
  const tenantsResult = await getTenantsForAnalytics();
  const tenants = tenantsResult.success ? tenantsResult.data || [] : [];

  return (
    <div className="flex-1 space-y-6 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Financial Analytics</h2>
          <p className="text-muted-foreground">
            Revenue, costs, profitability, and cash flow insights
          </p>
        </div>
      </div>

      <Suspense fallback={<FinancialLoadingSkeleton />}>
        <FinancialAnalyticsClient tenants={tenants} />
      </Suspense>
    </div>
  );
}

function FinancialLoadingSkeleton() {
  return (
    <div className="space-y-6">
      {/* Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <Skeleton className="h-16 w-full" />
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts */}
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
