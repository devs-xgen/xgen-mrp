// src/app/admin/(protected)/dashboard/page.tsx
"use client";

import { useEffect, useState } from "react";
import {
  WorkflowConnections,
  OrderStatusComparison,
  WorkflowQuickActions,
  TopProductsByOrdersChart,
  TopMaterialsConsumptionChart,
  WorkflowPipelineTracker,
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

// Import server actions
import {
  getStats,
  getInventoryAlerts,
  getProductionStatus,
  getQualityMetrics,
  getCustomerOrderStatus,
  getTopProductsByCustomerOrders,
  getTopMaterialsByConsumption,
  getWorkflowPipelineData,
} from "@/lib/actions/dashboard";

export default function AdminDashboard() {
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState<any>(null);

  useEffect(() => {
    let mounted = true;

    async function loadAllDashboardData() {
      try {
        setLoading(true);

        // Fetch ALL data in parallel with a single Promise.all
        const [
          stats,
          inventoryAlerts,
          productionStatus,
          qualityMetrics,
          customerOrderStatus,
          topProducts,
          topMaterials,
          workflowPipeline,
        ] = await Promise.all([
          getStats(),
          getInventoryAlerts(),
          getProductionStatus(),
          getQualityMetrics(),
          getCustomerOrderStatus(),
          getTopProductsByCustomerOrders(),
          getTopMaterialsByConsumption(),
          getWorkflowPipelineData(),
        ]);

        if (!mounted) return;

        setDashboardData({
          stats,
          inventoryAlerts,
          productionStatus,
          qualityMetrics,
          customerOrderStatus,
          topProducts,
          topMaterials,
          workflowPipeline,
        });
      } catch (error) {
        console.error("Failed to load dashboard data:", error);
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    loadAllDashboardData();

    return () => {
      mounted = false;
    };
  }, []);

  if (loading) {
    return (
      <PageContainer>
        <PageHeader>
          <PageHeaderMain>
            <PageTitle>Dashboard</PageTitle>
            <PageDescription>
              Overview of your inventory management system
            </PageDescription>
          </PageHeaderMain>
        </PageHeader>
        <PageBody>
          <div className="flex items-center justify-center h-96">
            <div className="text-center space-y-4">
              <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary mx-auto"></div>
              <p className="text-muted-foreground">Loading dashboard data...</p>
            </div>
          </div>
        </PageBody>
      </PageContainer>
    );
  }

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
          <WorkflowConnections
            initialStats={dashboardData?.stats}
            initialInventoryAlerts={dashboardData?.inventoryAlerts}
            initialProductionStatus={dashboardData?.productionStatus}
            initialQualityMetrics={dashboardData?.qualityMetrics}
          />

          {/* Workflow Pipeline Tracker */}
          <WorkflowPipelineTracker initialData={dashboardData?.workflowPipeline} />

          {/* Order Status Comparison (Customer vs Production) */}
          <OrderStatusComparison
            initialCustomerStatus={dashboardData?.customerOrderStatus}
            initialProductionStatus={dashboardData?.productionStatus}
          />

          {/* Product and Material Insights */}
          <div className="grid gap-6 md:grid-cols-2">
            <TopProductsByOrdersChart initialData={dashboardData?.topProducts} />
            <TopMaterialsConsumptionChart initialData={dashboardData?.topMaterials} />
          </div>

          {/* Quick Actions */}
          <WorkflowQuickActions />
        </div>
      </PageBody>
    </PageContainer>
  );
}
