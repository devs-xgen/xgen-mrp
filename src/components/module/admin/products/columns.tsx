// src/components/module/admin/products/columns.tsx
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
import { MoreHorizontal, Pencil, Trash, Factory, Eye } from "lucide-react";
import { ProductCategory, Status } from "@prisma/client";
import { EditProductDialog } from "./edit-product-dialog";
import { DeleteProductDialog } from "./delete-product-dialog";
import Link from "next/link";
import { CreateProductionDialog } from "./create-production-dialog";
import {
  ExtendedProductForTable,
  adaptTableProductForAPI,
  adaptTableProductForDetails,
} from "@/lib/adapters/product-adapters";

interface DataTableColumnProps {
  categories: ProductCategory[];
  workCenters: any[]; // Include work centers for production order creation
  onSuccess?: () => Promise<void>;
}

export const createColumns = ({
  categories,
  workCenters,
  onSuccess,
}: DataTableColumnProps): ColumnDef<ExtendedProductForTable>[] => [
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
    accessorKey: "sku",
    header: "SKU",
  },
  {
    accessorKey: "name",
    header: "Name",
    cell: ({ row }) => (
      <Link
        href={`/admin/products/${row.original.id}`}
        className="font-medium hover:underline"
      >
        {row.getValue("name")}
      </Link>
    ),
  },
  {
    accessorKey: "currentStock",
    header: "Stock",
    cell: ({ row }) => {
      const stock = row.getValue("currentStock") as number;
      const minStock = row.original.minimumStockLevel;

      return (
        <div className="flex items-center gap-2">
          <span>{stock}</span>
          {stock <= minStock && <Badge variant="destructive">Low Stock</Badge>}
        </div>
      );
    },
  },
  {
    accessorKey: "sellingPrice",
    header: "Price",
    cell: ({ row }) => {
      const price = row.getValue("sellingPrice") as number;
      const formatted = new Intl.NumberFormat("en-PH", {
        style: "currency",
        currency: "PHP",
      }).format(price);

      return formatted;
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
      // Use optional chaining and provide a default empty array if productionOrders is undefined
      const productionOrdersLength = product.productionOrders?.length || 0;
      const hasProductionOrders = productionOrdersLength > 0;

      // Convert the product to ProductWithNumberValues for CreateProductionDialog
      const productForDialog = adaptTableProductForDetails(product);

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
      const tableProduct = row.original;

      // Convert the table product back to a Prisma Product for the dialogs
      const productForAPI = adaptTableProductForAPI(tableProduct);

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
              <Link href={`/admin/products/${tableProduct.id}`}>
                <Eye className="mr-2 h-4 w-4" />
                View Details
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href={`/admin/production?productId=${tableProduct.id}`}>
                <Factory className="mr-2 h-4 w-4" />
                View Production
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <EditProductDialog
              product={productForAPI}
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
              product={productForAPI}
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
