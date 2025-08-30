"use client";

import { useRouter } from "next/navigation";
import type { ProductCategory } from "@prisma/client";
import type { ProductWithRelations } from "./columns";
import { createColumns } from "./columns";
import { CreateProductButton } from "./create-product-button";
import { DataTable, getTableConfig } from "@/components/global/table";

interface ProductsPageClientProps {
  data: ProductWithRelations[];
  categories: ProductCategory[];
}

export default function ProductsPageClient({
  data,
  categories,
}: ProductsPageClientProps) {
  const router = useRouter();
  const refresh = async () => {
    router.refresh();
  };

  const columns = createColumns(categories, refresh);
  const tableConfig = getTableConfig("products");

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-lg font-semibold leading-tight">Products</h1>
          <p className="text-sm text-muted-foreground">Manage products, variants, and production.</p>
        </div>
        <CreateProductButton categories={categories} onSuccess={refresh} />
      </div>

      <DataTable
        columns={columns}
        data={data}
        {...tableConfig}
        searchPlaceholder="Filter by name or SKU..."
      />
    </div>
  );
}
