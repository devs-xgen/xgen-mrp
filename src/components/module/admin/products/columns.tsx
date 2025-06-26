// src/components/module/admin/products/columns.tsx
"use client";

import { ColumnDef } from "@tanstack/react-table";
import { AlertTriangle, Factory } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { formatCurrencyPHP } from "@/lib/constant";
import type { Product, ProductCategory, Status } from "@prisma/client";
import { Checkbox } from "@/components/ui/checkbox";
import { DataTableColumnHeader } from "@/components/ui/data-table-column-header";
import { DataTableRowActions } from "./data-table-row-actions";

// Define the Product type with relations
export type ProductWithRelations = Product & {
  category: ProductCategory;
  variants?: any[];
  _count?: {
    productionOrders?: number;
  };
};

export const createColumns = (
  categories: ProductCategory[],
  onSuccess?: () => Promise<void>
): ColumnDef<ProductWithRelations>[] => [
  {
    id: "select",
    header: ({ table }) => (
      <Checkbox
        checked={
          table.getIsAllPageRowsSelected() 
            ? true 
            : table.getIsSomePageRowsSelected() 
            ? "indeterminate" 
            : false
        }
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label="Select all"
        className="translate-y-[2px]"
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label="Select row"
        className="translate-y-[2px]"
      />
    ),
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: "name",
    header: "Product Name",
    cell: ({ row }) => (
      <TooltipProvider>
        <div>
          <Tooltip>
            <TooltipTrigger asChild>
              <Link 
                href={`/admin/products/${row.original.id}`}
                className="font-medium hover:text-blue-600 hover:underline cursor-pointer transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded-sm"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    window.location.href = `/admin/products/${row.original.id}`;
                  }
                }}
                tabIndex={0}
              >
                {row.getValue("name")}
              </Link>
            </TooltipTrigger>
            <TooltipContent>
              <p>Click to view product details (or press Enter)</p>
            </TooltipContent>
          </Tooltip>
          <div className="text-xs text-muted-foreground">
            SKU: {row.original.sku}
          </div>
          {row.original.description && (
            <div className="text-xs text-muted-foreground truncate max-w-xs">
              {row.original.description}
            </div>
          )}
        </div>
      </TooltipProvider>
    ),
  },
  {
    accessorKey: "category",
    header: "Category",
    cell: ({ row }) => row.original.category?.name || "-",
  },
  {
    accessorKey: "sellingPrice",
    header: "Selling Price",
    cell: ({ row }) => {
      return formatCurrencyPHP(Number(row.getValue("sellingPrice")));
    },
  },
  {
    accessorKey: "unitCost",
    header: "Unit Cost",
    cell: ({ row }) => {
      return formatCurrencyPHP(Number(row.getValue("unitCost")));
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
          <span className="font-medium">{stock}</span>
          {isLowStock && (
            <AlertTriangle className="ml-2 h-4 w-4 text-amber-500" />
          )}
          <div className="text-xs text-muted-foreground ml-2">
            Min: {minStock}
          </div>
        </div>
      );
    },
  },
  {
    accessorKey: "productionOrders",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Production" />
    ),
    cell: ({ row }) => {
      const productionOrders = row.original._count?.productionOrders || 0;
      
      return (
        <div className="flex items-center">
          {productionOrders > 0 ? (
            <Badge variant="secondary" className="bg-blue-100 text-blue-800 flex items-center gap-1">
              <Factory className="h-3 w-3" />
              {productionOrders} orders
            </Badge>
          ) : (
            <Badge variant="outline">No production</Badge>
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
      const stock = Number(row.original.currentStock);
      const minStock = row.original.minimumStockLevel;
      
      // Determine display based on stock status
      let stockStatus: "default" | "secondary" | "destructive" = "default";
      let stockLabel = "In Stock";
      
      if (stock === 0) {
        stockStatus = "destructive";
        stockLabel = "Out of Stock";
      } else if (stock <= minStock) {
        stockStatus = "secondary";
        stockLabel = "Low Stock";
      }

      return (
        <div className="space-y-1">
          <Badge
            variant={status === "ACTIVE" ? "default" : "secondary"}
            className="text-xs"
          >
            {status.toLowerCase()}
          </Badge>
          <Badge variant={stockStatus} className="text-xs block">
            {stockLabel}
          </Badge>
        </div>
      );
    },
  },
  {
    accessorKey: "leadTime",
    header: "Lead Time",
    cell: ({ row }) => {
      const leadTime = row.getValue("leadTime") as number;
      return `${leadTime} days`;
    },
  },
  {
    id: "actions",
    cell: ({ row }) => <DataTableRowActions row={row} categories={categories} onSuccess={onSuccess} />,
  },
];
