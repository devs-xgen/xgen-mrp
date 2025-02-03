// src/components/module/admin/purchase-orders/columns.tsx
"use client"

import { ColumnDef } from "@tanstack/react-table"
import { PurchaseOrder } from "@/types/admin/purchase-order"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { DataTableColumnHeader } from "./data-table-column-header"
import { DataTableRowActions } from "./data-table-row-actions"
import { formatDate } from "@/lib/utils"
import { Status } from "@prisma/client"
import { Decimal } from "@prisma/client/runtime/library"

export const columns: ColumnDef<PurchaseOrder>[] = [
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
  {
    accessorKey: "poNumber",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="PO Number" />
    ),
    cell: ({ row }) => {
      return (
        <div className="font-medium">{row.getValue("poNumber")}</div>
      )
    },
  },
  {
    accessorKey: "supplier",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Supplier" />
    ),
    cell: ({ row }) => {
      const supplier = row.original.supplier
      return (
        <div className="flex flex-col">
          <span className="font-medium">{supplier.name}</span>
          <span className="text-xs text-muted-foreground">{supplier.code}</span>
        </div>
      )
    },
  },
  {
    accessorKey: "orderDate",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Order Date" />
    ),
    cell: ({ row }) => {
      return <div>{formatDate(row.getValue("orderDate"))}</div>
    },
  },
  {
    accessorKey: "expectedDelivery",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Expected Delivery" />
    ),
    cell: ({ row }) => {
      return <div>{formatDate(row.getValue("expectedDelivery"))}</div>
    },
  },
  {
    accessorKey: "totalAmount",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Total Amount" />
    ),
    cell: ({ row }) => {
      const amount = (row.getValue("totalAmount") as Decimal).toNumber()
      const formatted = new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "PHP",
      }).format(amount)
      return <div className="font-medium">{formatted}</div>
    },
  },
  {
    accessorKey: "status",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Status" />
    ),
    cell: ({ row }) => {
      const status = row.getValue("status") as Status

      return (
        <Badge variant={getStatusColor(status)}>
          {status.toLowerCase()}
        </Badge>
      )
    },
    filterFn: (row, id, value) => {
      return value.includes(row.getValue(id))
    },
  },
  {
    id: "actions",
    cell: ({ row }) => <DataTableRowActions row={row} />,
  },
]

function getStatusColor(status: Status): "default" | "success" | "warning" | "destructive" {
  switch (status) {
    case "COMPLETED":
      return "success"
    case "PENDING":
      return "warning"
    case "CANCELLED":
      return "destructive"
    default:
      return "default"
  }
}