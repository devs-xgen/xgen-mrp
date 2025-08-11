"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
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
    open?: boolean
    trigger: React.ReactNode
    onSuccess?: () => void | Promise<void>
}

export function DeleteSupplierDialog({
    supplier,
    trigger,
    onSuccess
}: DeleteSupplierDialogProps) {
    const [open, setOpen] = useState(false)
    const [loading, setLoading] = useState(false)
    const router = useRouter()

    const onDelete = async () => {
        if (loading) return
        setLoading(true)
        try {
            const response = await fetch(`/api/suppliers/${supplier.id}`, {
                method: "DELETE",
            })

            if (!response.ok) {
                // Treat 404 as idempotent success (already deleted)
                if (response.status === 404) {
                    // proceed as success
                } else {
                    let message = "Failed to delete supplier"
                    try {
                        const err = await response.json()
                        if (err?.error) message = err.error
                    } catch {}
                    throw new Error(message)
                }
            }

            // Success path (including idempotent 404): perform UI updates in a safe block
            toast({
                title: "Success",
                description: "Supplier deleted successfully",
            })
            setOpen(false)
            try {
                router.refresh()
                await onSuccess?.()
            } catch (uiErr) {
                console.error("Post-delete UI update error:", uiErr)
            }
        } catch (error: any) {
            // Network failure or ambiguous state: verify if resource is actually gone (with one retry)
            const verifyGone = async () => {
                try {
                    const verify1 = await fetch(`/api/suppliers/${supplier.id}`)
                    if (verify1.status === 404) return true
                    // small delay then retry to account for eventual consistency
                    await new Promise((res) => setTimeout(res, 250))
                    const verify2 = await fetch(`/api/suppliers/${supplier.id}`)
                    return verify2.status === 404
                } catch {
                    return false
                }
            }
            if (await verifyGone()) {
                toast({ title: "Success", description: "Supplier deleted successfully" })
                setOpen(false)
                try {
                    router.refresh()
                    await onSuccess?.()
                } catch (uiErr) {
                    console.error("Post-delete UI update error:", uiErr)
                }
                return
            }

            toast({
                title: "Error",
                description: error?.message || "Failed to delete supplier",
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
