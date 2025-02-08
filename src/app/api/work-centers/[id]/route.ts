import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { workCenterSchema } from "@/lib/workcenter";

interface RouteParams {
    params: { id: string };
}

// GET /api/workcenters/[id]
export async function GET(req: Request, { params }: RouteParams) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const workCenter = await prisma.workCenter.findUnique({
            where: { id: params.id },
        });

        if (!workCenter) {
            return new NextResponse("WorkCenter not found", { status: 404 });
        }

        return NextResponse.json(workCenter);
    } catch (error) {
        console.error("[WORKCENTER_GET]", error);
        return new NextResponse("Internal error", { status: 500 });
    }
}

// PATCH /api/workcenters/[id]
export async function PATCH(req: Request, { params }: RouteParams) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const json = await req.json();
        const body = workCenterSchema.partial().parse(json);

        const workCenter = await prisma.workCenter.update({
            where: { id: params.id },
            data: { ...body, modifiedBy: session.user.id },
        });

        return NextResponse.json(workCenter);
    } catch (error) {
        console.error("[WORKCENTER_PATCH]", error);
        return new NextResponse("Internal error", { status: 500 });
    }
}

// DELETE /api/workcenters/[id]
export async function DELETE(req: Request, { params }: RouteParams) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        // Prevent deletion if linked to any operations
        const workCenterInUse = await prisma.operation.findFirst({
            where: { workCenterId: params.id },
        });

        if (workCenterInUse) {
            return new NextResponse(
                "Cannot delete WorkCenter as it is linked to operations", 
                { status: 400 }
            );
        }

        await prisma.workCenter.delete({ where: { id: params.id } });

        return new NextResponse(null, { status: 204 });
    } catch (error) {
        console.error("[WORKCENTER_DELETE]", error);
        return new NextResponse("Internal error", { status: 500 });
    }
}
