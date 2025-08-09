// src/app/admin/(protected)/products/page.tsx
import { Metadata } from "next";
import { getAllProducts, getCategories } from "@/lib/actions/product";
import { DataTable } from "@/components/module/admin/products/data-table";
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
      <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
        {/* Page Header - Following Sales Invoices Pattern */}
        <div className="flex items-center justify-between space-y-2">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Products Management</h2>
            <p className="text-muted-foreground mt-1">
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
          data={products}
          categories={categories}
          onSuccess={refreshData}
        />
      </div>
    );
  } catch (error) {
    console.error("Error loading products page:", error);
    return (
      <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
        {/* Error Page Header */}
        <div className="flex items-center justify-between space-y-2">
          <div>
            <h2 className="text-3xl font-bold tracking-tight text-destructive">
              Error Loading Products
            </h2>
            <p className="text-muted-foreground mt-1">
              Unable to load the products management page
            </p>
          </div>
        </div>

        {/* Error Content */}
        <div className="flex flex-col items-center justify-center py-12">
          <div className="text-center max-w-md">
            <div className="w-16 h-16 mx-auto mb-4 bg-destructive/10 rounded-full flex items-center justify-center">
              <svg className="w-8 h-8 text-destructive" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold mb-2">Something went wrong</h3>
            <p className="text-muted-foreground mb-6">
              There was an error loading the products management page. Please try again later.
            </p>
            <Button
              onClick={() => {
                window.location.reload();
              }}
            >
              Try Again
            </Button>
          </div>
        </div>
      </div>
    );
  }
}
