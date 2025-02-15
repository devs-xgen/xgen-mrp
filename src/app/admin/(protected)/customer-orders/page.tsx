import { Metadata } from "next";
import { DataTable } from "@/components/module/admin/customer-orders/data-table";
import { columns } from "@/components/module/admin/customer-orders/columns";
import { CreateCustomerOrderDialog } from "@/components/module/admin/customer-orders/create-dialog";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getCustomerOrders } from "@/lib/actions/customer-order";
import { getAllProducts } from "@/lib/actions/product";
import { getAllCustomers } from "@/lib/actions/customers";

export const metadata: Metadata = {
  title: "Customer Orders | Admin Dashboard",
  description: "Manage your customer orders and order details",
};

export default async function CustomerOrdersPage() {
  const [customerOrders, products, customers] = await Promise.all([
    getCustomerOrders(),
    getAllProducts(),
    getAllCustomers(),
  ]);

  return (
    <div className="flex flex-col gap-6 p-8">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Customer Orders</h2>
          <p className="text-muted-foreground">
            Manage and track all customer orders
          </p>
        </div>
        <CreateCustomerOrderDialog products={products} customers={customers} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Customer Orders</CardTitle>
          <CardDescription>
            A list of all customer orders and their current status
          </CardDescription>
        </CardHeader>
        <CardContent>
          <DataTable columns={columns} data={customerOrders} />
        </CardContent>
      </Card>
    </div>
  );
}
