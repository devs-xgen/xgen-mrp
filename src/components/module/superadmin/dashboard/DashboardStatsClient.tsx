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

interface DashboardStatsClientProps {
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
}

export function DashboardStatsClient({ metrics }: DashboardStatsClientProps) {
  return (
    <>
      {/* Key Metrics Stats */}
      <div className={cn("grid gap-4", "grid-cols-1 sm:grid-cols-2 xl:grid-cols-4")}>
        <StatCard title="Total Users" value={metrics.totalUsers} icon={Users} />
        <StatCard title="Active Users" value={metrics.activeUsers} icon={UserCheck} />
        <StatCard title="Customers" value={metrics.totalCustomers} icon={Users} />
        <StatCard title="Support (Open)" value={metrics.openSupportTickets} icon={MessageCircle} />
      </div>

      <div className={cn("grid gap-4", "grid-cols-1 sm:grid-cols-2 xl:grid-cols-4")}>
        <StatCard title="Customer Orders" value={metrics.totalCustomerOrders} icon={ClipboardList} />
        <StatCard title="Production Orders" value={metrics.totalProductionOrders} icon={Factory} />
        <StatCard title="Materials" value={metrics.totalMaterials} icon={Package} />
        <StatCard title="Products" value={metrics.totalProducts} icon={Box} />
      </div>
    </>
  );
}
