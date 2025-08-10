import { Metadata } from "next";
import { SupplierDataTable } from '@/components/module/admin/suppliers/data-table'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle
} from '@/components/ui/card'
import { CreateSupplierDialog } from '@/components/module/admin/suppliers/create-supplier-dialog'
import { getAllSuppliers } from "@/lib/actions/suppliers"

export const metadata: Metadata = {
  title: "Suppliers",
  description: "Manage your suppliers and vendor relationships",
};

export default async function SuppliersPage() {
  const suppliers = await getAllSuppliers();

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      {/* Page Header - Following Sales Invoices Pattern */}
      <div className="flex items-center justify-between space-y-2">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Suppliers</h2>
          <p className="text-muted-foreground mt-1">
            Manage your suppliers and vendor relationships
          </p>
        </div>
        <div className="flex items-center gap-2">
          <CreateSupplierDialog />
        </div>
      </div>

      {/* Data Table - Following Design System Pattern */}
      <Card className="bg-card border rounded-lg">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg">All Suppliers</CardTitle>
        </CardHeader>
        <CardContent>
          <SupplierDataTable data={suppliers} />
        </CardContent>
      </Card>
    </div>
  )
}
