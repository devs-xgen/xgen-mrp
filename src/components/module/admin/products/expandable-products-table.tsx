"use client";

import { useState } from "react";
import * as React from "react";
import {
  ColumnFiltersState,
  SortingState,
  VisibilityState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  Row,
} from "@tanstack/react-table";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { ChevronDown, ChevronRight, Package, Layers } from "lucide-react";
import { createExpandableColumns } from "./expandable-columns";
import type { ProductCategory } from "@prisma/client";
import { formatCurrencyPHP } from "@/lib/constant";

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

interface ExpandableProductsTableProps {
  data: ProductWithVariants[];
  categories: ProductCategory[];
  workCenters: any[];
  onSuccess?: () => Promise<void>;
}

export function ExpandableProductsTable({
  data,
  categories,
  workCenters,
  onSuccess,
}: ExpandableProductsTableProps) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = useState({});
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

  const toggleRowExpansion = (productId: string) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(productId)) {
      newExpanded.delete(productId);
    } else {
      newExpanded.add(productId);
    }
    setExpandedRows(newExpanded);
  };

  const columns = createExpandableColumns({
    categories,
    workCenters,
    onSuccess,
    expandedRows,
    toggleRowExpansion,
  });

  const table = useReactTable({
    data,
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
    },
  });

  const renderVariantRows = (product: ProductWithVariants) => {
    if (!expandedRows.has(product.id) || !product.variants?.length) {
      return null;
    }

    return product.variants.map((variant, index) => (
      <TableRow key={`${product.id}-variant-${variant.id}`} className="bg-muted/30">
        <TableCell className="pl-12">
          <div className="flex items-center gap-2">
            <Package className="h-3 w-3 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">
              {variant.displayName || `${variant.sizeName || ''} ${variant.colorName || ''}`.trim()}
            </span>
          </div>
        </TableCell>
        <TableCell>
          <Badge variant="outline" className="text-xs">
            {variant.sku}
          </Badge>
        </TableCell>
        <TableCell>
          <div className="flex items-center gap-2">
            <span className="text-sm">{variant.currentStock}</span>
            {variant.currentStock <= variant.minimumStockLevel && (
              <Badge variant="destructive" className="text-xs">Low</Badge>
            )}
          </div>
        </TableCell>
        <TableCell>
          <span className="text-sm">{formatCurrencyPHP(variant.sellingPrice)}</span>
        </TableCell>
        <TableCell>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            {variant.sizeName && (
              <Badge variant="secondary" className="text-xs">
                {variant.sizeName}
              </Badge>
            )}
            {variant.colorName && (
              <Badge variant="secondary" className="text-xs">
                {variant.colorName}
              </Badge>
            )}
          </div>
        </TableCell>
        <TableCell>
          <span className="text-sm text-muted-foreground">-</span>
        </TableCell>
        <TableCell>
          <span className="text-sm text-muted-foreground">-</span>
        </TableCell>
      </TableRow>
    ));
  };

  return (
    <div className="w-full">
      <div className="flex items-center py-4">
        <Input
          placeholder="Filter products..."
          value={(table.getColumn("name")?.getFilterValue() as string) ?? ""}
          onChange={(event) =>
            table.getColumn("name")?.setFilterValue(event.target.value)
          }
          className="max-w-sm"
        />
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="ml-auto">
              Columns
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {table
              .getAllColumns()
              .filter((column) => column.getCanHide())
              .map((column) => {
                return (
                  <DropdownMenuCheckboxItem
                    key={column.id}
                    className="capitalize"
                    checked={column.getIsVisible()}
                    onCheckedChange={(value) =>
                      column.toggleVisibility(!!value)
                    }
                  >
                    {column.id}
                  </DropdownMenuCheckboxItem>
                );
              })}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead key={header.id}>
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </TableHead>
                  );
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <React.Fragment key={`product-row-${row.id}`}>
                  <TableRow
                    data-state={row.getIsSelected() && "selected"}
                    className={expandedRows.has(row.original.id) ? "border-b-0" : ""}
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
                  {renderVariantRows(row.original)}
                </React.Fragment>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  No results.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      
      <div className="flex items-center justify-end space-x-2 py-4">
        <div className="flex-1 text-sm text-muted-foreground">
          {table.getFilteredSelectedRowModel().rows.length} of{" "}
          {table.getFilteredRowModel().rows.length} row(s) selected.
        </div>
        <div className="space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  );
} 