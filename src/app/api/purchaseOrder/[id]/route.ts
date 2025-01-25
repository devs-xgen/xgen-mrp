import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

interface RouteParams {
  params: {
    id: string;
  };
}

// Update Purchase Order
export async function PATCH(req: Request, { params }: RouteParams) {
  try {
    const json = await req.json();
    const order = await prisma.purchaseOrder.update({
      where: {
        id: params.id,
      },
      data: {
        poNumber: json.poNumber,
        supplierId: json.supplierId,
        orderDate: new Date(json.orderDate),
        expectedDelivery: new Date(json.expectedDelivery),
        status: json.status,
        totalAmount: json.totalAmount,
        notes: json.notes,
        updatedAt: new Date(),
      },
    });
    return NextResponse.json(order);
  } catch (error: any) {
    if (error.code === "P2002") {
      return NextResponse.json(
        { error: "A purchase order with this PO number already exists" },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: "Error updating purchase order" },
      { status: 500 }
    );
  }
}

// Delete Purchase Order
export async function DELETE(_: Request, { params }: RouteParams) {
  try {
    // Check if the purchase order has associated order lines
    const order = await prisma.purchaseOrder.findUnique({
      where: { id: params.id },
      include: {
        orderLines: { select: { id: true }, take: 1 },
      },
    });

    if ((order?.orderLines.length ?? 0) > 0) {
      return NextResponse.json(
        { error: "Cannot delete purchase order with associated order lines" },
        { status: 400 }
      );
    }

    await prisma.purchaseOrder.delete({
      where: {
        id: params.id,
      },
    });
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    return NextResponse.json(
      { error: "Error deleting purchase order" },
      { status: 500 }
    );
  }
}
