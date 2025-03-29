// src/app/admin/(protected)/dashboard/page.tsx
"use client";

import { Suspense } from "react";
import {
  StatsCards,
  InventoryAlerts,
  ProductionStatusChart,
  MonthlySalesChart,
  TopProducts,
  SalesByCategoryChart,
  RecentOrders,
  OperationalAlerts,
  MaterialUtilization,
  WorkflowConnections,
} from "@/components/module/admin/dashboard";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
import { AlertCircle } from "lucide-react";
import { ErrorBoundary } from "@/components/shared/error-boundary";

// Loading fallback components
const StatsCardsSkeleton = () => (
  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
    {[...Array(4)].map((_, i) => (
      <Skeleton key={i} className="h-32 w-full" />
    ))}
  </div>
);

const CardSkeleton = () => <Skeleton className="h-[400px] w-full" />;

// Error fallback component
const ErrorCard = ({ componentName }: { componentName: string }) => (
  <Card>
    <CardContent className="flex flex-col items-center justify-center py-10">
      <AlertCircle className="h-10 w-10 text-red-500 mb-4" />
      <h3 className="text-lg font-medium">Failed to load {componentName}</h3>
      <p className="text-sm text-muted-foreground mt-2">
        There was an error loading this component.
      </p>
    </CardContent>
  </Card>
);

// Wrap components with error boundary
const ErrorBoundaryWrapper = ({
  children,
  componentName,
}: {
  children: React.ReactNode;
  componentName: string;
}) => (
  <ErrorBoundary fallback={<ErrorCard componentName={componentName} />}>
    <Suspense fallback={<CardSkeleton />}>{children}</Suspense>
  </ErrorBoundary>
);

export default function AdminDashboard() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
        <p className="text-muted-foreground">
          Overview of your inventory management system
        </p>
      </div>

      <div className="mt-2 mb-6">
        <WorkflowConnections />
      </div>

      <ErrorBoundaryWrapper componentName="Stats Cards">
        <StatsCards />
      </ErrorBoundaryWrapper>

      <div className="grid gap-6 md:grid-cols-2">
        <ErrorBoundaryWrapper componentName="Inventory Alerts">
          <InventoryAlerts />
        </ErrorBoundaryWrapper>

        <ErrorBoundaryWrapper componentName="Production Status">
          <ProductionStatusChart />
        </ErrorBoundaryWrapper>
      </div>

      <ErrorBoundaryWrapper componentName="Monthly Sales Chart">
        <MonthlySalesChart />
      </ErrorBoundaryWrapper>

      <div className="grid gap-6 md:grid-cols-2">
        <ErrorBoundaryWrapper componentName="Top Products">
          <TopProducts />
        </ErrorBoundaryWrapper>

        <ErrorBoundaryWrapper componentName="Sales by Category">
          <SalesByCategoryChart />
        </ErrorBoundaryWrapper>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <ErrorBoundaryWrapper componentName="Recent Orders">
          <RecentOrders />
        </ErrorBoundaryWrapper>

        <ErrorBoundaryWrapper componentName="Material Utilization">
          <MaterialUtilization />
        </ErrorBoundaryWrapper>
      </div>

      <ErrorBoundaryWrapper componentName="Operational Alerts">
        <OperationalAlerts />
      </ErrorBoundaryWrapper>
    </div>
  );
}
