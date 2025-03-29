// src/app/admin/(protected)/purchase-orderline/page.tsx
import { Metadata } from "next";
import { PurchaseOrderLineDataTable } from "@/components/module/admin/purchase-ordeline/data-table";
import { CreateOrderLineDialog } from "@/components/module/admin/purchase-ordeline/create-orderline-dialog";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getPurchaseOrderLines } from "@/lib/actions/purchaseorderline";
import { getAllMaterials } from "@/lib/actions/materials";
import { getPurchaseOrders } from "@/lib/actions/purchase-order";
import { revalidatePath } from "next/cache";
import { PurchaseOrderLinesStats } from "@/components/module/admin/purchase-ordeline/stats-dashboard";

export const metadata: Metadata = {
  title: "Purchase Order Lines",
  description: "Manage your purchase order lines",
};

async function refreshData() {
  "use server";
  revalidatePath("/admin/purchase-orderline");
}

// Extract the poId from the search params for filtering
interface PageProps {
  searchParams: { poId?: string };
}

export default async function PurchaseOrderLinesPage({
  searchParams,
}: PageProps) {
  const poId = searchParams.poId;

  // Fetch data with optional filtering
  const [purchaseOrderLines, materials, purchaseOrders] = await Promise.all([
    getPurchaseOrderLines(poId), // Pass poId to filter by purchase order if specified
    getAllMaterials(),
    getPurchaseOrders(),
  ]);

  // Find the purchase order details if poId is provided
  const selectedPurchaseOrder = poId
    ? purchaseOrders.find((order) => order.id === poId)
    : null;

  return (
    <div className="container mx-auto py-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            {selectedPurchaseOrder
              ? `Order Lines for ${selectedPurchaseOrder.poNumber}`
              : "Purchase Order Lines Management"}
          </h1>
          {selectedPurchaseOrder && (
            <p className="text-muted-foreground mt-1">
              Supplier: {selectedPurchaseOrder.supplier.name}
            </p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <CreateOrderLineDialog
            materials={materials}
            purchaseOrders={purchaseOrders}
            poId={poId}
            onSuccess={refreshData}
          />
        </div>
      </div>

      {/* Stats Dashboard */}
      <div className="mt-6">
        <PurchaseOrderLinesStats
          orderLines={purchaseOrderLines}
          purchaseOrders={purchaseOrders}
          selectedPoId={poId}
        />
      </div>

      <div className="mt-8">
        <Card>
          <CardHeader>
            <CardTitle>
              {selectedPurchaseOrder
                ? `Order Lines for ${selectedPurchaseOrder.poNumber}`
                : "All Purchase Order Lines"}
            </CardTitle>
            <CardDescription>
              {selectedPurchaseOrder
                ? `Manage order lines for purchase order ${selectedPurchaseOrder.poNumber}`
                : "Manage and monitor your purchase order lines across all orders"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <PurchaseOrderLineDataTable
              data={purchaseOrderLines}
              materials={materials}
              purchaseOrders={purchaseOrders}
              selectedPoId={poId}
              onSuccess={refreshData}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
