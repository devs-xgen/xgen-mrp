import { Metadata } from "next";
import { CustomerDataTable } from '@/components/module/admin/customers/data-table'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle
} from '@/components/ui/card'
import { CreateCustomerDialog } from '@/components/module/admin/customers/create-customer-dialog'
import { getAllCustomers } from "@/lib/actions/customers"

export const metadata: Metadata = {
  title: "Customers",
  description: "Manage your customers and their information",
};

export default async function CustomersPage() {
  const customers = await getAllCustomers();

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
          <CreateCustomerDialog />
        </div>
      </div>

      {/* Data Table - Following Design System Pattern */}
      <Card className="bg-card border rounded-lg">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg">All Customers</CardTitle>
        </CardHeader>
        <CardContent>
          <CustomerDataTable data={customers} />
        </CardContent>
      </Card>
    </div>
  )
}
