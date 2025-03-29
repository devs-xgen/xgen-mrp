// src/components/module/admin/purchase-ordeline/data-table.tsx
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
} from "@/components/ui/table";

import { DataTablePagination } from "./data-table-pagination";
import { DataTableToolbar } from "./data-table-toolbar";
import { PurchaseOrder, PurchaseOrderLine } from "@/types/admin/purchase-order";
import { Badge } from "@/components/ui/badge";
import { DataTableRowActions } from "./data-table-row-actions";

interface DataTableProps {
  data: PurchaseOrderLine[];
  materials: {
    id: string;
    name: string;
    sku: string;
    costPerUnit: number;
    currentStock: number;
    unitOfMeasure: {
      symbol: string;
      name: string;
    };
  }[];
  purchaseOrders: PurchaseOrder[];
  selectedPoId?: string;
  onSuccess: () => void;
}

export function PurchaseOrderLineDataTable({
  data,
  materials,
  purchaseOrders,
  selectedPoId,
  onSuccess,
}: DataTableProps) {
  const [rowSelection, setRowSelection] = React.useState({});
  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>({});
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    []
  );
  const [sorting, setSorting] = React.useState<SortingState>([]);

  const columns: ColumnDef<PurchaseOrderLine>[] = [
    {
      accessorKey: "id",
      header: "Line ID",
      cell: ({ row }) => {
        return `PN-${String(row.index + 1).padStart(4, "0")}`;
      },
    },
    {
      accessorKey: "poId",
      header: "Purchase Order",
      cell: ({ row }) => {
        const poId = row.original.poId;
        const purchaseOrder = purchaseOrders.find((po) => po.id === poId);
        return purchaseOrder ? purchaseOrder.poNumber : "Unknown";
      },
      enableHiding: !!selectedPoId, // Hide this column if we're viewing lines for a specific PO
    },
    {
      accessorKey: "material.name",
      header: "Material",
      cell: ({ row }) => {
        const materialId = row.original.materialId;
        const material = materials.find((m) => m.id === materialId);
        return material ? (
          <div>
            <div className="font-medium">{material.name}</div>
            <div className="text-sm text-muted-foreground">{material.sku}</div>
          </div>
        ) : (
          "Unknown"
        );
      },
    },
    {
      accessorKey: "quantity",
      header: "Quantity",
      cell: ({ row }) => {
        const materialId = row.original.materialId;
        const material = materials.find((m) => m.id === materialId);
        return `${row.original.quantity} ${
          material?.unitOfMeasure?.symbol || ""
        }`;
      },
    },
    {
      accessorKey: "unitPrice",
      header: "Unit Price",
      cell: ({ row }) => {
        const unitPrice = Number(row.original.unitPrice);
        return new Intl.NumberFormat("en-US", {
          style: "currency",
          currency: "PHP",
        }).format(unitPrice);
      },
    },
    {
      accessorKey: "lineTotal",
      header: "Total",
      cell: ({ row }) => {
        const quantity = row.original.quantity;
        const unitPrice = Number(row.original.unitPrice);
        const total = quantity * unitPrice;
        return new Intl.NumberFormat("en-US", {
          style: "currency",
          currency: "PHP",
        }).format(total);
      },
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => {
        const status = row.original.status;
        let variant: "default" | "success" | "warning" | "destructive" =
          "default";

        switch (status) {
          case "COMPLETED":
            variant = "success";
            break;
          case "PENDING":
            variant = "warning";
            break;
          case "CANCELLED":
            variant = "destructive";
            break;
        }

        return <Badge variant={variant}>{status.toLowerCase()}</Badge>;
      },
    },
    {
      id: "actions",
      cell: ({ row }) => (
        <DataTableRowActions row={row} onSuccess={onSuccess} />
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

  // Hide the PO column if we're viewing a specific PO's order lines
  React.useEffect(() => {
    if (selectedPoId) {
      setColumnVisibility((prev) => ({ ...prev, poId: false }));
    }
  }, [selectedPoId]);

  return (
    <div className="space-y-4">
      <DataTableToolbar table={table} purchaseOrders={purchaseOrders} />
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {data.length > 0 &&
              table.getHeaderGroups().map((headerGroup) => (
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
            {data.length > 0 ? (
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
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
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
