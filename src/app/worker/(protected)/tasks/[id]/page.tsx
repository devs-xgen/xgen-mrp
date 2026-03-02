import { ArrowLeft } from "lucide-react"
import type { Metadata } from "next"
import dynamic from "next/dynamic"
import Link from "next/link"
import { notFound } from "next/navigation"
import { Button } from "@/components/ui/button"
import { getDeliveryUsers } from "@/lib/actions/delivery/delivery-assignment"
import { getActiveInspectors } from "@/lib/actions/inspector"
import { getProductionOrderWithPhaseStatus } from "@/lib/actions/production-order"
import { convertDecimals } from "@/lib/convertDecimals"
import { getAvailableWorkCenters } from "@/lib/actions/inspector/production-order"
import { ProductionOrderDetails } from "@/components/module/worker/tasks/production-order-details"
import { getCurrentUserRole } from "@/lib/actions/worker/get-user-role" // Removed canAccessProductionOrder

const ProductionQRGenerator = dynamic(
  () =>
    import("@/components/module/worker/tasks/production-qr-generator").then(
      (mod) => mod.ProductionQRGenerator
    ),
  {
    loading: () => <Button variant="outline" size="sm" disabled>Loading QR...</Button>,
  }
)

const ProductionWorkflowProgressButton = dynamic(
  () =>
    import("@/components/module/admin/production/production-workflow-progress-button").then(
      (mod) => mod.ProductionWorkflowProgressButton
    ),
  {
    loading: () => <Button variant="outline" size="sm" disabled>Loading status...</Button>,
  }
)

interface ProductionOrderPageProps {
  params: Promise<{
    id: string
  }>
}

export async function generateMetadata({ params }: ProductionOrderPageProps): Promise<Metadata> {
  const { id } = await params
  const orderData = await getProductionOrderWithPhaseStatus(id)
  if (!orderData) return { title: "Production Order Not Found" }
  return {
    title: `Production Order - ${orderData.product.name}`,
    description: `Details for production order of ${orderData.quantity} units of ${orderData.product.name}`,
  }
}

export default async function ProductionOrderPage({ params }: ProductionOrderPageProps) {
  const { id } = await params

  // Get current user role and permissions
  const currentUser = await getCurrentUserRole()

  if (!currentUser) {
    // User not authenticated, redirect to login
    notFound()
  }

  // Get enhanced production order data with phase status
  const [orderDataRaw, workCenters, deliveryUsers] = await Promise.all([
    getProductionOrderWithPhaseStatus(id),
    getAvailableWorkCenters(),
    getDeliveryUsers(),
  ])

  if (!orderDataRaw) {
    // 404 if the order doesn't exist. This is the only remaining data check.
    notFound()
  }

  // === REMOVED THE canAccessProductionOrder CHECK HERE ===
  /*
  const hasAccess = await canAccessProductionOrder(id, currentUser) 
  if (!hasAccess) {
      notFound()
  }
  */
  // =======================================================

  // Convert Decimal fields to numbers for client component compatibility
  const orderData = convertDecimals(orderDataRaw)

  const allInspectors = await getActiveInspectors()
  const inspectorsMap = new Map()
  for (const inspector of allInspectors) {
    inspectorsMap.set(inspector.inspectorId, `${inspector.firstName} ${inspector.lastName}`)
  }

  // Transform the data to include all required properties
  const order = {
    ...orderData,

    // Transform qualityChecks to include all required properties
    qualityChecks: orderData.qualityChecks.map((check: any) => ({
      id: check.id,
      productionOrderId: check.productionOrderId,
      inspectorId: check.inspectorId,
      inspectorName: inspectorsMap.get(check.inspectorId) || "Unknown",
      checkDate: check.checkDate,
      status: check.status,
      defectsFound: check.defectsFound,
      actionTaken: check.actionTaken,
      notes: check.notes,
      createdAt: check.createdAt,
      updatedAt: check.updatedAt,
      productionOrder: {
        product: {
          name: orderData.product.name,
          sku: orderData.product.sku,
        },
      },
    })),

    // FIX 1: The delivery data is now under 'delivery' (lowercase)
    // Use the enhanced delivery info and map it to deliveryAssignment
    deliveryAssignment: orderData.delivery,
  }

  // Check if user can see certain actions based on role
  // RBAC for buttons/sections is still controlled here:
  const canManageWorkflow = currentUser.role === "ADMIN"
  const canGenerateQR = currentUser.role === "ADMIN" || currentUser.role === "DELIVERY"

  // Show role indicator for workers
  const isWorkerTask = currentUser.role === "WORKER" && currentUser.workCenterId &&
    orderData.operations.some((op: any) => op.workCenterId === currentUser.workCenterId)

  return (
    <div className="container mx-auto px-4 py-6 max-w-7xl">
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center">
          <Link href="/worker/tasks" className="mr-4">
            <Button variant="ghost" size="sm" className="h-9 w-9 rounded-full p-0 mr-2">
              <ArrowLeft className="h-5 w-5" />
              <span className="sr-only">Back</span>
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
              {order.product.name}
              {order.productVariant && (
                <span className="text-lg font-normal text-muted-foreground">
                  {" "}- {order.productVariant.displayName}
                </span>
              )}
            </h1>
            <p className="text-muted-foreground">
              Production Order #{order.id.substring(0, 8)}
              {order.productVariant && (
                <span className="ml-2 text-xs">(Variant: {order.productVariant.sku})</span>
              )}
              {isWorkerTask && (
                <span className="ml-2 text-xs bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 px-2 py-0.5 rounded">
                  Your Task
                </span>
              )}
              {currentUser.workCenterName && (
                <span className="ml-2 text-xs text-muted-foreground">
                  • {currentUser.workCenterName}
                </span>
              )}
            </p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          {canManageWorkflow && (
            <ProductionWorkflowProgressButton
              productionOrderId={orderData.id}
              currentStatus={orderData.status}
              className="sm:w-auto"
            />
          )}

          {canGenerateQR && (
            <ProductionQRGenerator
              order={{
                id: orderData.id,
                product: {
                  name: orderData.product.name,
                  sku: orderData.product.sku,
                },
                productVariant: orderData.productVariant
                  ? {
                      displayName: orderData.productVariant.displayName,
                      sku: orderData.productVariant.sku,
                    }
                  : undefined,
                quantity: orderData.quantity,
                startDate: orderData.startDate,
                dueDate: orderData.dueDate,
                status: orderData.status,
                priority: orderData.priority,
                delivery: {
                  // FIX 2a, 2b: Changed deliveryInfo to delivery
                  address: orderData.delivery?.deliveryAddress || "Not Assigned", 
                  contactName: orderData.delivery?.userName || "Not Assigned", 
                  contactPhone: "Not Assigned",
                  // FIX 2c, 2d: Changed deliveryInfo to delivery
                  estimatedDelivery: orderData.delivery?.scheduledDate || new Date(), 
                  instructions: orderData.delivery?.notes || "Not Assigned", 
                },
                assignments: {
                  qualityInspector: order.qualityChecks?.[0]?.inspectorName || "Not Assigned",
                  // FIX 3: Changed deliveryInfo to delivery
                  logisticsCoordinator: orderData.delivery?.userName || "Not Assigned", 
                },
              }}
            />
          )}
        </div>
      </div>

      {/* Production Order Details - Full width now with RBAC */}
      <div className="w-full">
        <ProductionOrderDetails
          order={order as any}
          workCenters={workCenters}
          deliveryUsers={deliveryUsers}
          currentUser={currentUser} // Pass current user for RBAC
        />
      </div>
    </div>
  )
}
