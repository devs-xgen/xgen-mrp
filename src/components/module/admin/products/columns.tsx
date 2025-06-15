// src/components/module/admin/products/columns.tsx
"use client";

import { ColumnDef } from "@tanstack/react-table";
import { AlertTriangle } from "lucide-react";
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

// Define the Product type with relations
export type ProductWithRelations = Product & {
  category: ProductCategory;
  variants?: any[];
};

export const columns: ColumnDef<ProductWithRelations>[] = [
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
    accessorKey: "variants",
    header: "Variants",
    cell: ({ row }) => {
      const variantCount = row.original.variants?.length || 0;
      return variantCount > 0 ? (
        <Badge variant="outline" className="text-xs">
          {variantCount} variants
        </Badge>
      ) : (
        <span className="text-muted-foreground text-xs">No variants</span>
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
];
