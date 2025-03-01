"use client";

import { Cross2Icon } from "@radix-ui/react-icons";
import { Table } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Status } from "@prisma/client";

interface DataTableToolbarProps<TData> {
  table: Table<TData>;
}

export function DataTableToolbar<TData>({
  table,
}: DataTableToolbarProps<TData>) {
  const isFiltered = table.getState().columnFilters.length > 0;

  return (
    <div className="flex items-center justify-between">
      <div className="flex flex-1 items-center space-x-2">
        <Input
          placeholder="Search by product..."
          value={
            (table.getColumn("productName")?.getFilterValue() as string) ?? ""
          }
          onChange={(event) =>
            table.getColumn("productName")?.setFilterValue(event.target.value)
          }
          className="h-8 w-[150px] lg:w-[250px]"
        />
        {table.getColumn("status") && (
          <Select
            value={
              (table.getColumn("status")?.getFilterValue() as string) || "all"
            }
            onValueChange={(value) =>
              table
                .getColumn("status")
                ?.setFilterValue(value === "all" ? undefined : value)
            }
          >
            <SelectTrigger className="h-8 w-[150px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value={Status.PENDING}>Pending</SelectItem>
              <SelectItem value={Status.IN_PROGRESS}>In Progress</SelectItem>
              <SelectItem value={Status.COMPLETED}>Completed</SelectItem>
            </SelectContent>
          </Select>
        )}
        {isFiltered && (
          <Button
            variant="ghost"
            onClick={() => table.resetColumnFilters()}
            className="h-8 px-2 lg:px-3"
          >
            Reset
            <Cross2Icon className="ml-2 h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
}
