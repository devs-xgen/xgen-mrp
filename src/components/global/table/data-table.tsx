// src/components/global/table/data-table.tsx
"use client";

import * as React from "react";
import {
  ColumnFiltersState,
  SortingState,
  VisibilityState,
  flexRender,
  getCoreRowModel,
  getFacetedRowModel,
  getFacetedUniqueValues,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { DataTableProps } from "./types";
import { DataTableToolbar } from "./data-table-toolbar";
import { DataTablePagination } from "./data-table-pagination";

const EMPTY_FILTER_OPTIONS: DataTableProps<unknown, unknown>["filterOptions"] = [];

function formatColumnLabel(column: ReturnType<typeof useReactTable<any>>["getAllColumns"][number]) {
  const header = column.columnDef.header;

  if (typeof header === "string") {
    return header;
  }

  const sourceLabel =
    (typeof column.columnDef.accessorKey === "string" && column.columnDef.accessorKey) ||
    column.id;

  return sourceLabel
    .replace(/_/g, " ")
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function isActionColumn(column: ReturnType<typeof useReactTable<any>>["getAllColumns"][number]) {
  if (column.id === "actions") {
    return true;
  }

  const header = column.columnDef.header;
  return typeof header === "string" && header.toLowerCase() === "actions";
}

export function DataTable<TData, TValue>({
  columns,
  data,
  searchKey = "name",
  searchPlaceholder = "Filter records...",
  showSearchInput = true,
  enableSelection = false,
  enablePagination = true,
  enableFiltering = true,
  enableSorting = true,
  enableColumnVisibility = true,
  pageSize = 10,
  className,
  emptyMessage = "No results found.",
  filterOptions = EMPTY_FILTER_OPTIONS,
  customToolbarActions,
  manualPagination = false,
  pageCount = -1,
  pagination,
  onPaginationChange,
}: DataTableProps<TData, TValue>) {
  const [rowSelection, setRowSelection] = React.useState({});
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({});
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);
  const [sorting, setSorting] = React.useState<SortingState>([]);

  const table = useReactTable({
    data,
    columns,
    state: {
      sorting: enableSorting ? sorting : [],
      columnVisibility,
      rowSelection: enableSelection ? rowSelection : {},
      columnFilters: enableFiltering ? columnFilters : [],
      ...(manualPagination ? { pagination } : {}),
    },
    enableRowSelection: enableSelection,
    onRowSelectionChange: enableSelection ? setRowSelection : undefined,
    onSortingChange: enableSorting ? setSorting : undefined,
    onColumnFiltersChange: enableFiltering ? setColumnFilters : undefined,
    onColumnVisibilityChange: enableColumnVisibility ? setColumnVisibility : undefined,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: enableFiltering ? getFilteredRowModel() : undefined,
    getPaginationRowModel: enablePagination ? getPaginationRowModel() : undefined,
    getSortedRowModel: enableSorting ? getSortedRowModel() : undefined,
    getFacetedRowModel: enableFiltering ? getFacetedRowModel() : undefined,
    getFacetedUniqueValues: enableFiltering ? getFacetedUniqueValues() : undefined,
    manualPagination,
    pageCount: manualPagination ? pageCount : undefined,
    onPaginationChange: manualPagination ? onPaginationChange : undefined,
    initialState: {
      pagination: {
        pageSize,
      },
    },
  });

  // Compute rows to render: only current page when pagination is enabled
  // If manual pagination is on, we assume 'data' is already the current page slice.
  const rowsToRender = enablePagination && !manualPagination
    ? table.getPaginationRowModel().rows
    : table.getRowModel().rows;

  return (
    <div className={cn("space-y-4", className)}>
      {enableFiltering && (
        <DataTableToolbar
          table={table}
          searchKey={searchKey}
          searchPlaceholder={searchPlaceholder}
          showSearchInput={showSearchInput}
          enableFiltering={enableFiltering}
          enableColumnVisibility={enableColumnVisibility}
          filterOptions={filterOptions}
          customActions={customToolbarActions}
        />
      )}

      <div className="space-y-3 md:hidden">
        {rowsToRender?.length ? (
          rowsToRender.map((row) => {
            const visibleCells = row.getVisibleCells();
            const actionCell = visibleCells.find((cell) => isActionColumn(cell.column));
            const contentCells = visibleCells.filter((cell) => !isActionColumn(cell.column));

            return (
              <div
                key={row.id}
                data-state={row.getIsSelected() && "selected"}
                className="rounded-xl border bg-card p-4 shadow-sm"
              >
                {actionCell && (
                  <div className="mb-3 flex justify-end">
                    {flexRender(actionCell.column.columnDef.cell, actionCell.getContext())}
                  </div>
                )}

                <div className="space-y-3">
                  {contentCells.map((cell) => (
                    <div
                      key={cell.id}
                      className="grid gap-1 border-b border-border/60 pb-3 last:border-b-0 last:pb-0"
                    >
                      <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                        {formatColumnLabel(cell.column)}
                      </div>
                      <div className="text-sm">
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })
        ) : (
          <div className="rounded-xl border bg-card px-4 py-10 text-center text-sm text-muted-foreground">
            {emptyMessage}
          </div>
        )}
      </div>

      <div className="hidden overflow-hidden rounded-md border md:block">
        <Table>
          <TableHeader className="bg-muted/50">
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead key={header.id} colSpan={header.colSpan}>
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                    </TableHead>
                  );
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {rowsToRender?.length ? (
              rowsToRender.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                  className="transition-colors hover:bg-muted/30"
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
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={table.getAllColumns().length}
                  className="h-24 text-center"
                >
                  {emptyMessage}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {enablePagination && (
        <div className="space-y-2">
          <DataTablePagination table={table} enableSelection={enableSelection} />
          <div className="text-[10px] text-muted-foreground text-center">
            Pagination Mode: {manualPagination ? "Server-side" : "Client-side"}
          </div>
        </div>
      )}
    </div>
  );
}
