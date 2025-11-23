"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { DataTable } from "@/components/global/table/data-table";
import { ColumnDef } from "@tanstack/react-table";

interface CustomerOrdersDataTableProps<TData, TValue> {
    columns: ColumnDef<TData, TValue>[];
    data: TData[];
    metadata: {
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    };
    highlightId?: string;
}

export function CustomerOrdersDataTable<TData, TValue>({
    columns,
    data,
    metadata,
    highlightId,
}: CustomerOrdersDataTableProps<TData, TValue>) {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();

    const onPaginationChange = (updaterOrValue: any) => {
        const newPagination =
            typeof updaterOrValue === "function"
                ? updaterOrValue({
                    pageIndex: metadata.page - 1,
                    pageSize: metadata.limit,
                })
                : updaterOrValue;

        const params = new URLSearchParams(searchParams.toString());
        params.set("page", (newPagination.pageIndex + 1).toString());
        params.set("limit", newPagination.pageSize.toString());
        router.push(`${pathname}?${params.toString()}`);
    };

    return (
        <DataTable
            columns={columns}
            data={data}
            searchKey="orderNumber"
            searchPlaceholder="Search customer orders..."
            enableSelection={false}
            enablePagination={true}
            enableFiltering={true}
            enableSorting={true}
            manualPagination={true}
            pageCount={metadata.totalPages}
            pagination={{
                pageIndex: metadata.page - 1,
                pageSize: metadata.limit,
            }}
            onPaginationChange={onPaginationChange}
            pageSize={metadata.limit}
        />
    );
}
