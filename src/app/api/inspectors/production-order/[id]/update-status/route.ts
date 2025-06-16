import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { Status } from "@prisma/client";
import { revalidatePath } from "next/cache";

export async function POST(
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

    const body = await req.json();
    const { status, notes } = body;

    // Verify the production order exists
    const productionOrder = await prisma.productionOrder.findUnique({
      where: { id: productionOrderId },
    });

    if (!productionOrder) {
      return NextResponse.json(
        { error: "Production order not found" },
        { status: 404 }
      );
    }

    // Find the inpector's work centers
    const userWorkCenters = await prisma.userWorkCenter.findMany({
      where: { userId: session.user.id },
      select: { workCenterId: true },
    });

    const workCenterIds = userWorkCenters.map((uwc) => uwc.workCenterId);

    if (workCenterIds.length === 0) {
      return NextResponse.json(
        { error: "inpector is not assigned to any work centers" },
        { status: 400 }
      );
    }

    // Find and update all operations for this production order in the inpector's work centers
    const operations = await prisma.operation.findMany({
      where: {
        productionOrderId,
        workCenterId: { in: workCenterIds },
      },
    });

    if (operations.length === 0) {
      return NextResponse.json(
        {
          error:
            "No operations found for this production order in your work centers",
          workCenters: workCenterIds,
        },
        { status: 404 }
      );
    }

    // Update all found operations
    const updates = operations.map((operation) =>
      prisma.operation.update({
        where: { id: operation.id },
        data: {
          status: status as Status,
          notes: notes,
          performedById: session.user.id,
          modifiedBy: session.user.id,
        },
      })
    );

    await prisma.$transaction(updates);

    // Also update the production order status if all operations are updated to the same status
    const allOperations = await prisma.operation.findMany({
      where: { productionOrderId },
    });

    // Check if all operations have the same status now
    const allSameStatus = allOperations.every((op) => op.status === status);

    if (allSameStatus) {
      await prisma.productionOrder.update({
        where: { id: productionOrderId },
        data: {
          status: status as Status,
          modifiedBy: session.user.id,
        },
      });
    }

    revalidatePath("/inpector/tasks");
    revalidatePath("/inpector/dashboard");

    return NextResponse.json({
      success: true,
      message: `Updated ${updates.length} operations for production order ${productionOrderId}`,
    });
  } catch (error) {
    console.error("Error updating production order status:", error);
    return NextResponse.json(
      { error: "Failed to update production order status" },
      { status: 500 }
    );
  }
}
