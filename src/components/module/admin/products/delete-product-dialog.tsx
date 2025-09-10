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
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"

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
    const [reason, setReason] = useState("")

    const handleDelete = async () => {
        try {
            setLoading(true)
            
            const result = await deleteProduct(product.id, reason || undefined)
            
            if (result.success) {
                toast({
                    title: "Success",
                    description: `Product "${product.name}" archived successfully`,
                })
                setOpen(false)
                setReason("")
                await onSuccess?.()
            } else {
                throw new Error(result.error || "Failed to archive product")
            }
        } catch (error) {
            console.error("Delete product error:", error)
            toast({
                title: "Error",
                description: error instanceof Error ? error.message : "Failed to archive product",
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
                    <DialogTitle>Archive Product</DialogTitle>
                    <DialogDescription>
                        Archiving will hide this product from listings and prevent it from being used in new orders or production. Existing records that reference it will be preserved.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4">
                    <div className="bg-muted p-4 rounded-lg">
                        <h4 className="font-medium">{product.name}</h4>
                        <p className="text-sm text-muted-foreground">SKU: {product.sku}</p>
                        <p className="text-sm text-muted-foreground">Category: {product.category?.name}</p>
                        {variantCount > 0 && (
                            <p className="text-sm text-muted-foreground">
                                This product has {variantCount} variant{variantCount > 1 ? 's' : ''} that will also be archived.
                            </p>
                        )}
                    </div>

                    {product.currentStock > 0 && (
                        <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg">
                            <p className="text-sm text-yellow-800">
                                <strong>Note:</strong> This product has {product.currentStock} units in stock.
                                Archiving will not remove stock records, but the product will be inactive for future transactions.
                            </p>
                        </div>
                    )}

                    <div className="space-y-2">
                        <Label htmlFor="archive-reason">Archive Reason (optional)</Label>
                        <Textarea
                            id="archive-reason"
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                            placeholder="Add a brief reason for archiving..."
                            rows={3}
                        />
                    </div>
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
                        {loading ? "Archiving..." : "Archive Product"}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    )
}