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
import { Product } from "@prisma/client"

interface DeleteProductDialogProps {
    product: Product
    trigger: React.ReactNode
    onSuccess?: () => void
}

export function DeleteProductDialog({
    product,
    trigger,
    onSuccess
}: DeleteProductDialogProps) {
    const [open, setOpen] = useState(false)
    const [loading, setLoading] = useState(false)

    const onDelete = async () => {
        try {
            setLoading(true)
            const response = await fetch(`/api/products/${product.id}`, {
                method: "DELETE",
            })

            if (!response.ok) {
                throw new Error("Failed to delete product")
            }

            toast({
                title: "Success",
                description: "Product deleted successfully",
            })
            setOpen(false)
            onSuccess?.()
        } catch (error) {
            toast({
                title: "Error",
                description: "Failed to delete product",
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
                        This will permanently delete the product &quot;{product.name}&quot;.
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