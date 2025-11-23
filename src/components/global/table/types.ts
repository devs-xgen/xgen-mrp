// src/components/global/table/types.ts
import { ColumnDef, Table } from "@tanstack/react-table";
import { ReactNode } from "react";

// Generic data table props
export interface DataTableProps<TData, TValue = unknown> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  searchKey?: string;
  searchPlaceholder?: string;
  onRowAction?: (row: TData) => void;
  enableSelection?: boolean;
  enablePagination?: boolean;
  enableFiltering?: boolean;
  enableSorting?: boolean;
  enableColumnVisibility?: boolean;
  pageSize?: number;
  className?: string;
  emptyMessage?: string;
  filterOptions?: readonly FilterOption[];
  customToolbarActions?: React.ReactNode;
  // Manual pagination props (optional for backward compatibility)
  manualPagination?: boolean;
  pageCount?: number;
  pagination?: import("@tanstack/react-table").PaginationState;
  onPaginationChange?: import("@tanstack/react-table").OnChangeFn<import("@tanstack/react-table").PaginationState>;
}

// Table toolbar props
export interface DataTableToolbarProps<TData> {
  table: Table<TData>;
  searchKey?: string;
  searchPlaceholder?: string;
  enableFiltering?: boolean;
  enableColumnVisibility?: boolean;
  filterOptions?: readonly FilterOption[];
  customActions?: ReactNode;
}

// Filter option interface
export interface FilterOption {
  readonly column: string;
  readonly title: string;
  readonly options: readonly {
    readonly label: string;
    readonly value: string;
    readonly icon?: React.ComponentType<{ className?: string }>;
  }[];
}

// Pagination props
export interface DataTablePaginationProps<TData> {
  table: Table<TData>;
  enableSelection?: boolean;
}

// Column visibility props
export interface DataTableViewOptionsProps<TData> {
  table: Table<TData>;
}

// Row actions props
export interface DataTableRowActionsProps<TData> {
  row: TData;
  actions?: RowAction<TData>[];
}

// Row action interface
export interface RowAction<TData> {
  label: string;
  icon?: React.ComponentType<{ className?: string }>;
  onClick: (row: TData) => void;
  variant?: "default" | "destructive" | "secondary";
  disabled?: (row: TData) => boolean;
}

// Table configuration for different page types
export interface TableConfig<TData> {
  searchKey: string;
  searchPlaceholder: string;
  emptyMessage: string;
  enableSelection?: boolean;
  enableFiltering?: boolean;
  enablePagination?: boolean;
  pageSize?: number;
  filterOptions?: readonly FilterOption[];
  rowActions?: RowAction<TData>[];
  customToolbarActions?: ReactNode;
}
