import { Metadata } from "next";
import { getArchivedOrders, getArchiveStatistics } from "@/lib/actions/order-archiving";
import { ArchivedOrdersClient } from "@/components/module/admin/customer-orders/ArchivedOrdersClient";
import { Breadcrumbs } from "@/components/shared/Breadcrumbs";

export const metadata: Metadata = {
  title: "Archived Orders",
  description: "View and manage archived customer orders with complete history preservation",
};

interface ArchivedOrdersPageProps {
  searchParams: Promise<{
    page?: string;
    customerName?: string;
    archiveReason?: string;
    billingStatus?: string;
    minValue?: string;
    maxValue?: string;
    dateFrom?: string;
    dateTo?: string;
  }>;
}

export default async function ArchivedOrdersPage({ searchParams }: ArchivedOrdersPageProps) {
  const params = await searchParams;
  const page = parseInt(params.page || "1", 10);
  const pageSize = 20;

  // Build filters from search params
  const filters: any = {};
  
  if (params.customerName) {
    filters.customerName = params.customerName;
  }
  
  if (params.archiveReason) {
    filters.archiveReason = params.archiveReason;
  }
  
  if (params.billingStatus) {
    filters.billingStatus = params.billingStatus;
  }
  
  if (params.minValue) {
    filters.minValue = parseFloat(params.minValue);
  }
  
  if (params.maxValue) {
    filters.maxValue = parseFloat(params.maxValue);
  }
  
  if (params.dateFrom || params.dateTo) {
    filters.dateRange = {};
    if (params.dateFrom) {
      filters.dateRange.from = new Date(params.dateFrom);
    }
    if (params.dateTo) {
      filters.dateRange.to = new Date(params.dateTo);
    }
  }

  // Fetch archived orders and statistics
  const [archivedOrdersData, archiveStats] = await Promise.all([
    getArchivedOrders(filters, page, pageSize),
    getArchiveStatistics(),
  ]);

  const breadcrumbItems = [
    { label: "Customer Orders", href: "/admin/customer-orders" },
    { label: "Archives", href: "/admin/customer-orders/archives" },
  ];

  return (
    <div className="flex flex-col gap-6 p-8">
      <div className="space-y-4">
        <Breadcrumbs items={breadcrumbItems} />
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Archived Orders</h1>
          <p className="text-muted-foreground">
            Complete archive management with history preservation and restoration capabilities
          </p>
        </div>
      </div>

      <ArchivedOrdersClient
        initialData={archivedOrdersData}
        statistics={archiveStats}
        currentPage={page}
        pageSize={pageSize}
        currentFilters={params}
      />
    </div>
  );
}
