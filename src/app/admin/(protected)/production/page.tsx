// src/app/admin/(protected)/production/page.tsx
import { Metadata } from "next"
import { 
  getProductionOrders, 
  getAvailableProducts,
  getAvailableWorkCenters
} from "@/lib/actions/production-order"
import { columns } from "@/components/module/admin/production/columns"
import { DataTable } from "@/components/module/admin/production/data-table"
import { ProductionOrderDialog } from "@/components/module/admin/production/create-production-order-dialog"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export const metadata: Metadata = {
  title: "Production Orders",
  description: "Manage production orders and manufacturing processes",
}

export default async function ProductionOrdersPage() {
  const [orders, products, workCenters] = await Promise.all([
    getProductionOrders(),
    getAvailableProducts(),
    getAvailableWorkCenters()
  ])

  // Transform orders data for the table
  const tableData = orders.map(order => ({
    id: order.id,
    productName: order.product.name,
    productSku: order.product.sku,
    quantity: order.quantity,
    startDate: order.startDate,
    dueDate: order.dueDate,
    status: order.status,
    priority: order.priority,
    customerOrderNumber: order.customerOrder?.orderNumber,
    progress: order.operations.reduce((acc, op) => {
      if (op.status === "COMPLETED") return acc + (100 / order.operations.length)
      if (op.status === "IN_PROGRESS") return acc + (50 / order.operations.length)
      return acc
    }, 0),
    lastUpdated: order.updatedAt
  }))

  return (
    <div className="flex flex-col gap-6 p-8">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Production Orders</h2>
          <p className="text-muted-foreground">
            Manage and track production orders across your manufacturing process
          </p>
        </div>
        <ProductionOrderDialog 
          products={products}
          workCenters={workCenters}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Production Orders</CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable 
            columns={columns} 
            data={tableData}
          />
        </CardContent>
      </Card>
    </div>
  )
}