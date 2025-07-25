import type { Metadata } from "next"
import { Suspense } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Activity, Clock, AlertTriangle } from "lucide-react"
import { ProductionOrderActivityCard } from "@/components/module/admin/production/production-order-activity-card"
import { getProductionOrdersForInspector } from "@/lib/actions/inspectors"
import { getProductionLogs } from "@/lib/actions/production-order"

export const metadata: Metadata = {
  title: "Activity Log",
  description: "View production activity logs and history",
}

// Helper function to serialize Decimal values
function serializeProductionOrder(order: any) {
  return {
    ...order,
    plannedMaterialCost: order.plannedMaterialCost ? Number(order.plannedMaterialCost) : null,
    actualMaterialCost: order.actualMaterialCost ? Number(order.actualMaterialCost) : null,
    materialVariance: order.materialVariance ? Number(order.materialVariance) : null,
    // Handle nested objects if they contain Decimals
    operations:
      order.operations?.map((op: any) => ({
        ...op,
        cost: op.cost ? Number(op.cost) : null,
      })) || [],
    qualityChecks:
      order.qualityChecks?.map((qc: any) => ({
        ...qc,
        // Convert any Decimal fields in quality checks if they exist
      })) || [],
  }
}

export default async function InspectorActivityLogPage() {
  try {
    const productionOrders = await getProductionOrdersForInspector({
      status: undefined, // Get all statuses
    })

    // Serialize the orders to remove Decimal objects
    const serializedOrders = productionOrders.map(serializeProductionOrder)

    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Activity Log</h2>
          <p className="text-muted-foreground">View production activity logs and history for all production orders</p>
        </div>

        {/* Summary Cards */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{serializedOrders.length}</div>
              <p className="text-xs text-muted-foreground">Production orders tracked</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Orders</CardTitle>
              <Clock className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {serializedOrders.filter((order) => order.status === "IN_PROGRESS").length}
              </div>
              <p className="text-xs text-muted-foreground">Currently in progress</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Issues Reported</CardTitle>
              <AlertTriangle className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {serializedOrders.filter((order) => order.status === "ON_HOLD").length}
              </div>
              <p className="text-xs text-muted-foreground">Orders with issues</p>
            </CardContent>
          </Card>
        </div>

        {/* Production Orders with Activity Logs */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium">Production Orders Activity</h3>

          <Suspense
            fallback={
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
                <span className="ml-2">Loading activity logs...</span>
              </div>
            }
          >
            {serializedOrders.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <Activity className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium mb-2">No Production Orders</h3>
                  <p className="text-muted-foreground text-center">
                    No production orders are available for activity tracking.
                  </p>
                </CardContent>
              </Card>
            ) : (
              await Promise.all(
                serializedOrders.map(async (order) => {
                  // Fetch logs for each order using the inspector's action
                  const activityLogs = await getProductionLogs(order.id)
                  return <ProductionOrderActivityCard key={order.id} order={order} activityLogs={activityLogs} />
                }),
              )
            )}
          </Suspense>
        </div>
      </div>
    )
  } catch (error) {
    console.error("Error loading activity log page:", error)

    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Activity Log</h2>
          <p className="text-muted-foreground">View production activity logs and history for all production orders</p>
        </div>

        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6 flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-red-500 mt-0.5" />
            <div>
              <p className="font-medium text-red-800">Error Loading Activity Logs</p>
              <p className="text-sm text-red-700 mt-1">
                There was an error loading the activity logs. Please try refreshing the page.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }
}
