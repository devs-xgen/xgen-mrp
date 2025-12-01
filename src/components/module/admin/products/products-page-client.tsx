"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import type { ProductWithRelations } from "./columns";
import { createColumns } from "./columns";
import { DataTable, getTableConfig } from "@/components/global/table";
import { ProductsExportButton } from "@/components/module/admin/products/products-export-button";
import { PaginationState } from "@tanstack/react-table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Status, ProductCategory } from "@prisma/client";
import { Search } from "lucide-react";

interface ProductsPageClientProps {
  data: ProductWithRelations[];
  metadata?: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
  categories: Pick<ProductCategory, "id" | "name">[];
}

export default function ProductsPageClient({
  data,
  metadata,
  categories,
}: ProductsPageClientProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const refresh = async () => {
    router.refresh();
  };

  const columns = createColumns(refresh);
  const tableConfig = getTableConfig("products");

  const statusOptions = useMemo(() => (
    [Status.ACTIVE, Status.INACTIVE, Status.ON_HOLD, Status.ARCHIVED] as Status[]
  ).filter(Boolean), []);

  const initialSearch = searchParams.get("search") ?? "";
  const initialStatus = searchParams.get("status") ?? "all";
  const initialCategory = searchParams.get("categoryId") ?? "all";
  const initialPriceMin = searchParams.get("priceMin") ?? "";
  const initialPriceMax = searchParams.get("priceMax") ?? "";
  const initialStockMin = searchParams.get("stockMin") ?? "";
  const initialStockMax = searchParams.get("stockMax") ?? "";

  const [searchValue, setSearchValue] = useState(initialSearch);
  const [statusFilter, setStatusFilter] = useState(initialStatus);
  const [categoryFilter, setCategoryFilter] = useState(initialCategory);
  const [priceRange, setPriceRange] = useState({ min: initialPriceMin, max: initialPriceMax });
  const [stockRange, setStockRange] = useState({ min: initialStockMin, max: initialStockMax });

  useEffect(() => {
    setSearchValue(initialSearch);
  }, [initialSearch]);

  useEffect(() => {
    setStatusFilter(initialStatus);
  }, [initialStatus]);

  useEffect(() => {
    setCategoryFilter(initialCategory);
  }, [initialCategory]);

  useEffect(() => {
    setPriceRange({ min: initialPriceMin, max: initialPriceMax });
  }, [initialPriceMin, initialPriceMax]);

  useEffect(() => {
    setStockRange({ min: initialStockMin, max: initialStockMax });
  }, [initialStockMin, initialStockMax]);

  const applyFilters = useCallback(
    (filters: Record<string, string | null | undefined>) => {
      const params = new URLSearchParams(searchParams.toString());
      Object.entries(filters).forEach(([key, value]) => {
        if (value === undefined) return;
        if (value === null || value === "") {
          params.delete(key);
        } else {
          params.set(key, value);
        }
      });
      router.push(`${pathname}?${params.toString()}`);
    },
    [pathname, router, searchParams]
  );

  useEffect(() => {
    const currentSearchParam = searchParams.get("search") ?? "";
    const normalized = searchValue.trim();
    if (normalized === currentSearchParam) {
      return;
    }

    const handler = setTimeout(() => {
      if (normalized === currentSearchParam) return;
      applyFilters({ search: normalized || null, page: "1" });
    }, 400);

    return () => clearTimeout(handler);
  }, [applyFilters, searchParams, searchValue]);

  const handleRangeChange = (
    type: "price" | "stock",
    key: "min" | "max",
    value: string
  ) => {
    if (type === "price") {
      setPriceRange((prev) => ({ ...prev, [key]: value }));
      applyFilters({ [key === "min" ? "priceMin" : "priceMax"]: value || null, page: "1" });
    } else {
      setStockRange((prev) => ({ ...prev, [key]: value }));
      applyFilters({ [key === "min" ? "stockMin" : "stockMax"]: value || null, page: "1" });
    }
  };

  // Handle server-side pagination
  const pagination: PaginationState = {
    pageIndex: (metadata?.page ?? 1) - 1,
    pageSize: metadata?.limit ?? 10,
  };

  const onPaginationChange = (
    updaterOrValue: PaginationState | ((old: PaginationState) => PaginationState)
  ) => {
    const previous = pagination;
    const next = typeof updaterOrValue === "function" ? updaterOrValue(previous) : updaterOrValue;

    const params = new URLSearchParams(searchParams.toString());
    params.set("page", (next.pageIndex + 1).toString());
    params.set("limit", next.pageSize.toString());

    router.push(`${pathname}?${params.toString()}`);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex w-full max-w-xl items-center gap-2">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={searchValue}
                onChange={(event) => setSearchValue(event.target.value)}
                placeholder="Search by name or SKU"
                className="pl-8"
              />
            </div>
            {searchValue && (
              <Button variant="ghost" size="sm" onClick={() => setSearchValue("")}>
                Clear
              </Button>
            )}
          </div>
          {metadata && (
            <div className="text-sm text-muted-foreground text-right">
              Showing {data.length} of {metadata.total} products
            </div>
          )}
        </div>

        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-1 flex-wrap gap-3">
            <Select
              value={statusFilter}
              onValueChange={(value) => {
                setStatusFilter(value);
                applyFilters({ status: value === "all" ? null : value, page: "1" });
              }}
            >
              <SelectTrigger className="w-full md:w-[180px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                {statusOptions.map((status) => (
                  <SelectItem key={status} value={status}>
                    {status.replace(/_/g, " ")}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={categoryFilter}
              onValueChange={(value) => {
                setCategoryFilter(value);
                applyFilters({ categoryId: value === "all" ? null : value, page: "1" });
              }}
            >
              <SelectTrigger className="w-full md:w-[200px]">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map((category) => (
                  <SelectItem key={category.id} value={category.id}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {(statusFilter !== "all" || categoryFilter !== "all") && (
            <Button
              variant="ghost"
              size="sm"
              className="self-start"
              onClick={() => {
                setStatusFilter("all");
                setCategoryFilter("all");
                applyFilters({ status: null, categoryId: null, page: "1" });
              }}
            >
              Reset filters
            </Button>
          )}
        </div>

        <div className="grid gap-3 md:grid-cols-2">
          <div className="rounded-lg border p-3 space-y-3">
            <Label className="text-xs uppercase text-muted-foreground tracking-wide">
              Selling Price (PHP)
            </Label>
            <div className="flex gap-3">
              <Input
                type="number"
                inputMode="decimal"
                placeholder="Min"
                value={priceRange.min}
                onChange={(event) => handleRangeChange("price", "min", event.target.value)}
              />
              <Input
                type="number"
                inputMode="decimal"
                placeholder="Max"
                value={priceRange.max}
                onChange={(event) => handleRangeChange("price", "max", event.target.value)}
              />
            </div>
          </div>

          <div className="rounded-lg border p-3 space-y-3">
            <Label className="text-xs uppercase text-muted-foreground tracking-wide">
              Current Stock
            </Label>
            <div className="flex gap-3">
              <Input
                type="number"
                inputMode="numeric"
                placeholder="Min"
                value={stockRange.min}
                onChange={(event) => handleRangeChange("stock", "min", event.target.value)}
              />
              <Input
                type="number"
                inputMode="numeric"
                placeholder="Max"
                value={stockRange.max}
                onChange={(event) => handleRangeChange("stock", "max", event.target.value)}
              />
            </div>
          </div>
        </div>
      </div>

      <DataTable
        columns={columns}
        data={data}
        {...tableConfig}
        showSearchInput={false}
        customToolbarActions={<ProductsExportButton />}
        manualPagination={!!metadata}
        pageCount={metadata?.totalPages ?? -1}
        pagination={pagination}
        onPaginationChange={onPaginationChange}
      />
    </div>
  );
}
