// src/app/admin/(protected)/purchase-orders/page.tsx
import { Metadata } from "next"
import { DataTable } from "@/components/module/admin/purchase-orders/data-table"
import { columns } from "@/components/module/admin/purchase-orders/columns"
import { CreatePurchaseOrderDialog } from "@/components/module/admin/purchase-orders/create-dialog"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { getPurchaseOrders } from "@/lib/actions/purchase-order"
import { getPurchaseOrderLines } from "@/lib/actions/purchaseorderline"

export const metadata: Metadata = {
  title: "Purchase Orders | Admin Dashboard",
  description: "Manage your purchase orders and order lines",
}

export default async function PurchaseOrdersPage() {
  // Fetch purchase orders and their lines
  const purchaseOrders = await getPurchaseOrders()
  const purchaseOrderLines = await getPurchaseOrderLines()

  return (
    <div className="flex flex-col gap-6 p-8">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Purchase Orders</h2>
          <p className="text-muted-foreground">
            Manage and track all purchase orders
          </p>
        </div>
        <CreatePurchaseOrderDialog />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Purchase Orders</CardTitle>
          <CardDescription>
            A list of all purchase orders and their current status
          </CardDescription>
        </CardHeader>
        <CardContent>
          <DataTable 
            columns={columns} 
            data={purchaseOrders}
            orderLines={purchaseOrderLines} 
          />
        </CardContent>
      </Card>
    </div>
  )
}