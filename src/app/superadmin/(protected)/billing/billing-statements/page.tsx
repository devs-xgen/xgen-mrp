import { Suspense } from "react";
import Link from "next/link";
import { Plus, FileText } from "lucide-react";
import { Metadata } from "next";
import { revalidatePath } from "next/cache";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  PageContainer,
  PageHeader,
  PageHeaderMain,
  PageTitle,
  PageDescription,
  PageHeaderActions,
  SectionCard,
} from "@/components/shared/page-layout";
import { getAllBillingStatements } from "@/lib/actions/superadmin/billing-statements";
import type { BillingStatus } from "@/types/admin/billing";
import { SuperAdminBillingStatementsDataTable } from "@/components/module/superadmin/billing/billing-statements-data-table";

export const metadata: Metadata = {
  title: "Billing Statements",
  description: "Manage billing statements across tenants",
};

async function refreshData() {
  "use server";
  revalidatePath("/superadmin/billing/billing-statements");
}

interface BillingStatementsPageProps {
  searchParams: Promise<{
    page?: string;
    perPage?: string;
    search?: string;
    status?: string;
    dateFrom?: string;
    dateTo?: string;
  }>;
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

export default async function SuperAdminBillingStatementsPage({ searchParams }: BillingStatementsPageProps) {
  const params = await searchParams;
  const page = Number(params.page) || 1;
  const perPage = Number(params.perPage) || 10;
  const search = params.search || "";
  const statusParam = params.status || "";
  const dateFrom = params.dateFrom || "";
  const dateTo = params.dateTo || "";

  const status = statusParam
    ? statusParam
        .split(",")
        .filter(Boolean)
        .filter((value): value is BillingStatus => Object.values(BillingStatus).includes(value as BillingStatus))
    : [];

  const filters = {
    search: search || undefined,
    status: status.length ? status : undefined,
    dateRange:
      dateFrom && dateTo
        ? {
            start: new Date(dateFrom),
            end: new Date(dateTo),
          }
        : undefined,
  };

  const data = await getAllBillingStatements(filters, page, perPage);

  return (
    <PageContainer>
      <PageHeader>
        <PageHeaderMain>
          <PageTitle>Billing Statements</PageTitle>
          <PageDescription>Full visibility into tenant billing statements</PageDescription>
        </PageHeaderMain>
        <PageHeaderActions>
          <Button asChild variant="outline">
            <Link href="/superadmin/billing">
              <FileText className="h-4 w-4 mr-2" />
              Billing Dashboard
            </Link>
          </Button>
          <Button asChild>
            <Link href="/superadmin/billing/billing-statements/create">
              <Plus className="h-4 w-4 mr-2" />
              Create Statement
            </Link>
          </Button>
        </PageHeaderActions>
      </PageHeader>

      <SectionCard heading="All Billing Statements">
        <Suspense fallback={<BillingStatementsTableSkeleton />}>
          <SuperAdminBillingStatementsDataTable
            data={data.data}
            pagination={data.pagination}
            onRefresh={refreshData}
          />
        </Suspense>
      </SectionCard>
    </PageContainer>
  );
}
