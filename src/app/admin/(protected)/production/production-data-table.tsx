"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { columns } from "@/components/module/admin/production/columns";
import { DataTable, getTableConfig } from "@/components/global/table";
import { PaginationState } from "@tanstack/react-table";

interface ProductionDataTableProps {
    data: any[];
    metadata: {
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    };
}

export default function ProductionDataTable({ data, metadata }: ProductionDataTableProps) {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();

    const config = getTableConfig("production");

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
            searchKey={config.searchKey}
            searchPlaceholder={config.searchPlaceholder}
            emptyMessage={config.emptyMessage}
            enableSelection={config.enableSelection}
            enableFiltering={config.enableFiltering}
            filterOptions={config.filterOptions}
            manualPagination={true}
            pageCount={metadata.totalPages}
            pagination={pagination}
            onPaginationChange={onPaginationChange}
        />
    );
}
