"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import type { ProductWithRelations } from "./columns";
import { createColumns } from "./columns";
import { DataTable, getTableConfig } from "@/components/global/table";
import { ProductsExportButton } from "@/components/module/admin/products/products-export-button";
import { PaginationState } from "@tanstack/react-table";

interface ProductsPageClientProps {
  data: ProductWithRelations[];
  metadata?: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export default function ProductsPageClient({
  data,
  metadata,
}: ProductsPageClientProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const refresh = async () => {
    router.refresh();
  };

  const columns = createColumns(refresh);
  const tableConfig = getTableConfig("products");

  // Handle server-side pagination
  const pagination: PaginationState = {
    pageIndex: (metadata?.page ?? 1) - 1,
    pageSize: metadata?.limit ?? 10,
  };

  const onPaginationChange = (updaterOrValue: PaginationState | ((old: PaginationState) => PaginationState)) => {
    const previous = pagination;
    const next = typeof updaterOrValue === 'function' ? updaterOrValue(previous) : updaterOrValue;

    const params = new URLSearchParams(searchParams.toString());
    params.set("page", (next.pageIndex + 1).toString());
    params.set("limit", next.pageSize.toString());

    router.push(`${pathname}?${params.toString()}`);
  };

  return (
    <DataTable
      columns={columns}
      data={data}
      {...tableConfig}
      searchPlaceholder="Filter by name or SKU..."
      customToolbarActions={<ProductsExportButton />}
      manualPagination={!!metadata}
      pageCount={metadata?.totalPages ?? -1}
      pagination={pagination}
      onPaginationChange={onPaginationChange}
    />
  );
}
