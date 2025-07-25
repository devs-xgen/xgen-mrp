# Data Table Design Schema - XGen MRP

**Purpose:** Comprehensive guide for implementing data tables with advanced features  
**Based on:** Delivery Receipts page implementation  
**Last Updated:** December 30, 2024

This document provides a complete implementation guide for creating data tables with dashboard analytics, advanced filtering, column management, and comprehensive action systems following the patterns established in the delivery receipts page.

---

## Table of Contents
1. [Architecture Overview](#architecture-overview)
2. [Page Structure](#page-structure)
3. [Component Breakdown](#component-breakdown)
4. [Implementation Steps](#implementation-steps)
5. [Column Definitions](#column-definitions)
6. [Filtering System](#filtering-system)
7. [Action System](#action-system)
8. [Dashboard Integration](#dashboard-integration)
9. [State Management](#state-management)
10. [Best Practices](#best-practices)

---

## Architecture Overview

### **Core Philosophy**
The data table system follows a modular, server-side approach with:
- **Server-side data fetching** with URL state management
- **Component composition** for maximum reusability
- **Type safety** throughout the entire data flow
- **Performance optimization** with proper caching and pagination
- **Accessibility** with keyboard navigation and screen reader support

### **Technology Stack**
- **@tanstack/react-table** - Core table functionality
- **Next.js App Router** - Server-side rendering and routing
- **TypeScript** - Type safety and developer experience
- **Tailwind CSS** - Styling and responsive design
- **Lucide React** - Consistent iconography

---

## Page Structure

### **Standard Data Table Page Layout**
```tsx
// /app/admin/(protected)/[module]/[entity]/page.tsx
export default async function EntityPage({ searchParams }: EntityPageProps) {
  return (
    <div className="flex flex-col gap-6 p-8 bg-background min-h-screen">
      {/* 1. Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{pageTitle}</h1>
          <p className="text-muted-foreground mt-1">{pageDescription}</p>
        </div>
        <div className="flex items-center gap-2">
          <Button size="sm" asChild>
            <Link href={`${basePath}/create`}>
              <Plus className="mr-2 h-4 w-4" />
              Create {entityName}
            </Link>
          </Button>
        </div>
      </div>

      {/* 2. Dashboard Analytics (Optional) */}
      <Suspense fallback={<DashboardSkeleton />}>
        <EntityDashboard data={data} analytics={analytics} />
      </Suspense>

      {/* 3. Data Table */}
      <Suspense fallback={<DataTableSkeleton />}>
        <DataTable data={data} />
      </Suspense>
    </div>
  );
}
```

### **File Structure**
```
src/components/module/admin/[module]/[entity]/
├── index.ts                          # Export barrel
├── [entity]-dashboard.tsx            # Analytics dashboard
├── data-table.tsx                    # Main table component
├── data-table-toolbar.tsx            # Search and filters
├── data-table-column-header.tsx      # Sortable headers
├── data-table-faceted-filter.tsx     # Multi-select filters
├── data-table-view-options.tsx       # Column visibility
├── data-table-pagination.tsx         # Pagination controls
└── columns.tsx                       # Column definitions
```

---

## Component Breakdown

### **1. Main Data Table Component**
```tsx
// data-table.tsx
"use client";

import { useState } from "react";
import {
  ColumnDef,
  ColumnFiltersState,
  SortingState,
  VisibilityState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DataTablePagination } from "./data-table-pagination";
import { DataTableToolbar } from "./data-table-toolbar";

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
}

export function DataTable<TData, TValue>({
  columns,
  data,
}: DataTableProps<TData, TValue>) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = useState({});

  const table = useReactTable({
    data,
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
    },
  });

  return (
    <div className="space-y-4">
      <DataTableToolbar table={table} />
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id} className="bg-muted/50">
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                  className="hover:bg-muted/30 transition-colors"
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id} className="p-4">
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  No results.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <DataTablePagination table={table} />
    </div>
  );
}
```

### **2. Data Table Toolbar**
```tsx
// data-table-toolbar.tsx
"use client";

import { Cross2Icon } from "@radix-ui/react-icons";
import { Table } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DataTableViewOptions } from "./data-table-view-options";
import { DataTableFacetedFilter } from "./data-table-faceted-filter";

interface DataTableToolbarProps<TData> {
  table: Table<TData>;
}

export function DataTableToolbar<TData>({
  table,
}: DataTableToolbarProps<TData>) {
  const isFiltered = table.getState().columnFilters.length > 0;

  // Define filter options based on your data
  const statuses = [
    { label: "Pending", value: "PENDING" },
    { label: "In Transit", value: "IN_TRANSIT" },
    { label: "Delivered", value: "DELIVERED" },
    { label: "Failed", value: "FAILED" },
    { label: "Returned", value: "RETURNED" },
    { label: "Cancelled", value: "CANCELLED" },
  ];

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
            <Cross2Icon className="ml-2 h-4 w-4" />
          </Button>
        )}
      </div>
      <DataTableViewOptions table={table} />
    </div>
  );
}
```

### **3. Column Header Component**
```tsx
// data-table-column-header.tsx
import { ArrowDownIcon, ArrowUpIcon, CaretSortIcon } from "@radix-ui/react-icons";
import { Column } from "@tanstack/react-table";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface DataTableColumnHeaderProps<TData, TValue>
  extends React.HTMLAttributes<HTMLDivElement> {
  column: Column<TData, TValue>;
  title: string;
}

export function DataTableColumnHeader<TData, TValue>({
  column,
  title,
  className,
}: DataTableColumnHeaderProps<TData, TValue>) {
  if (!column.getCanSort()) {
    return <div className={cn(className)}>{title}</div>;
  }

  return (
    <div className={cn("flex items-center space-x-2", className)}>
      <Button
        variant="ghost"
        size="sm"
        className="-ml-3 h-8 data-[state=open]:bg-accent"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        <span>{title}</span>
        {column.getIsSorted() === "desc" ? (
          <ArrowDownIcon className="ml-2 h-4 w-4" />
        ) : column.getIsSorted() === "asc" ? (
          <ArrowUpIcon className="ml-2 h-4 w-4" />
        ) : (
          <CaretSortIcon className="ml-2 h-4 w-4" />
        )}
      </Button>
    </div>
  );
}
```

---

## Implementation Steps

### **Step 1: Set Up Types**
```tsx
// types/admin/[module].ts
export interface EntityWithRelations {
  id: string;
  // Core entity fields
  name: string;
  status: EntityStatus;
  createdAt: Date;
  updatedAt: Date;
  
  // Relations
  relatedEntity?: RelatedEntity;
}

export interface EntityFilters {
  search?: string;
  status?: EntityStatus[];
  dateRange?: {
    from: Date;
    to: Date;
  };
  sortBy?: keyof EntityWithRelations;
  sortOrder?: "asc" | "desc";
}

export interface EntityAnalytics {
  totalCount: number;
  statusBreakdown: Record<EntityStatus, number>;
  recentActivity: EntityActivity[];
}
```

### **Step 2: Create Server Actions**
```tsx
// lib/actions/[entity].ts
"use server";

export async function getAllEntities(
  filters: EntityFilters = {},
  page: number = 1,
  perPage: number = 10
) {
  try {
    const where = buildWhereClause(filters);
    const orderBy = buildOrderByClause(filters);
    
    const [entities, totalCount] = await Promise.all([
      db.entity.findMany({
        where,
        orderBy,
        skip: (page - 1) * perPage,
        take: perPage,
        include: {
          relatedEntity: true,
        },
      }),
      db.entity.count({ where }),
    ]);

    return {
      data: entities,
      pagination: {
        page,
        perPage,
        totalCount,
        totalPages: Math.ceil(totalCount / perPage),
      },
    };
  } catch (error) {
    console.error("Error fetching entities:", error);
    throw new Error("Failed to fetch entities");
  }
}

function buildWhereClause(filters: EntityFilters) {
  const where: any = {};
  
  if (filters.search) {
    where.OR = [
      { name: { contains: filters.search, mode: "insensitive" } },
      { description: { contains: filters.search, mode: "insensitive" } },
    ];
  }
  
  if (filters.status?.length) {
    where.status = { in: filters.status };
  }
  
  if (filters.dateRange) {
    where.createdAt = {
      gte: filters.dateRange.from,
      lte: filters.dateRange.to,
    };
  }
  
  return where;
}
```

### **Step 3: Define Columns**
```tsx
// columns.tsx
"use client";

import { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  ArrowUpDown, 
  MoreHorizontal, 
  Eye, 
  Edit, 
  Trash2,
  Download,
  // Add other action icons as needed
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { EntityWithRelations } from "@/types/admin/[module]";
import { DataTableColumnHeader } from "./data-table-column-header";
import Link from "next/link";

export const columns: ColumnDef<EntityWithRelations>[] = [
  // Selection column (optional)
  {
    id: "select",
    header: ({ table }) => (
      <Checkbox
        checked={table.getIsAllPageRowsSelected()}
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
  },
  
  // Primary identifier column
  {
    accessorKey: "name",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Name" />
    ),
    cell: ({ row }) => {
      const name = row.getValue("name") as string;
      return (
        <div className="font-medium">
          <Link 
            href={`/admin/[module]/[entity]/${row.original.id}`}
            className="text-blue-600 hover:text-blue-800 hover:underline"
          >
            {name}
          </Link>
        </div>
      );
    },
  },
  
  // Status column with badges
  {
    accessorKey: "status",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Status" />
    ),
    cell: ({ row }) => {
      const status = row.getValue("status") as string;
      const statusColors = {
        ACTIVE: "bg-green-100 text-green-800",
        PENDING: "bg-yellow-100 text-yellow-800",
        INACTIVE: "bg-red-100 text-red-800",
        // Add more status colors as needed
      };
      
      return (
        <Badge className={statusColors[status as keyof typeof statusColors] || "bg-gray-100 text-gray-800"}>
          {status ? status.replace('_', ' ') : 'Unknown'}
        </Badge>
      );
    },
    filterFn: (row, id, value) => {
      return value.includes(row.getValue(id));
    },
  },
  
  // Date columns
  {
    accessorKey: "createdAt",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Created" />
    ),
    cell: ({ row }) => {
      const createdAt = row.getValue("createdAt") as Date;
      return (
        <div className="text-sm text-gray-600">
          {new Date(createdAt).toLocaleDateString()}
        </div>
      );
    },
  },
  
  // Actions column
  {
    id: "actions",
    header: "Actions",
    cell: ({ row }) => {
      const entity = row.original;

      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">Open menu</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Actions</DropdownMenuLabel>
            <DropdownMenuItem
              onClick={() => navigator.clipboard.writeText(entity.id)}
            >
              Copy ID
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href={`/admin/[module]/[entity]/${entity.id}`}>
                <Eye className="mr-2 h-4 w-4" />
                View Details
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href={`/admin/[module]/[entity]/${entity.id}/edit`}>
                <Edit className="mr-2 h-4 w-4" />
                Edit
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            
            {/* Conditional actions based on entity properties */}
            {entity.hasDocument && (
              <DropdownMenuItem>
                <Download className="mr-2 h-4 w-4" />
                Download Document
              </DropdownMenuItem>
            )}
            
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-destructive">
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
];
```

### **Step 4: Create Dashboard Component**
```tsx
// [entity]-dashboard.tsx
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EntityWithRelations, EntityAnalytics } from "@/types/admin/[module]";

interface EntityDashboardProps {
  data: EntityWithRelations[];
  analytics: EntityAnalytics;
}

export function EntityDashboard({ data, analytics }: EntityDashboardProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Entities</CardTitle>
          <Icon className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{analytics.totalCount}</div>
          <p className="text-xs text-muted-foreground">
            +{analytics.recentCount} from last month
          </p>
        </CardContent>
      </Card>
      
      {/* Add more analytics cards as needed */}
    </div>
  );
}
```

---

## Filtering System

### **URL State Management**
```tsx
// hooks/use-table-state.ts
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback } from "react";

export function useTableState() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const updateFilters = useCallback((filters: Record<string, any>) => {
    const params = new URLSearchParams(searchParams);
    
    Object.entries(filters).forEach(([key, value]) => {
      if (value && value !== "") {
        if (Array.isArray(value)) {
          params.set(key, value.join(","));
        } else {
          params.set(key, value.toString());
        }
      } else {
        params.delete(key);
      }
    });
    
    router.push(`?${params.toString()}`);
  }, [router, searchParams]);

  return { updateFilters };
}
```

### **Faceted Filter Component**
```tsx
// data-table-faceted-filter.tsx
import { CheckIcon, PlusCircledIcon } from "@radix-ui/react-icons";
import { Column } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

interface DataTableFacetedFilterProps<TData, TValue> {
  column?: Column<TData, TValue>;
  title?: string;
  options: {
    label: string;
    value: string;
    icon?: React.ComponentType<{ className?: string }>;
  }[];
}

export function DataTableFacetedFilter<TData, TValue>({
  column,
  title,
  options,
}: DataTableFacetedFilterProps<TData, TValue>) {
  const facets = column?.getFacetedUniqueValues();
  const selectedValues = new Set(column?.getFilterValue() as string[]);

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="h-8 border-dashed">
          <PlusCircledIcon className="mr-2 h-4 w-4" />
          {title}
          {selectedValues?.size > 0 && (
            <>
              <Separator orientation="vertical" className="mx-2 h-4" />
              <Badge
                variant="secondary"
                className="rounded-sm px-1 font-normal lg:hidden"
              >
                {selectedValues.size}
              </Badge>
              <div className="hidden space-x-1 lg:flex">
                {selectedValues.size > 2 ? (
                  <Badge
                    variant="secondary"
                    className="rounded-sm px-1 font-normal"
                  >
                    {selectedValues.size} selected
                  </Badge>
                ) : (
                  options
                    .filter((option) => selectedValues.has(option.value))
                    .map((option) => (
                      <Badge
                        variant="secondary"
                        key={option.value}
                        className="rounded-sm px-1 font-normal"
                      >
                        {option.label}
                      </Badge>
                    ))
                )}
              </div>
            </>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[200px] p-0" align="start">
        <Command>
          <CommandInput placeholder={title} />
          <CommandList>
            <CommandEmpty>No results found.</CommandEmpty>
            <CommandGroup>
              {options.map((option) => {
                const isSelected = selectedValues.has(option.value);
                return (
                  <CommandItem
                    key={option.value}
                    onSelect={() => {
                      if (isSelected) {
                        selectedValues.delete(option.value);
                      } else {
                        selectedValues.add(option.value);
                      }
                      const filterValues = Array.from(selectedValues);
                      column?.setFilterValue(
                        filterValues.length ? filterValues : undefined
                      );
                    }}
                  >
                    <div
                      className={cn(
                        "mr-2 flex h-4 w-4 items-center justify-center rounded-sm border border-primary",
                        isSelected
                          ? "bg-primary text-primary-foreground"
                          : "opacity-50 [&_svg]:invisible"
                      )}
                    >
                      <CheckIcon className={cn("h-4 w-4")} />
                    </div>
                    {option.icon && (
                      <option.icon className="mr-2 h-4 w-4 text-muted-foreground" />
                    )}
                    <span>{option.label}</span>
                    {facets?.get(option.value) && (
                      <span className="ml-auto flex h-4 w-4 items-center justify-center font-mono text-xs">
                        {facets.get(option.value)}
                      </span>
                    )}
                  </CommandItem>
                );
              })}
            </CommandGroup>
            {selectedValues.size > 0 && (
              <>
                <CommandSeparator />
                <CommandGroup>
                  <CommandItem
                    onSelect={() => column?.setFilterValue(undefined)}
                    className="justify-center text-center"
                  >
                    Clear filters
                  </CommandItem>
                </CommandGroup>
              </>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
```

---

## Action System

### **Comprehensive Action Patterns**
```tsx
// Action types and their implementations
const actionPatterns = {
  // View actions
  view: {
    icon: Eye,
    label: "View Details",
    href: (id: string) => `/admin/[module]/[entity]/${id}`,
    variant: "default"
  },
  
  // Edit actions
  edit: {
    icon: Edit,
    label: "Edit",
    href: (id: string) => `/admin/[module]/[entity]/${id}/edit`,
    variant: "default"
  },
  
  // Download/Export actions
  download: {
    icon: Download,
    label: "Download",
    onClick: (entity: Entity) => handleDownload(entity),
    variant: "default"
  },
  
  // Conditional actions (show only when condition is met)
  viewSignature: {
    icon: FileText,
    label: "View Signature",
    condition: (entity: Entity) => !!entity.signatureImage,
    onClick: (entity: Entity) => openSignatureModal(entity.signatureImage),
    variant: "default"
  },
  
  // Destructive actions
  delete: {
    icon: Trash2,
    label: "Delete",
    onClick: (entity: Entity) => handleDelete(entity),
    variant: "destructive",
    requiresConfirmation: true
  }
};

// Action menu implementation
function ActionMenu({ entity }: { entity: Entity }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="h-8 w-8 p-0">
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>Actions</DropdownMenuLabel>
        
        {/* Standard actions */}
        {Object.entries(actionPatterns).map(([key, action]) => {
          // Skip if condition is not met
          if (action.condition && !action.condition(entity)) {
            return null;
          }
          
          const ActionComponent = action.href ? Link : 'div';
          const actionProps = action.href 
            ? { href: action.href(entity.id) }
            : { onClick: () => action.onClick?.(entity) };
          
          return (
            <DropdownMenuItem 
              key={key}
              asChild={!!action.href}
              className={action.variant === 'destructive' ? 'text-destructive' : ''}
            >
              <ActionComponent {...actionProps}>
                <action.icon className="mr-2 h-4 w-4" />
                {action.label}
              </ActionComponent>
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
```

---

## Dashboard Integration

### **Analytics Card System**
```tsx
// components/analytics-card.tsx
interface AnalyticsCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ComponentType<{ className?: string }>;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  variant?: "default" | "success" | "warning" | "error";
}

export function AnalyticsCard({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  variant = "default"
}: AnalyticsCardProps) {
  const variantStyles = {
    default: "bg-card border",
    success: "bg-green-50/90 border border-green-200/70",
    warning: "bg-amber-50/90 border border-amber-200/70",
    error: "bg-red-50/90 border border-red-200/70"
  };

  return (
    <Card className={variantStyles[variant]}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {subtitle && (
          <p className="text-xs text-muted-foreground">{subtitle}</p>
        )}
        {trend && (
          <div className={`text-xs ${trend.isPositive ? 'text-green-600' : 'text-red-600'}`}>
            {trend.isPositive ? '↗' : '↘'} {Math.abs(trend.value)}%
          </div>
        )}
      </CardContent>
    </Card>
  );
}
```

---

## State Management

### **URL State Synchronization**
```tsx
// hooks/use-data-table-state.ts
export function useDataTableState() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // Parse current state from URL
  const currentState = useMemo(() => ({
    page: Number(searchParams.get('page')) || 1,
    perPage: Number(searchParams.get('per_page')) || 10,
    search: searchParams.get('search') || '',
    status: searchParams.get('status')?.split(',') || [],
    sort: searchParams.get('sort') || '',
  }), [searchParams]);
  
  // Update URL with new state
  const updateState = useCallback((updates: Partial<typeof currentState>) => {
    const params = new URLSearchParams(searchParams);
    
    Object.entries({ ...currentState, ...updates }).forEach(([key, value]) => {
      if (value && value !== '' && (!Array.isArray(value) || value.length > 0)) {
        params.set(key, Array.isArray(value) ? value.join(',') : String(value));
      } else {
        params.delete(key);
      }
    });
    
    router.push(`?${params.toString()}`);
  }, [currentState, router, searchParams]);
  
  return { currentState, updateState };
}
```

---

## Best Practices

### **Performance Optimization**
1. **Server-side filtering and pagination** - Never load all data client-side
2. **Proper memoization** - Use `useMemo` for expensive calculations
3. **Virtual scrolling** - For very large datasets (>1000 rows)
4. **Debounced search** - Prevent excessive API calls during typing
5. **Optimistic updates** - Update UI immediately, sync with server

### **Accessibility**
1. **Keyboard navigation** - Full keyboard support for all interactions
2. **Screen reader support** - Proper ARIA labels and descriptions
3. **Focus management** - Clear focus indicators and logical tab order
4. **Color contrast** - Ensure sufficient contrast for all text and backgrounds

### **User Experience**
1. **Loading states** - Always show loading indicators during data fetching
2. **Empty states** - Provide helpful empty states with clear actions
3. **Error handling** - Graceful error handling with retry mechanisms
4. **Responsive design** - Mobile-first approach with progressive enhancement
5. **Consistent interactions** - Standardized patterns across all tables

### **Code Organization**
1. **Component composition** - Break down complex components into smaller, reusable pieces
2. **Type safety** - Use TypeScript throughout for better developer experience
3. **Consistent naming** - Follow established naming conventions
4. **Documentation** - Document complex logic and component APIs
5. **Testing** - Unit tests for business logic, integration tests for user flows

---

## Example Usage

### **Quick Implementation Checklist**
- [ ] Define TypeScript interfaces for entity and filters
- [ ] Create server action for data fetching
- [ ] Set up column definitions with proper typing
- [ ] Implement data table component with toolbar
- [ ] Add dashboard analytics (if needed)
- [ ] Configure URL state management
- [ ] Add comprehensive action system
- [ ] Implement loading and error states
- [ ] Test responsive behavior
- [ ] Verify accessibility compliance

### **File Creation Order**
1. `types/admin/[module].ts` - Type definitions
2. `lib/actions/[entity].ts` - Server actions
3. `components/.../columns.tsx` - Column definitions
4. `components/.../data-table.tsx` - Main table component
5. `components/.../data-table-toolbar.tsx` - Toolbar with filters
6. `components/.../[entity]-dashboard.tsx` - Analytics dashboard
7. `app/.../page.tsx` - Page component
8. `components/.../index.ts` - Export barrel

This comprehensive guide ensures consistent, performant, and accessible data table implementations across the entire XGen MRP application.