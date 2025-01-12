import { Metadata } from "next"
import { CustomerDataTable } from "@/components/module/admin/customers/customer-data-table"
import { CreateCustomerDialog } from "@/components/module/admin/customers/create-customer-dialog"
import { db } from "@/lib/db"

export const metadata: Metadata = {
  title: "Customers Management",
  description: "Manage your customers",
}

export default async function CustomersPage() {
  // Fetch customers from the database
  const customers = await db.customer.findMany({
    orderBy: {
      createdAt: 'desc'
    }
  })

  return (
    <div className="flex flex-col gap-5 p-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Customers</h1>
          <p className="text-muted-foreground">
            Manage your customer accounts here
          </p>
        </div>
        <CreateCustomerDialog />
      </div>
      <CustomerDataTable data={customers} />
    </div>
  )
}
