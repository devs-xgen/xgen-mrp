import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
  try {
    const productionOrderId = id;
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Find the worker's work centers
    const userWorkCenters = await prisma.userWorkCenter.findMany({
      where: { userId: session.user.id },
      select: { workCenterId: true },
    });

    const workCenterIds = userWorkCenters.map((uwc) => uwc.workCenterId);

    if (workCenterIds.length === 0) {
      return NextResponse.json(
        { error: "Worker is not assigned to any work centers" },
        { status: 400 }
      );
    }

    // Get production order with related data
    const productionOrder = await prisma.productionOrder.findUnique({
      where: { id: productionOrderId },
      include: {
        product: {
          select: {
            id: true,
            name: true,
            sku: true,
            description: true,
          }
        },
        operations: {
          where: {
            workCenterId: { in: workCenterIds },
          },
          include: {
            workCenter: {
              select: {
                id: true,
                name: true,
              }
            }
          }
        }
      }
    });

    if (!productionOrder) {
      return NextResponse.json(
        { error: "Production order not found" },
        { status: 404 }
      );
    }

    // Check if worker has operations for this production order
    if (productionOrder.operations.length === 0) {
      return NextResponse.json(
        { 
          error: "You don't have access to this production order",
          details: "No operations assigned to your work centers"
        },
        { status: 403 }
      );
    }

    // Format response data
    const responseData = {
      id: productionOrder.id,
      product: {
        id: productionOrder.product.id,
        name: productionOrder.product.name,
        sku: productionOrder.product.sku,
        description: productionOrder.product.description,
      },
      quantity: productionOrder.quantity,
      completedQuantity: productionOrder.completedQuantity,
      status: productionOrder.status,
      priority: productionOrder.priority,
      startDate: productionOrder.startDate,
      dueDate: productionOrder.dueDate,
      notes: productionOrder.notes,
      operations: productionOrder.operations.map(op => ({
        id: op.id,
        status: op.status,
        startTime: op.startTime,
        endTime: op.endTime,
        workCenter: {
          id: op.workCenter.id,
          name: op.workCenter.name,
        },
        notes: op.notes,
      })),
      canUpdate: true, // Worker has access since operations exist
    };
    
    return NextResponse.json(responseData);
  } catch (error) {
    console.error("Error fetching production order details:", error);
    return NextResponse.json(
      { error: "Failed to fetch production order details" },
      { status: 500 }
    );
  }
} 