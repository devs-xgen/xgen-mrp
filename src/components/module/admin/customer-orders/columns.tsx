// src/components/module/admin/customer-orders/columns.tsx
"use client"

import { ColumnDef } from "@tanstack/react-table"
import { CustomerOrderColumn } from "@/types/admin/customer-order"
import { Badge } from "@/components/ui/badge"
import { DataTableColumnHeader } from "@/components/ui/data-table-column-header"
import { DataTableRowActions } from "./data-table-row-actions"
import { FulfillmentIndicator } from "./FulfillmentIndicator"
import { formatDate } from "@/lib/utils"
import { formatCurrencyPHP } from "@/lib/constant"
import { createSelectionColumn } from "@/components/global/table"

export const createColumns = (): ColumnDef<CustomerOrderColumn>[] => [
  // Selection checkbox column
  createSelectionColumn<CustomerOrderColumn>(),
  {
    accessorKey: "orderNumber",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Order #" />
    ),
    cell: ({ row }) => {
      return (
        <div>
          <div className="font-medium">{row.getValue("orderNumber")}</div>
          <div className="text-xs text-muted-foreground">
            {formatDate(row.original.orderDate)}
          </div>
        </div>
      )
    },
  },
  {
    accessorKey: "customerName",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Customer" />
    ),
    cell: ({ row }) => {
      return (
        <div>
          <div className="font-medium">{row.getValue("customerName")}</div>
          <div className="text-xs text-muted-foreground">
            {row.original.customerEmail || "No email"}
          </div>
        </div>
      )
    },
  },
  {
    accessorKey: "itemCount",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Items" />
    ),
    cell: ({ row }) => {
      return (
        <div>
          <div className="font-medium">{row.getValue("itemCount")} items</div>
          <div className="text-xs text-muted-foreground">
            {row.original.totalQuantity} units
          </div>
        </div>
      )
    },
  },
  {
    accessorKey: "fulfillmentOverview",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Fulfillment" />
    ),
    cell: ({ row }) => {
      const fulfillmentOverview = row.getValue("fulfillmentOverview") as CustomerOrderColumn["fulfillmentOverview"]
      return <FulfillmentIndicator fulfillmentOverview={fulfillmentOverview} />
    },
  },
  {
    accessorKey: "productionOrderCount",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Production" />
    ),
    cell: ({ row }) => {
      const count = row.getValue("productionOrderCount") as number
      return (
        <div>
          {count > 0 ? (
            <Badge variant="secondary" className="bg-blue-100 text-blue-800">
              {count} orders
            </Badge>
          ) : (
            <Badge variant="outline">No production</Badge>
          )}
        </div>
      )
    },
  },
  {
    accessorKey: "totalAmount",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Amount" />
    ),
    cell: ({ row }) => {
      const amount = row.getValue("totalAmount") as number
      return (
        <div className="font-medium">
          {formatCurrencyPHP(amount)}
        </div>
      )
    },
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
              : status === "CANCELLED"
              ? "destructive"
              : "outline"
          }
          className={
            status === "COMPLETED"
              ? "bg-green-500 text-white"
              : status === "IN_PROGRESS"
              ? "bg-blue-500 text-white"
              : status === "PENDING"
              ? "bg-yellow-500 text-white"
              : ""
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
    accessorKey: "requiredDate",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Due Date" />
    ),
    cell: ({ row }) => {
      const dueDate = new Date(row.getValue("requiredDate"))
      const today = new Date()
      const isOverdue = dueDate < today && row.original.status !== "COMPLETED"
      
      return (
        <div className={isOverdue ? "text-destructive font-medium" : ""}>
          {formatDate(row.getValue("requiredDate"))}
          {isOverdue && (
            <div className="text-xs text-destructive">Overdue</div>
          )}
        </div>
      )
    },
  },
  {
    id: "actions",
    cell: ({ row }) => (
      <DataTableRowActions row={row} />
    ),
  },
]

// For backward compatibility, export the default columns
export const columns = createColumns();
