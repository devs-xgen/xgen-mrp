import { Suspense } from "react";
import { revalidatePath } from "next/cache";
import { getAllSalesInvoices, getSalesReportData } from "@/lib/actions/sales-invoices";
import { SalesInvoicesDashboard } from "./sales-invoices-dashboard";
import { DataTable } from "./data-table";
import { SalesInvoiceWithItems, InvoiceStatus } from "@/types/admin/billing";

// Server actions for data revalidation
async function revalidateSalesInvoices() {
  "use server";
  revalidatePath("/admin/billing/sales-invoices");
}

async function refreshSalesInvoices() {
  "use server";
  revalidatePath("/admin/billing/sales-invoices", "page");
}

interface SalesInvoicesPageProps {
  searchParams?: {
    page?: string;
    per_page?: string;
    sort?: string;
    status?: string;
    search?: string;
    customer?: string;
    date_from?: string;
    date_to?: string;
  };
}

export default async function SalesInvoicesPage({
  searchParams,
}: SalesInvoicesPageProps) {
  // Parse search parameters
  const page = Number(searchParams?.page) || 1;
  const perPage = Number(searchParams?.per_page) || 10;
  const sort = searchParams?.sort;
  const status = searchParams?.status;
  const search = searchParams?.search;
  const customer = searchParams?.customer;
  const dateFrom = searchParams?.date_from;
  const dateTo = searchParams?.date_to;

  // Build filters object
  const filters = {
    ...(status && { status: status.split(",") as InvoiceStatus[] }),
    ...(customer && { customerId: customer }),
    ...(search && { search }),
    ...(dateFrom && { dateFrom: new Date(dateFrom) }),
    ...(dateTo && { dateTo: new Date(dateTo) }),
    ...(sort && {
      sortBy: sort.split(".")[0] as any,
      sortOrder: sort.split(".")[1] as "asc" | "desc",
    }),
  };

  // Fetch sales invoices data
  const salesInvoicesData = await getAllSalesInvoices(
    filters,
    page,
    perPage
  );

  const salesInvoices = salesInvoicesData?.data || [];
  const pagination = salesInvoicesData?.pagination || {
    page: 1,
    pageSize: 10,
    total: 0,
    totalPages: 0,
  };

  // Fetch analytics data for dashboard
  const reportData = await getSalesReportData(
    dateFrom ? new Date(dateFrom) : undefined,
    dateTo ? new Date(dateTo) : undefined
  );

  return (
    <div className="space-y-6">
      {/* Dashboard Analytics */}
      <Suspense fallback={<div>Loading dashboard...</div>}>
        <SalesInvoicesDashboard 
          invoices={salesInvoices} 
          reportData={reportData}
        />
      </Suspense>

      {/* Data Table */}
      <Suspense fallback={<div>Loading sales invoices...</div>}>
        <DataTable data={salesInvoices} />
      </Suspense>
    </div>
  );
}