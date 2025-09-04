'use client'

import { useEffect, useState } from "react"
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
import { deleteUser, getUserDeletionBlockers } from "@/lib/actions/users"
import { Checkbox } from "@/components/ui/checkbox"

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
    const [checkingLink, setCheckingLink] = useState(false)
    const [hasLinkedInspector, setHasLinkedInspector] = useState<boolean | null>(null)
    const [canDelete, setCanDelete] = useState<boolean | null>(null)
    const [blockerCounts, setBlockerCounts] = useState<{
        deliveryAssignments: number
        activityLogs: number
        productionHistoryLogs: number
        supportTickets: number
        supportMessages: number
    } | null>(null)
    const [confirmCascade, setConfirmCascade] = useState(false)

    // Check if this user has a linked inspector and any deletion blockers when dialog opens
    useEffect(() => {
        let mounted = true
        async function checkLink() {
            try {
                setCheckingLink(true)
                setHasLinkedInspector(null)
                setCanDelete(null)
                setBlockerCounts(null)
                setError(null)
                const result = await getUserDeletionBlockers(user.id)
                if (!mounted) return
                setHasLinkedInspector(!!result.hasLinkedInspector)
                setCanDelete(result.canDelete)
                setBlockerCounts(result.counts)
            } catch (err) {
                if (!mounted) return
                console.error('Error checking linked inspector:', err)
                // Non-blocking: just show a friendly message and require manual confirmation
                setError(err instanceof Error ? err.message : 'Could not verify linked records. You can still proceed if you are sure.')
                setHasLinkedInspector(false)
                setCanDelete(true)
            } finally {
                if (mounted) setCheckingLink(false)
            }
        }
        if (open) {
            setConfirmCascade(false)
            checkLink()
        }
        return () => {
            mounted = false
        }
    }, [open, user.id])

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
                    <AlertDialogTitle>
                        {hasLinkedInspector ? 'Delete user and linked inspector?' : 'Are you absolutely sure?'}
                    </AlertDialogTitle>
                    <AlertDialogDescription>
                        {checkingLink && (
                            <>Checking for linked records...</>
                        )}
                        {!checkingLink && (
                            <>
                                This action cannot be undone. This will permanently delete the user
                                account for {user.profile?.firstName} {user.profile?.lastName} ({user.email}).
                            </>
                        )}
                    </AlertDialogDescription>
                </AlertDialogHeader>
                {!checkingLink && hasLinkedInspector && (
                    <Alert>
                        <AlertDescription>
                            This user is linked to an inspector profile. Deleting this user will also delete the linked inspector profile.
                            Please proceed only if you&apos;re sure you no longer need either record.
                        </AlertDescription>
                    </Alert>
                )}
                {!checkingLink && canDelete === false && blockerCounts && (
                    <Alert variant="destructive">
                        <AlertDescription>
                            This user cannot be deleted because there are related records tied to their account:
                            <ul className="list-disc pl-5 mt-2">
                                {blockerCounts.deliveryAssignments > 0 && (
                                    <li>Delivery Assignments: {blockerCounts.deliveryAssignments}</li>
                                )}
                                {blockerCounts.activityLogs > 0 && (
                                    <li>Activity Logs: {blockerCounts.activityLogs}</li>
                                )}
                                {blockerCounts.productionHistoryLogs > 0 && (
                                    <li>Production History Logs: {blockerCounts.productionHistoryLogs}</li>
                                )}
                                {blockerCounts.supportTickets > 0 && (
                                    <li>Support Tickets: {blockerCounts.supportTickets}</li>
                                )}
                                {blockerCounts.supportMessages > 0 && (
                                    <li>Support Messages: {blockerCounts.supportMessages}</li>
                                )}
                            </ul>
                            Please reassign or remove these records first, or deactivate the user instead.
                        </AlertDescription>
                    </Alert>
                )}
                {error && (
                    <Alert variant="destructive">
                        <AlertDescription>{error}</AlertDescription>
                    </Alert>
                )}
                {!checkingLink && hasLinkedInspector && (
                    <div className="flex items-start gap-2 rounded-md border p-3">
                        <Checkbox
                            id="confirm-cascade"
                            checked={confirmCascade}
                            onCheckedChange={(v) => setConfirmCascade(Boolean(v))}
                        />
                        <label htmlFor="confirm-cascade" className="text-sm leading-5">
                            I understand that the linked inspector profile will be deleted together with this user.
                        </label>
                    </div>
                )}
                <AlertDialogFooter>
                    <AlertDialogCancel disabled={isLoading}>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                        onClick={handleDelete}
                        disabled={
                            isLoading ||
                            checkingLink ||
                            canDelete === false ||
                            (hasLinkedInspector ? !confirmCascade : false)
                        }
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                        {isLoading
                            ? "Deleting..."
                            : hasLinkedInspector
                                ? "Delete User and Inspector"
                                : "Delete User"}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    )
}