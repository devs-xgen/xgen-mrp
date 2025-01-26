// src/app/admin/(protected)/purchase-order/page.tsx

import { Metadata } from "next";
import { ProductDataTable } from "@/components/module/admin/purchase-orders/data-table";
import { CreatePurchaseOrderDialog } from "@/components/module/admin/purchase-orders/create-purchase-dialog";
import { SupplierManagement } from "@/components/module/admin/suppliers/supplier-management";
import { MaterialDialog } from "@/components/module/admin/materials/material-management";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  addPurchaseOrderLine,
  getPurchaseOrderLines,
  updatePurchaseOrderLine,
} from "@/lib/actions/purchaseorderline";
import { getSuppliers, getMaterials } from "@/lib/actions/materials";
import { revalidatePath } from "next/cache";

async function refreshData() {
  "use server";
  revalidatePath("/admin/purchase-orders");
}

export default async function PurchaseOrdersPage() {
  // Fetch required data
  const [purchaseOrderLines, suppliers, rawMaterials] = await Promise.all([
    getPurchaseOrderLines(),
    getSuppliers(),
    getMaterials(),
  ]);

  // Transform rawMaterials to match the expected Material type
  const materials = rawMaterials.map((item) => ({
    id: item.unitOfMeasure.id,
    name: item.unitOfMeasure.name,
    symbol: item.unitOfMeasure.symbol,
    description: item.unitOfMeasure.description,
    status: item.unitOfMeasure.status,
    category: item.type?.name || "Uncategorized", // Provide a default category if missing
    createdAt: item.unitOfMeasure.createdAt,
    updatedAt: item.unitOfMeasure.updatedAt,
    createdBy: item.unitOfMeasure.createdBy,
    modifiedBy: item.unitOfMeasure.modifiedBy,
  }));

  return (
    <div className="container mx-auto py-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">
          Purchase Orders Management
        </h1>
        <div className="flex items-center gap-2">
          {/* Supplier Management */}
          <SupplierManagement suppliers={suppliers} onSuccess={refreshData} />
          
          {/* Material Dialog */}
          <MaterialDialog materials={materials} onSuccess={refreshData} />
          
          {/* Create Purchase Order Dialog */}
          <CreatePurchaseOrderDialog
            suppliers={suppliers}
            materials={materials}
            onSuccess={refreshData}
          />
        </div>
      </div>

      <div className="mt-8">
        <Card>
          <CardHeader>
            <CardTitle>Purchase Orders</CardTitle>
            <CardDescription>
              Manage and monitor your purchase orders
            </CardDescription>
          </CardHeader>
          <CardContent>
            {/* Product Data Table */}
            <ProductDataTable
              data={purchaseOrderLines}
              suppliers={suppliers}
              materials={materials}
              onSuccess={refreshData}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
