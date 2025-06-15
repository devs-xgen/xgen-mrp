"use server";

import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { convertDecimals } from "@/lib/convertDecimals";

// Minimal types for basic functionality
export interface CreateProductVariantInput {
  productId: string;
  sizeName?: string;
  colorName?: string;
  unitCost: number;
  sellingPrice: number;
  minimumStockLevel: number;
}

export interface VariantAPIResponse {
  success: boolean;
  message: string;
  data?: any;
  variants?: any[];
  errors?: string[];
}

export interface BulkCreateVariantsInput {
  productId: string;
  sizes: any[];
  colors: any[];
  baseMaterials?: any[];
}

// Placeholder function for variant creation
export async function createProductVariant(
  data: CreateProductVariantInput
): Promise<VariantAPIResponse> {
  return {
    success: false,
    message: "Variant creation temporarily disabled - needs type fixes",
    errors: ["Function temporarily disabled"],
  };
}

// Placeholder function for bulk variant creation
export async function bulkCreateVariants(
  data: BulkCreateVariantsInput
): Promise<VariantAPIResponse> {
  return {
    success: false,
    message: "Bulk variant creation temporarily disabled - needs type fixes",
    errors: ["Function temporarily disabled"],
  };
}

// Placeholder function for variant BOM creation
export async function createProductVariantBOM(
  data: any
): Promise<VariantAPIResponse> {
  return {
    success: false,
    message: "Variant BOM creation temporarily disabled - needs type fixes",
    errors: ["Function temporarily disabled"],
  };
}

// Essential function that might be used - get product variants
export async function getProductVariants(productId: string) {
  try {
    const variants = await prisma.productVariant.findMany({
      where: { productId },
      orderBy: { sortOrder: "asc" },
    });

    // Convert Decimal types to numbers
    return variants.map((variant) => convertDecimals(variant));
  } catch (error) {
    console.error("Error fetching product variants:", error);
    return [];
  }
}
