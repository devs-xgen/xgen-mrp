import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ActivityIcon } from "lucide-react"
import { getProductionOrders, getProductionLogs } from "@/lib/actions/production-order"
import { ProductionOrderActivityCard } from "@/components/module/inspectors/production/production-order-activity-card"

export default async function ActivityLogPage() {
  const productionOrders = await getProductionOrders()

  return (
    <div className="flex flex-col gap-6 p-6 md:p-10">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ActivityIcon className="w-6 h-6" />
            Production Order Activity Overview
          </CardTitle>
          <CardDescription>
            A grouped chronological record of significant actions and events, organized by production order.
          </CardDescription>
        </CardHeader>
      </Card>

      <div className="grid grid-cols-1 gap-6">
        {productionOrders.length === 0 ? (
          <Card>
            <CardContent className="text-center py-8 text-muted-foreground">
              No production orders found to display activity logs.
            </CardContent>
          </Card>
        ) : (
          await Promise.all(
            productionOrders.map(async (order) => {
              const activityLogs = await getProductionLogs(order.id)
              return <ProductionOrderActivityCard key={order.id} order={order} activityLogs={activityLogs} />
            }),
          )
        )}
      </div>
    </div>
  )
}

