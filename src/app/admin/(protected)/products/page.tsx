// src/app/admin/(protected)/products/page.tsx
import { Metadata } from "next";
import { getAllProducts, getCategories } from "@/lib/actions/product";
import ProductsClient from "./client";

export const metadata: Metadata = {
  title: "Products Management",
  description: "Manage your product inventory and variants",
};

export default async function ProductsPage() {
  try {
    const [products, categories] = await Promise.all([
      getAllProducts(),
      getCategories(),
    ]);

    return (
      <ProductsClient 
        initialProducts={products} 
        initialCategories={categories} 
      />
    );
  } catch (error) {
    console.error("Error loading products page:", error);
    return (
      <div className="container mx-auto py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">
            Error Loading Products
          </h1>
          <p className="text-gray-600">
            There was an error loading the products page. Please try refreshing.
          </p>
        </div>
      </div>
    );
  }
}
