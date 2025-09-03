import { Metadata } from "next";
import { getCustomerOrdersWithFulfillment } from "@/lib/actions/customer-order";
import { getOrdersRequiringAnalysis } from "@/lib/actions/order-analysis";
import { columns } from "@/components/module/admin/customer-orders/columns";
import { DataTable } from "@/components/global/table";
import { Button } from "@/components/ui/button";
import { Plus, BarChart, Archive, Menu, ChevronDown } from "lucide-react";
import Link from "next/link";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  PageContainer,
  PageHeader,
  PageHeaderMain,
  PageTitle,
  PageDescription,
  PageHeaderActions,
  SectionCard,
} from "@/components/shared/page-layout";
import { CustomerOrderColumn } from "@/types/admin/customer-order";

export const metadata: Metadata = {
  title: "Customer Orders",
  description: "Manage customer orders and production planning",
};

export default async function CustomerOrdersPage() {
  // Fetch customer orders with robust error handling
  let customerOrders: any[] = [];
  
  try {
    customerOrders = await getCustomerOrdersWithFulfillment();
  } catch (error) {
    console.error("Failed to fetch customer orders:", error);
    // Return empty array to prevent page crash
    customerOrders = [];
  }

  // Optional: Try to fetch analysis data, but don't let it break the page
  try {
    await getOrdersRequiringAnalysis();
  } catch (error) {
    console.warn("Orders analysis not available:", error);
    // Continue without analysis data
  }

  const tableData: CustomerOrderColumn[] = customerOrders
    .filter(order => order && typeof order === 'object') // Filter out invalid orders
    .map((order) => {
      try {
        const orderLines = order.orderLines || [];
        const totalQuantity = orderLines.reduce((sum, line) => sum + (line?.quantity || 0), 0);

        const fulfilledItems = orderLines.filter(line =>
          line?.fulfillmentStatus === "FULFILLED"
        ).length;

        const pendingItems = orderLines.filter(line =>
          line?.fulfillmentStatus === "PENDING" || !line?.fulfillmentStatus
        ).length;

        const totalAllocated = orderLines.reduce((sum, line) =>
          sum + (line?.stockAllocated || 0) + (line?.productionQuantity || 0), 0
        );

        const fromStock = orderLines.reduce((sum, line) =>
          sum + (line?.stockAllocated || 0), 0
        );

        const fromProduction = orderLines.reduce((sum, line) =>
          sum + (line?.productionQuantity || 0), 0
        );

        const overallCompletion = totalQuantity > 0
          ? Math.round((totalAllocated / totalQuantity) * 100)
          : 0;

        return {
          id: order.id || '',
          orderNumber: order.orderNumber || 'Unknown',
          customerName: order.customer?.name || 'Unknown Customer',
          customerEmail: order.customer?.email || null,
          orderDate: order.orderDate || new Date().toISOString(),
          requiredDate: order.requiredDate || new Date().toISOString(),
          status: order.status || 'PENDING',
          totalAmount: order.totalAmount ? Number(order.totalAmount) : 0,
          itemCount: orderLines.length,
          totalQuantity: totalQuantity,
          productionOrderCount: order._count?.productionOrders || 0,
          billingStatementCount: order._count?.billingStatements || 0,
          billingStatements: order.billingStatements || [],
          notes: order.notes || null,
          lastUpdated: order.updatedAt || order.createdAt || new Date().toISOString(),
          fulfillmentOverview: {
            overallCompletion,
            totalAllocated,
            fromStock,
            fromProduction,
            pendingItems,
            fulfilledItems,
          },
        };
      } catch (error) {
        console.error("Error processing order:", error, order);
        // Return a minimal safe order object
        return {
          id: order?.id || '',
          orderNumber: order?.orderNumber || 'Error',
          customerName: 'Error loading customer',
          customerEmail: null,
          orderDate: new Date().toISOString(),
          requiredDate: new Date().toISOString(),
          status: 'PENDING',
          totalAmount: 0,
          itemCount: 0,
          totalQuantity: 0,
          productionOrderCount: 0,
          billingStatementCount: 0,
          billingStatements: [],
          notes: 'Error loading order details',
          lastUpdated: new Date().toISOString(),
          fulfillmentOverview: {
            overallCompletion: 0,
            totalAllocated: 0,
            fromStock: 0,
            fromProduction: 0,
            pendingItems: 0,
            fulfilledItems: 0,
          },
        };
      }
    });

  return (
    <PageContainer>
      <PageHeader>
        <PageHeaderMain>
          <PageTitle>Customer Orders</PageTitle>
          <PageDescription>
            Manage customer orders, stock analysis, and production planning
          </PageDescription>
        </PageHeaderMain>
        <PageHeaderActions>
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
        </PageHeaderActions>
      </PageHeader>

      <SectionCard heading="All Customer Orders">
        <DataTable
          columns={columns}
          data={tableData}
          searchKey="customerName"
          searchPlaceholder="Filter orders..."
          enableSelection={true}
        />
      </SectionCard>
    </PageContainer>
  );
}