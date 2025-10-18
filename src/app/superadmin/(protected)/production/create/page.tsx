import { Metadata } from "next";
import { SuperadminProductionCreateClient } from "@/components/module/superadmin/production/create/SuperadminProductionCreateClient";
import { getProductsWithVariantsForOrders } from "@/lib/actions/product";
import { Breadcrumbs } from "@/components/shared/Breadcrumbs";

export const metadata: Metadata = {
  title: "Create Production Order (SuperAdmin)",
  description:
    "Create a new production order with SuperAdmin override capabilities",
};

interface CreateProductionPageProps {
  searchParams: Promise<{
    productId?: string;
    variantId?: string;
    quantity?: string;
  }>;
}

export default async function SuperadminCreateProductionPage({
  searchParams,
}: CreateProductionPageProps) {
  const params = await searchParams;

  // Fetch required data for the form
  const products = await getProductsWithVariantsForOrders();

  // Pre-fill data from query params
  const prefillData = {
    productId: params.productId || "",
    productVariantId: params.variantId || "",
    quantity: params.quantity ? parseInt(params.quantity, 10) : 1,
  };

  const breadcrumbItems = [
    { label: "Production Orders", href: "/superadmin/production" },
    { label: "Create Order", href: "/superadmin/production/create" },
  ];

  return (
    <div className="flex flex-col gap-6 p-8">
      <div className="space-y-4">
        <Breadcrumbs items={breadcrumbItems} />
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">
              Create Production Order (SuperAdmin)
            </h2>
            <p className="text-muted-foreground">
              Create production orders with override capabilities: backdating, force-allocate materials, custom costs.
            </p>
          </div>
        </div>
      </div>

      <SuperadminProductionCreateClient
        products={products}
        prefillData={prefillData}
      />
    </div>
  );
}
