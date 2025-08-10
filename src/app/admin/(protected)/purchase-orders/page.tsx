// src/app/admin/(protected)/purchase-orders/page.tsx
import { Metadata } from "next";
import { DataTable } from "@/components/module/admin/purchase-orders/data-table";
import { columns } from "@/components/module/admin/purchase-orders/columns";
import { CreatePurchaseOrderDialog } from "@/components/module/admin/purchase-orders/create-dialog";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      {/* Page Header - Following Sales Invoices Pattern */}
      <div className="flex items-center justify-between space-y-2">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Purchase Orders</h2>
          <p className="text-muted-foreground mt-1">
            Manage and track all purchase orders
          </p>
        </div>
        <div className="flex items-center gap-2">
          <CreatePurchaseOrderDialog
            materials={materials as any}
            suppliers={suppliers}
          />
        </div>
      </div>

      {/* Statistics Dashboard */}
      <PurchaseOrdersStats purchaseOrders={purchaseOrders} />

      {/* Data Table - Following Design System Pattern */}
      <Card className="bg-card border rounded-lg">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg">All Purchase Orders</CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={columns}
            data={purchaseOrders}
            highlightId={highlightId}
          />
        </CardContent>
      </Card>
    </div>
  );
}
