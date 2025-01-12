"use client"

import { Customer } from "@prisma/client"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Edit, Trash } from "lucide-react"

interface ViewCustomerDialogProps {
    customer: Customer
    open: boolean
    onOpenChange: (open: boolean) => void
    onEdit: (customer: Customer) => void
    onDelete: (customer: Customer) => void
}

export function ViewCustomerDialog({
    customer,
    open,
    onOpenChange,
    onEdit,
    onDelete
}: ViewCustomerDialogProps) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[600px]">
                <DialogHeader>
                    <DialogTitle>Customer Details</DialogTitle>
                    <DialogDescription>
                        View customer information
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                        <span className="font-medium">Code:</span>
                        <span className="col-span-3">{customer.code}</span>
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <span className="font-medium">Name:</span>
                        <span className="col-span-3">{customer.name}</span>
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <span className="font-medium">Contact Person:</span>
                        <span className="col-span-3">{customer.contactPerson}</span>
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <span className="font-medium">Email:</span>
                        <span className="col-span-3">{customer.email}</span>
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <span className="font-medium">Phone:</span>
                        <span className="col-span-3">{customer.phone}</span>
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <span className="font-medium">Address:</span>
                        <span className="col-span-3">{customer.address}</span>
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <span className="font-medium">Location:</span>
                        <span className="col-span-3">
                            {[customer.city, customer.state, customer.country].filter(Boolean).join(", ")}
                        </span>
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <span className="font-medium">TIN Number:</span>
                        <span className="col-span-3">{customer.tinNumber}</span>
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <span className="font-medium">Credit Limit:</span>
                        <span className="col-span-3">
                            {customer.creditLimit?.toString() || 'N/A'}
                        </span>
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <span className="font-medium">Payment Terms:</span>
                        <span className="col-span-3">{customer.paymentTerms}</span>
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <span className="font-medium">Status:</span>
                        <span className="col-span-3">{customer.status}</span>
                    </div>
                    {customer.notes && (
                        <div className="grid grid-cols-4 items-center gap-4">
                            <span className="font-medium">Notes:</span>
                            <span className="col-span-3">{customer.notes}</span>
                        </div>
                    )}
                </div>

                <DialogFooter className="flex space-x-2">
                    <Button
                        variant="outline"
                        onClick={() => onOpenChange(false)}
                    >
                        Close
                    </Button>
                    <Button
                        variant="outline"
                        onClick={() => onEdit(customer)}
                    >
                        <Edit className="mr-2 h-4 w-4" />
                        Edit
                    </Button>
                    <Button
                        variant="destructive"
                        onClick={() => {
                            onOpenChange(false)
                            onDelete(customer)
                        }}
                    >
                        <Trash className="mr-2 h-4 w-4" />
                        Delete
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
} 