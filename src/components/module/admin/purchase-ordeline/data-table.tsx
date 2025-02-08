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

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"; // Adjust path if needed

import { DataTablePagination } from "./data-table-pagination"; // Adjust path if needed
import { DataTableToolbar } from "./data-table-toolbar"; // Adjust path if needed
import { PurchaseOrderLine } from "@/types/admin/purchase-order"; // Import your type
import { Material } from "@prisma/client"; // Import Material type

interface DataTableProps {
  data: PurchaseOrderLine[];
  materials: Material[];
  onSuccess: () => void;
}

export function PurchaseOrderLineDataTable({ data, materials, onSuccess }: DataTableProps) {
  const [rowSelection, setRowSelection] = React.useState({});
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({});
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);
  const [sorting, setSorting] = React.useState<SortingState>([]);

  const columns: ColumnDef<PurchaseOrderLine>[] = [
    {
      accessorKey: "id",
      header: "ID",
      cell: ({ row }) => {
        return `PN-${String(row.index + 1).padStart(4, '0')}`; // Generate sequential number
      },
      // cell: ({ row }) => {
      //   const idNumber = row.original.id; // Get the actual ID
      //   return `PN-${String(idNumber).padStart(4, '0')}`; // Format as PN-0001
      // },
    },
    {
      accessorKey: "material.name",
      header: "Material",
      cell: ({ row }) => {
        const materialId = row.original.materialId;
        const material = materials.find((m) => m.id === materialId);
        return material ? material.name : "Unknown";
      },
    },
    {
      accessorKey: "quantity",
      header: "Quantity",
    },
    // Add more columns as needed (unit price, total price, etc.)
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => (
        <button onClick={() => {
          // Edit logic here (e.g., open a modal)
          console.log("Edit clicked for row:", row.original);
        }}>
          Edit
        </button>
      ),
    },
  ];

  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
      columnVisibility,
      rowSelection,
      columnFilters,
    },
    enableRowSelection: true,
    onRowSelectionChange: setRowSelection,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  return (
    <div className="space-y-4">
      <DataTableToolbar table={table} />
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {data.length > 0 && // <-- Conditional rendering
              table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <TableHead key={header.id}>
                      {header.isPlaceholder
                        ? null
                        : flexRender(header.column.columnDef.header, header.getContext())}
                    </TableHead>
                  ))}
                </TableRow>
              ))}
          </TableHeader>
          <TableBody>
            {data.length > 0 ? ( // <-- Conditional rendering
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id} data-state={row.getIsSelected() && "selected"}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center">
                  {data.length === 0 ? "No results." : "Loading..."}
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