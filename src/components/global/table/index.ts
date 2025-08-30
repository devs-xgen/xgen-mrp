// src/components/global/table/index.ts
export { DataTable } from "./data-table";
export { DataTableToolbar } from "./data-table-toolbar";
export { DataTablePagination } from "./data-table-pagination";
export { DataTableViewOptions } from "./data-table-view-options";
export { DataTableFacetedFilter } from "./data-table-faceted-filter";
export { DataTableRowActions } from "./data-table-row-actions";

export type {
  DataTableProps,
  DataTableToolbarProps,
  DataTablePaginationProps,
  DataTableViewOptionsProps,
  DataTableRowActionsProps,
  FilterOption,
  RowAction,
  TableConfig,
} from "./types";

// Re-export table utilities
export * from "./table-utils";
export * from "./column-helpers";
