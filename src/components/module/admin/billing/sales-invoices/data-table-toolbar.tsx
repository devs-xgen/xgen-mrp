"use client";

import { Cross2Icon } from "@radix-ui/react-icons";
import { Table } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DataTableViewOptions } from "./data-table-view-options";
import { DataTableFacetedFilter } from "./data-table-faceted-filter";
import { CSVExportButton } from "./csv-export-button";
import { SalesInvoiceWithItems, InvoiceStatus } from "@/types/admin/billing";

interface DataTableToolbarProps<TData> {
  table: Table<TData>;
  onFiltersChange?: (filters: {
    search?: string;
    status?: InvoiceStatus[];
    dateRange?: { start: Date; end: Date };
  }) => void;
}

const statuses = [
  {
    value: "DRAFT",
    label: "Draft",
  },
  {
    value: "PENDING",
    label: "Pending",
  },
  {
    value: "PAID",
    label: "Paid",
  },
  {
    value: "OVERDUE",
    label: "Overdue",
  },
  {
    value: "CANCELLED",
    label: "Cancelled",
  },
];

export function DataTableToolbar<TData>({
  table,
  onFiltersChange,
}: DataTableToolbarProps<TData>) {
  const isFiltered = table.getState().columnFilters.length > 0;

  const handleSearchChange = (value: string) => {
    table.getColumn("invoiceNumber")?.setFilterValue(value);
    onFiltersChange?.({ search: value });
  };

  const handleStatusChange = (values: string[]) => {
    table.getColumn("status")?.setFilterValue(values);
    onFiltersChange?.({ status: values as InvoiceStatus[] });
  };

  const handleResetFilters = () => {
    table.resetColumnFilters();
    onFiltersChange?.({});
  };

  return (
    <div className="flex items-center justify-between">
      <div className="flex flex-1 items-center space-x-2">
        <Input
          placeholder="Filter by invoice number..."
          value={(table.getColumn("invoiceNumber")?.getFilterValue() as string) ?? ""}
          onChange={(event) => handleSearchChange(event.target.value)}
          className="h-8 w-[150px] lg:w-[250px]"
        />
        {table.getColumn("status") && (
          <DataTableFacetedFilter
            column={table.getColumn("status")}
            title="Status"
            options={statuses}
            onValueChange={handleStatusChange}
          />
        )}
        {isFiltered && (
          <Button
            variant="ghost"
            onClick={handleResetFilters}
            className="h-8 px-2 lg:px-3"
          >
            Reset
            <Cross2Icon className="ml-2 h-4 w-4" />
          </Button>
        )}
      </div>
      <div className="flex items-center space-x-2">
        <CSVExportButton />
        <DataTableViewOptions table={table} />
      </div>
    </div>
  );
}