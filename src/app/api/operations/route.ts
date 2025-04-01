import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { operationSchema } from "@/lib/operations";

// GET /api/operations
export async function GET() {
    try {
        const session = await getServerSession(authOptions);
        if (!session) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const operations = await prisma.operation.findMany({
            include: {
                workCenter: true,
                productionOrder: true,
            },
        });

        return NextResponse.json(operations);
    } catch (error) {
        console.error("[OPERATIONS_GET]", error);
        return new NextResponse("Internal error", { status: 500 });
    }
}

// POST /api/operations
export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const json = await req.json();
        const body = operationSchema.parse(json);

        const operation = await prisma.operation.create({
            data: {
                ...body,
                createdBy: session.user.id,
                cost: 0,
            },
            include: {
                workCenter: true,
                productionOrder: true,
            },
        });

        return NextResponse.json(operation);
    } catch (error) {
        console.error("[OPERATIONS_POST]", error);
        return new NextResponse("Internal error", { status: 500 });
    }
}
