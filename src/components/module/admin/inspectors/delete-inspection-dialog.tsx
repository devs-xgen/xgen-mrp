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
import { deleteInspector } from "@/lib/actions/inspector"
import { Inspector } from "@/lib/actions/inspector"

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
            await deleteInspector(inspector.inspectorId)

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