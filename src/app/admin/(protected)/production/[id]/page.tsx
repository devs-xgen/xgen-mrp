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
  // Fetch both order and work centers in parallel
  const [order, workCenters] = await Promise.all([
    getProductionOrder(params.id),
    getAvailableWorkCenters(),
  ]);

  if (!order) notFound();

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

      <ProductionOrderDetails order={order} workCenters={workCenters} />
    </div>
  );
}
