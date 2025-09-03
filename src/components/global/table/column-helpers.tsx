// src/components/global/table/column-helpers.tsx
"use client";

import { ColumnDef } from "@tanstack/react-table";
import { ArrowUpDown, MoreHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { formatCurrency, formatDate, formatDateTime } from "./table-utils";
import { DataTableRowActions } from "./data-table-row-actions";
import { RowAction } from "./types";

// Helper to create a sortable header
export function createSortableHeader(title: string) {
  const SortableHeader = ({ column }: any) => {
    return (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        className="h-8 px-2"
      >
        {title}
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    );
  };
  SortableHeader.displayName = `SortableHeader_${title}`;
  return SortableHeader;
}

// Helper to create a selection column
export function createSelectionColumn<T>(): ColumnDef<T> {
  return {
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
  };
}

// Helper to create a status badge column
export function createStatusColumn<T>(
  accessorKey: string,
  title: string = "Status"
): ColumnDef<T> {
  return {
    accessorKey,
    header: createSortableHeader(title),
    cell: ({ row }) => {
      const status = row.getValue(accessorKey) as string;
      return (
        <Badge
          variant={
            status === "ACTIVE" || status === "COMPLETED"
              ? "default"
              : status === "PENDING" || status === "IN_PROGRESS"
              ? "secondary"
              : status === "CANCELLED" || status === "FAILED"
              ? "destructive"
              : "outline"
          }
          className="capitalize"
        >
          {status.toLowerCase().replace("_", " ")}
        </Badge>
      );
    },
  };
}

// Helper to create a currency column
export function createCurrencyColumn<T>(
  accessorKey: string,
  title: string,
  currency = "PHP"
): ColumnDef<T> {
  return {
    accessorKey,
    header: createSortableHeader(title),
    cell: ({ row }) => {
      const amount = row.getValue(accessorKey) as number;
      return formatCurrency(amount, currency);
    },
  };
}

// Helper to create a date column
export function createDateColumn<T>(
  accessorKey: string,
  title: string,
  includeTime = false
): ColumnDef<T> {
  return {
    accessorKey,
    header: createSortableHeader(title),
    cell: ({ row }) => {
      const date = row.getValue(accessorKey) as Date | string;
      return includeTime ? formatDateTime(date) : formatDate(date);
    },
  };
}

// Helper to create a text column with optional subtitle
export function createTextColumn<T>(
  accessorKey: string,
  title: string,
  subtitleAccessor?: string
): ColumnDef<T> {
  return {
    accessorKey,
    header: createSortableHeader(title),
    cell: ({ row }) => {
      const value = row.getValue(accessorKey) as string;
      const subtitle = subtitleAccessor ? row.getValue(subtitleAccessor) as string : null;
      
      return (
        <div>
          <div className="font-medium">{value}</div>
          {subtitle && (
            <div className="text-xs text-muted-foreground">{subtitle}</div>
          )}
        </div>
      );
    },
  };
}

// Helper to create a number column
export function createNumberColumn<T>(
  accessorKey: string,
  title: string,
  suffix?: string
): ColumnDef<T> {
  return {
    accessorKey,
    header: createSortableHeader(title),
    cell: ({ row }) => {
      const value = row.getValue(accessorKey) as number;
      return `${value}${suffix ? ` ${suffix}` : ""}`;
    },
  };
}

// Helper to create an actions column
export function createActionsColumn<T>(actions: RowAction<T>[]): ColumnDef<T> {
  return {
    id: "actions",
    cell: ({ row }) => (
      <DataTableRowActions row={row.original} actions={actions} />
    ),
    enableSorting: false,
    enableHiding: false,
  };
}

// Helper to create a basic text column
export function createSimpleTextColumn<T>(
  accessorKey: string,
  title: string
): ColumnDef<T> {
  return {
    accessorKey,
    header: title,
    cell: ({ row }) => row.getValue(accessorKey) as string,
  };
}

// Helper to create a progress column
export function createProgressColumn<T>(
  accessorKey: string,
  title: string = "Progress"
): ColumnDef<T> {
  return {
    accessorKey,
    header: title,
    cell: ({ row }) => {
      const progress = row.getValue(accessorKey) as number;
      return (
        <div className="flex items-center space-x-2">
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full"
              style={{ width: `${Math.round(progress)}%` }}
            />
          </div>
          <span className="text-xs text-muted-foreground min-w-[40px]">
            {Math.round(progress)}%
          </span>
        </div>
      );
    },
  };
}
