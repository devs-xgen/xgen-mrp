"use client"

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
import { toast } from "@/hooks/use-toast"
import { Customer } from "@prisma/client"

interface DeleteCustomerDialogProps {
    customer: Customer
    open: boolean
    onOpenChange: (open: boolean) => void
    onSuccess?: () => Promise<void>
}

export function DeleteCustomerDialog({
    customer,
    open,
    onOpenChange,
    onSuccess
}: DeleteCustomerDialogProps) {
    const handleDelete = async () => {
        try {
            const response = await fetch(`/api/customers/${customer.id}`, {
                method: "DELETE",
            })

            if (!response.ok) {
                throw new Error("Failed to delete customer")
            }

            toast({
                title: "Success",
                description: "Customer deleted successfully",
            })
            onOpenChange(false)
            await onSuccess?.()
        } catch (error) {
            toast({
                title: "Error",
                description: error instanceof Error ? error.message : "Failed to delete customer",
                variant: "destructive",
            })
        }
    }

    return (
        <AlertDialog open={open} onOpenChange={onOpenChange}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                        This will permanently delete the customer &quot;{customer.name}&quot;.
                        This action cannot be undone.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    )
} 