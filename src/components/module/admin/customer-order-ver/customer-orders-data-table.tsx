"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useState, FormEvent } from "react";
import { ColumnDef } from "@tanstack/react-table";
import { DataTable } from "@/components/global/table/data-table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, X, CalendarIcon, Filter } from "lucide-react";
import { DateRange } from "react-day-picker";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Checkbox } from "@/components/ui/checkbox";
import { Status } from "@prisma/client";
import { Badge } from "@/components/ui/badge";

interface CustomerOrdersDataTableProps<TData, TValue> {
    columns: ColumnDef<TData, TValue>[];
    data: TData[];
    metadata: {
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    };
    highlightId?: string;
}

export function CustomerOrdersDataTable<TData, TValue>({
    columns,
    data,
    metadata,
    highlightId,
}: CustomerOrdersDataTableProps<TData, TValue>) {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const [searchValue, setSearchValue] = useState(searchParams.get("search") ?? "");
    const [dateRange, setDateRange] = useState<DateRange | undefined>(() => {
        const fromParam = searchParams.get("dateFrom");
        const toParam = searchParams.get("dateTo");
        if (fromParam || toParam) {
            return {
                from: fromParam ? new Date(fromParam) : undefined,
                to: toParam ? new Date(toParam) : undefined,
            };
        }
        return undefined;
    });
    const parseStatusParam = (value?: string | null): Status[] => {
        if (!value) return [];
        return value
            .split(",")
            .map((status) => status.trim())
            .filter((status): status is Status => (Object.values(Status) as string[]).includes(status));
    };

    const [selectedStatuses, setSelectedStatuses] = useState<Status[]>(() =>
        parseStatusParam(searchParams.get("status"))
    );

    const statusDisplayOrder: Status[] = [
        Status.PENDING,
        Status.IN_PROGRESS,
        Status.COMPLETED,
        Status.CANCELLED,
        Status.ON_HOLD,
        Status.ACTIVE,
        Status.INACTIVE,
    ];

    const toggleStatus = (status: Status) => {
        setSelectedStatuses((prev) =>
            prev.includes(status)
                ? prev.filter((item) => item !== status)
                : [...prev, status]
        );
    };

    const onPaginationChange = (updaterOrValue: any) => {
        const newPagination =
            typeof updaterOrValue === "function"
                ? updaterOrValue({
                    pageIndex: metadata.page - 1,
                    pageSize: metadata.limit,
                })
                : updaterOrValue;

        const params = new URLSearchParams(searchParams.toString());
        params.set("page", (newPagination.pageIndex + 1).toString());
        params.set("limit", newPagination.pageSize.toString());
        router.push(`${pathname}?${params.toString()}`);
    };

    const applyFilters = (event?: FormEvent<HTMLFormElement>) => {
        if (event) {
            event.preventDefault();
        }
        const params = new URLSearchParams(searchParams.toString());
        if (searchValue.trim()) {
            params.set("search", searchValue.trim());
        } else {
            params.delete("search");
        }
        if (dateRange?.from) {
            params.set("dateFrom", dateRange.from.toISOString());
        } else {
            params.delete("dateFrom");
        }
        if (dateRange?.to) {
            params.set("dateTo", dateRange.to.toISOString());
        } else {
            params.delete("dateTo");
        }
        if (selectedStatuses.length > 0) {
            params.set("status", selectedStatuses.join(","));
        } else {
            params.delete("status");
        }
        params.set("page", "1");
        router.push(`${pathname}?${params.toString()}`);
    };

    const handleSearchReset = () => {
        setSearchValue("");
        setDateRange(undefined);
        setSelectedStatuses([]);
        const params = new URLSearchParams(searchParams.toString());
        params.delete("search");
        params.delete("dateFrom");
        params.delete("dateTo");
        params.delete("status");
        params.set("page", "1");
        router.push(`${pathname}?${params.toString()}`);
    };

    return (
        <div className="space-y-4">
            <form onSubmit={applyFilters} className="flex flex-col gap-3 lg:flex-row lg:items-end lg:gap-4">
                <div className="flex flex-1 flex-col gap-2">
                    <label className="text-xs font-medium text-muted-foreground">Search</label>
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            value={searchValue}
                            onChange={(event) => setSearchValue(event.target.value)}
                            placeholder="Search by order number or customer name"
                            className="pl-9"
                        />
                        {(searchValue || dateRange) && (
                            <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 text-muted-foreground"
                                onClick={handleSearchReset}
                            >
                                <X className="h-4 w-4" />
                            </Button>
                        )}
                    </div>
                </div>

                <div className="flex flex-col gap-2">
                    <label className="text-xs font-medium text-muted-foreground">Order Date Range</label>
                    <Popover>
                        <PopoverTrigger asChild>
                            <Button
                                type="button"
                                variant="outline"
                                className={cn(
                                    "w-full justify-start text-left font-normal",
                                    !dateRange && "text-muted-foreground"
                                )}
                            >
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                {dateRange?.from ? (
                                    dateRange.to ? (
                                        `${format(dateRange.from, "LLL dd, y")} - ${format(dateRange.to, "LLL dd, y")}`
                                    ) : (
                                        format(dateRange.from, "LLL dd, y")
                                    )
                                ) : (
                                    "Select date range"
                                )}
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                                mode="range"
                                selected={dateRange}
                                onSelect={setDateRange}
                                numberOfMonths={2}
                            />
                        </PopoverContent>
                    </Popover>
                </div>

                <div className="flex flex-col gap-2">
                    <label className="text-xs font-medium text-muted-foreground">Status</label>
                    <Popover>
                        <PopoverTrigger asChild>
                            <Button
                                type="button"
                                variant="outline"
                                className="w-full justify-between"
                            >
                                <span className="flex items-center gap-2">
                                    <Filter className="h-4 w-4" />
                                    {selectedStatuses.length === 0
                                        ? "Any status"
                                        : `${selectedStatuses.length} selected`}
                                </span>
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-64 p-4" align="start">
                            <div className="space-y-3">
                                {statusDisplayOrder.map((statusValue) => (
                                    <label
                                        key={statusValue}
                                        className="flex items-center gap-2 text-sm"
                                    >
                                        <Checkbox
                                            checked={selectedStatuses.includes(statusValue)}
                                            onCheckedChange={() => toggleStatus(statusValue)}
                                        />
                                        <span className="capitalize">{statusValue.replace("_", " ")}</span>
                                    </label>
                                ))}
                                {selectedStatuses.length > 0 && (
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        className="w-full"
                                        onClick={() => setSelectedStatuses([])}
                                    >
                                        Clear status filter
                                    </Button>
                                )}
                            </div>
                        </PopoverContent>
                    </Popover>
                    {selectedStatuses.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                            {selectedStatuses.map((status) => (
                                <Badge key={status} variant="secondary" className="capitalize">
                                    {status.replace("_", " ")}
                                </Badge>
                            ))}
                        </div>
                    )}
                </div>

                <div className="flex gap-2">
                    <Button type="submit" className="flex-1 sm:flex-none">
                        Apply Filters
                    </Button>
                    <Button type="button" variant="ghost" onClick={handleSearchReset}>
                        Reset
                    </Button>
                </div>
            </form>

            <DataTable
                columns={columns}
                data={data}
                enableSelection={false}
                enablePagination={true}
                enableFiltering={false}
                enableSorting={true}
                manualPagination={true}
                pageCount={metadata.totalPages}
                pagination={{
                    pageIndex: metadata.page - 1,
                    pageSize: metadata.limit,
                }}
                onPaginationChange={onPaginationChange}
                pageSize={metadata.limit}
            />
        </div>
    );
}
