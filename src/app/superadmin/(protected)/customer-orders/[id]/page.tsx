import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { CustomerOrderDetailClient } from "@/components/module/superadmin/customer-orders/CustomerOrderDetailClient";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

interface CustomerOrderDetailPageProps {
  params: {
    id: string;
  };
}

export async function generateMetadata({ params }: CustomerOrderDetailPageProps) {
  const order = await prisma.customerOrder.findUnique({
    where: { id: params.id },
    select: { orderNumber: true },
  });

  return {
    title: order ? `Order ${order.orderNumber} | SuperAdmin` : "Order Not Found",
    description: "Customer order details",
  };
}

async function getCustomerOrder(id: string) {
  const order = await prisma.customerOrder.findUnique({
    where: { id },
    include: {
      customer: {
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          address: true,
        },
      },
      tenant: {
        select: {
          id: true,
          name: true,
        },
      },
      orderLines: {
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
              displayName: true,
              sku: true,
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
              displayName: true,
              sku: true,
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
      },
      billingStatements: {
        select: {
          id: true,
          statementNumber: true,
          status: true,
          totalAmount: true,
          createdAt: true,
        },
        orderBy: {
          createdAt: "desc",
        },
      },
    },
  });

  if (!order) {
    return null;
  }

  // Serialize Decimals
  return {
    ...order,
    totalAmount: order.totalAmount ? Number(order.totalAmount) : 0,
    orderLines: order.orderLines.map(line => ({
      ...line,
      unitPrice: line.unitPrice ? Number(line.unitPrice) : 0,
    })),
    productionOrders: order.productionOrders.map(po => ({
      ...po,
      plannedMaterialCost: po.plannedMaterialCost ? Number(po.plannedMaterialCost) : 0,
      actualMaterialCost: po.actualMaterialCost ? Number(po.actualMaterialCost) : 0,
      plannedLaborCost: po.plannedLaborCost ? Number(po.plannedLaborCost) : 0,
      actualLaborCost: po.actualLaborCost ? Number(po.actualLaborCost) : 0,
    })),
    billingStatements: order.billingStatements.map(bs => ({
      ...bs,
      totalAmount: bs.totalAmount ? Number(bs.totalAmount) : 0,
    })),
  };
}

export default async function CustomerOrderDetailPage({ params }: CustomerOrderDetailPageProps) {
  const order = await getCustomerOrder(params.id);

  if (!order) {
    notFound();
  }

  return (
    <div className="flex-1 space-y-6 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" asChild>
            <Link href="/superadmin/customer-orders">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Link>
          </Button>
          <div>
            <h2 className="text-3xl font-bold tracking-tight">
              Order {order.orderNumber}
            </h2>
            <p className="text-muted-foreground">
              Customer order details and production tracking
            </p>
          </div>
        </div>
      </div>

      <CustomerOrderDetailClient order={order} />
    </div>
  );
}
