// src/app/inspector/(protected)/request/[id]/page.tsx
import { ArrowLeft } from "lucide-react";
import { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ProductionOrderDetails } from "@/components/module/inspectors/request/production-order-details";
import { ProductionQRGenerator } from "@/components/module/inspectors/request/production-qr-generator";
import { Button } from "@/components/ui/button";
import { getDeliveryUsers, getDeliveryAssignment } from "@/lib/actions/delivery/delivery-assignment";
import { getActiveInspectors } from "@/lib/actions/inspector";
import { getProductionOrder, getAvailableWorkCenters } from "@/lib/actions/inspector/production-order";

interface ProductionOrderPageProps {
  params: Promise<{
    id: string;
  }>;
}

export async function generateMetadata({
  params,
}: ProductionOrderPageProps): Promise<Metadata> {
  const order = await getProductionOrder(id);
  if (!order) return { title: "Production Order Not Found" };

  return {
    title: `Production Order - ${order.product.name}`,
    description: `Details for production order of ${order.quantity} units of ${order.product.name}`,
  };
}

export default async function ProductionOrderPage({
  params,
}: ProductionOrderPageProps) {
  const { id } = await params;
  const [orderData, workCenters, deliveryUsers, deliveryAssignment] =
    await Promise.all([
      getProductionOrder(id),
      getAvailableWorkCenters(),
      getDeliveryUsers(),
      getDeliveryAssignment(id),
    ]);

  if (!orderData) notFound();

  // Remove debug logs
  console.log(
    "Original quality checks data:",
    JSON.stringify(orderData.qualityChecks, null, 2)
  );

  const allInspectors = await getActiveInspectors(); // fetch once
  const inspectorsMap = new Map();

  for (const inspector of allInspectors) {
    inspectorsMap.set(inspector.inspectorId, `${inspector.firstName} ${inspector.lastName}`);
  }

  // Transform the qualityChecks to include all required properties
  const order = {
    ...orderData,
    qualityChecks: orderData.qualityChecks.map((check) => ({
      id: check.id,
      productionOrderId: check.productionOrderId,
      inspectorId: check.inspectorId,
      inspectorName: inspectorsMap.get(check.inspectorId) || "Unknown",
      checkDate: check.checkDate.toISOString(),
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
    deliveryAssignment: deliveryAssignment,
  };

  return (
    <div className="container mx-auto px-4 py-6 max-w-7xl">
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center">
          <Link href="/inspector/request" className="mr-4">
            <Button variant="ghost" size="sm" className="h-9 w-9 rounded-full p-0 mr-2">
              <ArrowLeft className="h-5 w-5" />
              <span className="sr-only">Back</span>
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              {order.product.name}
            </h1>
            <p className="text-muted-foreground">
              Production Order #{order.id.substring(0, 8)}
            </p>
          </div>
        </div>
        
        <ProductionQRGenerator
          order={{
            id: orderData.id,
            product: {
              name: orderData.product.name,
              sku: orderData.product.sku,
            },
            quantity: orderData.quantity,
            startDate: orderData.startDate,
            dueDate: orderData.dueDate,
            status: orderData.status,
            priority: orderData.priority,
            delivery: {
              address: deliveryAssignment?.deliveryAddress || "Not Assigned",
              contactName: deliveryAssignment?.userName || "Not Assigned",
              contactPhone: "Not Assigned",
              estimatedDelivery: deliveryAssignment?.scheduledDate || new Date(),
              instructions: deliveryAssignment?.notes || "Not Assigned"
            },
            assignments: {
              qualityInspector: order.qualityChecks?.[0]?.inspectorName || "Not Assigned",
              logisticsCoordinator: deliveryAssignment?.userName || "Not Assigned"
            }
          }}
        />
      </div>

      <div className="grid grid-cols-1 gap-6">
        <ProductionOrderDetails
          order={order as any}
          workCenters={workCenters}
          deliveryUsers={deliveryUsers}
        />
      </div>
    </div>
  );
}
