import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { qualityCheckSchema } from "@/lib/qualitycheck";

// POST /api/quality-checks - Create a new quality check
export async function POST(req: Request) {
  try {
    const json = await req.json();
    const body = qualityCheckSchema.parse(json);

    const qualityCheck = await prisma.qualityCheck.create({
      data: {
        ...body,
        updatedAt: new Date(),
      },
    });

    return NextResponse.json(qualityCheck, { status: 201 });
  } catch (error: any) {
    console.error("Quality check creation error:", error);
    return NextResponse.json(
      { error: "Error creating quality check" },
      { status: 500 }
    );
  }
}

// GET /api/quality-checks - Get all quality checks
export async function GET() {
  try {
    const qualityChecks = await prisma.qualityCheck.findMany({
      include: {
        productionOrder: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json(qualityChecks);
  } catch (error) {
    console.error("Error fetching quality checks:", error);
    return NextResponse.json(
      { error: "Error fetching quality checks" },
      { status: 500 }
    );
  }
}
