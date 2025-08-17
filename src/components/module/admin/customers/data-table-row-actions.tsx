"use client"

import { Row } from "@tanstack/react-table"
import { Customer } from "@prisma/client"
import { Button } from "@/components/ui/button"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Edit, Eye, MoreHorizontal, Trash, ShoppingCart } from "lucide-react"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { EditCustomerDialog } from "./edit-customer-dialog"
import { DeleteCustomerDialog } from "./delete-customer-dialog"
import { ViewCustomerDialog } from "./view-customer-dialog"

interface DataTableRowActionsProps {
    row: Row<Customer>
    onCustomerUpdated?: () => Promise<void>
}

export function DataTableRowActions({ row, onCustomerUpdated }: DataTableRowActionsProps) {
    const router = useRouter()
    const [showEditDialog, setShowEditDialog] = useState(false)
    const [showDeleteDialog, setShowDeleteDialog] = useState(false)
    const [showViewDialog, setShowViewDialog] = useState(false)

    const handleViewOrders = () => {
        router.push(`/admin/customers/${row.original.id}/orders`)
    }

    return (
        <>
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon">
                        <MoreHorizontal className="h-4 w-4" />
                        <span className="sr-only">Open menu</span>
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => setShowViewDialog(true)}>
                        <Eye className="mr-2 h-4 w-4" />
                        View
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={handleViewOrders}>
                        <ShoppingCart className="mr-2 h-4 w-4" />
                        View Orders
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setShowEditDialog(true)}>
                        <Edit className="mr-2 h-4 w-4" />
                        Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setShowDeleteDialog(true)}>
                        <Trash className="mr-2 h-4 w-4" />
                        Delete
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>

            <ViewCustomerDialog
                customer={row.original}
                open={showViewDialog}
                onOpenChange={setShowViewDialog}
                onEdit={() => {
                    setShowViewDialog(false)
                    setShowEditDialog(true)
                }}
                onDelete={() => {
                    setShowViewDialog(false)
                    setShowDeleteDialog(true)
                }}
            />

            <EditCustomerDialog
                customer={row.original}
                open={showEditDialog}
                onOpenChange={setShowEditDialog}
                onSuccess={onCustomerUpdated}
            />

            <DeleteCustomerDialog
                customer={row.original}
                open={showDeleteDialog}
                onOpenChange={setShowDeleteDialog}
                onSuccess={onCustomerUpdated}
            />
        </>
    )
} 