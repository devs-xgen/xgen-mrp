import { Metadata } from "next";
import {
  getAllProductionOrdersSuperadmin,
  getProductionOrderStatsSuperadmin,
} from "@/lib/actions/superadmin/production-order";
import { convertDecimals } from "@/lib/convertDecimals";
import {
  PageContainer,
  PageHeader,
  PageHeaderMain,
  PageTitle,
  PageDescription,
  PageHeaderActions,
  PageBody,
  SectionCard,
} from "@/components/shared/page-layout";
import { Button } from "@/components/ui/button";
import { Shield, AlertTriangle } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { AnalyticsCard, analyticsCardVariants } from "@/components/ui/analytics-card";
import { SuperadminProductionOrdersTable } from "@/components/module/superadmin/production/SuperadminProductionOrdersTable";
import { SuperadminProductionExportButton } from "@/components/module/superadmin/production/SuperadminProductionExportButton";

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: "Production Orders | Superadmin",
  description: "Manage all production orders with override capabilities",
};

export default async function SuperadminProductionOrdersPage() {
  // Fetch all production orders with full details
  const [ordersRaw, stats] = await Promise.all([
    getAllProductionOrdersSuperadmin(),
    getProductionOrderStatsSuperadmin(),
  ]);

  // Convert Decimal fields
  const orders = convertDecimals(ordersRaw);

  // Transform for table
  const tableData = orders.map((order: any) => ({
    id: order.id,
    productName: order.product.name,
    productSku: order.product.sku,
    variantDisplayName: order.productVariant?.displayName,
    quantity: order.quantity,
    completedQuantity: order.completedQuantity,
    startDate: order.startDate,
    dueDate: order.dueDate,
    status: order.status,
    priority: order.priority,
    customerOrderNumber: order.customerOrder?.orderNumber,
    customerName: order.customerOrder?.customer?.name,
    plannedMaterialCost: order.plannedMaterialCost,
    actualMaterialCost: order.actualMaterialCost,
    materialVariance: order.materialVariance,
    createdAt: order.createdAt,
    updatedAt: order.updatedAt,
    createdBy: order.createdByUser?.email,
    modifiedBy: order.modifiedByUser?.email,
    operationsCount: order.operations.length,
    completedOperations: order.operations.filter((op: any) => op.status === "COMPLETED").length,
    qualityChecksCount: order.qualityChecks.length,
    hasDelivery: !!order.delivery,
    isOverdue: order.status !== "COMPLETED" && new Date(order.dueDate) < new Date(),
  }));

  // Calculate status counts
  const statusCounts = stats.byStatus.reduce((acc: any, item: any) => {
    acc[item.status] = item._count;
    return acc;
  }, {});

  // Calculate priority counts
  const priorityCounts = stats.byPriority.reduce((acc: any, item: any) => {
    acc[item.priority] = item._count;
    return acc;
  }, {});

  // Calculate at-risk orders (overdue or high variance)
  const atRiskOrders = orders.filter((order: any) => {
    const isOverdue = order.status !== "COMPLETED" && new Date(order.dueDate) < new Date();
    const hasHighVariance = Math.abs(order.materialVariance) > 1000;
    return isOverdue || hasHighVariance;
  }).length;

  return (
    <PageContainer>
      {/* Page Header */}
      <PageHeader>
        <PageHeaderMain>
          <div className="flex items-center gap-2">
            <Shield className="h-6 w-6 text-primary" />
            <div>
              <PageTitle>Production Orders (Superadmin)</PageTitle>
              <PageDescription>
                Full system access with override capabilities and unrestricted controls
              </PageDescription>
            </div>
          </div>
        </PageHeaderMain>
        <PageHeaderActions>
          <SuperadminProductionExportButton />
          <Link href="/superadmin/production/create">
            <Button>
              <Shield className="mr-2 h-4 w-4" />
              Create Production Order
            </Button>
          </Link>
        </PageHeaderActions>
      </PageHeader>

      <PageBody className="space-y-6">
        {/* Enhanced Statistics Dashboard */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <AnalyticsCard
            title="Total Orders"
            value={stats.total}
            icon="ClipboardList"
            {...analyticsCardVariants.blue}
          />
          <AnalyticsCard
            title="Completed"
            value={statusCounts["COMPLETED"] || 0}
            icon="CheckCircle"
            {...analyticsCardVariants.green}
          />
          <AnalyticsCard
            title="In Progress"
            value={statusCounts["IN_PROGRESS"] || 0}
            icon="AlertTriangle"
            {...analyticsCardVariants.amber}
          />
          <AnalyticsCard
            title="Overdue"
            value={stats.overdue}
            icon="Timer"
            {...analyticsCardVariants.red}
          />
          <AnalyticsCard
            title="At Risk"
            value={atRiskOrders}
            icon="AlertTriangle"
            {...analyticsCardVariants.orange}
          />
        </div>

        {/* Cost Variance Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <SectionCard heading="Cost Variance Summary">
            <div className="space-y-4 p-4">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Total Variance:</span>
                <span
                  className={`text-lg font-bold ${
                    stats.totalCostVariance > 0
                      ? "text-red-600"
                      : stats.totalCostVariance < 0
                      ? "text-green-600"
                      : "text-muted-foreground"
                  }`}
                >
                  ₱{stats.totalCostVariance.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Average Variance:</span>
                <span className="text-sm text-muted-foreground">
                  ₱{stats.avgMaterialVariance.toLocaleString()}
                </span>
              </div>
            </div>
          </SectionCard>

          <SectionCard heading="Priority Distribution">
            <div className="space-y-2 p-4">
              {["CRITICAL", "URGENT", "HIGH", "MEDIUM", "LOW"].map((priority) => (
                <div key={priority} className="flex justify-between items-center">
                  <Badge
                    variant={
                      priority === "CRITICAL"
                        ? "destructive"
                        : priority === "URGENT"
                        ? "destructive"
                        : "outline"
                    }
                  >
                    {priority}
                  </Badge>
                  <span className="text-sm">{priorityCounts[priority] || 0}</span>
                </div>
              ))}
            </div>
          </SectionCard>
        </div>

        {/* Warning Banner for Override Capabilities */}
        <div className="bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5" />
            <div className="flex-1">
              <h3 className="text-sm font-medium text-amber-900 dark:text-amber-100">
                Superadmin Override Mode Active
              </h3>
              <p className="text-sm text-amber-700 dark:text-amber-300 mt-1">
                You have unrestricted access to all production orders with the ability to override
                statuses, costs, quantities, and dates. All override actions are logged for audit
                purposes.
              </p>
            </div>
          </div>
        </div>

        {/* Enhanced Data Table */}
        <SectionCard heading="All Production Orders">
          <SuperadminProductionOrdersTable data={tableData} />
        </SectionCard>
      </PageBody>
    </PageContainer>
  );
}
