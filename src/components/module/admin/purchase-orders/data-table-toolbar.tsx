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
import { PlusIcon } from "lucide-react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useCallback, useState, useEffect } from "react";

interface DataTableToolbarProps<TData> {
  table: Table<TData>;
}

export function DataTableToolbar<TData>({
  table,
}: DataTableToolbarProps<TData>) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Initialize search from URL
  const [searchValue, setSearchValue] = useState(searchParams.get("search") || "");

  // Create a debounced search function
  // Since I don't know if useDebounce exists, I'll use a useEffect with setTimeout
  useEffect(() => {
    const timer = setTimeout(() => {
      const params = new URLSearchParams(searchParams.toString());
      if (searchValue) {
        params.set("search", searchValue);
      } else {
        params.delete("search");
      }

      // Reset page to 1 when searching
      if (searchValue !== (searchParams.get("search") || "")) {
        params.set("page", "1");
        router.push(`${pathname}?${params.toString()}`);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [searchValue, router, pathname, searchParams]);

  const isFiltered = table.getState().columnFilters.length > 0 || !!searchValue;

  return (
    <div className="flex items-center justify-between">
      <div className="flex flex-1 items-center space-x-2">
        <Input
          placeholder="Search orders..."
          value={searchValue}
          onChange={(event) => setSearchValue(event.target.value)}
          className="h-8 w-[150px] lg:w-[250px]"
        />
        {table.getColumn("status") && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="h-8 border-dashed">
                <PlusIcon className="mr-2 h-4 w-4" />
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
            onClick={() => {
              table.resetColumnFilters();
              setSearchValue("");
            }}
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
