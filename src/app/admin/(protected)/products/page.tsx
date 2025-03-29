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
import { revalidatePath } from "next/cache";

export const metadata: Metadata = {
  title: "Products Management",
  description: "Manage your product inventory",
};

async function refreshData() {
  "use server";
  revalidatePath("/admin/products");
}

export default async function ProductsPage() {
  const [products, categories, workCenters] = await Promise.all([
    getAllProducts(),
    getCategories(),
    getWorkCenters(),
  ]);

  return (
    <div className="container mx-auto py-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">
          Products Management
        </h1>
        <div className="flex items-center gap-4">
          <CategoryManagement categories={categories} onSuccess={refreshData} />
          <CreateProductDialog
            categories={categories}
            onSuccess={refreshData}
          />
        </div>
      </div>

      <div className="mt-8">
        <Card>
          <CardHeader>
            <CardTitle>Products</CardTitle>
            <CardDescription>
              Manage and monitor your product inventory
            </CardDescription>
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
    </div>
  );
}
