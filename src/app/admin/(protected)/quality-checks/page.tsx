import { Metadata } from "next";
import {
  getQualityChecks,
  getAvailableProductionOrders,
} from "@/lib/actions/quality-checks";
import { columns } from "@/components/module/admin/quality-checks/columns";
import { DataTable } from "@/components/module/admin/quality-checks/data-table";
import { CreateCheckDialog } from "@/components/module/admin/quality-checks/create-check-dialog";
import { QualityMetricsDisplay } from "@/components/module/admin/quality-checks/quality-metrics";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata: Metadata = {
  title: "Quality Control",
  description: "Manage quality control inspections and reports",
};

export default async function QualityChecksPage() {
  // Fetch quality checks and available production orders
  const [checks, productionOrders] = await Promise.all([
    getQualityChecks(),
    getAvailableProductionOrders(),
  ]);

  // Transform data for the table
  const tableData = checks.map((check) => ({
    id: check.id,
    checkDate: check.checkDate,
    productName: check.productionOrder.product.name,
    productSku: check.productionOrder.product.sku,
    status: check.status,
    inspectorName: "Admin", // This would normally come from user data
    defectsFound: check.defectsFound,
    actionTaken: check.actionTaken,
  }));

  return (
    <div className="flex flex-col gap-6 p-8">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Quality Control</h2>
          <p className="text-muted-foreground">
            Manage and track quality inspections for production orders
          </p>
        </div>
        <CreateCheckDialog productionOrders={productionOrders} />
      </div>

      {/* Quality metrics section */}
      <QualityMetricsDisplay />

      {/* Quality checks table */}
      <Card>
        <CardHeader>
          <CardTitle>Quality Checks</CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable columns={columns} data={tableData} />
        </CardContent>
      </Card>
    </div>
  );
}
