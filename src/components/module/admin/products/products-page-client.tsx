"use client";

import { useRouter } from "next/navigation";
import type { ProductCategory } from "@prisma/client";
import type { ProductWithRelations } from "./columns";
import { createColumns } from "./columns";
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
    <DataTable
      columns={columns}
      data={data}
      {...tableConfig}
      searchPlaceholder="Filter by name or SKU..."
    />
  );
}
