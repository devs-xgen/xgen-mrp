// src/app/admin/(protected)/production/page.tsx
import { Metadata } from "next";
import {
  getPaginatedProductionOrders,
  getProductionStats,
} from "@/lib/actions/production-order";
import ProductionDataTable from "./production-data-table";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import Link from "next/link";
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
import { Badge } from "@/components/ui/badge";
import { AnalyticsCard, analyticsCardVariants } from "@/components/ui/analytics-card";

import { FloatingChatbox } from "@/components/global/floating-chatbox";

export const metadata: Metadata = {
  title: "Production Orders",
  description: "Manage production orders and manufacturing processes",
};

export default async function ProductionOrdersPage({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined };
}) {
  const page = Number(searchParams.page) || 1;
  const limit = Number(searchParams.limit) || 10;
  const search = typeof searchParams.search === "string" ? searchParams.search : "";

  const [ordersData, stats] = await Promise.all([
    getPaginatedProductionOrders({ page, limit, search }),
    getProductionStats(),
  ]);

  // Transform orders data for the table (Decimals already converted)
  const tableData = ordersData.data.map((order: any) => ({
    id: order.id,
    productName: order.product.name,
    productSku: order.product.sku,
    variantDisplayName: order.productVariant?.displayName,
    quantity: order.quantity,
    startDate: order.startDate,
    dueDate: order.dueDate,
    status: order.status,
    priority: order.priority,
    customerOrderNumber: order.customerOrder?.orderNumber,
    progress: order.operations.reduce((acc: number, op: any) => {
      if (op.status === "COMPLETED") return acc + 100 / order.operations.length;
      if (op.status === "IN_PROGRESS")
        return acc + 50 / order.operations.length;
      return acc;
    }, 0),
    lastUpdated: order.updatedAt,

    // MRP Enhancement Fields (already converted to numbers)
    plannedMaterialCost: order.plannedMaterialCost,
    actualMaterialCost: order.actualMaterialCost,
    materialVariance: order.materialVariance,
    completedQuantity: order.completedQuantity,
  }));

  return (
    <PageContainer>
      {/* Page Header - Shared */}
      <PageHeader>
        <PageHeaderMain>
          <PageTitle>Production Orders</PageTitle>
          <PageDescription>
            Manage and track production orders across your manufacturing process
          </PageDescription>
        </PageHeaderMain>
        <PageHeaderActions>
          <Link href="/admin/production/create">
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Create Production Order
            </Button>
          </Link>
        </PageHeaderActions>
      </PageHeader>

      <PageBody className="space-y-6">
        {/* Production Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <AnalyticsCard
            title="Total Orders"
            value={stats.totalOrders}
            icon="ClipboardList"
            {...analyticsCardVariants.blue}
          />
          <AnalyticsCard
            title="Completed"
            value={stats.completed}
            icon="CheckCircle"
            {...analyticsCardVariants.green}
          />
          <AnalyticsCard
            title="In Progress"
            value={stats.inProgress}
            icon="AlertTriangle"
            {...analyticsCardVariants.amber}
          />
          <AnalyticsCard
            title="Overdue"
            value={stats.overdue}
            icon="Timer"
            {...analyticsCardVariants.red}
          />
        </div>

        {/* Quick Filters */}
        <div className="flex flex-wrap gap-2">
          <Badge variant="outline" className="cursor-pointer hover:bg-secondary">
            All ({stats.totalOrders})
          </Badge>
          <Badge
            variant="secondary"
            className="cursor-pointer hover:bg-secondary"
          >
            In Progress ({stats.inProgress})
          </Badge>
          <Badge variant="outline" className="cursor-pointer hover:bg-secondary">
            Pending ({stats.pending})
          </Badge>
          <Badge variant="outline" className="cursor-pointer hover:bg-secondary">
            Completed ({stats.completed})
          </Badge>
          <Badge
            variant="destructive"
            className="cursor-pointer hover:bg-destructive/90"
          >
            Overdue ({stats.overdue})
          </Badge>
        </div>

        {/* Data Table - Shared Section Card */}
        <SectionCard heading="All Production Orders">
          <ProductionDataTable
            data={tableData}
            metadata={ordersData.metadata}
          />
        </SectionCard>

        {/* Floating Chat Support */}
        <FloatingChatbox />
      </PageBody>
    </PageContainer>
  );
}
