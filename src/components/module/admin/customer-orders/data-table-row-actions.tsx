"use client"

import { useState } from "react"
import { Row } from "@tanstack/react-table"
import { Eye, MoreHorizontal, Trash, Factory, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { CustomerOrderColumn } from "@/types/admin/customer-order"
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
import { ProductionOrdersDialog } from "./production-orders-dialog"
import { CreateProductionOrdersDialog } from "./create-production-orders-dialog"

interface DataTableRowActionsProps {
  row: Row<CustomerOrderColumn>
}

export function DataTableRowActions({ row }: DataTableRowActionsProps) {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [showViewSheet, setShowViewSheet] = useState(false)
  const [showProductionDialog, setShowProductionDialog] = useState(false)
  const [showCreateProductionDialog, setShowCreateProductionDialog] = useState(false)
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
      // Refresh the page to update the list
      window.location.reload()
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
        <DropdownMenuContent align="end" className="w-[180px]">
          <DropdownMenuItem onClick={() => setShowViewSheet(true)}>
            <Eye className="mr-2 h-3.5 w-3.5 text-muted-foreground/70" />
            View Details
          </DropdownMenuItem>
          
          {customerOrder.productionOrderCount > 0 ? (
            <DropdownMenuItem onClick={() => setShowProductionDialog(true)}>
              <Factory className="mr-2 h-3.5 w-3.5 text-muted-foreground/70" />
              View Production
            </DropdownMenuItem>
          ) : (
            <DropdownMenuItem onClick={() => setShowCreateProductionDialog(true)}>
              <Plus className="mr-2 h-3.5 w-3.5 text-muted-foreground/70" />
              Create Production
            </DropdownMenuItem>
          )}
          
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

      <ProductionOrdersDialog
        customerOrderId={customerOrder.id}
        customerOrderNumber={customerOrder.orderNumber}
        open={showProductionDialog}
        onOpenChange={setShowProductionDialog}
      />

      <CreateProductionOrdersDialog
        customerOrderId={customerOrder.id}
        customerOrderNumber={customerOrder.orderNumber}
        open={showCreateProductionDialog}
        onOpenChange={setShowCreateProductionDialog}
      />
    </>
  )
}
