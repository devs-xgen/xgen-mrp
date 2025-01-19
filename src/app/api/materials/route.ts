import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { materialSchema } from "@/lib/material";

// GET /api/materials
export async function GET() {
    try {
        const session = await getServerSession(authOptions);
        if (!session) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const materials = await prisma.material.findMany({
            include: {
                type: true,
                unitOfMeasure: true,
                supplier: true,
            },
            orderBy: {
                name: 'asc',
            },
        });

        return NextResponse.json(materials);
    } catch (error) {
        console.error("[MATERIALS_GET]", error);
        return new NextResponse("Internal error", { status: 500 });
    }
}

// POST /api/materials
export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const json = await req.json();
        const body = materialSchema.parse(json);

        const material = await prisma.material.create({
            data: {
                ...body,
                createdBy: session.user.id,
            },
            include: {
                type: true,
                unitOfMeasure: true,
                supplier: true,
            },
        });

        return NextResponse.json(material);
    } catch (error) {
        console.error("[MATERIALS_POST]", error);
        return new NextResponse("Internal error", { status: 500 });
    }
}