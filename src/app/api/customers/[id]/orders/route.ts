import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const customerOrders = await prisma.customerOrder.findMany({
      where: {
        customerId: id,
      },
      include: {
        customer: true,
        orderLines: {
          include: {
            product: true,
            productVariant: true,
          },
        },
        productionOrders: true,
        billingStatements: true,
        transaction: true,
        _count: {
          select: {
            orderLines: true,
            productionOrders: true,
            billingStatements: true,
          },
        },
      },
      orderBy: {
        orderDate: "desc",
      },
    });

    return NextResponse.json(customerOrders);
  } catch (error) {
    console.error("[CUSTOMERS_ORDERS_GET]", error);
    return new NextResponse("Internal error", { status: 500 });
  }
}
