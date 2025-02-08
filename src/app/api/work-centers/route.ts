import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { workCenterSchema } from "@/lib/workcenter";

// GET /api/workcenters
export async function GET() {
    try {
        const session = await getServerSession(authOptions);
        if (!session) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const workCenters = await prisma.workCenter.findMany({
            orderBy: {
                name: 'asc',
            },
        });

        return NextResponse.json(workCenters);
    } catch (error) {
        console.error("[WORKCENTERS_GET]", error);
        return new NextResponse("Internal error", { status: 500 });
    }
}

// POST /api/workcenters
export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const json = await req.json();
        const body = workCenterSchema.parse(json);

        const workCenter = await prisma.workCenter.create({
            data: {
                ...body,
                createdBy: session.user.id,
            },
        });

        return NextResponse.json(workCenter);
    } catch (error) {
        console.error("[WORKCENTERS_POST]", error);
        return new NextResponse("Internal error", { status: 500 });
    }
}
