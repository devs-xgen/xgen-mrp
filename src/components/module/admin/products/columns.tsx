// src/components/module/admin/products/columns.tsx
"use client";
import { ColumnDef } from "@tanstack/react-table";
import { AlertTriangle, Factory, Edit, Trash2, Eye, MoreHorizontal } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import { Separator } from "@/components/ui/separator";
import { DeleteProductDialog } from "./delete-product-dialog";

// Define the Product type with relations and variants
export type ProductWithRelations = Product & {
  category: ProductCategory;
  variants?: {
    id: string;
    sku: string;
    displayName: string;
    sellingPrice: number;
    currentStock: number;
  }[];
  productionOrders?: any[];
  _count?: {
    productionOrders?: number;
  };
};

// Product Row Actions Component
interface ProductRowActionsProps {
  product: ProductWithRelations;
  onSuccess?: () => Promise<void>;
}

function ProductRowActions({ product, onSuccess }: ProductRowActionsProps) {
  const handleViewDetails = () => {
    window.location.href = `/admin/products/${product.id}`;
  };

  const handleEditPage = () => {
    window.location.href = `/admin/products/${product.id}/edit`;
  };

  return (
    <TooltipProvider>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            className="flex h-8 w-8 p-0 data-[state=open]:bg-muted"
          >
            <MoreHorizontal className="h-4 w-4" />
            <span className="sr-only">Open menu</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-[160px]">
          <Tooltip>
            <TooltipTrigger asChild>
              <DropdownMenuItem onClick={handleViewDetails}>
                <Eye className="mr-2 h-4 w-4" />
                View Details
              </DropdownMenuItem>
            </TooltipTrigger>
            <TooltipContent>
              <p>View detailed information, variants, and BOM</p>
            </TooltipContent>
          </Tooltip>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={handleEditPage}>
            <Edit className="mr-2 h-4 w-4" />
            Edit
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DeleteProductDialog
            product={product}
            trigger={
              <DropdownMenuItem
                onSelect={(e) => e.preventDefault()}
                className="text-red-600"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </DropdownMenuItem>
            }
            onSuccess={onSuccess}
          />
        </DropdownMenuContent>
      </DropdownMenu>
    </TooltipProvider>
  );
}

export const createColumns = (
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
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Product Name" />
    ),
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
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Category" />
    ),
    cell: ({ row }) => row.original.category?.name || "-",
  },
  {
    accessorKey: "sellingPrice",
    header: "Selling Price",
    cell: ({ row }) => {
      const product = row.original;
      if (product.hasVariants && product.variants && product.variants.length > 0) {
        const prices = product.variants.map(variant => variant.sellingPrice);
        const minPrice = Math.min(...prices);
        const maxPrice = Math.max(...prices);
        
        return (
          <div className="flex flex-col">
            <span className="font-semibold">
              {minPrice === maxPrice 
                ? formatCurrencyPHP(minPrice) 
                : `${formatCurrencyPHP(minPrice)} - ${formatCurrencyPHP(maxPrice)}`
              }
            </span>
            <span className="text-xs text-muted-foreground italic">
              (From variants)
            </span>
          </div>
        );
      }
      return formatCurrencyPHP(Number(product.sellingPrice));
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
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Current Stock" />
    ),
    cell: ({ row }) => {
      const product = row.original;
      
      const totalVariantStock = product.hasVariants && product.variants && product.variants.length > 0
        ? product.variants.reduce((sum, variant) => sum + variant.currentStock, 0)
        : null;
      
      const isLowStock = Number(product.currentStock) <= product.minimumStockLevel;
      const isVariantLowStock = totalVariantStock !== null && totalVariantStock <= product.minimumStockLevel;
      
      return (
        <div className="flex flex-col space-y-1">
          {totalVariantStock === null ? (
            // Display only base product stock if no variants exist
            <div className="flex items-center">
              <span className="font-medium">{product.currentStock}</span>
              {isLowStock && (
                <AlertTriangle className="ml-2 h-4 w-4 text-amber-500" />
              )}
            </div>
          ) : (
            // Display both base and variant stock if variants exist
            <>
              <div className="flex items-center text-sm font-normal">
                <span className="text-muted-foreground mr-1">Base:</span>
                <span className="font-medium">
                  {product.currentStock}
                </span>
                {isLowStock && (
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <AlertTriangle className="ml-2 h-4 w-4 text-amber-500" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Base stock is low</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                )}
              </div>
              <Separator className="my-1" />
              <div className="flex items-center text-sm font-normal">
                <span className="text-muted-foreground mr-1">Variants:</span>
                <span className="font-medium">
                  {totalVariantStock}
                </span>
                {isVariantLowStock && (
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <AlertTriangle className="ml-2 h-4 w-4 text-amber-500" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Variant stock is low</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                )}
              </div>
            </>
          )}
          <div className="text-xs text-muted-foreground">
            Min: {product.minimumStockLevel}
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
      const productionOrders =
        typeof row.original._count?.productionOrders === "number"
          ? (row.original._count?.productionOrders as number)
          : (row.original as any).productionOrders?.length || 0;
      
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
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Status" />
    ),
    cell: ({ row }) => {
      const status = row.getValue("status") as Status;
      const product = row.original;
      
      const totalStock = product.hasVariants && product.variants && product.variants.length > 0
        ? product.variants.reduce((sum, variant) => sum + variant.currentStock, 0)
        : Number(product.currentStock);
        
      const minStock = product.minimumStockLevel;
      
      let stockStatus: "default" | "secondary" | "destructive" = "default";
      let stockLabel = "In Stock";
      
      if (totalStock === 0) {
        stockStatus = "destructive";
        stockLabel = "Out of Stock";
      } else if (totalStock <= minStock) {
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
    cell: ({ row }) => (
      <ProductRowActions 
        product={row.original} 
        onSuccess={onSuccess} 
      />
    ),
    enableSorting: false,
    enableHiding: false,
  },
];