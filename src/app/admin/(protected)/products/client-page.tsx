"use client";

import { useState, useCallback } from "react";
import { CreateProductDialog } from "@/components/module/admin/products/create-product-dialog";
import { ExpandableProductsTable } from "@/components/module/admin/products/expandable-products-table";
import { useRouter } from "next/navigation";
import type { ProductCategory } from "@prisma/client";

interface ProductsClientPageProps {
  initialProducts: any[];
  initialCategories: ProductCategory[];
  initialWorkCenters: any[];
}

export default function ProductsClientPage({
  initialProducts,
  initialCategories,
  initialWorkCenters,
}: ProductsClientPageProps) {
  const [products, setProducts] = useState(initialProducts);
  const [categories, setCategories] = useState(initialCategories);
  const [workCenters, setWorkCenters] = useState(initialWorkCenters);
  const router = useRouter();

  const refreshData = useCallback(async () => {
    try {
      // Instead of calling server actions directly from client, 
      // we'll refresh the page to get fresh data from the server
      router.refresh();
    } catch (error) {
      console.error("Failed to refresh data:", error);
    }
  }, [router]);

  return (
    <div className="container mx-auto py-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Products</h1>
          <p className="text-muted-foreground">
            Manage your product catalog and variants
          </p>
        </div>
        <CreateProductDialog categories={categories} onSuccess={refreshData} />
      </div>

      <ExpandableProductsTable
        data={products}
        categories={categories}
        workCenters={workCenters}
        onSuccess={refreshData}
      />
    </div>
  );
} 