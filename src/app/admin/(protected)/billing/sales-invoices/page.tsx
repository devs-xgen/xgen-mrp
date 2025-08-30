import { Metadata } from "next";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getAllSalesInvoices, getSalesReportData } from "@/lib/actions/sales-invoices";
import { SalesInvoicesDashboard } from "@/components/module/admin/billing/sales-invoices/sales-invoices-dashboard";
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
import { SalesInvoicesDataTable } from "./sales-invoices-data-table";

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

// Server actions for data revalidation and refresh
async function revalidateData() {
  "use server";
  revalidatePath("/admin/billing/sales-invoices");
}

async function refreshData() {
  "use server";
  redirect("/admin/billing/sales-invoices");
}

export default async function SalesInvoicesPage({ searchParams }: PageProps) {
  const page = Number(searchParams.page) || 1;
  const perPage = Number(searchParams.perPage) || 10;
  const search = searchParams.search || "";
  const statusFilter = searchParams.status?.split(",") as InvoiceStatus[] || [];
  const dateRange = searchParams.dateFrom && searchParams.dateTo 
    ? { start: new Date(searchParams.dateFrom), end: new Date(searchParams.dateTo) }
    : undefined;

  // Fetch data
  const [invoicesResult, reportData] = await Promise.all([
    getAllSalesInvoices(
      {
        search,
        status: statusFilter,
        dateRange,
      },
      page,
      perPage
    ),
    getSalesReportData(),
  ]);

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
            <Link href="/admin/billing">
              <FileText className="h-4 w-4 mr-2" />
              Back to Billing
            </Link>
          </Button>
          <Button asChild>
            <Link href="/admin/billing/sales-invoices/create">
              <Plus className="h-4 w-4 mr-2" />
              Create Invoice
            </Link>
          </Button>
        </PageHeaderActions>
      </PageHeader>

      {/* Dashboard Analytics */}
      <SalesInvoicesDashboard reportData={reportData} />
      
      {/* Data Table */}
      <SectionCard heading="All Sales Invoices">
        <SalesInvoicesDataTable 
          data={invoicesResult.data}
          onRefresh={refreshData}
        />
      </SectionCard>
    </PageContainer>
  );
}