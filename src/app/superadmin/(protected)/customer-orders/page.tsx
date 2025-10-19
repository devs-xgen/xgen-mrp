import { Suspense } from "react";
import {
  getAllCustomerOrdersSuperadmin,
  getCustomerOrderStatsSuperadmin,
} from "@/lib/actions/superadmin/customer-order";
import { CustomerOrdersClient } from "@/components/module/superadmin/customer-orders/CustomerOrdersClient";
import { Skeleton } from "@/components/ui/skeleton";

export const metadata = {
  title: "Customer Orders | SuperAdmin",
  description: "Manage customer orders across all tenants",
};

async function CustomerOrdersContent() {
  const [orders, stats] = await Promise.all([
    getAllCustomerOrdersSuperadmin(),
    getCustomerOrderStatsSuperadmin(),
  ]);

  return (
    <CustomerOrdersClient
      initialOrders={orders}
      stats={stats}
    />
  );
}

export default function CustomerOrdersPage() {
  return (
    <div className="flex-1 space-y-6 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Customer Orders</h2>
          <p className="text-muted-foreground">
            View and manage customer orders across all tenants
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
        <CustomerOrdersContent />
      </Suspense>
    </div>
  );
}
