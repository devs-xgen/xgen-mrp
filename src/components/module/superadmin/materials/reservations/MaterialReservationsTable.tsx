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
import { Search, ChevronLeft, ChevronRight, Unlock } from "lucide-react";
import { format } from "date-fns";

interface MaterialReservationsTableProps {
  initialData: any[];
  onSelectionChange: (ids: string[]) => void;
  onBulkReleaseClick: () => void;
}

export function MaterialReservationsTable({
  initialData,
  onSelectionChange,
  onBulkReleaseClick,
}: MaterialReservationsTableProps) {
  const [rowSelection, setRowSelection] = useState({});
  const [globalFilter, setGlobalFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [productionOrderStatusFilter, setProductionOrderStatusFilter] = useState("ALL");

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
            disabled={table.getRowModel().rows.every(row => !row.original.isReleasable)}
          />
        ),
        cell: ({ row }) => (
          <Checkbox
            checked={row.getIsSelected()}
            onCheckedChange={(value) => row.toggleSelected(!!value)}
            aria-label="Select row"
            disabled={!row.original.isReleasable}
          />
        ),
        enableSorting: false,
        enableHiding: false,
      },
      {
        accessorKey: "material.name",
        header: "Material",
        cell: ({ row }) => (
          <div>
            <div className="font-medium">{row.original.material.name}</div>
            <div className="text-xs text-muted-foreground">
              {row.original.material.sku}
            </div>
          </div>
        ),
      },
      {
        accessorKey: "productionOrder",
        header: "Production Order",
        cell: ({ row }) => (
          <div>
            <div className="font-mono text-xs">
              {row.original.productionOrder.id.substring(0, 12)}...
            </div>
            <div className="text-xs text-muted-foreground">
              {row.original.productionOrder.product.name}
            </div>
          </div>
        ),
      },
      {
        accessorKey: "quantityReserved",
        header: "Reserved",
        cell: ({ row }) => (
          <div className="text-right">
            <div className="font-medium">
              {Number(row.original.quantityReserved).toLocaleString()}
            </div>
            <div className="text-xs text-muted-foreground">
              {row.original.material.unitOfMeasure?.symbol || "units"}
            </div>
          </div>
        ),
      },
      {
        accessorKey: "quantityConsumed",
        header: "Consumed",
        cell: ({ row }) => {
          const consumed = Number(row.original.quantityConsumed);
          const reserved = Number(row.original.quantityReserved);
          const percentage = reserved > 0 ? (consumed / reserved) * 100 : 0;

          return (
            <div className="text-right">
              <div className="font-medium">{consumed.toLocaleString()}</div>
              <div className="text-xs text-muted-foreground">
                {percentage.toFixed(0)}%
              </div>
            </div>
          );
        },
      },
      {
        accessorKey: "remainingQuantity",
        header: "Remaining",
        cell: ({ row }) => {
          const remaining = Number(row.original.quantityReserved) - Number(row.original.quantityConsumed);
          return (
            <div className="text-right font-medium">
              {remaining.toLocaleString()}
            </div>
          );
        },
      },
      {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => {
          const status = row.original.status;
          const variantMap: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
            ACTIVE: "default",
            RELEASED: "secondary",
            CONSUMED: "outline",
            CANCELLED: "destructive",
          };

          return (
            <Badge variant={variantMap[status] || "default"}>
              {status}
            </Badge>
          );
        },
      },
      {
        accessorKey: "productionOrder.status",
        header: "Order Status",
        cell: ({ row }) => {
          const status = row.original.productionOrder.status;
          const variantMap: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
            PENDING: "outline",
            IN_PROGRESS: "default",
            COMPLETED: "secondary",
            ON_HOLD: "destructive",
            CANCELLED: "destructive",
          };

          return (
            <Badge variant={variantMap[status] || "default"} className="text-xs">
              {status}
            </Badge>
          );
        },
      },
      {
        accessorKey: "reservedAt",
        header: "Reserved Date",
        cell: ({ row }) => (
          <div className="text-sm text-muted-foreground">
            {format(new Date(row.original.reservedAt), "MMM dd, yyyy")}
          </div>
        ),
      },
    ],
    []
  );

  // Add isReleasable flag to data
  const dataWithReleasability = useMemo(() => {
    return initialData.map(reservation => ({
      ...reservation,
      isReleasable:
        reservation.status === "ACTIVE" &&
        Number(reservation.quantityReserved) > Number(reservation.quantityConsumed),
    }));
  }, [initialData]);

  // Filter data
  const filteredData = useMemo(() => {
    return dataWithReleasability.filter(item => {
      if (statusFilter !== "ALL" && item.status !== statusFilter) {
        return false;
      }
      if (productionOrderStatusFilter !== "ALL" && item.productionOrder.status !== productionOrderStatusFilter) {
        return false;
      }
      return true;
    });
  }, [dataWithReleasability, statusFilter, productionOrderStatusFilter]);

  const table = useReactTable({
    data: filteredData,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    onRowSelectionChange: setRowSelection,
    onGlobalFilterChange: setGlobalFilter,
    enableRowSelection: (row) => row.original.isReleasable,
    state: {
      rowSelection,
      globalFilter,
    },
    initialState: {
      pagination: {
        pageSize: 20,
      },
    },
  });

  // Track selected IDs and notify parent
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
            placeholder="Search materials, orders..."
            value={globalFilter}
            onChange={(e) => setGlobalFilter(e.target.value)}
            className="pl-8"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="Reservation Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Statuses</SelectItem>
            <SelectItem value="ACTIVE">Active</SelectItem>
            <SelectItem value="RELEASED">Released</SelectItem>
            <SelectItem value="CONSUMED">Consumed</SelectItem>
            <SelectItem value="CANCELLED">Cancelled</SelectItem>
          </SelectContent>
        </Select>
        <Select value={productionOrderStatusFilter} onValueChange={setProductionOrderStatusFilter}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="Order Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Order Statuses</SelectItem>
            <SelectItem value="PENDING">Pending</SelectItem>
            <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
            <SelectItem value="COMPLETED">Completed</SelectItem>
            <SelectItem value="ON_HOLD">On Hold</SelectItem>
            <SelectItem value="CANCELLED">Cancelled</SelectItem>
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
                  className={!row.original.isReleasable ? "opacity-50" : ""}
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
                  No material reservations found.
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
            {selectedCount} reservation{selectedCount > 1 ? "s" : ""} selected
          </span>
          <Button
            variant="secondary"
            size="sm"
            onClick={onBulkReleaseClick}
            className="gap-2"
          >
            <Unlock className="h-4 w-4" />
            Bulk Release
          </Button>
        </div>
      )}
    </div>
  );
}
