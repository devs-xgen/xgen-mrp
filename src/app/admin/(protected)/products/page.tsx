// src/app/admin/(protected)/products/page.tsx
import { Metadata } from "next";
import { getAllProducts } from "@/lib/actions/product";
import { getCategories } from "@/lib/api/products";
import { getWorkCenters } from "@/lib/actions/work-center";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ProductDataTable } from "@/components/module/admin/products/data-table";
import { CreateProductDialog } from "@/components/module/admin/products/create-product-dialog";
import { CategoryManagement } from "@/components/module/admin/products/category-management";
import { AnalyticsCard, analyticsCardVariants } from "@/components/ui/analytics-card";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Products Management",
  description: "Manage your product inventory",
};

async function refreshData() {
  "use server";
  revalidatePath("/admin/products");
  redirect("/admin/products");
}

export default async function ProductsPage() {
  const [products, categories, workCenters] = await Promise.all([
    getAllProducts(),
    getCategories(),
    getWorkCenters(),
  ]);

  // Calculate analytics
  const totalProducts = products.length;
  const activeProducts = products.filter((p: any) => p.status === 'ACTIVE').length;
  const lowStockProducts = products.filter((p: any) => p.currentStock <= p.minimumStockLevel).length;
  const withVariants = products.filter((p: any) => p.hasVariants).length;

  return (
    <div className="flex flex-col gap-6 p-8">
      {/* Header Section */}
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Products Management</h2>
          <p className="text-muted-foreground">
            Manage your product catalog, size variants, and inventory
          </p>
        </div>
        <div className="flex items-center gap-4">
          <CategoryManagement categories={categories} onSuccess={refreshData} />
          <CreateProductDialog
            categories={categories}
            onSuccess={refreshData}
          />
        </div>
      </div>

      {/* Analytics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <AnalyticsCard
          title="Total Products"
          value={totalProducts}
          icon="Package"
          {...analyticsCardVariants.blue}
        />
        <AnalyticsCard
          title="Active Products"
          value={activeProducts}
          icon="CheckCircle"
          {...analyticsCardVariants.green}
        />
        <AnalyticsCard
          title="Low Stock"
          value={lowStockProducts}
          icon="AlertTriangle"
          {...analyticsCardVariants.red}
        />
        <AnalyticsCard
          title="With Variants"
          value={withVariants}
          icon="Layers"
          {...analyticsCardVariants.purple}
        />
      </div>

      {/* Content Section */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Products ({totalProducts})</CardTitle>
            <CardDescription>
              Manage and monitor your product inventory and size variants
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <ProductDataTable
            data={products}
            categories={categories}
            workCenters={workCenters}
            onSuccess={refreshData}
          />
        </CardContent>
      </Card>
    </div>
  );
}
