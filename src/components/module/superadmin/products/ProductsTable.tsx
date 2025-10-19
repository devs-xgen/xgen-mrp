"use client";

import { useState, useMemo } from "react";
import {
  useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  ColumnDef,
  flexRender,
} from "@tanstack/react-table";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { Search, ChevronLeft, ChevronRight, Archive, TrendingUp, DollarSign } from "lucide-react";

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
            ${Number(row.original.sellingPrice || 0).toFixed(2)}
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
  });

  useMemo(() => {
    const selectedIds = table.getSelectedRowModel().rows.map(row => row.original.id);
    onSelectionChange(selectedIds);
  }, [rowSelection, table, onSelectionChange]);

  const selectedCount = table.getSelectedRowModel().rows.length;

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
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
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
