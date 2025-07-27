import { Suspense } from "react";
import { Metadata } from "next";
import { Skeleton } from "@/components/ui/skeleton";

// Import server actions and types
import { getAllBillingStatements, getBillingAnalytics } from "@/lib/actions/billing-statements";
import { BillingStatementsClient } from "@/components/module/admin/billing/billing-statements";
import { BillingStatus } from "@/types/admin/billing";

export const metadata: Metadata = {
  title: "Billing Statements",
  description: "Manage customer billing statements and track payments",
};

interface BillingStatementsPageProps {
  searchParams: {
    page?: string;
    perPage?: string;
    search?: string;
    status?: string;
    dateFrom?: string;
    dateTo?: string;
  };
}

function BillingStatementsTableSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-32" />
        ))}
      </div>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-[250px]" />
          <Skeleton className="h-8 w-[100px]" />
        </div>
        <Skeleton className="h-[400px] w-full" />
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-[200px]" />
          <Skeleton className="h-8 w-[200px]" />
        </div>
      </div>
    </div>
  );
}

export default async function BillingStatementsPage({ searchParams }: BillingStatementsPageProps) {
  const params = await searchParams;
  const page = Number(params.page) || 1;
  const perPage = Number(params.perPage) || 10;
  const search = params.search || "";
  const statusParam = params.status || "";
  const dateFrom = params.dateFrom || "";
  const dateTo = params.dateTo || "";

  // Parse status parameter - it can be a comma-separated string of statuses
  const status = statusParam ? statusParam.split(',').filter(Boolean).filter((s): s is BillingStatus => 
    Object.values(BillingStatus).includes(s as BillingStatus)
  ) : [];

  // Build filters object
  const filters = {
    search: search || undefined,
    status: status.length > 0 ? status : undefined,
    dateRange: dateFrom && dateTo ? {
      start: new Date(dateFrom),
      end: new Date(dateTo)
    } : undefined,
  };

  const data = await getAllBillingStatements(filters, page, perPage);
  const analytics = await getBillingAnalytics();

  return (
    <div className="flex-1 space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Billing Statements</h1>
          <p className="text-muted-foreground">
            Manage customer billing statements and track payments
          </p>
        </div>
      </div>

      <Suspense fallback={<BillingStatementsTableSkeleton />}>
        <BillingStatementsClient data={data} analytics={analytics} />
      </Suspense>
    </div>
  );
}