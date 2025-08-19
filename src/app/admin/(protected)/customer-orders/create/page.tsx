import { Metadata } from "next";
import { getAllCustomers } from "@/lib/actions/customers";
import { getProductsWithVariantsForOrders } from "@/lib/actions/product";
import { CustomerOrderCreateClient } from "@/components/module/admin/customer-orders/create/CustomerOrderCreateClient";

export const metadata: Metadata = {
  title: "Create Customer Order",
  description: "Create a new customer order for archiving and fulfillment tracking",
};

export default async function CreateCustomerOrderPage() {
  // Fetch required data for the form
  const [customers, products] = await Promise.all([
    getAllCustomers(),
    getProductsWithVariantsForOrders(),
  ]);

  return (
    <div className="flex flex-col gap-6 p-8">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Create Customer Order</h2>
          <p className="text-muted-foreground">
            Create a new customer order that will be saved for archiving purposes. 
            Production planning can be done separately after order creation.
          </p>
        </div>
      </div>

      <CustomerOrderCreateClient 
        customers={customers}
        products={products}
      />
    </div>
  );
}
