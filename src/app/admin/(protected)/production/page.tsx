// src/app/admin/(protected)/production/page.tsx
import { Metadata } from "next";
import {
  getProductionOrders,
  getAvailableProducts,
  getAvailableWorkCenters,
} from "@/lib/actions/production-order";
import { columns } from "@/components/module/admin/production/columns";
import { DataTable } from "@/components/module/admin/production/data-table";
import { ProductionOrderDialog } from "@/components/module/admin/production/create-production-order-dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  LucideAlertCircle,
  LucideCheckCircle,
  LucideClipboardList,
  LucideTimerOff,
} from "lucide-react";

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

  // Transform orders data for the table
  const tableData = orders.map((order) => ({
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
    
    // MRP Enhancement Fields
    plannedMaterialCost: Number(order.plannedMaterialCost),
    actualMaterialCost: Number(order.actualMaterialCost),
    materialVariance: Number(order.materialVariance),
    completedQuantity: order.completedQuantity,
  }));

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
    <div className="flex flex-col gap-6 p-8">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">
            Production Orders
          </h2>
          <p className="text-muted-foreground">
            Manage and track production orders across your manufacturing process
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
              <p className="text-sm font-medium text-muted-foreground">
                Total Orders
              </p>
              <h3 className="text-2xl font-bold">{totalOrders}</h3>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center py-6">
            <LucideCheckCircle className="w-8 h-8 mr-4 text-green-500" />
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                Completed
              </p>
              <h3 className="text-2xl font-bold">
                {statusCounts["COMPLETED"]}
              </h3>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center py-6">
            <LucideAlertCircle className="w-8 h-8 mr-4 text-amber-500" />
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                In Progress
              </p>
              <h3 className="text-2xl font-bold">
                {statusCounts["IN_PROGRESS"]}
              </h3>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center py-6">
            <LucideTimerOff className="w-8 h-8 mr-4 text-red-500" />
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                Overdue
              </p>
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

      <Card>
        <CardHeader>
          <CardTitle>All Production Orders</CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable columns={columns} data={tableData} />
        </CardContent>
      </Card>
    </div>
  );
}
