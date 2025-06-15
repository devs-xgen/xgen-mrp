import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";

// GET /api/customerOrder - Get all customer orders
export async function GET(request: Request) {
  try {
    const customerOrders = await prisma.customerOrder.findMany({
      include: {
        customer: true,
        orderLines: true,
        productionOrders: true,
      },
    });

    return NextResponse.json(customerOrders);
  } catch (error) {
    console.error("Error getting customer orders:", error);
    return new NextResponse(
      JSON.stringify({ error: "Failed to get customer orders" }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}
