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

export function DataTable<TData, TValue>({
  columns,
  data,
  searchKey = "name",
  searchPlaceholder = "Filter records...",
  enableSelection = false,
  enablePagination = true,
  enableFiltering = true,
  enableSorting = true,
  enableColumnVisibility = true,
  pageSize = 10,
  className,
  emptyMessage = "No results found.",
  filterOptions = [],
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
          enableFiltering={enableFiltering}
          enableColumnVisibility={enableColumnVisibility}
          filterOptions={filterOptions}
          customActions={customToolbarActions}
        />
      )}

      <div className="rounded-md border overflow-hidden">
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
