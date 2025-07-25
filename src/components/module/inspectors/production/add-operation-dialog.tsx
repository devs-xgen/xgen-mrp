"use client"

import { useState, useEffect } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Loader2 } from "lucide-react"
import { getAvailableWorkCenters } from "@/lib/actions/inspector/production-order" // Assuming this action exists

interface AddOperationDialogProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: (data: {
    workCenterId: string
    startTime: Date
    endTime: Date
    cost: number
    notes?: string
  }) => Promise<void>
}

export function AddOperationDialog({ isOpen, onClose, onConfirm }: AddOperationDialogProps) {
  const [workCenterId, setWorkCenterId] = useState("")
  const [startTime, setStartTime] = useState("")
  const [endTime, setEndTime] = useState("")
  const [cost, setCost] = useState<number>(0)
  const [notes, setNotes] = useState("")
  const [isAdding, setIsAdding] = useState(false)
  const [workCenters, setWorkCenters] = useState<any[]>([]) // Replace 'any' with actual type
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (isOpen) {
      const fetchData = async () => {
        try {
          const fetchedWorkCenters = await getAvailableWorkCenters()
          setWorkCenters(fetchedWorkCenters)
        } catch (err) {
          setError("Failed to load work centers.")
          console.error(err)
        }
      }
      fetchData()
    } else {
      // Reset form on close
      setWorkCenterId("")
      setStartTime("")
      setEndTime("")
      setCost(0)
      setNotes("")
      setError(null)
    }
  }, [isOpen])

  const handleConfirm = async () => {
    setError(null)
    if (!workCenterId || !startTime || !endTime || cost <= 0) {
      setError("Please fill in all required fields (Work Center, Start Time, End Time, Cost).")
      return
    }

    const start = new Date(startTime)
    const end = new Date(endTime)

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      setError("Invalid date/time format.")
      return
    }
    if (start >= end) {
      setError("Start time must be before end time.")
      return
    }

    setIsAdding(true)
    try {
      await onConfirm({
        workCenterId,
        startTime: start,
        endTime: end,
        cost,
        notes,
      })
      onClose()
    } catch (err: any) {
      setError(err.message || "Failed to add operation.")
    } finally {
      setIsAdding(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add New Operation</DialogTitle>
          <DialogDescription>Define a new production operation for this order.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          {error && <p className="text-red-500 text-sm">{error}</p>}
          <div className="grid gap-2">
            <Label htmlFor="workCenter">Work Center</Label>
            <Select value={workCenterId} onValueChange={setWorkCenterId} disabled={isAdding}>
              <SelectTrigger id="workCenter">
                <SelectValue placeholder="Select a work center" />
              </SelectTrigger>
              <SelectContent>
                {workCenters.map((wc) => (
                  <SelectItem key={wc.id} value={wc.id}>
                    {wc.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="startTime">Start Time</Label>
            <Input
              id="startTime"
              type="datetime-local"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              disabled={isAdding}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="endTime">End Time</Label>
            <Input
              id="endTime"
              type="datetime-local"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              disabled={isAdding}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="cost">Cost</Label>
            <Input
              id="cost"
              type="number"
              step="0.01"
              value={cost}
              onChange={(e) => setCost(Number(e.target.value))}
              disabled={isAdding}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="notes">Notes (Optional)</Label>
            <Textarea
              id="notes"
              placeholder="Add notes for this operation..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              disabled={isAdding}
              className="min-h-[80px]"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isAdding}>
            Cancel
          </Button>
          <Button onClick={handleConfirm} disabled={isAdding}>
            {isAdding && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Add Operation
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
