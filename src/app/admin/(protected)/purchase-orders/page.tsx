// src/app/admin/(protected)/purchase-orders/page.tsx
import { Metadata } from "next";
import { DataTable } from "@/components/module/admin/purchase-orders/data-table";
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
import { getPurchaseOrders } from "@/lib/actions/purchase-order";
import { getAllMaterials } from "@/lib/actions/materials";
import { getAllSuppliers } from "@/lib/actions/suppliers";
import { PurchaseOrdersStats } from "@/components/module/admin/purchase-orders/stats-dashboard";

export const metadata: Metadata = {
  title: "Purchase Orders | Admin Dashboard",
  description: "Manage your purchase orders and order lines",
};

interface PageProps {
  searchParams: Promise<{ highlight?: string }>;
}

export default async function PurchaseOrdersPage({ searchParams }: PageProps) {
  const { highlight } = await searchParams;
  const highlightId = highlight;

  const [purchaseOrders, materials, suppliers] = await Promise.all([
    getPurchaseOrders(),
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
      <PurchaseOrdersStats purchaseOrders={purchaseOrders} />

      <SectionCard heading="All Purchase Orders">
        <DataTable
          columns={columns}
          data={purchaseOrders}
          highlightId={highlightId}
        />
      </SectionCard>
    </PageContainer>
  );
}
