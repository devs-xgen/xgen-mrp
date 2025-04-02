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
import { Inspector } from "@prisma/client"

interface DeleteInspectorDialogProps {
    inspector: Inspector
    open: boolean
    onOpenChange: (open: boolean) => void
    onSuccess?: () => Promise<void>
}

export function DeleteInspectorDialog({
    inspector,
    open,
    onOpenChange,
    onSuccess
}: DeleteInspectorDialogProps) {
    const handleDelete = async () => {
        try {
            const response = await fetch(`/api/inspectors/${inspector.inspectorId}`, {
                method: "DELETE",
            })

            if (!response.ok) {
                throw new Error("Failed to delete inspector")
            }

            toast({
                title: "Success",
                description: "Inspector deleted successfully",
            })
            onOpenChange(false)
            await onSuccess?.()
        } catch (error) {
            toast({
                title: "Error",
                description: error instanceof Error ? error.message : "Failed to delete inspector",
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
                        This will permanently delete the inspector &quot;{inspector.firstName} {inspector.lastName}&quot;.
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