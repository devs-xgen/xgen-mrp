import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// Create Production Order
export async function POST(req: Request) {
    try {
        const json = await req.json();
        const productionOrder = await prisma.productionOrder.create({
            data: {
                productId: json.productId,
                quantity: json.quantity,
                startDate: new Date(json.startDate),
                dueDate: new Date(json.dueDate),
                status: json.status || 'ACTIVE',
                priority: json.priority || 'MEDIUM',
                customerOrderId: json.customerOrderId,
                notes: json.notes,
            },
        });
        return NextResponse.json(productionOrder);
    } catch (error: any) {
        return NextResponse.json(
            { error: "Error creating production order" },
            { status: 500 }
        );
    }
}

// Get All Production Orders
export async function GET() {
    try {
        const productionOrders = await prisma.productionOrder.findMany({
            orderBy: {
                startDate: "asc",
            },
        });
        return NextResponse.json(productionOrders);
    } catch (error) {
        return NextResponse.json(
            { error: "Error fetching production orders" },
            { status: 500 }
        );
    }
}
