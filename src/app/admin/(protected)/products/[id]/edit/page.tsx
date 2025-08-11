// src/app/admin/(protected)/products/[id]/edit/page.tsx
import { Metadata } from "next";
import { notFound } from "next/navigation";
import { getProductById, getCategories, updateProduct } from "@/lib/actions/product";
import ProductEditClientPage from "./client-page";

export const metadata: Metadata = {
  title: "Edit Product",
};

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function Page({ params }: PageProps) {
  const { id } = await params;
  const [product, categories] = await Promise.all([
    getProductById(id),
    getCategories(),
  ]);

  if (!product) return notFound();

  async function onSubmit(formData: {
    name?: string;
    sku?: string;
    description?: string;
    categoryId?: string;
    sizeRange?: string[];
    colorOptions?: string[];
    unitCost?: number;
    sellingPrice?: number;
    minimumStockLevel?: number;
    leadTime?: number;
    status?: any;
  }) {
    "use server";
    return await updateProduct(id, formData);
  }

  return (
    <ProductEditClientPage product={product} categories={categories} onSubmit={onSubmit} />
  );
}
