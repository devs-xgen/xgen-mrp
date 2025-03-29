// src/components/module/admin/purchase-ordeline/data-table-toolbar.tsx
"use client";

import { Cross2Icon } from "@radix-ui/react-icons";
import { Table } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Status } from "@prisma/client";
import { Filter } from "lucide-react";
import { useState } from "react";
import { PurchaseOrder } from "@/types/admin/purchase-order";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useRouter, usePathname, useSearchParams } from "next/navigation";

interface DataTableToolbarProps<TData> {
  table: Table<TData>;
  purchaseOrders: PurchaseOrder[];
}

export function DataTableToolbar<TData>({
  table,
  purchaseOrders,
}: DataTableToolbarProps<TData>) {
  const isFiltered = table.getState().columnFilters.length > 0;
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Get current poId from URL - ensure it's never an empty string
  const currentPoId = searchParams.get("poId") || "all";

  // Filter by purchase order from the URL
  const handlePoChange = (value: string) => {
    // Update URL and navigate
    if (value === "all") {
      router.push(pathname);
    } else {
      router.push(`${pathname}?poId=${value}`);
    }
  };

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex flex-1 items-center space-x-2">
        <Input
          placeholder="Filter by material..."
          value={
            (table.getColumn("material.name")?.getFilterValue() as string) ?? ""
          }
          onChange={(event) =>
            table.getColumn("material.name")?.setFilterValue(event.target.value)
          }
          className="h-8 w-[150px] lg:w-[250px]"
        />

        {table.getColumn("status") && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="h-8 border-dashed">
                <Filter className="mr-2 h-4 w-4" />
                Status
                {table.getColumn("status")?.getFilterValue() ? (
                  <Badge
                    variant="secondary"
                    className="ml-2 rounded-sm px-1 font-normal lg:hidden"
                  >
                    1
                  </Badge>
                ) : null}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-[150px]">
              {Object.values(Status).map((status) => {
                const filterValue = table
                  .getColumn("status")
                  ?.getFilterValue() as string[] | undefined;

                return (
                  <DropdownMenuCheckboxItem
                    key={status}
                    checked={filterValue?.includes(status) ?? false}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        table
                          .getColumn("status")
                          ?.setFilterValue(
                            filterValue ? [...filterValue, status] : [status]
                          );
                      } else {
                        table
                          .getColumn("status")
                          ?.setFilterValue(
                            filterValue?.filter((value) => value !== status) ??
                              []
                          );
                      }
                    }}
                  >
                    {status.toLowerCase()}
                  </DropdownMenuCheckboxItem>
                );
              })}
            </DropdownMenuContent>
          </DropdownMenu>
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

      {/* Filter by Purchase Order */}
      <div className="flex items-center space-x-2">
        <Select value={currentPoId} onValueChange={handlePoChange}>
          <SelectTrigger className="h-8 w-[180px] lg:w-[220px]">
            <SelectValue placeholder="Filter by PO" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Purchase Orders</SelectItem>
            {purchaseOrders.map((po) => (
              <SelectItem key={po.id} value={po.id}>
                {po.poNumber} - {po.supplier.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
