import { notFound } from "next/navigation";
import { Metadata } from "next";
import { getQualityCheck } from "@/lib/actions/quality-checks";
import { EditQualityCheckForm } from "@/components/module/admin/quality-checks/edit-quality-check-form";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

interface EditQualityCheckPageProps {
  params: {
    id: string;
  };
}

export async function generateMetadata({
  params,
}: EditQualityCheckPageProps): Promise<Metadata> {
  const check = await getQualityCheck(params.id);
  if (!check) return { title: "Quality Check Not Found" };

  return {
    title: `Edit Quality Check - ${check.productionOrder.product.name}`,
    description: `Edit quality inspection details for ${check.productionOrder.product.name}`,
  };
}

export default async function EditQualityCheckPage({
  params,
}: EditQualityCheckPageProps) {
  const check = await getQualityCheck(params.id);

  if (!check) notFound();

  return (
    <div className="flex flex-col gap-6 p-8">
      <div className="flex items-center gap-4">
        <Link href={`/admin/quality-checks/${params.id}`}>
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Quality Check
          </Button>
        </Link>
      </div>

      <div>
        <h2 className="text-3xl font-bold tracking-tight">
          Edit Quality Check
        </h2>
        <p className="text-muted-foreground">
          Update inspection details for {check.productionOrder.product.name}
        </p>
      </div>

      <EditQualityCheckForm qualityCheck={check} />
    </div>
  );
}
