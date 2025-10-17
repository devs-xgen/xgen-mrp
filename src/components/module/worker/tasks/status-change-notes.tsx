"use client"

import type React from "react"
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
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2 } from "lucide-react"
import type { Status } from "@prisma/client" // Assuming Status enum is available from Prisma client

interface StatusChangeNotesDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  status: Status | null // The status that will be applied
  onConfirm: (notes: string) => void
  loading: boolean
}

export const StatusChangeNotesDialog: React.FC<StatusChangeNotesDialogProps> = ({
  open,
  onOpenChange,
  status,
  onConfirm,
  loading,
}) => {
  const [notes, setNotes] = useState("")

  const handleConfirm = () => {
    onConfirm(notes)
    // Notes state will be reset by parent when dialog closes
  }

  const handleCancel = () => {
    setNotes("") // Clear notes on cancel
    onOpenChange(false)
  }

  const getTitle = (s: Status | null) => {
    if (!s) return "Confirm Action"
    const formattedStatus = s.toLowerCase().replace(/_/g, " ")
    return `Confirm Status Change to "${formattedStatus}"`
  }

  const getDescription = (s: Status | null) => {
    if (!s) return "Please provide any relevant notes for this action."
    const formattedStatus = s.toLowerCase().replace(/_/g, " ")
    return `You are about to change the production order status to "${formattedStatus}". Please add any relevant notes for this action.`
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{getTitle(status)}</AlertDialogTitle>
          <AlertDialogDescription>
            {getDescription(status)}
            <div className="mt-4 space-y-2">
              <Label htmlFor="action-notes">Notes (Optional)</Label>
              <Input
                id="action-notes"
                placeholder="e.g., 'Materials verified', 'Production paused due to machine maintenance'"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                disabled={loading}
              />
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={handleCancel} disabled={loading}>
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction onClick={handleConfirm} disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Confirming...
              </>
            ) : (
              "Confirm"
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
