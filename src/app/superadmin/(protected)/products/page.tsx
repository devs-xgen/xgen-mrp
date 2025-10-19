import { Suspense } from "react";
import {
  getAllProductsSuperadmin,
  getProductStatsSuperadmin,
} from "@/lib/actions/superadmin/product";
import { ProductsClient } from "@/components/module/superadmin/products/ProductsClient";
import { Skeleton } from "@/components/ui/skeleton";
import { prisma } from "@/lib/db";

export const metadata = {
  title: "Products | SuperAdmin",
  description: "Manage products and variants across all tenants",
};

async function ProductsContent() {
  const [products, stats, categories] = await Promise.all([
    getAllProductsSuperadmin(),
    getProductStatsSuperadmin(),
    prisma.productCategory.findMany({
      select: {
        id: true,
        name: true,
      },
      orderBy: {
        name: "asc",
      },
    }),
  ]);

  return (
    <ProductsClient
      initialProducts={products}
      stats={stats}
      categories={categories}
    />
  );
}

export default function ProductsPage() {
  return (
    <div className="flex-1 space-y-6 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Products</h2>
          <p className="text-muted-foreground">
            Manage products, variants, and BOMs across all tenants
          </p>
        </div>
      </div>

      <Suspense
        fallback={
          <div className="space-y-4">
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-96 w-full" />
          </div>
        }
      >
        <ProductsContent />
      </Suspense>
    </div>
  );
}
