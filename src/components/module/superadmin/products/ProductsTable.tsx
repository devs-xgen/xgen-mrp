"use client";

import { useState, useMemo, Fragment } from "react";
import {
  useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  getExpandedRowModel,
  ColumnDef,
  flexRender,
  Row,
} from "@tanstack/react-table";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatCurrencyPHP } from "@/lib/constant";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Search, ChevronLeft, ChevronRight, Archive, TrendingUp, DollarSign, ChevronDown, Package } from "lucide-react";

interface ProductsTableProps {
  initialData: any[];
  categories: Array<{ id: string; name: string }>;
  onSelectionChange: (ids: string[]) => void;
  onBulkAction: (action: "archive" | "activate" | "pricing") => void;
}

export function ProductsTable({
  initialData,
  categories,
  onSelectionChange,
  onBulkAction,
}: ProductsTableProps) {
  const [rowSelection, setRowSelection] = useState({});
  const [globalFilter, setGlobalFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [categoryFilter, setCategoryFilter] = useState("ALL");

  const columns: ColumnDef<any>[] = useMemo(
    () => [
      {
        id: "expander",
        header: () => null,
        cell: ({ row }) => {
          const hasVariants = row.original._count?.variants > 0;
          const hasBoms = row.original._count?.boms > 0;
          const canExpand = hasVariants || hasBoms;

          return canExpand ? (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => row.toggleExpanded()}
              className="h-8 w-8 p-0"
            >
              <ChevronDown
                className={`h-4 w-4 transition-transform ${
                  row.getIsExpanded() ? "rotate-180" : ""
                }`}
              />
            </Button>
          ) : null;
        },
        enableSorting: false,
      },
      {
        id: "select",
        header: ({ table }) => (
          <Checkbox
            checked={
              table.getIsAllPageRowsSelected() ||
              (table.getIsSomePageRowsSelected() && "indeterminate")
            }
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
      },
      {
        accessorKey: "sku",
        header: "SKU",
        cell: ({ row }) => (
          <div className="font-mono text-xs">{row.original.sku}</div>
        ),
      },
      {
        accessorKey: "name",
        header: "Product Name",
        cell: ({ row }) => (
          <div>
            <div className="font-medium">{row.original.name}</div>
            {row.original.category && (
              <div className="text-xs text-muted-foreground">
                {row.original.category.name}
              </div>
            )}
          </div>
        ),
      },
      {
        accessorKey: "hasVariants",
        header: "Variants",
        cell: ({ row }) => {
          const count = row.original._count?.variants || 0;
          return count > 0 ? (
            <Badge variant="secondary" className="text-xs">
              {count} variant{count > 1 ? "s" : ""}
            </Badge>
          ) : (
            <span className="text-xs text-muted-foreground">None</span>
          );
        },
      },
      {
        accessorKey: "currentStock",
        header: "Stock",
        cell: ({ row }) => {
          const stock = Number(row.original.currentStock || 0);
          const min = Number(row.original.minimumStockLevel || 0);
          const isLow = stock <= min;

          return (
            <div className={isLow ? "text-amber-600 font-medium" : ""}>
              {stock.toLocaleString()}
            </div>
          );
        },
      },
      {
        accessorKey: "sellingPrice",
        header: "Price",
        cell: ({ row }) => (
          <div className="text-right font-medium">
            {formatCurrencyPHP(row.original.sellingPrice)}
          </div>
        ),
      },
      {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => {
          const status = row.original.status;
          const variantMap: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
            ACTIVE: "default",
            INACTIVE: "secondary",
            DISCONTINUED: "destructive",
          };

          return (
            <Badge variant={variantMap[status] || "outline"}>
              {status}
            </Badge>
          );
        },
      },
      {
        id: "boms",
        header: "BOM",
        cell: ({ row }) => {
          const count = row.original._count?.boms || 0;
          return count > 0 ? (
            <Badge variant="outline" className="text-xs">
              {count} item{count > 1 ? "s" : ""}
            </Badge>
          ) : (
            <span className="text-xs text-muted-foreground">None</span>
          );
        },
      },
    ],
    []
  );

  const filteredData = useMemo(() => {
    return initialData.filter(item => {
      if (statusFilter !== "ALL" && item.status !== statusFilter) {
        return false;
      }
      if (categoryFilter !== "ALL" && item.categoryId !== categoryFilter) {
        return false;
      }
      return true;
    });
  }, [initialData, statusFilter, categoryFilter]);

  const table = useReactTable({
    data: filteredData,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getExpandedRowModel: getExpandedRowModel(),
    onRowSelectionChange: setRowSelection,
    onGlobalFilterChange: setGlobalFilter,
    state: {
      rowSelection,
      globalFilter,
    },
    initialState: {
      pagination: {
        pageSize: 25,
      },
    },
    getRowCanExpand: (row) => {
      const hasVariants = row.original._count?.variants > 0;
      const hasBoms = row.original._count?.boms > 0;
      return hasVariants || hasBoms;
    },
  });

  useMemo(() => {
    const selectedIds = table.getSelectedRowModel().rows.map(row => row.original.id);
    onSelectionChange(selectedIds);
  }, [rowSelection, table, onSelectionChange]);

  const selectedCount = table.getSelectedRowModel().rows.length;

  const renderExpandedContent = (row: Row<any>) => {
    const product = row.original;
    const hasVariants = product.variants && product.variants.length > 0;
    const hasBoms = product.boms && product.boms.length > 0;

    return (
      <div className="p-6 space-y-6">
        {/* Product-level BOMs (for products without variants) */}
        {hasBoms && !hasVariants && (
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
              <Package className="h-4 w-4" />
              <span>Materials for {product.name}</span>
            </div>
            <div className="ml-6 space-y-2">
              {product.boms.map((bom: any) => (
                <div
                  key={bom.id}
                  className="flex items-center justify-between p-3 bg-background rounded-lg border"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                      <Package className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <div className="font-medium text-sm">{bom.material.name}</div>
                      <div className="text-xs text-muted-foreground">
                        SKU: {bom.material.sku}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-medium">
                      Qty: {bom.quantityRequired}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Variants with their BOMs */}
        {hasVariants && (
          <div className="space-y-4">
            <div className="text-sm font-semibold text-muted-foreground">
              Variants ({product.variants.length})
            </div>
            <div className="space-y-4">
              {product.variants.map((variant: any) => (
                <div key={variant.id} className="ml-4 border-l-2 border-primary/20 pl-4 space-y-3">
                  {/* Variant Header */}
                  <div className="flex items-center justify-between p-3 bg-background rounded-lg border">
                    <div>
                      <div className="font-medium">{variant.displayName}</div>
                      <div className="text-xs text-muted-foreground space-x-2">
                        <span>SKU: {variant.sku}</span>
                        {variant.sizeName && <span>• Size: {variant.sizeName}</span>}
                        {variant.colorName && <span>• Color: {variant.colorName}</span>}
                        {variant.styleName && <span>• Style: {variant.styleName}</span>}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm">Stock: {variant.currentStock}</div>
                      <div className="text-sm font-medium">{formatCurrencyPHP(variant.sellingPrice)}</div>
                    </div>
                  </div>

                  {/* Variant Materials */}
                  {variant.boms && variant.boms.length > 0 && (
                    <div className="ml-6 space-y-2">
                      <div className="text-xs font-medium text-muted-foreground flex items-center gap-2">
                        <Package className="h-3 w-3" />
                        Materials ({variant.boms.length})
                      </div>
                      {variant.boms.map((bom: any) => (
                        <div
                          key={bom.id}
                          className="flex items-center justify-between p-2.5 bg-muted/50 rounded-md border text-sm"
                        >
                          <div className="flex items-center gap-2">
                            <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center">
                              <Package className="h-3 w-3 text-primary" />
                            </div>
                            <div>
                              <div className="font-medium text-xs">{bom.material.name}</div>
                              <div className="text-xs text-muted-foreground">
                                {bom.material.sku}
                              </div>
                            </div>
                          </div>
                          <div className="text-right text-xs">
                            <div className="font-medium">Qty: {bom.quantityNeeded}</div>
                            {bom.wastePercentage > 0 && (
                              <div className="text-muted-foreground">
                                Waste: {bom.wastePercentage}%
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* No variants and no BOMs */}
        {!hasVariants && !hasBoms && (
          <div className="text-sm text-muted-foreground text-center py-4">
            No variants or materials configured for this product
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search products..."
            value={globalFilter}
            onChange={(e) => setGlobalFilter(e.target.value)}
            className="pl-8"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Statuses</SelectItem>
            <SelectItem value="ACTIVE">Active</SelectItem>
            <SelectItem value="INACTIVE">Inactive</SelectItem>
            <SelectItem value="DISCONTINUED">Discontinued</SelectItem>
          </SelectContent>
        </Select>
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Categories</SelectItem>
            {categories.map(cat => (
              <SelectItem key={cat.id} value={cat.id}>
                {cat.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(header.column.columnDef.header, header.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <Fragment key={row.id}>
                  <TableRow data-state={row.getIsSelected() && "selected"}>
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id}>
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </TableCell>
                    ))}
                  </TableRow>
                  {row.getIsExpanded() && (
                    <TableRow>
                      <TableCell colSpan={columns.length} className="bg-muted/30 p-0">
                        {renderExpandedContent(row)}
                      </TableCell>
                    </TableRow>
                  )}
                </Fragment>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center">
                  No products found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          {selectedCount > 0 ? (
            <span className="font-medium text-foreground">
              {selectedCount} of {table.getFilteredRowModel().rows.length} row(s) selected
            </span>
          ) : (
            <span>
              {table.getFilteredRowModel().rows.length} row(s) total
            </span>
          )}
        </div>
        <div className="flex items-center space-x-2">
          <Select
            value={String(table.getState().pagination.pageSize)}
            onValueChange={(value) => table.setPageSize(Number(value))}
          >
            <SelectTrigger className="w-[120px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="25">25 rows</SelectItem>
              <SelectItem value="50">50 rows</SelectItem>
              <SelectItem value="100">100 rows</SelectItem>
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            <ChevronLeft className="h-4 w-4" />
            Previous
          </Button>
          <div className="text-sm">
            Page {table.getState().pagination.pageIndex + 1} of {table.getPageCount()}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            Next
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Floating Bulk Action Bar */}
      {selectedCount > 0 && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground px-6 py-3 rounded-full shadow-lg flex items-center gap-4 z-50 animate-in slide-in-from-bottom-5">
          <span className="font-medium">
            {selectedCount} product{selectedCount > 1 ? "s" : ""} selected
          </span>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => onBulkAction("archive")}
            className="gap-2"
          >
            <Archive className="h-4 w-4" />
            Archive
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => onBulkAction("activate")}
            className="gap-2"
          >
            <TrendingUp className="h-4 w-4" />
            Activate
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => onBulkAction("pricing")}
            className="gap-2"
          >
            <DollarSign className="h-4 w-4" />
            Update Pricing
          </Button>
        </div>
      )}
    </div>
  );
}
