"use client";

import * as React from "react";
import {
  ColumnDef,
  ColumnFiltersState,
  SortingState,
  VisibilityState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { useRouter, usePathname, useSearchParams } from "next/navigation";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import { DataTablePagination } from "./data-table-pagination";
import { DataTableToolbar } from "./data-table-toolbar";

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  highlightId?: string; // Optional ID to highlight a row
  metadata?: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export function DataTable<TData, TValue>({
  columns,
  data,
  highlightId,
  metadata,
}: DataTableProps<TData, TValue>) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [rowSelection, setRowSelection] = React.useState({});
  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>({});
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    []
  );
  const [sorting, setSorting] = React.useState<SortingState>([]);

  // Auto-scroll to highlighted row
  const highlightedRowRef = React.useRef<HTMLTableRowElement>(null);

  React.useEffect(() => {
    if (highlightId && highlightedRowRef.current) {
      highlightedRowRef.current.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    }
  }, [highlightId, data]);

  const onPaginationChange = (updaterOrValue: any) => {
    const newPagination =
      typeof updaterOrValue === "function"
        ? updaterOrValue({
          pageIndex: (metadata?.page || 1) - 1,
          pageSize: metadata?.limit || 10,
        })
        : updaterOrValue;

    const params = new URLSearchParams(searchParams.toString());
    params.set("page", (newPagination.pageIndex + 1).toString());
    params.set("limit", newPagination.pageSize.toString());
    router.push(`${pathname}?${params.toString()}`);
  };

  const table = useReactTable({
    data,
    columns,
    pageCount: metadata?.totalPages || -1,
    manualPagination: true,
    state: {
      sorting,
      columnVisibility,
      rowSelection,
      columnFilters,
      pagination: {
        pageIndex: (metadata?.page || 1) - 1,
        pageSize: metadata?.limit || 10,
      },
    },
    enableRowSelection: true,
    onRowSelectionChange: setRowSelection,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onPaginationChange,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  // Find the page that contains the highlighted row if any
  React.useEffect(() => {
    if (highlightId) {
      const allRows = table.getCoreRowModel().rows;
      const rowIndex = allRows.findIndex(
        (row) => (row.original as any).id === highlightId
      );

      if (rowIndex !== -1) {
        const pageSize = table.getState().pagination.pageSize;
        const pageIndex = Math.floor(rowIndex / pageSize);
        table.setPageIndex(pageIndex);
      }
    }
  }, [highlightId, table, data]);

  return (
    <div className="space-y-4">
      <DataTableToolbar table={table} />
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                        header.column.columnDef.header,
                        header.getContext()
                      )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => {
                const isHighlighted =
                  highlightId && (row.original as any).id === highlightId;

                return (
                  <TableRow
                    key={row.id}
                    data-state={row.getIsSelected() && "selected"}
                    className={
                      isHighlighted ? "bg-primary/10 animate-pulse" : ""
                    }
                    ref={isHighlighted ? highlightedRowRef : null}
                  >
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id}>
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext()
                        )}
                      </TableCell>
                    ))}
                  </TableRow>
                );
              })
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  No results.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <DataTablePagination table={table} />
    </div>
  );
}
