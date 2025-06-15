// src/app/admin/(protected)/products/page.tsx
import { Metadata } from "next";
import { getAllProducts } from "@/lib/actions/product";
import { getCategories } from "@/lib/api/products";
import { getWorkCenters } from "@/lib/actions/work-center";
import ProductsClientPage from "./client-page";

export const metadata: Metadata = {
  title: "Products Management",
  description: "Manage your product inventory",
};

export default async function ProductsPage() {
  try {
    // Fetch all data in parallel
    const [products, categories, workCenters] = await Promise.all([
      getAllProducts(),
      getCategories(),
      getWorkCenters(),
    ]);

    return (
      <ProductsClientPage
        initialProducts={products}
        initialCategories={categories}
        initialWorkCenters={workCenters}
      />
    );
  } catch (error) {
    console.error("❌ Error loading products page:", error);
    return (
      <div className="container mx-auto py-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-destructive mb-2">
            Error Loading Products
          </h1>
          <p className="text-muted-foreground">
            There was an error loading the products page. Please try again later.
          </p>
        </div>
      </div>
    );
  }
}
