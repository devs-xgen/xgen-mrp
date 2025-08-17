import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const code = searchParams.get("code");

    if (!code) {
      return new NextResponse("Code parameter is required", { status: 400 });
    }

    const existingCustomer = await prisma.customer.findUnique({
      where: { code },
      select: { id: true },
    });

    return NextResponse.json({ exists: !!existingCustomer });
  } catch (error) {
    console.error("[CUSTOMERS_CHECK_CODE]", error);
    return new NextResponse("Internal error", { status: 500 });
  }
}
