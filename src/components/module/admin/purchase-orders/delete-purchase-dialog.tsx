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
import { PurchaseOrder } from "@prisma/client"

interface DeletePurchaseOrderDialogProps {
    purchaseOrder: PurchaseOrder
    trigger: React.ReactNode
    onSuccess?: () => void
}

export function DeletePurchaseOrderDialog({
    purchaseOrder,
    trigger,
    onSuccess
}: DeletePurchaseOrderDialogProps) {
    const [open, setOpen] = useState(false)
    const [loading, setLoading] = useState(false)

    const onDelete = async () => {
        try {
            setLoading(true)
            const response = await fetch(`/api/purchase-orders/${purchaseOrder.id}`, {
                method: "DELETE",
            })

            if (!response.ok) {
                throw new Error("Failed to delete purchase order")
            }

            toast({
                title: "Success",
                description: `Purchase order #${purchaseOrder.poNumber} deleted successfully`,
            })
            setOpen(false)
            onSuccess?.()
        } catch (error) {
            toast({
                title: "Error",
                description: "Failed to delete purchase order",
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
                        This will permanently delete the purchase order #"{purchaseOrder.poNumber}".
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
