// pages/admin/purchase-orderline/index.tsx (Server Component)
import { Metadata } from "next";
import { PurchaseOrderLineDataTable } from "@/components/module/admin/purchase-ordeline/data-table";
// import { CreatePurchaseOrderLineDialog } from "@/components/module/admin/purchase-ordeline/create-orderline-dialog";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getPurchaseOrderLines } from "@/lib/actions/purchaseorderline";
import { getAllMaterials } from "@/lib/actions/materials";
import { revalidatePath } from "next/cache";

export const metadata: Metadata = {
  title: "Purchase Order Lines",
  description: "Manage your purchase order lines",
};

async function refreshData() {
  "use server";
  revalidatePath("/admin/purchase-orderline");
}

export default async function PurchaseOrderLinesPage() {
  const [purchaseOrderLines, materials] = await Promise.all([
    getPurchaseOrderLines(),
    getAllMaterials(),
  ]);

  return (
    <div className="container mx-auto py-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">
          Purchase Order Lines Management
        </h1>
        <div className="flex items-center gap-2">
          {/* <CreatePurchaseOrderLineDialog materials={materials} onSuccess={refreshData} /> */}
        </div>
      </div>

      <div className="mt-8">
        <Card>
          <CardHeader>
            <CardTitle>Purchase Order Lines</CardTitle>
            <CardDescription>
              Manage and monitor your purchase order lines
            </CardDescription>
          </CardHeader>
          <CardContent>
            <PurchaseOrderLineDataTable
              data={purchaseOrderLines}
              materials={materials}
              onSuccess={refreshData}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
