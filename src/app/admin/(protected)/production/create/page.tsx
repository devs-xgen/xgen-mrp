import { Metadata } from "next";
import { ProductionCreateClient } from "@/components/module/admin/production/create/ProductionCreateClient";
import { getProductsWithVariantsForOrders } from "@/lib/actions/product";
import { Breadcrumbs } from "@/components/shared/Breadcrumbs";

export const metadata: Metadata = {
  title: "Create Production Order",
  description:
    "Create a new standalone production order for manufacturing",
};

interface CreateProductionPageProps {
  searchParams: Promise<{
    productId?: string;
    variantId?: string;
    quantity?: string;
    batch?: string; // New batch mode parameter
  }>;
}

export default async function CreateProductionPage({
  searchParams,
}: CreateProductionPageProps) {
  const params = await searchParams;

  // Fetch required data for the form with performance optimizations
  const products = await getProductsWithVariantsForOrders();

  // Pre-fill data from query params
  const prefillData = {
    productId: params.productId || "",
    productVariantId: params.variantId || "",
    quantity: params.quantity ? parseInt(params.quantity, 10) : 1,
  };

  // Parse batch data if provided
  let batchMode = false;
  let batchItems: any[] = [];
  
  if (params.batch) {
    try {
      const batchData = JSON.parse(decodeURIComponent(params.batch));
      batchMode = batchData.batchMode || false;
      batchItems = batchData.batchItems || [];
    } catch (error) {
      console.error("Failed to parse batch data:", error);
    }
  }

  const breadcrumbItems = [
    { label: "Production Orders", href: "/admin/production" },
    { label: "Create Order", href: "/admin/production/create" },
  ];

  return (
    <div className="flex flex-col gap-6 p-8">
      <div className="space-y-4">
        <Breadcrumbs items={breadcrumbItems} />
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Create Production Order</h2>
            <p className="text-muted-foreground">
              Create a standalone production order for manufacturing. 
              Customer orders are managed separately.
            </p>
          </div>
        </div>
      </div>

      <ProductionCreateClient
        products={products}
        customers={[]} // Empty array since we don't need customers for standalone production
        customerOrders={[]} // Empty array since we don't need customer orders
        prefillData={prefillData}
        batchMode={batchMode}
        batchItems={batchItems}
      />
    </div>
  );
}
