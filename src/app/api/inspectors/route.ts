import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

// GET /api/inspectors
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const inspectors = await prisma.inspector.findMany({
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json(inspectors);
  } catch (error) {
    console.error("[INSPECTORS_GET]", error);
    return new NextResponse("Internal error", { status: 500 });
  }
}

// POST /api/inspectors
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const body = await request.json();
    
    const inspector = await prisma.inspector.create({
      data: body,
    });

    return NextResponse.json(inspector);
  } catch (error) {
    console.error("[INSPECTORS_POST]", error);
    return new NextResponse("Internal error", { status: 500 });
  }
}
