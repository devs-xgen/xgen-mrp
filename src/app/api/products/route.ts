import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";
import { Status } from "@prisma/client";
import { convertDecimals } from "@/lib/convertDecimals";

export async function POST(req: Request) {
  try {
    const json = await req.json();

    // Debug: Log the received data
    console.log("API received data:", {
      name: json.name,
      hasVariants: json.hasVariants,
      sizeRange: json.sizeRange,
      colorOptions: json.colorOptions,
      sizeVariants: json.sizeVariants,
    });

    // Create product with size variants in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create the main product
      const product = await tx.product.create({
        data: {
          name: json.name,
          sku: json.sku,
          description: json.description,
          categoryId: json.categoryId,
          sizeRange: json.sizeRange || [],
          colorOptions: json.colorOptions || [],
          unitCost: json.unitCost,
          sellingPrice: json.sellingPrice,
          minimumStockLevel: json.minimumStockLevel,
          currentStock: 0, // Initial stock is 0
          leadTime: json.leadTime,
          hasVariants: json.hasVariants || false,
          status: "ACTIVE" as Status,
        },
      });

      // Create variants if specified
      const variants: any[] = [];
      if (
        json.hasVariants &&
        json.sizeVariants &&
        json.sizeVariants.length > 0
      ) {
        // Create product variants for each size
        for (const sizeVariant of json.sizeVariants) {
          const variant = await tx.productVariant.create({
            data: {
              productId: product.id,
              sku: `${product.sku}-${sizeVariant.sizeCode}`,
              sizeName: sizeVariant.sizeName,
              sizeCode: sizeVariant.sizeCode,
              unitCost: sizeVariant.unitCost,
              sellingPrice: sizeVariant.sellingPrice,
              minimumStockLevel: sizeVariant.minimumStockLevel,
              displayName: `${product.name} - ${sizeVariant.sizeName}`,
              sortOrder: sizeVariant.sortOrder || 0,
              isActive: true,
            },
          });
          variants.push(variant);
        }
      }

      return { product, variants };
    });

    return NextResponse.json({
      success: true,
      data: convertDecimals(result.product),
      variants: convertDecimals(result.variants),
      message: `Product created successfully${result.variants.length > 0 ? ` with ${result.variants.length} variants` : ""}`,
    });
  } catch (error: any) {
    console.error("Product creation error:", error);
    if (error.code === "P2002") {
      return NextResponse.json(
        { error: "A product with this SKU already exists" },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: "Error creating product" },
      { status: 500 }
    );
  }
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const categoryId = searchParams.get("categoryId");
    const statusParam = searchParams.get("status");

    // Validate status is a valid enum value
    const status =
      statusParam && Object.values(Status).includes(statusParam as Status)
        ? (statusParam as Status)
        : undefined;

    const where = {
      ...(categoryId && { categoryId }),
      ...(status && { status }),
    };

    const products = await prisma.product.findMany({
      where,
      include: {
        category: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json(convertDecimals(products));
  } catch (error) {
    console.error("Error fetching products:", error);
    return NextResponse.json(
      { error: "Error fetching products" },
      { status: 500 }
    );
  }
}
