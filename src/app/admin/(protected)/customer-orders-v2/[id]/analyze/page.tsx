import { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import { analyzeCustomerOrderStock } from "@/lib/actions/order-analysis";
import { CustomerOrderAnalysisClient } from "@/components/module/admin/customer-orders/analysis/CustomerOrderAnalysisClient";
import { CustomerOrderAnalysisSkeleton } from "@/components/module/admin/customer-orders/analysis/CustomerOrderAnalysisSkeleton";

export const metadata: Metadata = {
  title: "Customer Order Analysis (V2)",
  description: "Analyze customer order for stock availability and production planning",
};

interface CustomerOrderV2AnalysisPageProps {
  params: {
    id: string;
  };
}

export default async function CustomerOrderV2AnalysisPage({
  params,
}: CustomerOrderV2AnalysisPageProps) {
  const { id } = params;

  if (!id) {
    notFound();
  }

  try {
    const orderAnalysis = await analyzeCustomerOrderStock(id);

    return (
      <div className="flex flex-col gap-6 p-8">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Order Analysis</h2>
            <p className="text-muted-foreground">
              Bridge between customer order and production planning. Review stock availability
              and decide fulfillment strategy for {" "}
              <span className="font-medium">{orderAnalysis.orderNumber}</span>
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
    console.error("Error loading customer order analysis (V2):", error);
    notFound();
  }
}
