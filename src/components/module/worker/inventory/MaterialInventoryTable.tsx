"use client";

import { Eye } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ColumnDef } from "@tanstack/react-table";
import { 
  DataTable, 
  createTextColumn, 
  createCurrencyColumn, 
  createActionsColumn,
} from "@/components/global/table";
import type { MaterialInventoryItem } from "@/lib/actions/worker/inventory";

interface MaterialInventoryTableProps {
  materials: MaterialInventoryItem[];
  materialTypes: Array<{ id: string; name: string; description?: string }>;
  suppliers: Array<{ id: string; name: string; code: string }>;
  pagination: {
    page: number;
    pageSize: number;
    totalItems: number;
    totalPages: number;
  };
  currentFilters: {
    search?: string;
    materialType?: string;
    stockLevel?: string;
    supplierId?: string;
  };
}

// Helper function to get stock level badge
function getStockLevelBadge(stockLevel: string) {
  switch (stockLevel) {
    case "normal":
      return <Badge variant="secondary" className="bg-green-100 text-green-800">Normal</Badge>;
    case "low":
      return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">Low</Badge>;
    case "critical":
      return <Badge variant="secondary" className="bg-orange-100 text-orange-800">Critical</Badge>;
    case "outOfStock":
      return <Badge variant="destructive">Out of Stock</Badge>;
    default:
      return <Badge variant="outline">{stockLevel}</Badge>;
  }
}

export function MaterialInventoryTable({
  materials,
  materialTypes,
  suppliers,
  pagination,
  currentFilters,
}: MaterialInventoryTableProps) {
  
  // Define columns for the global DataTable
  const materialColumns: ColumnDef<MaterialInventoryItem>[] = [
    createTextColumn<MaterialInventoryItem>("name", "Material", "sku"),
    {
      accessorKey: "materialTypeName",
      header: "Type",
      cell: ({ row }) => (
        <span className="text-sm">{row.original.materialTypeName}</span>
      ),
    },
    {
      id: "stockLevel",
      header: "Stock Level",
      cell: ({ row }) => getStockLevelBadge(row.original.stockLevel),
    },
    {
      id: "currentStock",
      header: "Current Stock",
      cell: ({ row }) => (
        <span className="font-mono text-sm">
          {row.original.currentStock} {row.original.unitOfMeasureSymbol}
        </span>
      ),
    },
    {
      id: "availableStock",
      header: "Available",
      cell: ({ row }) => (
        <span className="font-mono text-sm">
          {row.original.availableStock} {row.original.unitOfMeasureSymbol}
        </span>
      ),
    },
    {
      id: "minimumStockLevel",
      header: "Min Level",
      cell: ({ row }) => (
        <span className="font-mono text-sm text-muted-foreground">
          {row.original.minimumStockLevel} {row.original.unitOfMeasureSymbol}
        </span>
      ),
    },
    createCurrencyColumn<MaterialInventoryItem>("costPerUnit", "Unit Cost"),
    createCurrencyColumn<MaterialInventoryItem>("totalValue", "Total Value"),
    {
      id: "supplier",
      header: "Supplier",
      cell: ({ row }) => (
        <div>
          <div className="font-medium text-sm">{row.original.supplier.name}</div>
          <div className="text-xs text-muted-foreground">{row.original.supplier.code}</div>
        </div>
      ),
    },
    createActionsColumn<MaterialInventoryItem>([
      {
        label: "View Details",
        icon: Eye,
        onClick: (material) => {
          // TODO: Implement view details functionality
          console.log("View material:", material);
        },
      },
    ]),
  ];

  return (
    <DataTable
      columns={materialColumns}
      data={materials}
      searchKey="name"
      searchPlaceholder="Filter materials..."
      enableFiltering={true}
      enablePagination={true}
      enableSorting={true}
      pageSize={20}
      emptyMessage="No materials found matching your criteria."
    />
  );
}
