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
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Loader2 } from "lucide-react"
import { getAvailableCustomerOrders } from "@/lib/actions/inspector/production-order" // Assuming this action exists
import { format } from "date-fns"

interface LinkCustomerOrderDialogProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: (customerOrderId: string, notes?: string) => Promise<void>
}

export function LinkCustomerOrderDialog({ isOpen, onClose, onConfirm }: LinkCustomerOrderDialogProps) {
  const [customerOrderId, setCustomerOrderId] = useState("")
  const [notes, setNotes] = useState("")
  const [isLinking, setIsLinking] = useState(false)
  const [customerOrders, setCustomerOrders] = useState<any[]>([]) // Replace 'any' with actual type
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (isOpen) {
      const fetchData = async () => {
        try {
          const fetchedOrders = await getAvailableCustomerOrders()
          setCustomerOrders(fetchedOrders)
        } catch (err) {
          setError("Failed to load customer orders.")
          console.error(err)
        }
      }
      fetchData()
    } else {
      // Reset form on close
      setCustomerOrderId("")
      setNotes("")
      setError(null)
    }
  }, [isOpen])

  const handleConfirm = async () => {
    setError(null)
    if (!customerOrderId) {
      setError("Please select a customer order.")
      return
    }

    setIsLinking(true)
    try {
      await onConfirm(customerOrderId, notes)
      onClose()
    } catch (err: any) {
      setError(err.message || "Failed to link customer order.")
    } finally {
      setIsLinking(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Link Customer Order</DialogTitle>
          <DialogDescription>Select a customer order to link to this production order.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          {error && <p className="text-red-500 text-sm">{error}</p>}
          <div className="grid gap-2">
            <Label htmlFor="customerOrder">Customer Order</Label>
            <Select value={customerOrderId} onValueChange={setCustomerOrderId} disabled={isLinking}>
              <SelectTrigger id="customerOrder">
                <SelectValue placeholder="Select a customer order" />
              </SelectTrigger>
              <SelectContent>
                {customerOrders.map((order) => (
                  <SelectItem key={order.id} value={order.id}>
                    {order.orderNumber} - {order.customer?.name || "N/A"} (Due:{" "}
                    {format(new Date(order.requiredDate), "MMM dd, yyyy")})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="notes">Notes (Optional)</Label>
            <Textarea
              id="notes"
              placeholder="Add notes for linking this order..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              disabled={isLinking}
              className="min-h-[80px]"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isLinking}>
            Cancel
          </Button>
          <Button onClick={handleConfirm} disabled={isLinking}>
            {isLinking && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Link Order
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
