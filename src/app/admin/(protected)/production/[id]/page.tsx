
import { ArrowLeft } from "lucide-react"
import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import { Button } from "@/components/ui/button"
import { getDeliveryUsers } from "@/lib/actions/delivery/delivery-assignment"
import { getActiveInspectors } from "@/lib/actions/inspector"
import { getProductionOrderWithPhaseStatus } from "@/lib/actions/production-order"
import { convertDecimals } from "@/lib/convertDecimals"
import { getAvailableWorkCenters } from "@/lib/actions/inspector/production-order"
import { ProductionOrderDetails } from "@/components/module/admin/production/production-order-details"
import { ProductionOrderHeaderActions } from "./production-order-header-actions"
import {
  PageContainer,
  PageHeader,
  PageHeaderMain,
  PageHeaderActions,
  PageTitle,
  PageDescription,
  SectionCard,
} from "@/components/shared/page-layout"

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

  // Get enhanced production order data with phase status
  const [orderDataRaw, workCenters, deliveryUsers] = await Promise.all([
    getProductionOrderWithPhaseStatus(id),
    getAvailableWorkCenters(),
    getDeliveryUsers(),
  ])

  if (!orderDataRaw) notFound()

  // Convert Decimal fields to numbers for client component compatibility
  const orderData = convertDecimals(orderDataRaw)
  console.log("Enhanced order data with phase status:", JSON.stringify(orderData, null, 2))

  const allInspectors = await getActiveInspectors() // fetch once
  const inspectorsMap = new Map()
  for (const inspector of allInspectors) {
    inspectorsMap.set(inspector.inspectorId, `${inspector.firstName} ${inspector.lastName}`)
  }

  // Transform the data to include all required properties (Decimals already converted)
  const order = {
    ...orderData,

    // Transform qualityChecks to include all required properties
    qualityChecks: orderData.qualityChecks.map((check: any) => ({
      id: check.id,
      productionOrderId: check.productionOrderId,
      inspectorId: check.inspectorId,
      inspectorName: inspectorsMap.get(check.inspectorId) || "Unknown",
      checkDate: check.checkDate, // Removed .toISOString()
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

    // Use the enhanced delivery info and map it to deliveryAssignment
    deliveryAssignment: orderData.deliveryInfo, // Ensure this matches the expected type in ProductionOrderDetails
  }

  return (
    <PageContainer className="mx-auto max-w-6xl space-y-6">
      <PageHeader className="flex-col gap-4 rounded-2xl border border-border bg-gradient-to-br from-primary/5 via-background to-secondary/10 p-5 shadow-sm lg:flex-row lg:items-center lg:justify-between">
        <PageHeaderMain className="w-full space-y-4">
          <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
            <Link href="/admin/production">
              <Button
                variant="outline"
                size="icon"
                className="h-9 w-9 rounded-full border-border text-muted-foreground hover:text-foreground"
                aria-label="Back to production list"
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <span className="truncate">
              Production / Order #{order.id.substring(0, 8)}
            </span>
            {order.productVariant && (
              <span className="text-xs text-muted-foreground/80">
                Variant: {order.productVariant.sku}
              </span>
            )}
          </div>

          <div>
            <PageTitle className="text-foreground text-2xl leading-tight md:text-3xl">
              {order.product.name}
              {order.productVariant && (
                <span className="text-lg font-normal text-muted-foreground">
                  {` – ${order.productVariant.displayName}`}
                </span>
              )}
            </PageTitle>
            <PageDescription>
              Priority {order.priority.toLowerCase()} • Status {order.status.replaceAll("_", " ")}
            </PageDescription>
          </div>
        </PageHeaderMain>

        <PageHeaderActions className="w-full justify-stretch gap-3 lg:w-auto">
          <ProductionOrderHeaderActions
            productionOrderId={orderData.id}
            currentStatus={orderData.status}
            productLabel={`${orderData.product.name}${orderData.productVariant ? ` - ${orderData.productVariant.displayName}` : ""}`}
            qrOrderData={{
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
                address: orderData.deliveryInfo?.deliveryAddress || "Not Assigned",
                contactName: orderData.deliveryInfo?.userName || "Not Assigned",
                contactPhone: "Not Assigned",
                estimatedDelivery: orderData.deliveryInfo?.scheduledDate || new Date(),
                instructions: orderData.deliveryInfo?.notes || "Not Assigned",
              },
              assignments: {
                qualityInspector: order.qualityChecks?.[0]?.inspectorName || "Not Assigned",
                logisticsCoordinator: orderData.deliveryInfo?.userName || "Not Assigned",
              },
            }}
          />
        </PageHeaderActions>
      </PageHeader>

      <SectionCard
        heading="Order Overview"
        className="border border-border bg-card/90 shadow-sm"
        contentClassName="pt-6"
      >
        <ProductionOrderDetails
          order={order as any}
          workCenters={workCenters}
          deliveryUsers={deliveryUsers}
        />
      </SectionCard>
    </PageContainer>
  )
}
