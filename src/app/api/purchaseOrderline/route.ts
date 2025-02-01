import { NextResponse } from "next/server";
import { prisma } from "@/lib/db"; // Adjust path based on your project structure

export async function POST(req: Request) {
  try {
    const json = await req.json();
    const { materialId, quantity, unitPrice, notes, createdBy } = json;

    // Validate required fields
    if (!materialId || !quantity || unitPrice === undefined || isNaN(Number(unitPrice))) {
      return NextResponse.json(
        { error: "Missing or invalid required fields" },
        { status: 400 }
      );
    }

    const createdOrderLine = await prisma.purchaseOrderLine.create({
      data: {
        materialId,
        quantity: Number(quantity), // Ensure quantity is a number
        unitPrice: Number(unitPrice), // Convert unitPrice to a number
        notes: notes || null,
        createdBy: createdBy || "system", // Default if not provided
      },
    });

    return NextResponse.json({ success: true, data: createdOrderLine });
  } catch (error: any) {
    console.error("Error creating purchase order line:", error);
    return NextResponse.json(
      { error: "Error creating purchase order line", details: error.message },
      { status: 500 }
    );
  }
}

  
  export async function GET() {
    try {
      const orders = await prisma.purchaseOrder.findMany({
        include: {
          supplier: true,
          orderLines: {
            include: { // Include Material details for each line
              material: true,
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
      });
      return NextResponse.json(orders);
    } catch (error) {
      return NextResponse.json(
        { error: "Error fetching purchase orders" },
        { status: 500 }
      );
    }
  }
  