import { Metadata } from "next";
import { redirect } from "next/navigation";
import { getAllSalesInvoices } from "@/lib/actions/superadmin/sales-invoices";
import { InvoiceStatus } from "@/types/admin/billing";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Plus, FileText } from "lucide-react";
import {
  PageContainer,
  PageHeader,
  PageHeaderMain,
  PageTitle,
  PageDescription,
  PageHeaderActions,
  SectionCard,
} from "@/components/shared/page-layout";
import { SuperAdminSalesInvoicesDataTable } from "@/components/module/superadmin/billing/sales-invoices/sales-invoices-data-table";

export const metadata: Metadata = {
  title: "Sales Invoices",
  description: "Manage sales invoices and billing information",
};

interface PageProps {
  searchParams: {
    page?: string;
    perPage?: string;
    search?: string;
    status?: string;
    dateFrom?: string;
    dateTo?: string;
  };
}

async function refreshData() {
  "use server";
  redirect("/superadmin/billing/sales-invoices");
}

export default async function SuperAdminSalesInvoicesPage({ searchParams }: PageProps) {
  const page = Number(searchParams.page) || 1;
  const perPage = Number(searchParams.perPage) || 10;
  const search = searchParams.search || "";
  const statusFilter = searchParams.status?.split(",") as InvoiceStatus[] || [];
  const dateRange = searchParams.dateFrom && searchParams.dateTo 
    ? { start: new Date(searchParams.dateFrom), end: new Date(searchParams.dateTo) }
    : undefined;

  // Fetch data
  const invoicesResult = await getAllSalesInvoices(
    {
      search,
      status: statusFilter,
      dateRange,
    },
    page,
    perPage
  );

  return (
    <PageContainer>
      {/* Page Header */}
      <PageHeader>
        <PageHeaderMain>
          <PageTitle>Sales Invoices</PageTitle>
          <PageDescription>
            Manage sales invoices and billing information
          </PageDescription>
        </PageHeaderMain>
        <PageHeaderActions>
          <Button asChild variant="outline">
            <Link href="/superadmin/billing">
              <FileText className="h-4 w-4 mr-2" />
              Back to Billing
            </Link>
          </Button>
          <Button asChild>
            <Link href="/superadmin/billing/sales-invoices/create">
              <Plus className="h-4 w-4 mr-2" />
              Create Invoice
            </Link>
          </Button>
        </PageHeaderActions>
      </PageHeader>

      {/* Data Table */}
      <SectionCard heading="All Sales Invoices">
        <SuperAdminSalesInvoicesDataTable 
          data={invoicesResult.data}
          onRefresh={refreshData}
        />
      </SectionCard>
    </PageContainer>
  );
}
