"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Loader2 } from "lucide-react"
import { Input } from "@/components/ui/input"

interface InspectorStatusChangeNotesDialogProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: (notes?: string, actionTaken?: string) => void
  isPending: boolean
  title: string
  description: string
  showActionTaken?: boolean // New prop to conditionally show Action Taken field
}

export function InspectorStatusChangeNotesDialog({
  isOpen,
  onClose,
  onConfirm,
  isPending,
  title,
  description,
  showActionTaken = false, // Default to false
}: InspectorStatusChangeNotesDialogProps) {
  const [notes, setNotes] = useState("")
  const [actionTaken, setActionTaken] = useState("")

  const handleConfirm = () => {
    onConfirm(notes, showActionTaken ? actionTaken : undefined)
    setNotes("")
    setActionTaken("")
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="notes">Notes (Optional)</Label>
            <Textarea
              id="notes"
              placeholder="Add any relevant notes here..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="min-h-[80px]"
            />
          </div>
          {showActionTaken && (
            <div className="grid gap-2">
              <Label htmlFor="actionTaken">Action Taken (Optional)</Label>
              <Input
                id="actionTaken"
                placeholder="e.g., Repaired, Replaced, Approved"
                value={actionTaken}
                onChange={(e) => setActionTaken(e.target.value)}
              />
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isPending}>
            Cancel
          </Button>
          <Button onClick={handleConfirm} disabled={isPending}>
            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Confirm
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
