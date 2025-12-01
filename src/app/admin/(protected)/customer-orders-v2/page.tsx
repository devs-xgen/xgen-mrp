import { Metadata } from "next";
import { CustomerOrdersDataTable } from "@/components/module/admin/customer-order-ver/customer-orders-data-table";
import { CustomerOrderV2HeaderActions } from "@/components/module/admin/customer-order-ver/CustomerOrderV2HeaderActions";
import { columns } from "@/components/module/admin/customer-order-ver/columns";
import {
  PageContainer,
  PageHeader,
  PageHeaderMain,
  PageTitle,
  PageDescription,
  SectionCard,
  PageHeaderActions,
} from "@/components/shared/page-layout";
import {
  getPaginatedCustomerOrders,
  getCustomerOrderStats,
} from "@/lib/actions/customer-order";

export const metadata: Metadata = {
  title: "Customer Orders V2 | Admin Dashboard",
  description: "Enhanced customer order management with advanced features",
};

interface PageProps {
  searchParams: Promise<{
    page?: string;
    limit?: string;
    search?: string;
    highlight?: string;
    dateFrom?: string;
    dateTo?: string;
  }>;
}

export default async function CustomerOrderV2Page({ searchParams }: PageProps) {
  const resolvedSearchParams = await searchParams;
  const page = Number(resolvedSearchParams.page) || 1;
  const limit = Number(resolvedSearchParams.limit) || 10;
  const search = resolvedSearchParams.search || "";
  const highlightId = resolvedSearchParams.highlight;
  const dateFrom = resolvedSearchParams.dateFrom
    ? new Date(resolvedSearchParams.dateFrom)
    : undefined;
  const dateTo = resolvedSearchParams.dateTo
    ? new Date(resolvedSearchParams.dateTo)
    : undefined;
  const normalizedDateFrom = dateFrom && !isNaN(dateFrom.getTime()) ? dateFrom : undefined;
  const normalizedDateTo = dateTo && !isNaN(dateTo.getTime()) ? dateTo : undefined;

  const [paginatedOrders, stats] = await Promise.all([
    getPaginatedCustomerOrders({
      page,
      limit,
      search,
      dateFrom: normalizedDateFrom,
      dateTo: normalizedDateTo,
    }),
    getCustomerOrderStats(),
  ]);

  return (
    <PageContainer>
      <PageHeader>
        <PageHeaderMain>
          <PageTitle>Purchase Orders</PageTitle>
          <PageDescription>
            Enhanced customer order management with real-time tracking, (It is Customer Order we just tried putting Purchase Order for you guys)
          </PageDescription>
        </PageHeaderMain>
        <PageHeaderActions>
          <CustomerOrderV2HeaderActions />
        </PageHeaderActions>
      </PageHeader>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-card border rounded-lg p-6">
          <p className="text-sm font-medium text-muted-foreground">Total Orders</p>
          <p className="text-2xl font-bold mt-1">{stats.totalOrders}</p>
          <p className="text-xs text-muted-foreground mt-1">
            {stats.pendingOrders} pending
          </p>
        </div>
        <div className="bg-card border rounded-lg p-6">
          <p className="text-sm font-medium text-muted-foreground">Total Value</p>
          <p className="text-2xl font-bold mt-1">
            ₱{stats.totalAmount.toLocaleString()}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            ₱{stats.pendingAmount.toLocaleString()} pending
          </p>
        </div>
        <div className="bg-card border rounded-lg p-6">
          <p className="text-sm font-medium text-muted-foreground">Month Growth</p>
          <p className="text-2xl font-bold mt-1">{stats.monthlyTrends.growth}%</p>
          <p className="text-xs text-muted-foreground mt-1">
            {stats.monthlyTrends.currentMonth} this month
          </p>
        </div>
        <div className="bg-card border rounded-lg p-6">
          <p className="text-sm font-medium text-muted-foreground">Recent Order</p>
          <p className="text-2xl font-bold mt-1">
            {stats.mostRecentOrder?.orderNumber || "None"}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            {stats.mostRecentOrder
              ? new Date(stats.mostRecentOrder.date).toLocaleDateString()
              : "No orders"}
          </p>
        </div>
      </div>

      <SectionCard heading="All Customer Orders">
        <CustomerOrdersDataTable
          columns={columns}
          data={paginatedOrders.data}
          metadata={paginatedOrders.metadata}
          highlightId={highlightId}
        />
      </SectionCard>
    </PageContainer>
  );
}
