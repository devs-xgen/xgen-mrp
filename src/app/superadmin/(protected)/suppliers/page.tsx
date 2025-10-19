import { Suspense } from "react";
import {
  getAllSuppliersSuperadmin,
  getSupplierStatsSuperadmin,
  getAllPurchaseOrdersSuperadmin,
} from "@/lib/actions/superadmin/supplier";
import { SuppliersClient } from "@/components/module/superadmin/suppliers/SuppliersClient";
import { Skeleton } from "@/components/ui/skeleton";

export const metadata = {
  title: "Suppliers & Purchase Orders | SuperAdmin",
  description: "Manage suppliers and purchase orders across all tenants",
};

async function SuppliersContent() {
  const [suppliers, stats, purchaseOrders] = await Promise.all([
    getAllSuppliersSuperadmin(),
    getSupplierStatsSuperadmin(),
    getAllPurchaseOrdersSuperadmin(),
  ]);

  return (
    <SuppliersClient
      initialSuppliers={suppliers}
      initialPurchaseOrders={purchaseOrders}
      stats={stats}
    />
  );
}

export default function SuppliersPage() {
  return (
    <div className="flex-1 space-y-6 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Suppliers & Purchase Orders</h2>
          <p className="text-muted-foreground">
            Manage suppliers and procurement across all tenants
          </p>
        </div>
      </div>

      <Suspense
        fallback={
          <div className="space-y-4">
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-96 w-full" />
          </div>
        }
      >
        <SuppliersContent />
      </Suspense>
    </div>
  );
}
