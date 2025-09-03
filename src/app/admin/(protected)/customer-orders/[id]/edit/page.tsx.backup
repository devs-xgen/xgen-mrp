import { Metadata } from "next";
import { notFound } from "next/navigation";
import { CustomerOrderEditClient } from "@/components/module/admin/customer-orders/CustomerOrderEditClient";
import { Breadcrumbs } from "@/components/shared/Breadcrumbs";
import { getCustomerOrderById } from "@/lib/actions/customer-order";
import { getAllCustomers } from "@/lib/actions/customers";
import { getProductsWithVariantsForOrders } from "@/lib/actions/product";

interface CustomerOrderEditPageProps {
  params: {
    id: string;
  };
}

export async function generateMetadata({ params }: CustomerOrderEditPageProps): Promise<Metadata> {
  const order = await getCustomerOrderById(params.id);
  
  if (!order) {
    return {
      title: "Order Not Found",
    };
  }

  return {
    title: `Edit Order ${order.orderNumber} - ${order.customer.name}`,
    description: `Edit customer order ${order.orderNumber} from ${order.customer.name}`,
  };
}

export default async function CustomerOrderEditPage({ params }: CustomerOrderEditPageProps) {
  const [order, customers, productsForOrders] = await Promise.all([
    getCustomerOrderById(params.id),
    getAllCustomers(),
    getProductsWithVariantsForOrders(),
  ]);

  if (!order) {
    notFound();
  }

  // Transform data for client component
  const transformedOrder = {
    ...order,
    totalAmount: order.totalAmount.toNumber(),
    customer: {
      ...order.customer,
      creditLimit: order.customer.creditLimit?.toNumber() || null,
    },
    orderLines: order.orderLines.map((line) => ({
      ...line,
      unitPrice: line.unitPrice.toNumber(),
      product: line.product ? {
        ...line.product,
        sellingPrice: line.product.sellingPrice.toNumber(),
      } : undefined,
      productVariant: line.productVariant ? {
        ...line.productVariant,
        sellingPrice: line.productVariant.sellingPrice.toNumber(),
      } : undefined,
    })),
  };

  // Map server action products (unitPrice) to structure expected by the client (sellingPrice)
  const transformedProducts = productsForOrders.map((product: any) => ({
    ...product,
    sellingPrice: product.unitPrice,
    variants: (product.variants || []).map((variant: any) => ({
      ...variant,
      sellingPrice: variant.unitPrice,
    })),
  }));

  const breadcrumbItems = [
    { label: "Customer Orders", href: "/admin/customer-orders" },
    { label: order.orderNumber, href: `/admin/customer-orders/${order.id}` },
    { label: "Edit", href: `/admin/customer-orders/${order.id}/edit` },
  ];

  return (
    <div className="flex flex-col gap-6 p-8 bg-background min-h-screen">
      <div className="space-y-4">
        <Breadcrumbs items={breadcrumbItems} />
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Edit Order {order.orderNumber}</h1>
          <p className="text-muted-foreground">
            Modify order details and line items for {order.customer.name}
          </p>
        </div>
      </div>

      <CustomerOrderEditClient 
        order={transformedOrder} 
        customers={customers}
        products={transformedProducts}
      />
    </div>
  );
}
