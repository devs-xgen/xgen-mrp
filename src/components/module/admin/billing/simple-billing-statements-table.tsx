"use client"

import { useState } from "react"
import { ColumnDef } from "@tanstack/react-table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { DataTable } from "@/components/ui/data-table"
import { DataTableColumnHeader } from "@/components/ui/data-table-column-header"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { MoreHorizontal, Eye, Trash, CheckCircle, FileText } from "lucide-react"
import { formatDate } from "@/lib/utils"
import { formatCurrencyPHP } from "@/lib/constant"
import { updateBillingStatementStatus, deleteBillingStatement } from "@/lib/actions/simple-billing-statements"
import { useToast } from "@/hooks/use-toast"
import { SerializableData } from "@/lib/utils/decimal-serializer"

// Type for serialized billing statement data
type SerializedBillingStatement = SerializableData<{
  id: string
  statementNumber: string
  customerName: string
  totalAmount: number
  billingDate: Date
  dueDate: Date
  status: "DRAFT" | "SENT" | "PAID" | "OVERDUE" | "CANCELLED"
  notes?: string | null
  customer: {
    id: string
    name: string
    email: string | null
  }
  customerOrder: {
    id: string
    orderNumber: string
    orderDate: Date
    status: string
  }
}>

interface SimpleBillingStatementsTableProps {
  data: SerializedBillingStatement[]
}

export function SimpleBillingStatementsTable({ data }: SimpleBillingStatementsTableProps) {
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const { toast } = useToast()

  const handleStatusUpdate = async (id: string, status: "DRAFT" | "SENT" | "PAID" | "OVERDUE" | "CANCELLED") => {
    try {
      await updateBillingStatementStatus(id, status)
      toast({
        title: "Success",
        description: "Billing statement status updated successfully",
      })
      window.location.reload()
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update billing statement status",
        variant: "destructive",
      })
    }
  }

  const handleDelete = async () => {
    if (!deleteId) return

    try {
      await deleteBillingStatement(deleteId)
      toast({
        title: "Success",
        description: "Billing statement deleted successfully",
      })
      setDeleteId(null)
      window.location.reload()
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete billing statement",
        variant: "destructive",
      })
    }
  }

  const columns: ColumnDef<SerializedBillingStatement>[] = [
    {
      accessorKey: "statementNumber",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Statement #" />
      ),
      cell: ({ row }) => {
        return (
          <div>
            <div className="font-medium">{row.getValue("statementNumber")}</div>
            <div className="text-xs text-muted-foreground">
              {formatDate(new Date(row.original.billingDate as unknown as string))}
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
              {row.original.customer.email || "No email"}
            </div>
          </div>
        )
      },
    },
    {
      accessorKey: "customerOrder",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Order" />
      ),
      cell: ({ row }) => {
        const order = row.original.customerOrder
        return (
          <div>
            <div className="font-medium">{order.orderNumber}</div>
            <div className="text-xs text-muted-foreground">
              {formatDate(new Date(order.orderDate as unknown as string))}
            </div>
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
              status === "PAID"
                ? "default"
                : status === "SENT"
                ? "secondary"
                : status === "OVERDUE"
                ? "destructive"
                : status === "CANCELLED"
                ? "destructive"
                : "outline"
            }
            className={
              status === "PAID"
                ? "bg-green-500 text-white"
                : status === "SENT"
                ? "bg-blue-500 text-white"
                : status === "OVERDUE"
                ? "bg-red-500 text-white"
                : status === "CANCELLED"
                ? "bg-gray-500 text-white"
                : "bg-yellow-500 text-white"
            }
          >
            {status.toLowerCase()}
          </Badge>
        )
      },
      filterFn: (row, id, value) => {
        return value.includes(row.getValue(id))
      },
    },
    {
      accessorKey: "dueDate",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Due Date" />
      ),
      cell: ({ row }) => {
        const dueDate = new Date(row.getValue("dueDate") as unknown as string)
        const today = new Date()
        const isOverdue = dueDate < today && row.original.status !== "PAID"
        
        return (
          <div className={isOverdue ? "text-destructive font-medium" : ""}>
            {formatDate(row.getValue("dueDate") as unknown as string)}
            {isOverdue && (
              <div className="text-xs text-destructive">Overdue</div>
            )}
          </div>
        )
      },
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const statement = row.original

        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="flex h-8 w-8 p-0 data-[state=open]:bg-muted"
              >
                <MoreHorizontal className="h-4 w-4" />
                <span className="sr-only">Open menu</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-[200px]">
              <DropdownMenuItem>
                <Eye className="mr-2 h-3.5 w-3.5 text-muted-foreground/70" />
                View Details
              </DropdownMenuItem>
              
              <DropdownMenuItem>
                <FileText className="mr-2 h-3.5 w-3.5 text-muted-foreground/70" />
                Download PDF
              </DropdownMenuItem>
              
              <DropdownMenuSeparator />
              
              {statement.status !== "PAID" && (
                <DropdownMenuItem onClick={() => handleStatusUpdate(statement.id, "PAID")}>
                  <CheckCircle className="mr-2 h-3.5 w-3.5 text-muted-foreground/70" />
                  Mark as Paid
                </DropdownMenuItem>
              )}
              
              {statement.status === "DRAFT" && (
                <DropdownMenuItem onClick={() => handleStatusUpdate(statement.id, "SENT")}>
                  <FileText className="mr-2 h-3.5 w-3.5 text-muted-foreground/70" />
                  Mark as Sent
                </DropdownMenuItem>
              )}
              
              <DropdownMenuSeparator />
              
              <DropdownMenuItem
                onClick={() => setDeleteId(statement.id)}
                className="text-destructive focus:text-destructive"
              >
                <Trash className="mr-2 h-3.5 w-3.5 text-muted-foreground/70" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )
      },
    },
  ]

  return (
    <>
      <DataTable
        columns={columns}
        data={data}
      />

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the billing statement.
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}