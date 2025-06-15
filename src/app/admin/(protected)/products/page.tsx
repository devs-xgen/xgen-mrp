// src/app/admin/(protected)/products/page.tsx
import { Metadata } from "next";
import { getAllProducts, getCategories } from "@/lib/actions/product";
import { DataTable } from "@/components/module/admin/products/data-table";
import { columns } from "@/components/module/admin/products/columns";
import { CreateProductButton } from "@/components/module/admin/products/create-product-button";
import { ProductCategoryDialog } from "@/components/module/admin/products/product-category-dialog";
import { revalidatePath } from "next/cache";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Products Management",
  description: "Manage your product inventory and variants",
};

// Server action to refresh the data
async function revalidateData() {
  "use server";
  try {
    revalidatePath("/admin/products");
    await getCategories();
  } catch (error) {
    console.error("Error revalidating data:", error);
    throw new Error("Failed to refresh data");
  }
}

// Server action to refresh data for the page
async function refreshData() {
  "use server";
  revalidatePath("/admin/products");
}

export default async function ProductsPage() {
  try {
    // Fetch required data for products management
    const [products, categories] = await Promise.all([
      getAllProducts(),
      getCategories(),
    ]);

    return (
      <div className="flex flex-col gap-6 p-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              Products Management
            </h1>
            <p className="text-muted-foreground">
              Manage your product inventory and variants
            </p>
          </div>
          <div className="flex items-center gap-2">
            <ProductCategoryDialog
              categories={categories}
              onSuccess={revalidateData}
            />
            <CreateProductButton
              categories={categories}
              onSuccess={refreshData}
            />
          </div>
        </div>

        {/* Data Table with products and editing capabilities */}
        <DataTable
          columns={columns}
          data={products}
          categories={categories}
          onSuccess={refreshData}
        />
      </div>
    );
  } catch (error) {
    console.error("Error loading products page:", error);
    return (
      <div className="flex flex-col items-center justify-center h-full p-8">
        <h1 className="text-2xl font-bold text-red-500 mb-4">
          Error Loading Products
        </h1>
        <p className="text-gray-600">
          There was an error loading the products management page. Please try
          again later.
        </p>
        <Button
          className="mt-4"
          onClick={() => {
            window.location.reload();
          }}
        >
          Retry
        </Button>
      </div>
    );
  }
}
