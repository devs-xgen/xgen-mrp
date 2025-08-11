"use client";

import { Row } from "@tanstack/react-table";
import { MoreHorizontal, Edit, Trash2, Eye } from "lucide-react";
import { useRouter } from "next/navigation";
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
import { ProductWithRelations } from "./columns";
import { EditProductDialog } from "./edit-product-dialog";
import { DeleteProductDialog } from "./delete-product-dialog";
import type { ProductCategory } from "@prisma/client";

interface DataTableRowActionsProps {
  row: Row<ProductWithRelations>;
  categories: ProductCategory[];
  onSuccess?: () => Promise<void>;
}

export function DataTableRowActions({
  row,
  categories,
  onSuccess,
}: DataTableRowActionsProps) {
  const product = row.original;
  const router = useRouter();

  const handleViewDetails = () => {
    router.push(`/admin/products/${product.id}`);
  };

  const handleEditPage = () => {
    router.push(`/admin/products/${product.id}/edit`);
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
            Edit (Page)
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <EditProductDialog
            product={product}
            categories={categories}
            trigger={
              <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                <Edit className="mr-2 h-4 w-4" />
                Edit
              </DropdownMenuItem>
            }
            onSuccess={onSuccess}
          />
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