import { Metadata } from "next";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getAllSalesInvoices, getSalesReportData } from "@/lib/actions/sales-invoices";
import { SalesInvoicesDashboard } from "@/components/module/admin/billing/sales-invoices/sales-invoices-dashboard";
import { SalesInvoicesClient } from "@/components/module/admin/billing/sales-invoices/sales-invoices-client";
import { InvoiceStatus } from "@/types/admin/billing";

export const metadata: Metadata = {
  title: "Sales Invoices",
  description: "Manage your sales invoices",
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
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Sales Invoices</h2>
      </div>
      
      <SalesInvoicesDashboard reportData={reportData} />
      
      <SalesInvoicesClient initialData={invoicesResult.data} />
    </div>
  );
}