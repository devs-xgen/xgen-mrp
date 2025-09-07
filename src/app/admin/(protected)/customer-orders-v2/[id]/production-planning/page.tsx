import { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import { analyzeCustomerOrderStock } from "@/lib/actions/order-analysis";
import { CustomerOrderAnalysisClient } from "@/components/module/admin/customer-orders/analysis/CustomerOrderAnalysisClient";
import { CustomerOrderAnalysisSkeleton } from "@/components/module/admin/customer-orders/analysis/CustomerOrderAnalysisSkeleton";

export const metadata: Metadata = {
  title: "Customer Order Production Planning (V2)",
  description: "Plan production and stock allocation for a specific customer order",
};

interface CustomerOrderV2ProductionPlanningPageProps {
  params: Promise<{ id: string }>;
}

export default async function CustomerOrderV2ProductionPlanningPage({
  params,
}: CustomerOrderV2ProductionPlanningPageProps) {
  const { id } = await params;

  if (!id) {
    notFound();
  }

  try {
    const orderAnalysis = await analyzeCustomerOrderStock(id);

    return (
      <div className="flex flex-col gap-6 p-8">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Production Planning</h2>
            <p className="text-muted-foreground">
              Allocate stock and create production orders for <span className="font-medium">{orderAnalysis.orderNumber}</span>
            </p>
          </div>
        </div>

        <Suspense fallback={<CustomerOrderAnalysisSkeleton />}> 
          <CustomerOrderAnalysisClient 
            orderAnalysis={orderAnalysis} 
            orderId={id}
            backHref="/admin/customer-orders-v2"
          />
        </Suspense>
      </div>
    );
  } catch (error) {
    console.error("Error loading customer order production planning (V2):", error);
    notFound();
  }
}
