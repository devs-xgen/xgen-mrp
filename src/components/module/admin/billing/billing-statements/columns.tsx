"use client"

import { ColumnDef } from "@tanstack/react-table"
import Link from "next/link"
import { MoreHorizontal, FileText, Download } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import { DataTableColumnHeader } from "./data-table-column-header"
import { BillingStatementWithRelations, BillingStatus } from "@/types/admin/billing"
import { formatCurrencyPHP } from "@/lib/constant"
import { formatDate } from "@/lib/services/pdf-generator"
import { getStatusBadge } from "./utils"

export const columns: ColumnDef<BillingStatementWithRelations>[] = [
  {
    accessorKey: "statementNumber",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Statement #" />
    ),
    cell: ({ row }) => {
      const statement = row.original
      return (
        <div className="font-medium">
          {statement.statementNumber}
        </div>
      )
    },
  },
  {
    accessorKey: "customer",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Customer" />
    ),
    cell: ({ row }) => {
      const statement = row.original
      return (
        <div>
          <div className="font-medium">{statement.customerName || "Unknown Customer"}</div>
          {statement.customerOrder && (
            <div className="text-sm text-blue-600">
              Order: {statement.customerOrder.orderNumber}
            </div>
          )}
          {statement.deliveryReceipts && statement.deliveryReceipts.length > 0 && (
            <div className="text-sm text-green-600">
              Delivery: {statement.deliveryReceipts[0].receiptNumber}
            </div>
          )}
        </div>
      )
    },
  },
  {
    id: "orderInfo",
    header: "Order Info",
    cell: ({ row }) => {
      const statement = row.original
      return (
        <div className="space-y-1">
          {statement.customerOrder && (
            <div className="text-sm text-blue-600">
              Order: {statement.customerOrder.orderNumber}
            </div>
          )}
          {statement.productionOrder && (
            <div className="text-sm text-purple-600">
              Production: {statement.productionOrder.quantity}x {statement.productionOrder.product?.name}
            </div>
          )}
          {statement.deliveryReceipts && statement.deliveryReceipts.length > 0 && (
            <div className="text-sm text-green-600">
              Delivery: {statement.deliveryReceipts[0].receiptNumber}
            </div>
          )}
        </div>
      )
    },
  },
  {
    accessorKey: "netAmount",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Amount" />
    ),
    cell: ({ row }) => {
      const statement = row.original
      return (
        <div className="text-right">
          <div className="font-medium">
            {formatCurrencyPHP(statement.netAmount)}
          </div>
          {statement.totalAmount !== statement.netAmount && (
            <div className="text-sm text-muted-foreground">
              Total: {formatCurrencyPHP(statement.totalAmount)}
            </div>
          )}
          {statement.taxAmount > 0 && (
            <div className="text-xs text-muted-foreground">
              Tax: {formatCurrencyPHP(statement.taxAmount)}
            </div>
          )}
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
      const status = row.getValue("status") as BillingStatus
      return getStatusBadge(status)
    },
    filterFn: (row, id, value) => {
      return value.includes(row.getValue(id))
    },
  },
  {
    accessorKey: "billingDate",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Billing Date" />
    ),
    cell: ({ row }) => {
      const date = row.getValue("billingDate") as Date
      return new Date(date).toLocaleDateString()
    },
  },
  {
    accessorKey: "dueDate",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Due Date" />
    ),
    cell: ({ row }) => {
      const date = row.getValue("dueDate") as Date | null
      return date ? new Date(date).toLocaleDateString() : '-'
    },
  },
  {
    id: "actions",
    header: "Actions",
    cell: ({ row }) => {
      const statement = row.original

      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Actions</DropdownMenuLabel>
            <DropdownMenuItem asChild>
              <Link href={`/admin/billing/billing-statements/${statement.id}`}>
                <FileText className="mr-2 h-4 w-4" />
                View Details
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Download className="mr-2 h-4 w-4" />
              Download PDF
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            {statement.status === 'DRAFT' && (
              <DropdownMenuItem asChild>
                <Link href={`/admin/billing/billing-statements/${statement.id}/edit`}>
                  Edit Statement
                </Link>
              </DropdownMenuItem>
            )}
            {statement.status === 'SENT' && (
              <DropdownMenuItem>
                Mark as Paid
              </DropdownMenuItem>
            )}
            {statement.status === 'DRAFT' && (
              <DropdownMenuItem className="text-destructive">
                Delete Statement
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      )
    },
  },
]