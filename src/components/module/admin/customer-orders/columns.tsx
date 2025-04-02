// src/components/module/admin/customer-orders/columns.tsx
"use client"

import { ColumnDef, Row } from "@tanstack/react-table"
import { CustomerOrder } from "@/types/admin/customer-order"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { CustomerOrderColumnHeader } from "./data-table-column-header"
import { DataTableRowActions } from "./data-table-row-actions"
import { formatDate } from "@/lib/utils"
import { Status } from "@prisma/client"
import { Decimal } from "@prisma/client/runtime/library"

export const columns: ColumnDef<CustomerOrder>[] = [
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
    accessorKey: "orderNumber",
    header: ({ column }) => (
      <CustomerOrderColumnHeader column={column} title="Order Number" />
    ),
    cell: ({ row }) => (
      <div className="font-medium">{row.getValue("orderNumber")}</div>
    ),
  },
  {
    accessorKey: "customer",
    header: ({ column }) => (
      <CustomerOrderColumnHeader column={column} title="Customer" />
    ),
    cell: ({ row }) => {
      const customer = row.original.customer
      return (
        <div className="flex flex-col">
          <span className="font-medium">{customer.name}</span>
        </div>
      )
    },
  },
  {
    accessorKey: "orderDate",
    header: ({ column }) => (
      <CustomerOrderColumnHeader column={column} title="Order Date" />
    ),
    cell: ({ row }) => (
      <div>{formatDate(row.getValue("orderDate"))}</div>
    ),
  },
  {
    accessorKey: "requiredDate",
    header: ({ column }) => (
      <CustomerOrderColumnHeader column={column} title="Required Date" />
    ),
    cell: ({ row }) => (
      <div>{formatDate(row.getValue("requiredDate"))}</div>
    ),
  },
  {
    accessorKey: "totalAmount",
    header: ({ column }) => (
      <CustomerOrderColumnHeader column={column} title="Total Amount" />
    ),
    cell: ({ row }) => {
      const amount = row.getValue("totalAmount") as number
      const formatted = new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "PHP",
      }).format(amount)
      return <div className="font-medium">{formatted}</div>
    },
  },
  // {
  //   accessorKey: "unitPrice",
  //   header: "Unit Price",
  //   cell: ({ row }) => <span>{formatCurrency(row.original.unitPrice)}</span>
  // },
  {
    accessorKey: "status",
    header: ({ column }) => (
      <CustomerOrderColumnHeader column={column} title="Status" />
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
    accessorKey: "orderLines",
    header: ({ column }) => (
      <CustomerOrderColumnHeader column={column} title="Products" />
    ),
    cell: ({ row }) => {
      const orderLines = row.original.orderLines; // Access orderLines
  
      if (!orderLines || orderLines.length === 0) {
        return <div>No products</div>;
      }
  
      return (
        <ul className="list-disc pl-5">
          {orderLines.map((orderLine) => (
            <li key={orderLine.id}>
              {orderLine.product?.name} ({orderLine.quantity} x{" "}
              {formatCurrency(Number(orderLine.unitPrice))}) {/* ✅ Ensure Number conversion */}
            </li>
          ))}
        </ul>
      );
    },
  },
  
  {
    id: "actions",
    cell: ({ row }) => <DataTableRowActions row={row as Row<CustomerOrder>} />, // ✅ Type Assertion
  }
  ,
]

function getStatusColor(status: Status): "default" | "success" | "warning" | "destructive" {
  switch (status) {
    case "ACTIVE":
      return "success"
    case "PENDING":
      return "warning"
    case "CANCELLED":
      return "destructive"
    default:
      return "default"
  }
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "PHP",
  }).format(amount);
}