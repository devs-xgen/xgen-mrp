// src/components/module/inspector/inventory/columns.tsx
"use client";

import { ColumnDef } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import { ArrowUpDown } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { DataTableRowActions } from "./data-table-row-actions";


// Define a common interface for the combined data
interface InventoryItem {
  id: string;
  sku: string;
  name: string;
  type: 'material' | 'product';
  currentStock: number;
  minimumStockLevel: number;
  unitOfMeasure: { name: string; symbol: string; };
  supplier?: { id: string; name: string };
  displayName?: string; // from product variants
  materialType?: { id: string; name: string };
}

export const createColumns = (
  materialTypes: { id: string; name: string }[],
  unitOfMeasures: { id: string; name: string; symbol?: string }[],
  suppliers: { id: string; name: string }[],
  onSuccess?: () => Promise<void>
): ColumnDef<InventoryItem>[] => [
  {
    accessorKey: "sku",
    header: ({ column }) => (
      <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
        SKU
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
  },
  {
    accessorKey: "name",
    header: ({ column }) => (
      <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
        Name
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => {
      const item = row.original;
      const name = item.name || item.displayName;
      return <div className="font-medium">{name}</div>;
    },
  },
  {
    accessorKey: "currentStock",
    header: ({ column }) => (
      <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
        Quantity
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => {
      const item = row.original;
      return <div className="text-right">{item.currentStock}</div>;
    },
  },
  {
    accessorKey: "unitOfMeasure",
    header: "Unit",
    cell: ({ row }) => {
      const item = row.original;
      const unit = item.unitOfMeasure?.symbol || (item.type === 'product' ? 'pcs' : 'N/A');
      return <div className="text-muted-foreground">{unit}</div>;
    },
  },
  {
    accessorKey: "stockLevel",
    header: "Stock Level",
    cell: ({ row }) => {
      const item = row.original;
      const stockLevel = item.currentStock <= item.minimumStockLevel ? 'Low' : 'Adequate';
      return (
        <Badge
          variant={stockLevel === 'Low' ? 'destructive' : 'default'}
          className={stockLevel === 'Adequate' ? 'bg-green-500 hover:bg-green-500' : ''}
        >
          {stockLevel}
        </Badge>
      );
    },
    filterFn: (row, id, value) => {
      // You'll need a way to filter by stock level in the toolbar
      return value.includes(row.getValue(id));
    },
  },
  {
    accessorKey: "type",
    header: "Type",
    cell: ({ row }) => {
      const type = row.original.type;
      return <Badge variant="secondary">{type === 'product' ? 'Product' : 'Material'}</Badge>;
    },
  },
  {
    id: "actions",
    cell: ({ row }) => <DataTableRowActions row={row} onSuccess={onSuccess} />,
  },
];