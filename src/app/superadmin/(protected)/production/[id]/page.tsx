import { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Shield } from "lucide-react";
import { getProductionOrderByIdSuperadmin } from "@/lib/actions/superadmin/production-order";
import { convertDecimals } from "@/lib/convertDecimals";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SuperadminProductionOrderDetail } from "@/components/module/superadmin/production/SuperadminProductionOrderDetail";

interface SuperadminProductionOrderPageProps {
  params: Promise<{
    id: string;
  }>;
}

export async function generateMetadata({
  params,
}: SuperadminProductionOrderPageProps): Promise<Metadata> {
  const { id } = await params;
  const order = await getProductionOrderByIdSuperadmin(id);

  if (!order) {
    return {
      title: "Production Order Not Found | Superadmin",
    };
  }

  return {
    title: `${order.product.name} - Production Order | Superadmin`,
    description: `Superadmin view of production order ${id}`,
  };
}

export default async function SuperadminProductionOrderPage({
  params,
}: SuperadminProductionOrderPageProps) {
  const { id } = await params;

  // Fetch full production order details
  const orderRaw = await getProductionOrderByIdSuperadmin(id);

  if (!orderRaw) {
    notFound();
  }

  // Convert Decimal fields
  const order = convertDecimals(orderRaw);

  return (
    <div className="container mx-auto px-4 py-6 max-w-7xl">
      {/* Header */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link href="/superadmin/production">
            <Button variant="ghost" size="sm" className="h-9 w-9 rounded-full p-0">
              <ArrowLeft className="h-5 w-5" />
              <span className="sr-only">Back</span>
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary" />
              <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
                {order.product.name}
                {order.productVariant && (
                  <span className="text-lg font-normal text-muted-foreground">
                    - {order.productVariant.displayName}
                  </span>
                )}
              </h1>
            </div>
            <div className="flex items-center gap-2 mt-1">
              <p className="text-muted-foreground">
                Production Order #{order.id.substring(0, 8)}
              </p>
              <Badge variant="outline" className="font-mono text-xs">
                Superadmin View
              </Badge>
            </div>
          </div>
        </div>
      </div>

      {/* Warning Banner */}
      <div className="mb-6 bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <Shield className="h-5 w-5 text-amber-600 mt-0.5" />
          <div className="flex-1">
            <h3 className="text-sm font-medium text-amber-900 dark:text-amber-100">
              Superadmin Override Mode Active
            </h3>
            <p className="text-sm text-amber-700 dark:text-amber-300 mt-1">
              You have full unrestricted access to this production order. All override actions are
              logged in the audit trail.
            </p>
          </div>
        </div>
      </div>

      {/* Production Order Detail Component */}
      <SuperadminProductionOrderDetail order={order} />
    </div>
  );
}
