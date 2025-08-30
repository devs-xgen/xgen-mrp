import { Metadata } from "next";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { CustomerOrderDetailsClient } from "@/components/module/admin/customer-orders/CustomerOrderDetailsClient";
import { Breadcrumbs } from "@/components/shared/Breadcrumbs";
import { Prisma } from "@prisma/client";

interface CustomerOrderDetailsPageProps {
  params: Promise<{
    id: string;
  }>;
}

// Recursive serializer to convert Prisma Decimal instances to strings
function serializeDecimal(obj: any): any {
  if (obj === null || obj === undefined) return obj;
  if (obj instanceof Prisma.Decimal) return obj.toString();
  if (Array.isArray(obj)) return obj.map(serializeDecimal);
  if (typeof obj === "object") {
    const newObj: any = {};
    for (const key in obj) {
      if (Object.hasOwnProperty.call(obj, key)) {
        newObj[key] = serializeDecimal(obj[key]);
      }
    }
    return newObj;
  }
  return obj;
}


async function getCustomerOrderDetails(orderId: string) {
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
          select: {
            id: true,
            productId: true,
            productVariantId: true,
            quantity: true,
            unitPrice: true,
            status: true,
            notes: true,
            // Fulfillment tracking fields
            fulfillmentType: true,
            stockAllocated: true,
            productionQuantity: true,
            fulfillmentStatus: true,
            allocatedAt: true,
            fulfilledAt: true,
            createdAt: true,
            updatedAt: true,
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
        productionOrders: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                sku: true,
              },
            },
            productVariant: {
              select: {
                id: true,
                sku: true,
                displayName: true,
              },
            },
            operations: {
              include: {
                workCenter: {
                  select: {
                    name: true,
                  },
                },
              },
            },
            qualityChecks: {
              orderBy: {
                checkDate: "desc",
              },
              take: 3,
            },
          },
        },
        billingStatements: {
          include: {
            salesInvoice: {
              select: {
                id: true,
                invoiceNumber: true,
                status: true,
                totalAmount: true,
                invoiceDate: true,
              },
            },
            deliveryReceipts: {
              select: {
                id: true,
                receiptNumber: true,
                deliveryStatus: true,
                deliveryDate: true,
                receivedBy: true,
              },
            },
          },
          orderBy: {
            billingDate: "desc",
          },
        },
        transaction: {
          include: {
            handledByUser: {
              select: {
                email: true,
              },
            },
          },
          orderBy: {
            paymentDate: "desc",
          },
        },
        _count: {
          select: {
            orderLines: true,
            productionOrders: true,
            billingStatements: true,
            transaction: true,
          },
        },
      },
    });

    return order;
  } catch (error) {
    console.error("Error fetching customer order details:", error);
    return null;
  }
}

export async function generateMetadata({ params }: CustomerOrderDetailsPageProps): Promise<Metadata> {
  const resolvedParams = await params;
  const order = await getCustomerOrderDetails(resolvedParams.id);
  
  if (!order) {
    return {
      title: "Order Not Found",
    };
  }

  return {
    title: `Order ${order.orderNumber} - ${order.customer.name}`,
    description: `Customer order details for ${order.orderNumber} from ${order.customer.name}`,
  };
}

export default async function CustomerOrderDetailsPage({ params }: CustomerOrderDetailsPageProps) {
  const resolvedParams = await params;
  const order = await getCustomerOrderDetails(resolvedParams.id);

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
    productionOrders: order.productionOrders.map((po) => ({
      ...po,
      plannedMaterialCost: po.plannedMaterialCost.toNumber(),
      actualMaterialCost: po.actualMaterialCost.toNumber(),
      materialVariance: po.materialVariance.toNumber(),
      operations: po.operations.map((op) => ({
        ...op,
        cost: op.cost.toNumber(),
      })),
    })),
    billingStatements: order.billingStatements.map((bs) => ({
      ...bs,
      totalAmount: bs.totalAmount.toNumber(),
      taxAmount: bs.taxAmount.toNumber(),
      discountAmount: bs.discountAmount.toNumber(),
      netAmount: bs.netAmount.toNumber(),
      salesInvoice: bs.salesInvoice ? {
        ...bs.salesInvoice,
        totalAmount: bs.salesInvoice.totalAmount.toNumber(),
      } : null,
    })),
    transaction: order.transaction.map((tx) => ({
      ...tx,
      amount: tx.amount.toNumber(),
    })),
  };

  const breadcrumbItems = [
    { label: "Customer Orders", href: "/admin/customer-orders" },
    { label: order.orderNumber, href: `/admin/customer-orders/${order.id}` },
  ];

  return (
    <div className="flex flex-col gap-6 p-8">
      <div className="space-y-4">
        <Breadcrumbs items={breadcrumbItems} />
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Order {order.orderNumber}</h1>
          <p className="text-muted-foreground">
            Complete order details and fulfillment tracking for {order.customer.name}
          </p>
        </div>
      </div>

      <CustomerOrderDetailsClient order={transformedOrder} />
    </div>
  );
}
