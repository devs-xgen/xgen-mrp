// src/app/admin/(protected)/products/[id]/page.tsx
import { notFound } from "next/navigation";
import { Metadata } from "next";
import {
  getProductById,
  getProductionOrdersByProductId,
} from "@/lib/actions/product";
import { getWorkCenters } from "@/lib/actions/work-center";
import ProductDetailClientPage from "./client-page";
import {
  convertDecimalsToNumbers,
  ProductWithNumberValues,
} from "@/types/admin/product";

interface ProductDetailPageProps {
  params: {
    id: string;
  };
}

export async function generateMetadata({
  params,
}: ProductDetailPageProps): Promise<Metadata> {
  const product = await getProductById(params.id);
  if (!product) return { title: "Product Not Found" };

  return {
    title: `Product: ${product.name}`,
    description: `Details for product ${product.name}`,
  };
}

export default async function ProductDetailPage({
  params,
}: ProductDetailPageProps) {
  // Fetch product, production orders, and work centers in parallel
  const [product, productionOrders, workCenters] = await Promise.all([
    getProductById(params.id),
    getProductionOrdersByProductId(params.id),
    getWorkCenters(),
  ]);

  if (!product) notFound();

  // Create a merged object with proper shape
  const enhancedProduct = {
    ...product,
    productionOrders:
      productionOrders?.map((order) => ({
        id: order.id,
        status: order.status,
        quantity: order.quantity,
        dueDate: order.dueDate,
      })) || [],
  };

  // Convert all Decimal values to numbers before sending to the client
  const productWithNumberValues = convertDecimalsToNumbers(enhancedProduct);
  const workCentersWithNumberValues = convertDecimalsToNumbers(workCenters);

  return (
    <ProductDetailClientPage
      params={params}
      product={productWithNumberValues as ProductWithNumberValues}
      workCenters={workCentersWithNumberValues}
    />
  );
}
