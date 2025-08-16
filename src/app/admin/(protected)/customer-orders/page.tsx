import { Metadata } from "next";
import { getCustomerOrders } from "@/lib/actions/customer-order";
import { columns } from "@/components/module/admin/customer-orders/columns";
import { DataTable } from "@/components/module/admin/customer-orders/data-table";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AnalyticsCard, analyticsCardVariants } from "@/components/ui/analytics-card";
import { formatCurrencyPHP } from "@/lib/constant";
import { CustomerOrderColumn } from "@/types/admin/customer-order";

export const metadata: Metadata = {
  title: "Customer Orders",
  description: "Manage customer orders and production planning",
};

export default async function CustomerOrdersPage() {
  const customerOrders = await getCustomerOrders();

  // Transform orders data for the table
  const tableData: CustomerOrderColumn[] = customerOrders.map((order) => ({
    id: order.id,
    orderNumber: order.orderNumber,
    customerName: order.customer.name,
    customerEmail: order.customer.email || null,
    orderDate: order.orderDate,
    requiredDate: order.requiredDate,
    status: order.status,
    totalAmount: order.totalAmount,
    itemCount: order.orderLines.length,
    totalQuantity: order.orderLines.reduce((sum, line) => sum + line.quantity, 0),
    productionOrderCount: order._count?.productionOrders || 0,
    billingStatementCount: order._count?.billingStatements || 0,
    billingStatements: order.billingStatements,
    notes: order.notes || null,
    lastUpdated: new Date(), // Using current date for now, will fix when schema is updated
  }));

  // Calculate statistics
  const totalOrders = customerOrders.length;
  const totalRevenue = customerOrders.reduce((sum, order) => sum + order.totalAmount, 0);

  // Count statuses
  const statusCounts = {
    COMPLETED: 0,
    IN_PROGRESS: 0,
    PENDING: 0,
    CANCELLED: 0,
  };

  customerOrders.forEach((order) => {
    if (order.status in statusCounts) {
      statusCounts[order.status as keyof typeof statusCounts]++;
    }
  });

  // Calculate orders requiring production
  const ordersNeedingProduction = customerOrders.filter((order) => {
    return order.status !== "COMPLETED" && order.status !== "CANCELLED" && 
           (!order._count?.productionOrders || order._count.productionOrders === 0);
  }).length;

  return (
    <div className="flex flex-col gap-6 p-8">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Customer Orders</h2>
          <p className="text-muted-foreground">
            Manage customer orders and production planning with product variants
          </p>
        </div>
        <Link href="/admin/production/create">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Create Order
          </Button>
        </Link>
      </div>

      {/* Customer Order Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <AnalyticsCard
          title="Total Orders"
          value={totalOrders}
          icon="ShoppingCart"
          {...analyticsCardVariants.blue}
        />
        <AnalyticsCard
          title="Completed"
          value={statusCounts["COMPLETED"]}
          icon="CheckCircle"
          {...analyticsCardVariants.green}
        />
        <AnalyticsCard
          title="Revenue"
          value={formatCurrencyPHP(totalRevenue)}
          icon="Package"
          {...analyticsCardVariants.amber}
        />
        <AnalyticsCard
          title="Need Production"
          value={ordersNeedingProduction}
          icon="AlertTriangle"
          {...analyticsCardVariants.red}
        />
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
          Need Production ({ordersNeedingProduction})
        </Badge>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Customer Orders</CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable columns={columns} data={tableData} />
        </CardContent>
      </Card>
    </div>
  );
}
