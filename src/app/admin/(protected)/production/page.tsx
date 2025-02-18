// // pages/admin/purchase-orderline/index.tsx (Server Component)
// import { Metadata } from "next";
// import { PurchaseOrderLineDataTable } from "@/components/module/admin/purchase-ordeline/data-table";
// // import { CreatePurchaseOrderLineDialog } from "@/components/module/admin/purchase-ordeline/create-orderline-dialog";
// import {
//   Card,
//   CardContent,
//   CardDescription,
//   CardHeader,
//   CardTitle,
// } from "@/components/ui/card";
// import { getPurchaseOrderLines } from "@/lib/actions/purchaseorderline";
// import { getAllMaterials } from "@/lib/actions/materials";
import { revalidatePath } from "next/cache";

// export const metadata: Metadata = {
//   title: "Purchase Order Lines",
//   description: "Manage your purchase order lines",
// };

async function refreshData() {
  "use server";
  revalidatePath("/admin/production");
}

// // pages/admin/purchase-orderline/index.tsx (Server Component)  

export default async function ProductionOrderPage() {  
  return (  
    <div style={{ backgroundColor: 'white', height: '100vh' }}>  
      {/* Empty white page */}  
    </div>  
  );  
}