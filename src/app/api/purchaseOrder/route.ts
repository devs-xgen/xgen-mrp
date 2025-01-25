import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// Create Purchase Order
export async function POST(req: Request) {
    try {
        const json = await req.json();
        const order = await prisma.purchaseOrder.create({
            data: {
                poNumber: json.poNumber,
                supplierId: json.supplierId,
                orderDate: new Date(json.orderDate),
                expectedDelivery: new Date(json.expectedDelivery),
                status: json.status,
                totalAmount: json.totalAmount,
                notes: json.notes,
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
            { error: "Error creating purchase order" },
            { status: 500 }
        );
    }
}

// Get Purchase Orders
export async function GET() {
    try {
        const orders = await prisma.purchaseOrder.findMany({
            include: {
                supplier: true,
                orderLines: true,
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
