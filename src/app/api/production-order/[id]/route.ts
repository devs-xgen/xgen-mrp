import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

interface RouteParams {
    params: {
        id: string;
    };
}

// Update Production Order
export async function PATCH(req: Request, { params }: RouteParams) {
    try {
        const json = await req.json();
        const order = await prisma.productionOrder.update({
            where: {
                id: params.id,
            },
            data: {
                productId: json.productId,
                quantity: json.quantity,
                startDate: new Date(json.startDate),
                dueDate: new Date(json.dueDate),
                status: json.status,
                priority: json.priority,
                customerOrderId: json.customerOrderId,
                notes: json.notes,
                updatedAt: new Date(),
            },
        });
        return NextResponse.json(order);
    } catch (error: any) {
        if (error.code === "P2002") {
            return NextResponse.json(
                { error: "A production order with this data already exists" },
                { status: 400 }
            );
        }
        return NextResponse.json(
            { error: "Error updating production order" },
            { status: 500 }
        );
    }
}

// Delete Production Order
export async function DELETE(_: Request, { params }: RouteParams) {
    try {
        // Check if the production order has associated operations or quality checks
        const order = await prisma.productionOrder.findUnique({
            where: { id: params.id },
            include: {
                operations: { select: { id: true }, take: 1 },
                qualityChecks: { select: { id: true }, take: 1 },
            },
        });

        if ((order?.operations.length ?? 0) > 0 || (order?.qualityChecks.length ?? 0) > 0) {
            return NextResponse.json(
                { error: "Cannot delete production order with associated operations or quality checks" },
                { status: 400 }
            );
        }

        await prisma.productionOrder.delete({
            where: {
                id: params.id,
            },
        });
        return new NextResponse(null, { status: 204 });
    } catch (error) {
        return NextResponse.json(
            { error: "Error deleting production order" },
            { status: 500 }
        );
    }
}
