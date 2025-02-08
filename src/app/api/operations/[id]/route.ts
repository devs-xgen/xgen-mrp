import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { operationSchema } from "@/lib/operations";

interface RouteParams {
    params: {
        id: string;
    };
}

// PATCH /api/operations/[id] - Update an operation
export async function PATCH(req: Request, { params }: RouteParams) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const json = await req.json();
        const body = operationSchema.partial().parse(json);

        const operation = await prisma.operation.update({
            where: {
                id: params.id,
            },
            data: {
                ...body,
                modifiedBy: session.user.id,
                updatedAt: new Date(),
            },
            include: {
                workCenter: true,
                productionOrder: true,
            },
        });

        return NextResponse.json(operation);
    } catch (error: any) {
        console.error("Operation update error:", error);
        return NextResponse.json(
            { error: "Error updating operation" },
            { status: 500 }
        );
    }
}

// DELETE /api/operations/[id] - Delete an operation
export async function DELETE(_: Request, { params }: RouteParams) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        await prisma.operation.delete({
            where: {
                id: params.id,
            },
        });

        return new NextResponse(null, { status: 204 });
    } catch (error) {
        console.error("Operation deletion error:", error);
        return NextResponse.json(
            { error: "Error deleting operation" },
            { status: 500 }
        );
    }
}

// GET /api/operations/[id] - Get a single operation
export async function GET(_: Request, { params }: RouteParams) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const operation = await prisma.operation.findUnique({
            where: {
                id: params.id,
            },
            include: {
                workCenter: true,
                productionOrder: true,
            },
        });

        if (!operation) {
            return NextResponse.json(
                { error: "Operation not found" },
                { status: 404 }
            );
        }

        return NextResponse.json(operation);
    } catch (error) {
        console.error("Error fetching operation:", error);
        return NextResponse.json(
            { error: "Error fetching operation" },
            { status: 500 }
        );
    }
}
