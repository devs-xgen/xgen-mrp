"use client";

import { useRouter } from "next/navigation";
import type { ProductWithRelations } from "./columns";
import { createColumns } from "./columns";
import { DataTable, getTableConfig } from "@/components/global/table";

interface ProductsPageClientProps {
  data: ProductWithRelations[];
}

export default function ProductsPageClient({
  data,
}: ProductsPageClientProps) {
  const router = useRouter();
  const refresh = async () => {
    router.refresh();
  };

  const columns = createColumns(refresh);
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
