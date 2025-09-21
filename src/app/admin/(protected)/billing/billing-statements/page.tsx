import { Suspense } from "react";
import { Metadata } from "next";
import Link from "next/link";
import { Plus, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { revalidatePath } from "next/cache";

// Import server actions and types
import { getAllBillingStatements } from "@/lib/actions/billing-statements";
import { BillingStatus } from "@/types/admin/billing";

// Import page layout components
import {
  PageContainer,
  PageHeader,
  PageHeaderMain,
  PageTitle,
  PageDescription,
  PageHeaderActions,
  SectionCard,
} from "@/components/shared/page-layout";
import { BillingStatementsDataTable } from "./billing-statements-data-table";

export const metadata: Metadata = {
  title: "Billing Statements",
  description: "Manage customer billing statements and track payments",
};

// Server actions for data revalidation
async function refreshData() {
  "use server";
  revalidatePath("/admin/billing/billing-statements");
}

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

  return (
    <PageContainer>
      {/* Page Header */}
      <PageHeader>
        <PageHeaderMain>
          <PageTitle>Billing Statements</PageTitle>
          <PageDescription>
            Manage customer billing statements and track payments
          </PageDescription>
        </PageHeaderMain>
        <PageHeaderActions>
          <Button asChild variant="outline">
            <Link href="/admin/billing">
              <FileText className="h-4 w-4 mr-2" />
              Back to Billing
            </Link>
          </Button>
          <Button asChild>
            <Link href="/admin/billing/billing-statements/create">
              <Plus className="h-4 w-4 mr-2" />
              Create Statement
            </Link>
          </Button>
        </PageHeaderActions>
      </PageHeader>

      {/* Data Table */}
      <SectionCard heading="All Billing Statements">
        <Suspense fallback={<BillingStatementsTableSkeleton />}>
          <BillingStatementsDataTable 
            data={data.data}
            pagination={data.pagination}
            onRefresh={refreshData}
          />
        </Suspense>
      </SectionCard>
    </PageContainer>
  );
}