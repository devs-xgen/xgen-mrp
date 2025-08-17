"use client";

import { Customer } from "@prisma/client";
import { useRouter } from "next/navigation";
import { CustomerDataTable } from "./data-table";
import { CreateCustomerDialog } from "./create-customer-dialog";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle
} from "@/components/ui/card";

interface CustomersPageClientProps {
  initialCustomers: Customer[];
}

export function CustomersPageClient({ initialCustomers }: CustomersPageClientProps) {
  const router = useRouter();

  const handleCustomerCreated = async () => {
    // Refresh the page to get updated data
    router.refresh();
  };

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      {/* Page Header - Following Sales Invoices Pattern */}
      <div className="flex items-center justify-between space-y-2">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Customers</h2>
          <p className="text-muted-foreground mt-1">
            Manage your customers and their information
          </p>
        </div>
        <div className="flex items-center gap-2">
          <CreateCustomerDialog onSuccess={handleCustomerCreated} />
        </div>
      </div>

      {/* Data Table - Following Design System Pattern */}
      <Card className="bg-card border rounded-lg">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg">All Customers</CardTitle>
        </CardHeader>
        <CardContent>
          <CustomerDataTable data={initialCustomers} onCustomerUpdated={handleCustomerCreated} />
        </CardContent>
      </Card>
    </div>
  );
}
