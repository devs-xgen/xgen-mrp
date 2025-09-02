'use client'

import { useState } from "react"
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
import { Alert, AlertDescription } from "@/components/ui/alert"
import type { UserData } from "@/types/admin/user"
import { deleteUser } from "@/lib/actions/users"

interface DeleteUserDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    user: UserData
    onSuccess?: () => void
}

export function DeleteUserDialog({
    open,
    onOpenChange,
    user,
    onSuccess
}: DeleteUserDialogProps) {
    const [error, setError] = useState<string | null>(null)
    const [isLoading, setIsLoading] = useState(false)

    const handleDelete = async () => {
        try {
            setIsLoading(true)
            setError(null)

            await deleteUser(user.id)

            onOpenChange(false)
            onSuccess?.()
        } catch (error) {
            console.error('Error deleting user:', error)
            setError(error instanceof Error ? error.message : 'An error occurred')
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <AlertDialog open={open} onOpenChange={onOpenChange}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                        This action cannot be undone. This will permanently delete the user
                        account for {user.profile?.firstName} {user.profile?.lastName} ({user.email}).
                    </AlertDialogDescription>
                </AlertDialogHeader>
                {error && (
                    <Alert variant="destructive">
                        <AlertDescription>{error}</AlertDescription>
                    </Alert>
                )}
                <AlertDialogFooter>
                    <AlertDialogCancel disabled={isLoading}>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                        onClick={handleDelete}
                        disabled={isLoading}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                        {isLoading ? "Deleting..." : "Delete User"}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    )
}