"use client";

import { StatCard } from "@/components/module/superadmin/StatCard";
import {
  Users,
  UserCheck,
  Factory,
  ClipboardList,
  Package,
  Box,
  MessageCircle,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { DashboardAnalytics } from "@/lib/actions/superadmin";
import { ProductionOrdersChart } from "./dashboard/ProductionOrdersChart";
import { InventoryHealthChart } from "./dashboard/InventoryHealthChart";
import { RevenueChart } from "./dashboard/RevenueChart";
import { QualityMetricsCard } from "./dashboard/QualityMetricsCard";
import { TopProductsChart } from "./dashboard/TopProductsChart";
import { MaterialConsumptionChart } from "./dashboard/MaterialConsumptionChart";
import { AlertsCard } from "./dashboard/AlertsCard";

export interface SuperAdminDashboardProps {
  metrics: {
    totalUsers: number;
    activeUsers: number;
    totalCustomers: number;
    totalCustomerOrders: number;
    totalProductionOrders: number;
    totalMaterials: number;
    totalProducts: number;
    openSupportTickets: number;
  };
  analytics: DashboardAnalytics;
}

export default function SuperAdminDashboardClient({ metrics, analytics }: SuperAdminDashboardProps) {
  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Super Admin Dashboard</h1>
        <p className="text-sm text-muted-foreground">System-wide overview and key performance indicators</p>
      </div>

      {/* Key Metrics Stats */}
      <div className={cn("grid gap-4", "grid-cols-1 sm:grid-cols-2 xl:grid-cols-4") }>
        <StatCard title="Total Users" value={metrics.totalUsers} icon={Users} />
        <StatCard title="Active Users" value={metrics.activeUsers} icon={UserCheck} />
        <StatCard title="Customers" value={metrics.totalCustomers} icon={Users} />
        <StatCard title="Support (Open)" value={metrics.openSupportTickets} icon={MessageCircle} />
      </div>

      <div className={cn("grid gap-4", "grid-cols-1 sm:grid-cols-2 xl:grid-cols-4") }>
        <StatCard title="Customer Orders" value={metrics.totalCustomerOrders} icon={ClipboardList} />
        <StatCard title="Production Orders" value={metrics.totalProductionOrders} icon={Factory} />
        <StatCard title="Materials" value={metrics.totalMaterials} icon={Package} />
        <StatCard title="Products" value={metrics.totalProducts} icon={Box} />
      </div>

      {/* Production & Revenue Analytics */}
      <div className="grid gap-6 grid-cols-1 lg:grid-cols-2">
        <ProductionOrdersChart data={analytics.productionOrdersByStatus} />
        <RevenueChart data={analytics.revenueByMonth} />
      </div>

      {/* Quality Metrics & Alerts */}
      <div className="grid gap-6 grid-cols-1 lg:grid-cols-2">
        <QualityMetricsCard data={analytics.qualityMetrics} />
        <AlertsCard
          lowStockAlerts={analytics.lowStockAlerts}
          productionEfficiency={analytics.productionEfficiency}
        />
      </div>

      {/* Inventory & Material Analysis */}
      <div className="grid gap-6 grid-cols-1 lg:grid-cols-2">
        <InventoryHealthChart data={analytics.inventoryHealth} />
        <MaterialConsumptionChart data={analytics.materialConsumption} />
      </div>

      {/* Top Products */}
      <div className="grid gap-6 grid-cols-1">
        <TopProductsChart data={analytics.topProducts} />
      </div>
    </div>
  );
}
