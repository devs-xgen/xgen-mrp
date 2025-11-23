import { Metadata } from "next";
import { PurchaseOrdersDataTable } from "@/components/module/admin/purchase-orders/purchase-orders-data-table";
import { columns } from "@/components/module/admin/purchase-orders/columns";
import { CreatePurchaseOrderDialog } from "@/components/module/admin/purchase-orders/create-dialog";
import {
  PageContainer,
  PageHeader,
  PageHeaderMain,
  PageTitle,
  PageDescription,
  PageHeaderActions,
  SectionCard,
} from "@/components/shared/page-layout";
import {
  getPaginatedPurchaseOrders,
  getPurchaseOrderStats,
} from "@/lib/actions/purchase-order";
import { getAllMaterials } from "@/lib/actions/materials";
import { getAllSuppliers } from "@/lib/actions/suppliers";
import { PurchaseOrdersStats } from "@/components/module/admin/purchase-orders/stats-dashboard";

export const metadata: Metadata = {
  title: "Purchase Orders | Admin Dashboard",
  description: "Manage your purchase orders and order lines",
};

interface PageProps {
  searchParams: Promise<{
    page?: string;
    limit?: string;
    search?: string;
    highlight?: string;
  }>;
}

export default async function PurchaseOrdersPage({ searchParams }: PageProps) {
  const resolvedSearchParams = await searchParams;
  const page = Number(resolvedSearchParams.page) || 1;
  const limit = Number(resolvedSearchParams.limit) || 10;
  const search = resolvedSearchParams.search || "";
  const highlightId = resolvedSearchParams.highlight;

  const [paginatedOrders, stats, materials, suppliers] = await Promise.all([
    getPaginatedPurchaseOrders({ page, limit, search }),
    getPurchaseOrderStats(),
    getAllMaterials(),
    getAllSuppliers(),
  ]);

  return (
    <PageContainer>
      <PageHeader>
        <PageHeaderMain>
          <PageTitle>Purchase Orders</PageTitle>
          <PageDescription>
            Manage and track all purchase orders
          </PageDescription>
        </PageHeaderMain>
        <PageHeaderActions>
          <CreatePurchaseOrderDialog
            materials={materials as any}
            suppliers={suppliers}
          />
        </PageHeaderActions>
      </PageHeader>

      {/* Statistics Dashboard */}
      <PurchaseOrdersStats stats={stats} />

      <SectionCard heading="All Purchase Orders">
        <PurchaseOrdersDataTable
          columns={columns}
          data={paginatedOrders.data}
          metadata={paginatedOrders.metadata}
          highlightId={highlightId}
        />
      </SectionCard>
    </PageContainer>
  );
}
