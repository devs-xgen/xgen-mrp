import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";


export async function GET(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const order = await prisma.productionOrder.findUnique({
      where: { id: params.id },
      include: {
        product: true,
        workCenter: true,
        operations: {
          include: {
            workCenter: true,
            assignedWorker: true,
          },
        },
        assignedWorker: true,
      },
    });

    if (!order) {
      return NextResponse.json({ error: "Production order not found" }, { status: 404 });
    }

    // ✅ OPTIONAL: comment out this section for testing all orders
    // if (order.assignedWorkerId !== session.user.id) {
    //   return NextResponse.json({ error: "You are not assigned to this production order." }, { status: 403 });
    // }

    return NextResponse.json(order);
  } catch (error) {
    console.error("Error fetching order:", error);
    return NextResponse.json({ error: "Failed to fetch order" }, { status: 500 });
  }
}