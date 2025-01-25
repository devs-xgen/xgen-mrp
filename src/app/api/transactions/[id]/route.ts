import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

interface RouteParams {
    params: {
        id: string;
    };
}

// Update Transaction
export async function PATCH(req: Request, { params }: RouteParams) {
    try {
        const json = await req.json();
        const transaction = await prisma.transaction.update({
            where: {
                id: params.id,
            },
            data: {
                orderId: json.orderId,
                paymentMethod: json.paymentMethod,
                amount: json.amount,
                handledBy: json.handledBy,
                paymentDate: new Date(json.paymentDate),
                status: json.status,
                notes: json.notes,
                updatedAt: new Date(),
            },
        });
        return NextResponse.json(transaction);
    } catch (error: any) {
        if (error.code === "P2002") {
            return NextResponse.json(
                { error: "A transaction with this data already exists" },
                { status: 400 }
            );
        }
        return NextResponse.json(
            { error: "Error updating transaction" },
            { status: 500 }
        );
    }
}

// Delete Transaction
export async function DELETE(_: Request, { params }: RouteParams) {
    try {
        await prisma.transaction.delete({
            where: {
                id: params.id,
            },
        });
        return new NextResponse(null, { status: 204 });
    } catch (error) {
        return NextResponse.json(
            { error: "Error deleting transaction" },
            { status: 500 }
        );
    }
}
