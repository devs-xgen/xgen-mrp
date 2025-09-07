import { Metadata } from "next";
import { getOrdersRequiringAnalysis, getOrderAnalysisSummary } from "@/lib/actions/order-analysis";
import { ProductionPlanningClient } from "@/components/module/admin/production/planning/ProductionPlanningClient";

export const metadata: Metadata = {
  title: "Customer Orders V2 – Production Planning",
  description: "Bulk production planning and order processing for Customer Orders V2",
};

export default async function CustomerOrdersV2ProductionPlanningPage() {
  try {
    const [ordersRequiringAnalysis, analysisSummary] = await Promise.all([
      getOrdersRequiringAnalysis(),
      getOrderAnalysisSummary().catch(() => null),
    ]);

    return (
      <div className="flex flex-col gap-6 p-8">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Customer Orders V2 — Production Planning</h2>
            <p className="text-muted-foreground">
              Bulk production planning and order processing dashboard
            </p>
          </div>
        </div>

        <ProductionPlanningClient 
          ordersRequiringAnalysis={ordersRequiringAnalysis}
          analysisSummary={analysisSummary}
        />
      </div>
    );
  } catch (error) {
    console.error("Error loading Customer Orders V2 production planning:", error);

    return (
      <div className="flex flex-col gap-6 p-8">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Customer Orders V2 — Production Planning</h2>
            <p className="text-muted-foreground">
              Bulk production planning and order processing dashboard
            </p>
          </div>
        </div>

        <div className="flex items-center justify-center h-64">
          <div className="text-center space-y-2">
            <h3 className="text-lg font-medium">Unable to load production planning data</h3>
            <p className="text-muted-foreground">
              There was an error loading the production planning dashboard. Please try again later.
            </p>
          </div>
        </div>
      </div>
    );
  }
}
