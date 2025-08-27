import { Metadata } from "next";
import { getCustomerOrdersWithFulfillment } from "@/lib/actions/customer-order";
import { getOrdersRequiringAnalysis } from "@/lib/actions/order-analysis";
import { columns } from "@/components/module/admin/customer-orders/columns";
import { DataTable } from "@/components/module/admin/customer-orders/data-table";
import { Button } from "@/components/ui/button";
import { Plus, BarChart, Archive, Menu, ChevronDown } from "lucide-react";
import Link from "next/link";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CustomerOrderColumn } from "@/types/admin/customer-order";

export const metadata: Metadata = {
  title: "Customer Orders",
  description: "Manage customer orders and production planning",
};

export default async function CustomerOrdersPage() {
  const [customerOrders] = await Promise.all([
    getCustomerOrdersWithFulfillment(),
    getOrdersRequiringAnalysis().catch(() => []),
  ]);

  const tableData: CustomerOrderColumn[] = customerOrders.map((order) => {
    const orderLines = order.orderLines || [];
    const totalQuantity = orderLines.reduce((sum, line) => sum + line.quantity, 0);

    const fulfilledItems = orderLines.filter(line =>
      line.fulfillmentStatus === "FULFILLED"
    ).length;

    const pendingItems = orderLines.filter(line =>
      line.fulfillmentStatus === "PENDING" || !line.fulfillmentStatus
    ).length;

    const totalAllocated = orderLines.reduce((sum, line) =>
      sum + (line.stockAllocated || 0) + (line.productionQuantity || 0), 0
    );

    const fromStock = orderLines.reduce((sum, line) =>
      sum + (line.stockAllocated || 0), 0
    );

    const fromProduction = orderLines.reduce((sum, line) =>
      sum + (line.productionQuantity || 0), 0
    );

    const overallCompletion = totalQuantity > 0
      ? Math.round((totalAllocated / totalQuantity) * 100)
      : 0;

    return {
      id: order.id,
      orderNumber: order.orderNumber,
      customerName: order.customer.name,
      customerEmail: order.customer.email || null,
      orderDate: order.orderDate,
      requiredDate: order.requiredDate,
      status: order.status,
      totalAmount: Number(order.totalAmount),
      itemCount: orderLines.length,
      totalQuantity: totalQuantity,
      productionOrderCount: order._count?.productionOrders || 0,
      billingStatementCount: order._count?.billingStatements || 0,
      billingStatements: order.billingStatements,
      notes: order.notes || null,
      lastUpdated: new Date(),
      fulfillmentOverview: {
        overallCompletion,
        totalAllocated,
        fromStock,
        fromProduction,
        pendingItems,
        fulfilledItems,
      },
    };
  });

  return (
    <div className="flex flex-col gap-6 p-8">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Customer Orders</h2>
          <p className="text-muted-foreground">
            Manage customer orders, stock analysis, and production planning
          </p>
        </div>
        <div className="flex gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline">
                <Menu className="mr-2 h-4 w-4" />
                Actions
                <ChevronDown className="ml-2 h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem asChild>
                <Link href="/admin/customer-orders/analytics" className="flex items-center">
                  <BarChart className="mr-2 h-4 w-4" />
                  View Analytics
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/admin/customer-orders/archives" className="flex items-center">
                  <Archive className="mr-2 h-4 w-4" />
                  View Archives
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/admin/production/planning" className="flex items-center">
                  <BarChart className="mr-2 h-4 w-4" />
                  Production Planning
                </Link>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Link href="/admin/customer-orders/create">
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Create Order
            </Button>
          </Link>
        </div>
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