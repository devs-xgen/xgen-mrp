import { Metadata } from "next";
import { getAllCustomers } from "@/lib/actions/customers";
import { getProductsWithVariantsForOrders } from "@/lib/actions/product";
import { CustomerOrderCreateV2Client } from "@/components/module/admin/customer-order-ver/CustomerOrderCreateV2Client";
import { Breadcrumbs } from "@/components/shared/Breadcrumbs";
import { Customer } from "@prisma/client";

export const metadata: Metadata = {
  title: "Create Customer Order V2",
  description: "Create a new customer order with enhanced features and real-time fulfillment tracking",
};

export default async function CreateCustomerOrderV2Page() {
  // Fetch required data for the form
  const [customers, products] = await Promise.all([
    getAllCustomers(),
    getProductsWithVariantsForOrders(),
  ]);

   const serializableCustomers = customers.map(customer => ({
    ...customer,
    creditLimit: customer.creditLimit !== null ? customer.creditLimit.toString() : null,
    // Ensure any other non-serializable fields are also converted if present
    // e.g., if you had a Date object that wasn't correctly serialized, you might do:
    // createdAt: customer.createdAt.toISOString(),
  }));

  const breadcrumbItems = [
    { label: "Customer Orders V2", href: "/admin/customer-orders-v2" },
    { label: "Create Order", href: "/admin/customer-orders-v2/create" },
  ];

  return (
    <div className="flex flex-col gap-6 p-8">
      <div className="space-y-4">
        <Breadcrumbs items={breadcrumbItems} />
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Create Customer Order V2</h2>
            <p className="text-muted-foreground">
              Create a new customer order with enhanced features, real-time fulfillment tracking, 
              and integrated production planning capabilities.
            </p>
          </div>
        </div>
      </div>

      <CustomerOrderCreateV2Client 
        customers={serializableCustomers as Customer[]}
        products={products}
      />
    </div>
  );
}
