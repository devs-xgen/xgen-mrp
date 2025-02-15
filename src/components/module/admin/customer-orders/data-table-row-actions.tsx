"use client"

import { useState } from "react"
import { Row } from "@tanstack/react-table"
import { Eye, MoreHorizontal, Trash } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { CustomerOrder } from "@prisma/client"
import { deleteCustomerOrder } from "@/lib/actions/customer-order"
import { useToast } from "@/hooks/use-toast"
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
import { CustomerOrderSheet } from "./customer-order-sheet"

interface DataTableRowActionsProps<T = any> { // ✅ Allow generic row type
  row: Row<T>;
}

export function DataTableRowActions({ row }: DataTableRowActionsProps) {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [showViewSheet, setShowViewSheet] = useState(false)
  const { toast } = useToast()
  const customerOrder = row.original

  const onDelete = async () => {
    try {
      await deleteCustomerOrder(customerOrder.id)
      toast({
        title: "Success",
        description: "Customer order deleted successfully",
      })
      setShowDeleteDialog(false)
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete customer order",
        variant: "destructive",
      })
    }
  }

  return (
    <>
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
        <DropdownMenuContent align="end" className="w-[160px]">
          <DropdownMenuItem onClick={() => setShowViewSheet(true)}>
            <Eye className="mr-2 h-3.5 w-3.5 text-muted-foreground/70" />
            View/Edit
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={() => setShowDeleteDialog(true)}
            className="text-destructive focus:text-destructive"
          >
            <Trash className="mr-2 h-3.5 w-3.5 text-muted-foreground/70" />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the customer order {customerOrder.orderNumber}.
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={onDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <CustomerOrderSheet 
        customerOrder={customerOrder}
        open={showViewSheet}
        onOpenChange={setShowViewSheet}
      />
    </>
  )
}
