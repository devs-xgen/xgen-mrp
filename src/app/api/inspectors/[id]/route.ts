import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

interface Params {
  params: { id: string };
}

export async function GET(request: Request, { params }: Params) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    return new NextResponse(
      JSON.stringify({ error: "Unauthorized" }),
      { status: 401, headers: { "Content-Type": "application/json" } }
    );
  }

  try {
    const inspector = await prisma.inspector.findUnique({
      where: { inspectorId: params.id },
      // include related data if needed
    });

    if (!inspector) {
      return new NextResponse(
        JSON.stringify({ error: "Inspector not found" }),
        { status: 404, headers: { "Content-Type": "application/json" } }
      );
    }

    return NextResponse.json(inspector);
  } catch (error) {
    console.error("Error fetching inspector:", error);
    return new NextResponse(
      JSON.stringify({ error: "Failed to fetch inspector" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
