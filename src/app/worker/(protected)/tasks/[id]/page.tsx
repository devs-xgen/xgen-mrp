import { ArrowLeft } from "lucide-react"
import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import { WorkerProductionDetails } from "@/components/module/worker/tasks/worker-production-details-component"
import { Button } from "@/components/ui/button"
import { getProductionOrderWithPhaseStatus } from "@/lib/actions/production-order"
import { convertDecimals } from "@/lib/convertDecimals"
import { getAvailableWorkCenters } from "@/lib/actions/inspector/production-order"
import { ProductionWorkflowWorkerProgressButton } from "@/components/module/worker/tasks/production-workflow-progress-button"

interface ProductionOrderPageProps {
  params: {
    id: string
  }
}

export async function generateMetadata({ params }: ProductionOrderPageProps): Promise<Metadata> {
  const { id } = params
  const orderData = await getProductionOrderWithPhaseStatus(id)
  if (!orderData) return { title: "Production Job Not Found" }

  return {
    title: `Production Job - ${orderData.product.name}`,
    description: `Shop floor details for job of ${orderData.quantity} units of ${orderData.product.name}`,
  }
}

export default async function WorkerProductionOrderPage({ params }: ProductionOrderPageProps) {
  // 1. Extract the ID from the URL parameters
  const { id } = params

  // 2. Fetch necessary data concurrently (Removed inspectors and delivery users)
  const [orderDataRaw, workCenters] = await Promise.all([
    getProductionOrderWithPhaseStatus(id), // Core fetch by ID
    getAvailableWorkCenters(), // Worker needs this for phase execution
  ])

  // Handle case where the order ID does not exist
  if (!orderDataRaw) notFound()

  // 3. Prepare Data for Client Components
  const orderData = convertDecimals(orderDataRaw)

  // 4. Transform data structure (Simplified: removed inspector mapping/quality checks)
  const order = {
    ...orderData,
    // Retain core order data and production phase status only.
    // Explicitly set deliveryAssignment to null/undefined if needed by downstream components
    // to prevent administrative data from displaying.
    deliveryAssignment: null, 
    qualityChecks: [], // Remove complex quality check history for worker focus
  }

  // --- Worker View UI ---
  return (
    <div className="container mx-auto px-4 py-6 max-w-7xl">
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center">
          {/* Updated back link to a hypothetical worker job list */}
          <Link href="/worker/jobs" className="mr-4">
            <Button variant="ghost" size="sm" className="h-9 w-9 rounded-full p-0 mr-2">
              <ArrowLeft className="h-5 w-5" />
              <span className="sr-only">Back to Production Jobs</span>
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
              {order.product.name}
              {order.productVariant && (
                <span className="text-lg font-normal text-muted-foreground"> - {order.productVariant.displayName}</span>
              )}
            </h1>
            <p className="text-muted-foreground">
              Production Job #{order.id.substring(0, 8)}
              {order.productVariant && <span className="ml-2 text-xs">(Variant: {order.productVariant.sku})</span>}
            </p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          {/* The worker uses this button to mark phases as complete */}
          <ProductionWorkflowWorkerProgressButton
            productionOrderId={orderData.id}
            currentStatus={orderData.status}
            className="sm:w-auto"
          />
          {/* ProductionQRGenerator is removed */}
        </div>
      </div>
      
      {/* Production Order Details Component */}
      <div className="w-full">
        <WorkerProductionDetails
          order={order as any} 
          workCenters={workCenters}
        /> {/* <-- CHANGE: Using the new WorkerProductionDetails component */}
      </div>
    </div>
  )
}
