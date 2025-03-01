import { notFound } from "next/navigation";
import { Metadata } from "next";
import { getQualityCheck } from "@/lib/actions/quality-checks";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { formatDate } from "@/lib/utils";
import Link from "next/link";
import { ArrowLeft, Pencil } from "lucide-react";

interface QualityCheckPageProps {
  params: {
    id: string;
  };
}

export async function generateMetadata({
  params,
}: QualityCheckPageProps): Promise<Metadata> {
  const check = await getQualityCheck(params.id);
  if (!check) return { title: "Quality Check Not Found" };

  return {
    title: `Quality Check - ${check.productionOrder.product.name}`,
    description: `Quality inspection details for ${check.productionOrder.product.name}`,
  };
}

export default async function QualityCheckPage({
  params,
}: QualityCheckPageProps) {
  const check = await getQualityCheck(params.id);

  if (!check) notFound();

  return (
    <div className="flex flex-col gap-6 p-8">
      <div className="flex items-center gap-4">
        <Link href="/admin/quality-checks">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Quality Checks
          </Button>
        </Link>
      </div>

      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">
            Quality Check Details
          </h2>
          <p className="text-muted-foreground">
            Inspection for {check.productionOrder.product.name}
          </p>
        </div>
        <Link href={`/admin/quality-checks/${params.id}/edit`}>
          <Button>
            <Pencil className="h-4 w-4 mr-2" />
            Edit Check
          </Button>
        </Link>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Inspection Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h4 className="text-sm font-medium text-muted-foreground">
                  Check Date
                </h4>
                <p className="text-base">{formatDate(check.checkDate)}</p>
              </div>
              <div>
                <h4 className="text-sm font-medium text-muted-foreground">
                  Status
                </h4>
                <Badge
                  variant={
                    check.status === "COMPLETED"
                      ? "default"
                      : check.status === "IN_PROGRESS"
                      ? "secondary"
                      : "outline"
                  }
                >
                  {check.status.toLowerCase().replace("_", " ")}
                </Badge>
              </div>
            </div>

            <div>
              <h4 className="text-sm font-medium text-muted-foreground">
                Defects Found
              </h4>
              <p className="text-base whitespace-pre-wrap">
                {check.defectsFound || "None reported"}
              </p>
            </div>

            <div>
              <h4 className="text-sm font-medium text-muted-foreground">
                Action Taken
              </h4>
              <p className="text-base whitespace-pre-wrap">
                {check.actionTaken || "None reported"}
              </p>
            </div>

            <div>
              <h4 className="text-sm font-medium text-muted-foreground">
                Notes
              </h4>
              <p className="text-base whitespace-pre-wrap">
                {check.notes || "No additional notes"}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Product Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h4 className="text-sm font-medium text-muted-foreground">
                Product Name
              </h4>
              <p className="text-base">{check.productionOrder.product.name}</p>
            </div>

            <div>
              <h4 className="text-sm font-medium text-muted-foreground">SKU</h4>
              <p className="text-base">{check.productionOrder.product.sku}</p>
            </div>

            <div>
              <h4 className="text-sm font-medium text-muted-foreground">
                Production Order
              </h4>
              <div className="flex items-center space-x-2">
                <p className="text-base">{check.productionOrderId}</p>
                <Button variant="outline" size="sm" asChild>
                  <Link href={`/admin/production/${check.productionOrderId}`}>
                    View Order
                  </Link>
                </Button>
              </div>
            </div>

            <div>
              <h4 className="text-sm font-medium text-muted-foreground">
                Created
              </h4>
              <p className="text-base">{formatDate(check.createdAt)}</p>
            </div>

            <div>
              <h4 className="text-sm font-medium text-muted-foreground">
                Last Updated
              </h4>
              <p className="text-base">{formatDate(check.updatedAt)}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
