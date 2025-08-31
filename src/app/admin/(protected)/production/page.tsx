// src/app/admin/(protected)/production/page.tsx
import { Metadata } from "next";
import {
  getProductionOrders,
} from "@/lib/actions/production-order";
import { columns } from "@/components/module/admin/production/columns";
import { DataTable, getTableConfig } from "@/components/global/table";
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
import { convertDecimals } from "@/lib/convertDecimals";

import { FloatingChatbox } from "@/components/global/floating-chatbox";

export const metadata: Metadata = {
  title: "Production Orders",
  description: "Manage production orders and manufacturing processes",
};

export default async function ProductionOrdersPage() {
  const ordersRaw = await getProductionOrders();

  // Convert Decimal fields to numbers for client component compatibility
  const orders = convertDecimals(ordersRaw);

  // Transform orders data for the table (Decimals already converted)
  const tableData = orders.map((order: any) => ({
    id: order.id,
    productName: order.product.name,
    productSku: order.product.sku,
    variantDisplayName: order.productVariant?.displayName, // 🆕 ADD: Include variant display name
    quantity: order.quantity,
    startDate: order.startDate,
    dueDate: order.dueDate,
    status: order.status,
    priority: order.priority,
    customerOrderNumber: order.customerOrder?.orderNumber,
    progress: order.operations.reduce((acc, op) => {
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

  // Global table configuration for production
  const config = getTableConfig("production");

  // Calculate statistics
  const totalOrders = orders.length;

  // Use type-safe string comparisons
  const statusCounts = {
    COMPLETED: 0,
    IN_PROGRESS: 0,
    PENDING: 0,
  };

  // Count the different statuses
  orders.forEach((order) => {
    if (order.status in statusCounts) {
      statusCounts[order.status as keyof typeof statusCounts]++;
    }
  });

  // Calculate overdue orders
  const overdueOrders = orders.filter((order) => {
    return order.status !== "COMPLETED" && new Date(order.dueDate) < new Date();
  }).length;

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
            value={totalOrders}
            icon="ClipboardList"
            {...analyticsCardVariants.blue}
          />
          <AnalyticsCard
            title="Completed"
            value={statusCounts["COMPLETED"]}
            icon="CheckCircle"
            {...analyticsCardVariants.green}
          />
          <AnalyticsCard
            title="In Progress"
            value={statusCounts["IN_PROGRESS"]}
            icon="AlertTriangle"
            {...analyticsCardVariants.amber}
          />
          <AnalyticsCard
            title="Overdue"
            value={overdueOrders}
            icon="Timer"
            {...analyticsCardVariants.red}
          />
        </div>

        {/* Quick Filters */}
        <div className="flex flex-wrap gap-2">
          <Badge variant="outline" className="cursor-pointer hover:bg-secondary">
            All ({totalOrders})
          </Badge>
          <Badge
            variant="secondary"
            className="cursor-pointer hover:bg-secondary"
          >
            In Progress ({statusCounts["IN_PROGRESS"]})
          </Badge>
          <Badge variant="outline" className="cursor-pointer hover:bg-secondary">
            Pending ({statusCounts["PENDING"]})
          </Badge>
          <Badge variant="outline" className="cursor-pointer hover:bg-secondary">
            Completed ({statusCounts["COMPLETED"]})
          </Badge>
          <Badge
            variant="destructive"
            className="cursor-pointer hover:bg-destructive/90"
          >
            Overdue ({overdueOrders})
          </Badge>
        </div>

        {/* Data Table - Shared Section Card */}
        <SectionCard heading="All Production Orders">
          <DataTable
            columns={columns}
            data={tableData}
            searchKey={config.searchKey}
            searchPlaceholder={config.searchPlaceholder}
            emptyMessage={config.emptyMessage}
            enableSelection={config.enableSelection}
            enableFiltering={config.enableFiltering}
            filterOptions={config.filterOptions}
          />
        </SectionCard>

        {/* Floating Chat Support */}
        <FloatingChatbox />
      </PageBody>
    </PageContainer>
  );
}
