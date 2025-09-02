import { Metadata } from "next";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { CustomerOrderEditClient } from "@/components/module/admin/customer-orders/CustomerOrderEditClient";
import { Breadcrumbs } from "@/components/shared/Breadcrumbs";
import { Prisma } from "@prisma/client";

interface CustomerOrderEditPageProps {
  params: Promise<{
    id: string;
  }>;
}

async function getCustomerOrderForEdit(orderId: string) {
  try {
    const order = await prisma.customerOrder.findUnique({
      where: {
        id: orderId,
      },
      include: {
        customer: {
          select: {
            id: true,
            name: true,
            code: true,
            email: true,
            phone: true,
            address: true,
            city: true,
            state: true,
            country: true,
            paymentTerms: true,
            creditLimit: true,
          },
        },
        orderLines: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                sku: true,
                description: true,
                sellingPrice: true,
                currentStock: true,
                minimumStockLevel: true,
                committedStock: true,
              },
            },
            productVariant: {
              select: {
                id: true,
                sku: true,
                displayName: true,
                sizeName: true,
                colorName: true,
                sellingPrice: true,
                currentStock: true,
                minimumStockLevel: true,
                committedStock: true,
              },
            },
          },
        },
      },
    });

    return order;
  } catch (error) {
    console.error("Error fetching customer order for edit:", error);
    return null;
  }
}

async function getCustomersAndProducts() {
  try {
    const [customers, products] = await Promise.all([
      prisma.customer.findMany({
        where: {
          status: "ACTIVE",
        },
        select: {
          id: true,
          name: true,
          code: true,
          email: true,
          phone: true,
        },
        orderBy: {
          name: "asc",
        },
      }),
      prisma.product.findMany({
        where: {
          status: "ACTIVE",
        },
        include: {
          variants: {
            where: {
              isActive: true,
            },
            select: {
              id: true,
              sku: true,
              displayName: true,
              sizeName: true,
              colorName: true,
              sellingPrice: true,
              currentStock: true,
              minimumStockLevel: true,
            },
          },
        },
        orderBy: {
          name: "asc",
        },
      }),
    ]);

    return { customers, products };
  } catch (error) {
    console.error("Error fetching customers and products:", error);
    return { customers: [], products: [] };
  }
}

export async function generateMetadata({ params }: CustomerOrderEditPageProps): Promise<Metadata> {
  const resolvedParams = await params;
  const order = await getCustomerOrderForEdit(resolvedParams.id);
  
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
  const resolvedParams = await params;
  const [order, { customers, products }] = await Promise.all([
    getCustomerOrderForEdit(resolvedParams.id),
    getCustomersAndProducts(),
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

  const transformedProducts = products.map((product) => ({
    ...product,
    unitCost: product.unitCost.toNumber(),
    sellingPrice: product.sellingPrice.toNumber(),
    variants: product.variants.map((variant) => ({
      ...variant,
      sellingPrice: variant.sellingPrice.toNumber(),
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
