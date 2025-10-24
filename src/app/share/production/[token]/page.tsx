// src/app/share/production/[token]/page.tsx
import { Metadata } from "next";
import { notFound } from "next/navigation";
import { getProductionOrderByShareableToken } from "@/lib/actions/shareable-link";
import { ProductionOrderShareView } from "./production-order-share-view";

interface PageProps {
  params: Promise<{
    token: string;
  }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { token } = await params;
  const result = await getProductionOrderByShareableToken(token);

  if (!result.success || !result.productionOrder) {
    return {
      title: "Production Order Not Found",
      description: "The shared production order link is invalid or has expired.",
    };
  }

  return {
    title: `Production Order - ${result.productionOrder.product.name}`,
    description: `View production details for ${result.productionOrder.quantity} units of ${result.productionOrder.product.name}`,
  };
}

export default async function SharedProductionOrderPage({ params }: PageProps) {
  const { token } = await params;
  const result = await getProductionOrderByShareableToken(token);

  if (!result.success || !result.productionOrder) {
    notFound();
  }

  return (
    <ProductionOrderShareView
      productionOrder={result.productionOrder}
      shareableLink={result.shareableLink}
    />
  );
}
