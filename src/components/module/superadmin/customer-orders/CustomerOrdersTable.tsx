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
import { Search, ChevronLeft, ChevronRight, Edit, ExternalLink } from "lucide-react";
import { format } from "date-fns";
import Link from "next/link";

interface CustomerOrdersTableProps {
  initialData: any[];
  onSelectionChange: (ids: string[]) => void;
  onBulkStatusClick: () => void;
}

export function CustomerOrdersTable({
  initialData,
  onSelectionChange,
  onBulkStatusClick,
}: CustomerOrdersTableProps) {
  const [rowSelection, setRowSelection] = useState({});
  const [globalFilter, setGlobalFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [tenantFilter, setTenantFilter] = useState("ALL");

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
        enableHiding: false,
      },
      {
        accessorKey: "orderNumber",
        header: "Order #",
        cell: ({ row }) => (
          <Link
            href={`/superadmin/customer-orders/${row.original.id}`}
            className="font-mono text-xs hover:underline"
          >
            {row.original.orderNumber}
          </Link>
        ),
      },
      {
        accessorKey: "customer.name",
        header: "Customer",
        cell: ({ row }) => (
          <div>
            <div className="font-medium">{row.original.customer.name}</div>
            <div className="text-xs text-muted-foreground">
              {row.original.customer.email}
            </div>
          </div>
        ),
      },
      {
        accessorKey: "tenant.name",
        header: "Tenant",
        cell: ({ row }) => (
          <div className="text-sm">{row.original.tenant?.name || "N/A"}</div>
        ),
      },
      {
        accessorKey: "orderDate",
        header: "Order Date",
        cell: ({ row }) => (
          <div className="text-sm text-muted-foreground">
            {format(new Date(row.original.orderDate), "MMM dd, yyyy")}
          </div>
        ),
      },
      {
        accessorKey: "requiredDate",
        header: "Delivery Date",
        cell: ({ row }) => (
          <div className="text-sm">
            {row.original.requiredDate
              ? format(new Date(row.original.requiredDate), "MMM dd, yyyy")
              : "N/A"}
          </div>
        ),
      },
      {
        accessorKey: "totalAmount",
        header: "Total",
        cell: ({ row }) => (
          <div className="text-right font-medium">
            ${Number(row.original.totalAmount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </div>
        ),
      },
      {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => {
          const status = row.original.status;
          const variantMap: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
            PENDING: "outline",
            APPROVED: "default",
            IN_PROGRESS: "default",
            COMPLETED: "secondary",
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
        id: "production",
        header: "Production",
        cell: ({ row }) => {
          const count = row.original._count?.productionOrders || 0;
          return count > 0 ? (
            <Badge variant="secondary" className="text-xs">
              {count} PO{count > 1 ? "s" : ""}
            </Badge>
          ) : (
            <span className="text-xs text-muted-foreground">None</span>
          );
        },
      },
      {
        id: "actions",
        header: "Actions",
        cell: ({ row }) => (
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              asChild
            >
              <Link href={`/superadmin/customer-orders/${row.original.id}`}>
                <ExternalLink className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        ),
      },
    ],
    []
  );

  // Filter data
  const filteredData = useMemo(() => {
    return initialData.filter(item => {
      if (statusFilter !== "ALL" && item.status !== statusFilter) {
        return false;
      }
      if (tenantFilter !== "ALL" && item.tenantId !== tenantFilter) {
        return false;
      }
      return true;
    });
  }, [initialData, statusFilter, tenantFilter]);

  // Get unique tenants for filter
  const tenants = useMemo(() => {
    const uniqueTenants = new Map();
    initialData.forEach(order => {
      if (order.tenant) {
        uniqueTenants.set(order.tenant.id, order.tenant.name);
      }
    });
    return Array.from(uniqueTenants, ([id, name]) => ({ id, name }));
  }, [initialData]);

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
            placeholder="Search orders, customers..."
            value={globalFilter}
            onChange={(e) => setGlobalFilter(e.target.value)}
            className="pl-8"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="Order Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Statuses</SelectItem>
            <SelectItem value="PENDING">Pending</SelectItem>
            <SelectItem value="APPROVED">Approved</SelectItem>
            <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
            <SelectItem value="COMPLETED">Completed</SelectItem>
            <SelectItem value="CANCELLED">Cancelled</SelectItem>
          </SelectContent>
        </Select>
        <Select value={tenantFilter} onValueChange={setTenantFilter}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="Tenant" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Tenants</SelectItem>
            {tenants.map(tenant => (
              <SelectItem key={tenant.id} value={tenant.id}>
                {tenant.name}
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
                  No customer orders found.
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
            {selectedCount} order{selectedCount > 1 ? "s" : ""} selected
          </span>
          <Button
            variant="secondary"
            size="sm"
            onClick={onBulkStatusClick}
            className="gap-2"
          >
            <Edit className="h-4 w-4" />
            Bulk Update Status
          </Button>
        </div>
      )}
    </div>
  );
}
