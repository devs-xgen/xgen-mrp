import { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import { analyzeCustomerOrderStock } from "@/lib/actions/order-analysis";
import { CustomerOrderAnalysisClient } from "@/components/module/admin/customer-orders/analysis/CustomerOrderAnalysisClient";
import { CustomerOrderAnalysisSkeleton } from "@/components/module/admin/customer-orders/analysis/CustomerOrderAnalysisSkeleton";

export const metadata: Metadata = {
  title: "Customer Order Analysis",
  description: "Analyze customer order for stock availability and production planning",
};

interface CustomerOrderAnalysisPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function CustomerOrderAnalysisPage({
  params,
}: CustomerOrderAnalysisPageProps) {
  const { id } = await params;

  if (!id) {
    notFound();
  }

  try {
    // Analyze the customer order
    const orderAnalysis = await analyzeCustomerOrderStock(id);

    return (
      <div className="flex flex-col gap-6 p-8">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Order Analysis</h2>
            <p className="text-muted-foreground">
              Review stock availability and make production planning decisions for{" "}
              <span className="font-medium">{orderAnalysis.orderNumber}</span>
            </p>
          </div>
        </div>

        <Suspense fallback={<CustomerOrderAnalysisSkeleton />}>
          <CustomerOrderAnalysisClient 
            orderAnalysis={orderAnalysis}
            orderId={id}
          />
        </Suspense>
      </div>
    );
  } catch (error) {
    console.error("Error loading customer order analysis:", error);
    notFound();
  }
}
