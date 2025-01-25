import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// Create Transaction
export async function POST(req: Request) {
    try {
        const json = await req.json();
        const transaction = await prisma.transaction.create({
            data: {
                orderId: json.orderId,
                paymentMethod: json.paymentMethod,
                amount: json.amount,
                handledBy: json.handledBy,
                paymentDate: new Date(json.paymentDate),
                status: json.status,
                notes: json.notes,
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
            { error: "Error creating transaction" },
            { status: 500 }
        );
    }
}

// Get Transactions
export async function GET() {
    try {
        const transactions = await prisma.transaction.findMany({
            include: {
                handledByUser: true,
                customerOrder: true,
            },
            orderBy: {
                createdAt: "desc",
            },
        });
        return NextResponse.json(transactions);
    } catch (error) {
        return NextResponse.json(
            { error: "Error fetching transactions" },
            { status: 500 }
        );
    }
}
