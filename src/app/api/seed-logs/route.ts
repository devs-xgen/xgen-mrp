import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

// Force dynamic rendering since this API route uses authentication
export const dynamic = 'force-dynamic'

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get all production orders
    const productionOrders = await prisma.productionOrder.findMany({
      take: 10, // Limit to 10 orders
      orderBy: { createdAt: 'desc' }
    });

    const results = [];

    // Create logs for each production order
    for (const order of productionOrders) {
      // Create a log entry
      const log = await prisma.activityLog.create({
        data: {
          type: 'PRODUCTION_STATUS_CHANGE',
          userId: session.user.id,
          details: {
            productionOrderId: order.id,
            oldStatus: 'PENDING',
            newStatus: order.status,
            notes: 'Initial production order status (seeded)'
          }
        }
      });
      
      results.push({
        productionOrderId: order.id,
        logId: log.id
      });
    }

    return NextResponse.json({ 
      success: true, 
      message: `Created ${results.length} log entries`,
      results
    });
  } catch (error) {
    console.error("Error seeding logs:", error);
    return NextResponse.json(
      { error: "Failed to seed logs" },
      { status: 500 }
    );
  }
} 