// src/app/admin/(protected)/materials/[id]/page.tsx
import { Metadata } from "next";
import { notFound } from "next/navigation";
import { getMaterialById } from "@/lib/actions/materials";
import { getMaterialUsage } from "@/lib/actions/material-search";
import { MaterialDetailView } from "@/components/module/admin/materials/material-detail-view";

interface MaterialDetailPageProps {
  params: Promise<{
    id: string;
  }>;
}

export async function generateMetadata({
  params,
}: MaterialDetailPageProps): Promise<Metadata> {
  const { id } = await params;
  const material = await getMaterialById(id);
  if (!material) return { title: "Material Not Found" };

  return {
    title: `Material: ${material.name}`,
    description: `Details for material ${material.name}`,
  };
}

export default async function MaterialDetailPage({
  params,
}: MaterialDetailPageProps) {
  const { id } = await params;
  const [material, materialUsage] = await Promise.all([
    getMaterialById(id),
    getMaterialUsage(id),
  ]);

  if (!material) notFound();

  return (
    <div className="container mx-auto py-6">
      <MaterialDetailView material={material} materialUsage={materialUsage} />
    </div>
  );
}
