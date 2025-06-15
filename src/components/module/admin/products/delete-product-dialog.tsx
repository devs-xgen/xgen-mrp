"use client"

import { useState } from "react"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { toast } from "@/hooks/use-toast"
import { deleteProduct } from "@/lib/actions/product"
import { ProductWithRelations } from "./columns"

interface DeleteProductDialogProps {
    product: ProductWithRelations
    trigger: React.ReactNode
    onSuccess?: () => Promise<void>
}

export function DeleteProductDialog({
    product,
    trigger,
    onSuccess
}: DeleteProductDialogProps) {
    const [open, setOpen] = useState(false)
    const [loading, setLoading] = useState(false)

    const handleDelete = async () => {
        try {
            setLoading(true)
            
            const result = await deleteProduct(product.id)
            
            if (result.success) {
                toast({
                    title: "Success",
                    description: `Product "${product.name}" deleted successfully`,
                })
                setOpen(false)
                await onSuccess?.()
            } else {
                throw new Error(result.error || "Failed to delete product")
            }
        } catch (error) {
            console.error("Delete product error:", error)
            toast({
                title: "Error",
                description: error instanceof Error ? error.message : "Failed to delete product",
                variant: "destructive",
            })
        } finally {
            setLoading(false)
        }
    }

    const variantCount = product.variants?.length || 0

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {trigger}
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Delete Product</DialogTitle>
                    <DialogDescription>
                        Are you sure you want to delete this product? This action cannot be undone.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4">
                    <div className="bg-muted p-4 rounded-lg">
                        <h4 className="font-medium">{product.name}</h4>
                        <p className="text-sm text-muted-foreground">SKU: {product.sku}</p>
                        <p className="text-sm text-muted-foreground">Category: {product.category?.name}</p>
                        {variantCount > 0 && (
                            <p className="text-sm text-muted-foreground">
                                This product has {variantCount} variant{variantCount > 1 ? 's' : ''} that will also be deleted.
                            </p>
                        )}
                    </div>

                    {product.currentStock > 0 && (
                        <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg">
                            <p className="text-sm text-yellow-800">
                                <strong>Warning:</strong> This product has {product.currentStock} units in stock. 
                                Deleting this product will permanently remove all inventory records.
                            </p>
                        </div>
                    )}
                </div>

                <div className="flex justify-end gap-2">
                    <Button
                        variant="outline"
                        onClick={() => setOpen(false)}
                        disabled={loading}
                    >
                        Cancel
                    </Button>
                    <Button
                        variant="destructive"
                        onClick={handleDelete}
                        disabled={loading}
                    >
                        {loading ? "Deleting..." : "Delete Product"}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    )
}