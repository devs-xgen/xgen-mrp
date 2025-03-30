"use client";

import { useState, useEffect } from "react";
import {
  ColumnDef,
  ColumnFiltersState,
  SortingState,
  flexRender,
  getCoreRowModel,
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
import { DataTableRowActions } from "./data-table-row-actions";
import { DataTableToolbar } from "./data-table-toolbar";
import { DataTablePagination } from "./data-table-pagination";
import { Material } from "@/types/admin/materials";

interface DataTableProps {
  data: Material[];
  columns: ColumnDef<Material, any>[];
  materialTypes: { id: string; name: string }[];
  unitOfMeasures: { id: string; name: string; symbol?: string }[];
  suppliers: { id: string; name: string }[];
  onSuccess?: () => Promise<void>;
}

export function DataTable({
  data,
  columns,
  materialTypes,
  unitOfMeasures,
  suppliers,
  onSuccess,
}: DataTableProps) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [rowSelection, setRowSelection] = useState({});

  // Create a new array of columns with the actions column added
  const columnsWithActions: ColumnDef<Material, any>[] = [
    ...columns,
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => (
        <DataTableRowActions
          row={row}
          materialTypes={materialTypes}
          unitOfMeasures={unitOfMeasures}
          suppliers={suppliers}
          onSuccess={onSuccess}
        />
      ),
    },
  ];

  // Initialize the table with proper data and columns including actions
  const table = useReactTable({
    data,
    columns: columnsWithActions,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    onSortingChange: setSorting,
    getSortedRowModel: getSortedRowModel(),
    onColumnFiltersChange: setColumnFilters,
    getFilteredRowModel: getFilteredRowModel(),
    onRowSelectionChange: setRowSelection,
    state: {
      sorting,
      columnFilters,
      rowSelection,
    },
  });

  return (
    <div className="space-y-4">
      {/* Enhanced toolbar with more robust filtering/view options */}
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
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
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
                  colSpan={columnsWithActions.length}
                  className="h-24 text-center"
                >
                  No materials found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Enhanced pagination component */}
      <DataTablePagination table={table} />
    </div>
  );
}
