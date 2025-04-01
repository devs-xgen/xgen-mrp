"use client"

import { useState } from "react"
import {
    AlertDialog,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import { toast } from "@/hooks/use-toast"
import { Supplier } from "@prisma/client"

interface DeleteSupplierDialogProps {
    supplier: Supplier
    open: boolean
    trigger: React.ReactNode
    onSuccess?: () => void
}

export function DeleteSupplierDialog({
    supplier,
    trigger,
    onSuccess
}: DeleteSupplierDialogProps) {
    const [open, setOpen] = useState(false)
    const [loading, setLoading] = useState(false)

    const onDelete = async () => {
        try {
            setLoading(true)
            const response = await fetch(`/api/suppliers/${supplier.id}`, {
                method: "DELETE",
            })

            if (!response.ok) {
                throw new Error("Failed to delete supplier")
            }

            toast({
                title: "Success",
                description: "Supplier deleted successfully",
            })
            setOpen(false)
            onSuccess?.()
        } catch (error) {
            toast({
                title: "Error",
                description: "Failed to delete supplier",
                variant: "destructive",
            })
        } finally {
            setLoading(false)
        }
    }

    return (
        <AlertDialog open={open} onOpenChange={setOpen}>
            <AlertDialogTrigger asChild>
                {trigger}
            </AlertDialogTrigger>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                        This will permanently delete the supplier &quot;{supplier.name}&quot;.
                        This action cannot be undone.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel disabled={loading}>Cancel</AlertDialogCancel>
                    <Button
                        variant="destructive"
                        onClick={onDelete}
                        disabled={loading}
                    >
                        {loading ? "Deleting..." : "Delete"}
                    </Button>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    )
}
