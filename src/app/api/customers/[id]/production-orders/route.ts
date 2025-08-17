import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    // Get production orders that are linked to customer orders from this customer
    const productionOrders = await prisma.productionOrder.findMany({
      where: {
        customerOrder: {
          customerId: id,
        },
      },
      include: {
        product: true,
        productVariant: true,
        customerOrder: {
          include: {
            customer: true,
          },
        },
        operations: true,
        qualityChecks: true,
        delivery: true,
        costVariances: true,
        materialReservations: true,
        productionBatches: true,
        _count: {
          select: {
            operations: true,
            qualityChecks: true,
            materialReservations: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json(productionOrders);
  } catch (error) {
    console.error("[CUSTOMERS_PRODUCTION_ORDERS_GET]", error);
    return new NextResponse("Internal error", { status: 500 });
  }
}
