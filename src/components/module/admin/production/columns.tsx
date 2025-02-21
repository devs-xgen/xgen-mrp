// src/components/module/admin/production/columns.tsx
"use client"

import { ColumnDef } from "@tanstack/react-table"
import { ProductionOrderColumn } from "@/types/admin/production-order"
import { Badge } from "@/components/ui/badge"
import { DataTableColumnHeader } from "@/components/ui/data-table-column-header"
import { DataTableRowActions } from "./data-table-row-actions"
import { formatDate } from "@/lib/utils"
import { Progress } from "@/components/ui/progress"

export const columns: ColumnDef<ProductionOrderColumn>[] = [
  {
    accessorKey: "productName",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Product" />
    ),
    cell: ({ row }) => {
      return (
        <div>
          <div className="font-medium">{row.getValue("productName")}</div>
          <div className="text-xs text-muted-foreground">{row.original.productSku}</div>
        </div>
      )
    },
  },
  {
    accessorKey: "quantity",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Quantity" />
    ),
  },
  {
    accessorKey: "startDate",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Start Date" />
    ),
    cell: ({ row }) => formatDate(row.getValue("startDate")),
  },
  {
    accessorKey: "dueDate",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Due Date" />
    ),
    cell: ({ row }) => formatDate(row.getValue("dueDate")),
  },
  {
    accessorKey: "progress",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Progress" />
    ),
    cell: ({ row }) => (
      <div className="flex items-center gap-2">
        <Progress value={row.getValue("progress")} className="w-[60px]" />
        <span className="text-sm">{row.getValue("progress")}%</span>
      </div>
    ),
  },
  {
    accessorKey: "status",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Status" />
    ),
    cell: ({ row }) => {
      const status = row.getValue("status") as string
      return (
        <Badge 
          variant={
            status === "COMPLETED" 
              ? "default" 
              : status === "IN_PROGRESS" 
                ? "secondary"
                : "outline"
          }
        >
          {status.toLowerCase().replace("_", " ")}
        </Badge>
      )
    },
    filterFn: (row, id, value) => {
      return value.includes(row.getValue(id))
    },
  },
  {
    accessorKey: "priority",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Priority" />
    ),
    cell: ({ row }) => {
      const priority = row.getValue("priority") as string
      return (
        <Badge 
          variant={
            priority === "HIGH" 
              ? "destructive" 
              : priority === "MEDIUM" 
                ? "default"
                : "secondary"
          }
        >
          {priority.toLowerCase()}
        </Badge>
      )
    },
    filterFn: (row, id, value) => {
      return value.includes(row.getValue(id))
    },
  },
  {
    accessorKey: "customerOrderNumber",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Customer Order" />
    ),
    cell: ({ row }) => row.getValue("customerOrderNumber") || "—",
  },
  {
    id: "actions",
    cell: ({ row }) => <DataTableRowActions row={row} />,
  },
]