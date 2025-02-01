import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

interface RouteParams {
  params: {
    id: string;
  };
}

// Update Purchase Order Line
export async function PATCH(req: Request, { params }: RouteParams) {
  try {
    const json = await req.json();

    // Handle partial updates (only update fields present in the JSON)
    const data: any = {};
    if (json.materialId) {
      data.materialId = json.materialId;
    }
    if (json.quantity) {
      data.quantity = json.quantity;
    }
    if (json.unitPrice) {
      data.unitPrice = json.unitPrice;
    }
    if (json.status) {
      data.status = json.status;
    }
    if (json.notes) {
      data.notes = json.notes;
    }
    // ... add checks for other fields as needed (e.g., createdBy, modifiedBy)

    const purchaseOrderLine = await prisma.purchaseOrderLine.update({
      where: {
        id: params.id,
      },
      data: data, // Use the data object for partial updates
      include: { material: true, purchaseOrder: true }, // Include related data if needed
    });
    return NextResponse.json(purchaseOrderLine);
  } catch (error: any) {
    console.error("Error updating purchase order line:", error);
    return NextResponse.json(
      { error: "Error updating purchase order line" },
      { status: 500 }
    );
  }
}

// Delete Purchase Order Line
export async function DELETE(_: Request, { params }: RouteParams) {
  try {
    await prisma.purchaseOrderLine.delete({
      where: {
        id: params.id,
      },
    });
    return new NextResponse(null, { status: 204 }); // 204 No Content is standard for successful delete
  } catch (error) {
    console.error("Error deleting purchase order line:", error);
    return NextResponse.json(
      { error: "Error deleting purchase order line" },
      { status: 500 }
    );
  }
}