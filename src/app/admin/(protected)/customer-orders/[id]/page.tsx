import { Metadata } from "next";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { CustomerOrderDetailsClient } from "@/components/module/admin/customer-orders/CustomerOrderDetailsClient";
import { Breadcrumbs } from "@/components/shared/Breadcrumbs";
import CustomerOrderErrorBoundary from "@/components/module/admin/customer-orders/CustomerOrderErrorBoundary";


interface CustomerOrderDetailsPageProps {
  params: Promise<{
    id: string;
  }>;
}




async function getCustomerOrderDetails(orderId: string) {
  // Validate input
  if (!orderId || typeof orderId !== 'string') {
    console.error("Invalid orderId provided:", orderId);
    return null;
  }

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

  // Transform data for client component with comprehensive null checks
  const transformedOrder = {
    ...order,
    // Safe decimal conversion with fallbacks
    totalAmount: order.totalAmount ? (typeof order.totalAmount.toNumber === 'function' ? order.totalAmount.toNumber() : Number(order.totalAmount)) : 0,
    customer: order.customer ? {
      ...order.customer,
      creditLimit: order.customer.creditLimit ? (typeof order.customer.creditLimit.toNumber === 'function' ? order.customer.creditLimit.toNumber() : Number(order.customer.creditLimit)) : null,
    } : {
      id: '',
      name: 'Unknown Customer',
      code: '',
      email: null,
      phone: null,
      address: null,
      city: null,
      state: null,
      country: null,
      paymentTerms: null,
      creditLimit: null,
    },
    // Safe order lines transformation
    orderLines: (order.orderLines || []).map((line) => {
      if (!line) return null;
      return {
        ...line,
        unitPrice: line.unitPrice ? (typeof line.unitPrice.toNumber === 'function' ? line.unitPrice.toNumber() : Number(line.unitPrice)) : 0,
        product: line.product ? {
          ...line.product,
          sellingPrice: line.product.sellingPrice ? (typeof line.product.sellingPrice.toNumber === 'function' ? line.product.sellingPrice.toNumber() : Number(line.product.sellingPrice)) : 0,
        } : undefined,
        productVariant: line.productVariant ? {
          ...line.productVariant,
          sellingPrice: line.productVariant.sellingPrice ? (typeof line.productVariant.sellingPrice.toNumber === 'function' ? line.productVariant.sellingPrice.toNumber() : Number(line.productVariant.sellingPrice)) : 0,
        } : undefined,
      };
    }).filter(Boolean), // Remove any null entries
    // Safe production orders transformation
    productionOrders: (order.productionOrders || []).map((po) => {
      if (!po) return null;
      return {
        ...po,
        plannedMaterialCost: po.plannedMaterialCost ? (typeof po.plannedMaterialCost.toNumber === 'function' ? po.plannedMaterialCost.toNumber() : Number(po.plannedMaterialCost)) : 0,
        actualMaterialCost: po.actualMaterialCost ? (typeof po.actualMaterialCost.toNumber === 'function' ? po.actualMaterialCost.toNumber() : Number(po.actualMaterialCost)) : 0,
        materialVariance: po.materialVariance ? (typeof po.materialVariance.toNumber === 'function' ? po.materialVariance.toNumber() : Number(po.materialVariance)) : 0,
        operations: (po.operations || []).map((op) => {
          if (!op) return null;
          return {
            ...op,
            cost: op.cost ? (typeof op.cost.toNumber === 'function' ? op.cost.toNumber() : Number(op.cost)) : 0,
          };
        }).filter(Boolean),
      };
    }).filter(Boolean), // Remove any null entries
    // Safe billing statements transformation
    billingStatements: (order.billingStatements || []).map((bs) => {
      if (!bs) return null;
      return {
        ...bs,
        totalAmount: bs.totalAmount ? (typeof bs.totalAmount.toNumber === 'function' ? bs.totalAmount.toNumber() : Number(bs.totalAmount)) : 0,
        taxAmount: bs.taxAmount ? (typeof bs.taxAmount.toNumber === 'function' ? bs.taxAmount.toNumber() : Number(bs.taxAmount)) : 0,
        discountAmount: bs.discountAmount ? (typeof bs.discountAmount.toNumber === 'function' ? bs.discountAmount.toNumber() : Number(bs.discountAmount)) : 0,
        netAmount: bs.netAmount ? (typeof bs.netAmount.toNumber === 'function' ? bs.netAmount.toNumber() : Number(bs.netAmount)) : 0,
        salesInvoice: bs.salesInvoice ? {
          ...bs.salesInvoice,
          totalAmount: bs.salesInvoice.totalAmount ? (typeof bs.salesInvoice.totalAmount.toNumber === 'function' ? bs.salesInvoice.totalAmount.toNumber() : Number(bs.salesInvoice.totalAmount)) : 0,
        } : null,
      };
    }).filter(Boolean), // Remove any null entries
    // Safe transactions transformation
    transaction: (order.transaction || []).map((tx) => {
      if (!tx) return null;
      return {
        ...tx,
        amount: tx.amount ? (typeof tx.amount.toNumber === 'function' ? tx.amount.toNumber() : Number(tx.amount)) : 0,
        paymentDate: tx.paymentDate ? tx.paymentDate.toISOString() : null,
      };
    }).filter(Boolean), // Remove any null entries
    // Ensure _count exists with defaults
    _count: order._count || {
      orderLines: 0,
      productionOrders: 0,
      billingStatements: 0,
      transaction: 0,
    },
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

      <CustomerOrderErrorBoundary>
        <CustomerOrderDetailsClient order={transformedOrder} />
      </CustomerOrderErrorBoundary>
    </div>
  );
}
