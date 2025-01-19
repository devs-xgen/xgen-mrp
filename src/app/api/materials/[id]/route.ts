import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { materialSchema } from "@/lib/material";

interface RouteParams {
    params: {
        id: string;
    };
}

// GET /api/materials/[materialId]
export async function GET(req: Request, { params }: RouteParams) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const material = await prisma.material.findUnique({
            where: {
                id: params.id,
            },
            include: {
                type: true,
                unitOfMeasure: true,
                supplier: true,
            },
        });

        if (!material) {
            return new NextResponse("Material not found", { status: 404 });
        }

        return NextResponse.json(material);
    } catch (error) {
        console.error("[MATERIAL_GET]", error);
        return new NextResponse("Internal error", { status: 500 });
    }
}

// PATCH /api/materials/[materialId]
export async function PATCH(req: Request, { params }: RouteParams) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const json = await req.json();
        const body = materialSchema.partial().parse(json);

        const material = await prisma.material.update({
            where: {
                id: params.id,
            },
            data: {
                ...body,
                modifiedBy: session.user.id,
            },
            include: {
                type: true,
                unitOfMeasure: true,
                supplier: true,
            },
        });

        return NextResponse.json(material);
    } catch (error) {
        console.error("[MATERIAL_PATCH]", error);
        return new NextResponse("Internal error", { status: 500 });
    }
}

// DELETE /api/materials/[materialId]
export async function DELETE(req: Request, { params }: RouteParams) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        // Check if material is being used in any BOMs
        const materialInUse = await prisma.bOM.findFirst({
            where: {
                materialId: params.id
            }
        });

        if (materialInUse) {
            return new NextResponse(
                "Cannot delete material as it is being used in BOMs", 
                { status: 400 }
            );
        }

        await prisma.material.delete({
            where: {
                id: params.id,
            },
        });

        return new NextResponse(null, { status: 204 });
    } catch (error) {
        console.error("[MATERIAL_DELETE]", error);
        return new NextResponse("Internal error", { status: 500 });
    }
}