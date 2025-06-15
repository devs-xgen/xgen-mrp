import { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { 
  MoreHorizontal, 
  Pencil, 
  Trash, 
  Factory, 
  Eye, 
  ChevronDown, 
  ChevronRight,
  Layers,
  Package
} from "lucide-react";
import { ProductCategory, Status } from "@prisma/client";
import { EditProductDialog } from "./edit-product-dialog";
import { DeleteProductDialog } from "./delete-product-dialog";
import Link from "next/link";
import { CreateProductionDialog } from "./create-production-dialog";
import { formatCurrencyPHP } from "@/lib/constant";
import { ProductWithNumberValues } from "@/types/admin/product";

// Helper function to convert ProductWithVariants to ProductWithNumberValues
const convertToProductWithNumberValues = (product: ProductWithVariants): ProductWithNumberValues => {
  return {
    id: product.id,
    name: product.name,
    sku: product.sku,
    sellingPrice: product.sellingPrice,
    description: null,
    status: product.status as Status,
    categoryId: product.category?.id || '',
    currentStock: product.currentStock,
    minimumStockLevel: product.minimumStockLevel,
    leadTime: 0, // Default value
    sizeRange: [], // Default value
    colorOptions: [], // Default value
    unitCost: product.sellingPrice, // Fallback
    createdAt: new Date(),
    updatedAt: new Date(),
    hasVariants: product.hasVariants,
    category: product.category,
    productionOrders: product.productionOrders,
    boms: [],
    variants: [],
    expectedStock: 0,
    committedStock: 0,
    calculatedStock: 0,
    createdBy: null,
    modifiedBy: null,
  };
};

interface ProductWithVariants {
  id: string;
  name: string;
  sku: string;
  currentStock: number;
  minimumStockLevel: number;
  sellingPrice: number;
  status: string;
  hasVariants: boolean;
  category?: {
    id: string;
    name: string;
  };
  variants?: Array<{
    id: string;
    sku: string;
    sizeName: string | null;
    colorName: string | null;
    currentStock: number;
    minimumStockLevel: number;
    unitCost: number;
    sellingPrice: number;
    displayName: string;
  }>;
  productionOrders?: Array<{
    id: string;
    status: string;
    quantity: number;
    dueDate: Date;
  }>;
}

interface ExpandableColumnProps {
  categories: ProductCategory[];
  workCenters: any[];
  onSuccess?: () => Promise<void>;
  expandedRows: Set<string>;
  toggleRowExpansion: (productId: string) => void;
}

export const createExpandableColumns = ({
  categories,
  workCenters,
  onSuccess,
  expandedRows,
  toggleRowExpansion,
}: ExpandableColumnProps): ColumnDef<ProductWithVariants>[] => [
  {
    id: "select",
    header: ({ table }) => (
      <Checkbox
        checked={table.getIsAllPageRowsSelected()}
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label="Select all"
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label="Select row"
      />
    ),
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: "name",
    header: "Product Name",
    cell: ({ row }) => {
      const product = row.original;
      const hasVariants = product.variants && product.variants.length > 0;
      const isExpanded = expandedRows.has(product.id);

      return (
        <div className="flex items-center gap-2">
          {hasVariants && (
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0"
              onClick={() => toggleRowExpansion(product.id)}
            >
              {isExpanded ? (
                <ChevronDown className="h-3 w-3" />
              ) : (
                <ChevronRight className="h-3 w-3" />
              )}
            </Button>
          )}
          <div className="flex flex-col">
            <Link
              href={`/admin/products/${product.id}`}
              className="font-medium hover:underline"
            >
              {product.name}
            </Link>
            {hasVariants && (
              <div className="flex items-center gap-1 mt-1">
                <Layers className="h-3 w-3 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">
                  {product.variants?.length || 0} variant{(product.variants?.length || 0) !== 1 ? 's' : ''}
                </span>
              </div>
            )}
          </div>
        </div>
      );
    },
  },
  {
    accessorKey: "sku",
    header: "SKU",
    cell: ({ row }) => (
      <Badge variant="outline">{row.getValue("sku")}</Badge>
    ),
  },
  {
    accessorKey: "currentStock",
    header: "Stock",
    cell: ({ row }) => {
      const product = row.original;
      const hasVariants = product.variants && product.variants.length > 0;
      
      if (hasVariants && product.variants) {
        // Show aggregated stock for products with variants
        const totalStock = product.variants.reduce((sum, variant) => sum + variant.currentStock, 0);
        const lowStockVariants = product.variants.filter(v => v.currentStock <= v.minimumStockLevel).length;
        
        return (
          <div className="flex items-center gap-2">
            <span>{totalStock}</span>
            {lowStockVariants > 0 && (
              <Badge variant="destructive" className="text-xs">
                {lowStockVariants} low
              </Badge>
            )}
          </div>
        );
      } else {
        // Show individual stock for products without variants
        const stock = product.currentStock;
        const minStock = product.minimumStockLevel;

        return (
          <div className="flex items-center gap-2">
            <span>{stock}</span>
            {stock <= minStock && <Badge variant="destructive">Low Stock</Badge>}
          </div>
        );
      }
    },
  },
  {
    accessorKey: "sellingPrice",
    header: "Price",
    cell: ({ row }) => {
      const product = row.original;
      const hasVariants = product.variants && product.variants.length > 0;
      
      if (hasVariants && product.variants) {
        // Show price range for products with variants
        const prices = product.variants.map(v => v.sellingPrice);
        const minPrice = Math.min(...prices);
        const maxPrice = Math.max(...prices);
        
        if (minPrice === maxPrice) {
          return formatCurrencyPHP(minPrice);
        } else {
          return `${formatCurrencyPHP(minPrice)} - ${formatCurrencyPHP(maxPrice)}`;
        }
      } else {
        // Show individual price for products without variants
        const price = product.sellingPrice;
        return formatCurrencyPHP(price);
      }
    },
  },
  {
    id: "variants",
    header: "Variants",
    cell: ({ row }) => {
      const product = row.original;
      const hasVariants = product.variants && product.variants.length > 0;
      
      if (!hasVariants) {
        return (
          <span className="text-sm text-muted-foreground">No variants</span>
        );
      }

      // Group variants by size and color for display
      const sizes = [...new Set(product.variants?.map(v => v.sizeName).filter(Boolean) || [])];
      const colors = [...new Set(product.variants?.map(v => v.colorName).filter(Boolean) || [])];

      return (
        <div className="flex flex-col gap-1">
          {sizes.length > 0 && (
            <div className="flex items-center gap-1 flex-wrap">
              <span className="text-xs text-muted-foreground">Sizes:</span>
              {sizes.slice(0, 3).map(size => (
                <Badge key={size} variant="secondary" className="text-xs">
                  {size}
                </Badge>
              ))}
              {sizes.length > 3 && (
                <span className="text-xs text-muted-foreground">+{sizes.length - 3}</span>
              )}
            </div>
          )}
          {colors.length > 0 && (
            <div className="flex items-center gap-1 flex-wrap">
              <span className="text-xs text-muted-foreground">Colors:</span>
              {colors.slice(0, 3).map(color => (
                <Badge key={color} variant="secondary" className="text-xs">
                  {color}
                </Badge>
              ))}
              {colors.length > 3 && (
                <span className="text-xs text-muted-foreground">+{colors.length - 3}</span>
              )}
            </div>
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
        <Badge variant={status === "ACTIVE" ? "default" : "secondary"}>
          {status.toLowerCase()}
        </Badge>
      );
    },
  },
  {
    id: "production",
    header: "Production",
    cell: ({ row }) => {
      const product = row.original;
      const productionOrdersLength = product.productionOrders?.length || 0;
      const hasProductionOrders = productionOrdersLength > 0;

      // Convert product for dialog
      const productForDialog = convertToProductWithNumberValues(product);

      return (
        <div className="flex items-center gap-2">
          {hasProductionOrders ? (
            <Badge variant="secondary" className="flex items-center gap-1">
              <Factory className="h-3 w-3" />
              <span>{productionOrdersLength} active</span>
            </Badge>
          ) : product.currentStock <= product.minimumStockLevel ? (
            <CreateProductionDialog
              product={productForDialog}
              workCenters={workCenters}
            >
              <Button variant="outline" size="sm" className="h-8">
                <Factory className="mr-2 h-3 w-3" />
                Create Production
              </Button>
            </CreateProductionDialog>
          ) : null}
        </div>
      );
    },
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const product = row.original;

      // Convert product for dialogs
      const productForAPI = convertToProductWithNumberValues(product);

      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">Open menu</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Actions</DropdownMenuLabel>
            <DropdownMenuItem asChild>
              <Link href={`/admin/products/${product.id}`}>
                <Eye className="mr-2 h-4 w-4" />
                View Details
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href={`/admin/production?productId=${product.id}`}>
                <Factory className="mr-2 h-4 w-4" />
                View Production
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <EditProductDialog
              product={productForAPI as any}
              categories={categories}
              onSuccess={onSuccess}
              trigger={
                <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                  <Pencil className="mr-2 h-4 w-4" />
                  Edit
                </DropdownMenuItem>
              }
            />
            <DeleteProductDialog
              product={productForAPI as any}
              onSuccess={onSuccess}
              trigger={
                <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                  <Trash className="mr-2 h-4 w-4" />
                  Delete
                </DropdownMenuItem>
              }
            />
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
]; 