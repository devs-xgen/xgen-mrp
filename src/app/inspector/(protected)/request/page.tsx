// src/app/inspector/(protected)/request/page.tsx
import { Metadata } from "next";
import {
  getProductionOrders,
  getAvailableProducts,
  getAvailableWorkCenters,
} from "@/lib/actions/inspector/production-order";
import { columns } from "@/components/module/inspectors/request/columns";
import { DataTable } from "@/components/module/inspectors/request/data-table";
import { ProductionOrderDialog } from "@/components/module/inspectors/request/create-production-order-dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  LucideAlertCircle,
  LucideCheckCircle,
  LucideClipboardList,
  LucideTimerOff,
} from "lucide-react";
import { prisma } from "@/lib/db"; // Ensure you have access to Prisma instance
import ProductionHistoryDashboard from "@/components/module/history-logs/production-history-dashboard";
import ProductionHistoryTimeline from "@/components/module/history-logs/production-history-timeline";

export const metadata: Metadata = {
  title: "Production Orders",
  description: "Manage production orders and manufacturing processes",
};

export default async function ProductionOrdersPage() {
  const [orders, products, workCenters] = await Promise.all([
    getProductionOrders(),
    getAvailableProducts(),
    getAvailableWorkCenters(),
  ]);

  // Extend with material request info
  const ordersWithMaterialFlags = await Promise.all(
    orders.map(async (order) => {
      const hasMaterialRequest = await prisma.materialRequest.count({
        where: { productionOrderId: order.id },
      });

      return {
        ...order,
        hasMaterialRequest: hasMaterialRequest > 0,
      };
    })
  );

  // Transform data for table
  const tableData = ordersWithMaterialFlags.map((order) => ({
    id: order.id,
    productName: order.product.name,
    productSku: order.product.sku,
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
    plannedMaterialCost: Number(order.plannedMaterialCost),
    actualMaterialCost: Number(order.actualMaterialCost),
    materialVariance: Number(order.materialVariance),
    completedQuantity: order.completedQuantity,
    hasMaterialRequest: order.hasMaterialRequest,
  }));

  const totalOrders = orders.length;

  const statusCounts = {
    COMPLETED: 0,
    IN_PROGRESS: 0,
    PENDING: 0,
  };

  orders.forEach((order) => {
    if (order.status in statusCounts) {
      statusCounts[order.status as keyof typeof statusCounts]++;
    }
  });

  const overdueOrders = orders.filter((order) => {
    return order.status !== "COMPLETED" && new Date(order.dueDate) < new Date();
  }).length;

  const withMaterialRequestCount = ordersWithMaterialFlags.filter((o) => o.hasMaterialRequest).length;

  return (
    <div className="flex flex-col gap-6 p-8">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Request Material</h2>
          <p className="text-muted-foreground">
            Manage and track production orders across your manufacturing process and also the request item it need
          </p>
        </div>
        <ProductionOrderDialog products={products} workCenters={workCenters} />
      </div>

      {/* Production Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="flex items-center py-6">
            <LucideClipboardList className="w-8 h-8 mr-4 text-blue-500" />
            <div>
              <p className="text-sm font-medium text-muted-foreground">Total Orders</p>
              <h3 className="text-2xl font-bold">{totalOrders}</h3>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center py-6">
            <LucideCheckCircle className="w-8 h-8 mr-4 text-green-500" />
            <div>
              <p className="text-sm font-medium text-muted-foreground">Completed</p>
              <h3 className="text-2xl font-bold">{statusCounts["COMPLETED"]}</h3>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center py-6">
            <LucideAlertCircle className="w-8 h-8 mr-4 text-amber-500" />
            <div>
              <p className="text-sm font-medium text-muted-foreground">In Progress</p>
              <h3 className="text-2xl font-bold">{statusCounts["IN_PROGRESS"]}</h3>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center py-6">
            <LucideTimerOff className="w-8 h-8 mr-4 text-red-500" />
            <div>
              <p className="text-sm font-medium text-muted-foreground">Overdue</p>
              <h3 className="text-2xl font-bold">{overdueOrders}</h3>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Filters */}
      <div className="flex flex-wrap gap-2 my-2">
        <Badge variant="outline" className="cursor-pointer hover:bg-secondary">
          All ({totalOrders})
        </Badge>
        <Badge variant="secondary" className="cursor-pointer hover:bg-secondary">
          In Progress ({statusCounts["IN_PROGRESS"]})
        </Badge>
        <Badge variant="outline" className="cursor-pointer hover:bg-secondary">
          Pending ({statusCounts["PENDING"]})
        </Badge>
        <Badge variant="outline" className="cursor-pointer hover:bg-secondary">
          Completed ({statusCounts["COMPLETED"]})
        </Badge>
        <Badge variant="destructive" className="cursor-pointer hover:bg-destructive/90">
          Overdue ({overdueOrders})
        </Badge>
        <Badge variant="outline" className="cursor-pointer hover:bg-secondary">
          With Materials ({withMaterialRequestCount})
        </Badge>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Production Orders</CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable columns={columns} data={tableData} />
        </CardContent>
      </Card>
      <Card>
        {/* Production Order History Section */}
        <div>
          <div>
            <h1 className="text-3xl font-bold mb-2">Production Order History</h1>
            <p className="text-muted-foreground mb-6">
              Comprehensive tracking and visualization of production activities
            </p>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            <div className="xl:col-span-2">
              <ProductionHistoryDashboard productionOrderId={""} />
            </div>
            <div>
              <ProductionHistoryTimeline productionOrderId={""} />
            </div>
          </div>
        </div>
      </Card>
    </div>

  );
}
