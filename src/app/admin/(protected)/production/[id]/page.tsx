// src/app/admin/(protected)/production/[id]/page.tsx
import { notFound } from "next/navigation";
import { Metadata } from "next";
import {
  getProductionOrder,
  getAvailableWorkCenters,
} from "@/lib/actions/production-order";
import { ProductionOrderDetails } from "@/components/module/admin/production/production-order-details";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { getInspector } from "@/lib/actions/inspector";

interface ProductionOrderPageProps {
  params: {
    id: string;
  };
}

export async function generateMetadata({
  params,
}: ProductionOrderPageProps): Promise<Metadata> {
  const order = await getProductionOrder(params.id);
  if (!order) return { title: "Production Order Not Found" };

  return {
    title: `Production Order - ${order.product.name}`,
    description: `Details for production order of ${order.quantity} units of ${order.product.name}`,
  };
}

export default async function ProductionOrderPage({
  params,
}: ProductionOrderPageProps) {
  const [orderData, workCenters] = await Promise.all([
    getProductionOrder(params.id),
    getAvailableWorkCenters(),
  ]);

  if (!orderData) notFound();

  console.log(
    "Original quality checks data:",
    JSON.stringify(orderData.qualityChecks, null, 2)
  );

  // Fetch inspectors data
  const inspectorsMap = new Map();

  // Get inspector names for all checks
  for (const check of orderData.qualityChecks) {
    if (!inspectorsMap.has(check.inspectorId)) {
      try {
        const inspector = await getInspector(check.inspectorId);
        inspectorsMap.set(
          check.inspectorId,
          `${inspector.firstName} ${inspector.lastName}`
        );
      } catch (error) {
        console.error(`Error fetching inspector ${check.inspectorId}:`, error);
        inspectorsMap.set(check.inspectorId, "Unknown Inspector");
      }
    }
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
  };

  return (
    <div className="flex flex-col gap-6 p-8">
      <div className="flex items-center gap-4">
        <Link href="/admin/production">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Production Orders
          </Button>
        </Link>
      </div>

      <ProductionOrderDetails order={order as any} workCenters={workCenters} />
    </div>
  );
}
