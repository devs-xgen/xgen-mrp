"use client";

import { Table } from "@tanstack/react-table";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DataTableViewOptions } from "./data-table-view-options";
import { DataTableFacetedFilter } from "./data-table-faceted-filter";
import { DeliveryReceiptsExportButton } from "../delivery-receipts-export-button";

interface DataTableToolbarProps<TData> {
  table: Table<TData>;
}

const statuses = [
  {
    value: "PENDING",
    label: "Pending",
  },
  {
    value: "IN_TRANSIT",
    label: "In Transit",
  },
  {
    value: "DELIVERED",
    label: "Delivered",
  },
  {
    value: "CANCELLED",
    label: "Cancelled",
  },
  {
    value: "FAILED",
    label: "Failed",
  },
  {
    value: "RETURNED",
    label: "Returned",
  },
];

export function DataTableToolbar<TData>({
  table,
}: DataTableToolbarProps<TData>) {
  const isFiltered = table.getState().columnFilters.length > 0;

  return (
    <div className="flex items-center justify-between">
      <div className="flex flex-1 items-center space-x-2">
        <Input
          placeholder="Filter by receipt number..."
          value={(table.getColumn("receiptNumber")?.getFilterValue() as string) ?? ""}
          onChange={(event) =>
            table.getColumn("receiptNumber")?.setFilterValue(event.target.value)
          }
          className="h-8 w-[150px] lg:w-[250px]"
        />
        {table.getColumn("deliveryStatus") && (
          <DataTableFacetedFilter
            column={table.getColumn("deliveryStatus")}
            title="Status"
            options={statuses}
          />
        )}
        {isFiltered && (
          <Button
            variant="ghost"
            onClick={() => table.resetColumnFilters()}
            className="h-8 px-2 lg:px-3"
          >
            Reset
            <X className="ml-2 h-4 w-4" />
          </Button>
        )}
      </div>
      <div className="flex items-center space-x-2">
        <DeliveryReceiptsExportButton />
        <DataTableViewOptions table={table} />
      </div>
    </div>
  );
}