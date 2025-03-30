"use client";

import { ColumnDef } from "@tanstack/react-table";
import { AlertTriangle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Material } from "@/types/admin/materials";
import { Status } from "@prisma/client";

// Format currency for display
const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
  }).format(amount);
};

console.log("Defining columns for material table - without actions column");

export const columns: ColumnDef<Material>[] = [
  {
    accessorKey: "name",
    header: "Material Name",
    cell: ({ row }) => (
      <div>
        <div className="font-medium">{row.getValue("name")}</div>
        <div className="text-xs text-muted-foreground">
          SKU: {row.original.sku}
        </div>
      </div>
    ),
  },
  {
    accessorKey: "type",
    header: "Type",
    cell: ({ row }) => row.original.type?.name || "-",
  },
  {
    accessorKey: "unitOfMeasure",
    header: "Unit",
    cell: ({ row }) => {
      const uom = row.original.unitOfMeasure;
      return uom ? `${uom.name} (${uom.symbol})` : "-";
    },
  },
  {
    accessorKey: "costPerUnit",
    header: "Cost / Unit",
    cell: ({ row }) => {
      console.log(
        "Rendering costPerUnit cell for",
        row.original.name,
        "value:",
        row.getValue("costPerUnit"),
        "type:",
        typeof row.getValue("costPerUnit")
      );
      return formatCurrency(Number(row.getValue("costPerUnit")));
    },
  },
  {
    accessorKey: "currentStock",
    header: "Current Stock",
    cell: ({ row }) => {
      const stock = Number(row.getValue("currentStock"));
      const minStock = row.original.minimumStockLevel;
      const isLowStock = stock <= minStock;

      return (
        <div className="flex items-center">
          <span>{stock}</span>
          {isLowStock && (
            <AlertTriangle className="ml-2 h-4 w-4 text-amber-500" />
          )}
        </div>
      );
    },
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      const status = row.getValue("status") as Status;
      return (
        <Badge
          variant={status === "ACTIVE" ? "default" : "secondary"}
          className="capitalize"
        >
          {status.toLowerCase()}
        </Badge>
      );
    },
  },
  // Removed the actions column since we're adding it in the DataTable component
];

console.log("Columns defined:", columns.length, "columns");
