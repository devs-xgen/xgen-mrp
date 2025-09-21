// src/app/admin/(protected)/dashboard/page.tsx
"use client";

import {
  WorkflowConnections,
  OrderStatusComparison,
  WorkflowQuickActions,
  TopProductsByOrdersChart,
  TopMaterialsConsumptionChart,
} from "@/components/module/admin/dashboard";

// Import page layout components
import {
  PageContainer,
  PageHeader,
  PageHeaderMain,
  PageTitle,
  PageDescription,
  PageBody,
} from "@/components/shared/page-layout";

export default function AdminDashboard() {
  return (
    <PageContainer>
      {/* Page Header */}
      <PageHeader>
        <PageHeaderMain>
          <PageTitle>Dashboard</PageTitle>
          <PageDescription>
            Overview of your inventory management system
          </PageDescription>
        </PageHeaderMain>
      </PageHeader>

      {/* Page Body */}
      <PageBody>
        <div className="space-y-6">
          {/* Manufacturing Workflow Connections */}
          <WorkflowConnections />

          {/* Order Status Comparison (Customer vs Production) */}
          <OrderStatusComparison />

          {/* Product and Material Insights */}
          <div className="grid gap-6 md:grid-cols-2">
            <TopProductsByOrdersChart />
            <TopMaterialsConsumptionChart />
          </div>

          {/* Quick Actions */}
          <WorkflowQuickActions />
        </div>
      </PageBody>
    </PageContainer>
  );
}
