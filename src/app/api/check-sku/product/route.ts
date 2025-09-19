// src/app/api/check-sku/product/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const sku = (searchParams.get("sku") || "").trim();
    const excludeId = searchParams.get("excludeId") || undefined;

    if (!sku) {
      return NextResponse.json({ available: false, error: "Missing sku" }, { status: 400 });
    }

    const existing = await prisma.product.findFirst({
      where: {
        sku,
        ...(excludeId ? { id: { not: excludeId } } : {}),
      },
      select: { id: true },
    });

    return NextResponse.json({ available: !existing });
  } catch (e) {
    console.error("SKU check error (product):", e);
    return NextResponse.json({ available: false, error: "Server error" }, { status: 500 });
  }
}
