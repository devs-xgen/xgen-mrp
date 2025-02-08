import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { qualityCheckSchema } from "@/lib/qualitycheck";

interface RouteParams {
    params: {
        id: string;
    };
}



// PATCH /api/quality-checks/[id] - Update a quality check
export async function PATCH(req: Request, { params }: RouteParams) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const json = await req.json();
        const body = qualityCheckSchema.partial().parse(json);

        const qualityCheck = await prisma.qualityCheck.update({
            where: {
                id: params.id,
            },
            data: {
                ...body,
                modifiedBy: session.user.id,
                updatedAt: new Date(),
            },
        });

        return NextResponse.json(qualityCheck);
    } catch (error: any) {
        console.error("Quality check update error:", error);
        return NextResponse.json(
            { error: "Error updating quality check" },
            { status: 500 }
        );
    }
}

// DELETE /api/quality-checks/[id] - Delete a quality check
export async function DELETE(_: Request, { params }: RouteParams) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        await prisma.qualityCheck.delete({
            where: {
                id: params.id,
            },
        });

        return new NextResponse(null, { status: 204 });
    } catch (error) {
        console.error("Quality check deletion error:", error);
        return NextResponse.json(
            { error: "Error deleting quality check" },
            { status: 500 }
        );
    }
}
