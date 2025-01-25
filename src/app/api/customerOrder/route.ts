import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";

// Create Customer Order
export async function POST(req: Request) {
    try {
        const json = await req.json();
        const order = await prisma.customerOrder.create({
            data: {
                orderNumber: json.orderNumber,
                customerId: json.customerId,
                orderDate: new Date(json.orderDate),
                requiredDate: new Date(json.requiredDate),
                status: json.status || 'ACTIVE',
                totalAmount: json.totalAmount,
                shippingAddress: json.shippingAddress,
                billingAddress: json.billingAddress,
                notes: json.notes,
            },
        });
        return NextResponse.json(order);
    } catch (error: any) {
        if (error.code === "P2002") {
            return NextResponse.json(
                { error: "A customer order with this order number already exists" },
                { status: 400 }
            );
        }
        return NextResponse.json(
            { error: "Error creating customer order" },
            { status: 500 }
        );
    }
}

// Get All Customer Orders
export async function GET() {
    try {
        const orders = await prisma.customerOrder.findMany({
            orderBy: {
                orderDate: "desc",
            },
        });
        return NextResponse.json(orders);
    } catch (error) {
        return NextResponse.json(
            { error: "Error fetching customer orders" },
            { status: 500 }
        );
    }
}
