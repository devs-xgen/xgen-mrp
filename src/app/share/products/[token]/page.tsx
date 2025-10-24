// src/app/share/products/[token]/page.tsx
import { Metadata } from "next";
import { notFound } from "next/navigation";
import { getProductByShareableToken } from "@/lib/actions/shareable-link";
import { ProductShareView } from "./product-share-view";

interface PageProps {
  params: Promise<{
    token: string;
  }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { token } = await params;
  const result = await getProductByShareableToken(token);

  if (!result.success || !result.product) {
    return {
      title: "Product Not Found",
      description: "The shared product link is invalid or has expired.",
    };
  }

  return {
    title: `${result.product.name} - Shared Product`,
    description: result.product.description || `View details for ${result.product.name}`,
  };
}

export default async function SharedProductPage({ params }: PageProps) {
  const { token } = await params;
  const result = await getProductByShareableToken(token);

  if (!result.success || !result.product) {
    notFound();
  }

  return <ProductShareView product={result.product} shareableLink={result.shareableLink} />;
}
