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
import { Loader2, PlusCircle, XCircle } from "lucide-react"
import { getAvailableWorkCenters } from "@/lib/actions/inspector/production-order" // Assuming this action exists
import { getAvailableMaterials } from "@/lib/actions/bom"


interface CreateMaterialRequestDialogProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: (
    workCenterId: string,
    items: Array<{ materialId: string; quantity: number }>,
    notes?: string,
  ) => Promise<void>
}

interface MaterialItem {
  materialId: string
  quantity: number
}

export function CreateMaterialRequestDialog({ isOpen, onClose, onConfirm }: CreateMaterialRequestDialogProps) {
  const [workCenterId, setWorkCenterId] = useState("")
  const [items, setItems] = useState<MaterialItem[]>([{ materialId: "", quantity: 0 }])
  const [notes, setNotes] = useState("")
  const [isCreating, setIsCreating] = useState(false)
  const [workCenters, setWorkCenters] = useState<any[]>([]) // Replace 'any' with actual type
  const [materials, setMaterials] = useState<any[]>([]) // Replace 'any' with actual type
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (isOpen) {
      const fetchData = async () => {
        try {
          const fetchedWorkCenters = await getAvailableWorkCenters()
          setWorkCenters(fetchedWorkCenters)
          const fetchedMaterials = await getAvailableMaterials() // Assuming this action exists
          setMaterials(fetchedMaterials)
        } catch (err) {
          setError("Failed to load necessary data.")
          console.error(err)
        }
      }
      fetchData()
    } else {
      // Reset form on close
      setWorkCenterId("")
      setItems([{ materialId: "", quantity: 0 }])
      setNotes("")
      setError(null)
    }
  }, [isOpen])

  const handleAddItem = () => {
    setItems([...items, { materialId: "", quantity: 0 }])
  }

  const handleRemoveItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index))
  }

  const handleItemChange = (index: number, field: keyof MaterialItem, value: string | number) => {
    const newItems = [...items]
    if (field === "quantity") {
      newItems[index][field] = Number(value)
    } else {
      newItems[index][field] = value as string
    }
    setItems(newItems)
  }

  const handleConfirm = async () => {
    setError(null)
    if (!workCenterId) {
      setError("Please select a work center.")
      return
    }
    if (items.some((item) => !item.materialId || item.quantity <= 0)) {
      setError("Please ensure all material items have a selected material and a quantity greater than 0.")
      return
    }

    setIsCreating(true)
    try {
      await onConfirm(workCenterId, items, notes)
      onClose()
    } catch (err: any) {
      setError(err.message || "Failed to create material request.")
    } finally {
      setIsCreating(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create Material Request</DialogTitle>
          <DialogDescription>Request materials needed for this production order.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          {error && <p className="text-red-500 text-sm">{error}</p>}
          <div className="grid gap-2">
            <Label htmlFor="workCenter">Work Center</Label>
            <Select value={workCenterId} onValueChange={setWorkCenterId} disabled={isCreating}>
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
            <Label>Materials</Label>
            {items.map((item, index) => (
              <div key={index} className="flex items-center gap-2">
                <Select
                  value={item.materialId}
                  onValueChange={(value) => handleItemChange(index, "materialId", value)}
                  disabled={isCreating}
                >
                  <SelectTrigger className="flex-1">
                    <SelectValue placeholder="Select material" />
                  </SelectTrigger>
                  <SelectContent>
                    {materials.map((mat) => (
                      <SelectItem key={mat.id} value={mat.id}>
                        {mat.name} ({mat.sku})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Input
                  type="number"
                  placeholder="Quantity"
                  value={item.quantity > 0 ? item.quantity : ""}
                  onChange={(e) => handleItemChange(index, "quantity", e.target.value)}
                  disabled={isCreating}
                  className="w-24"
                />
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleRemoveItem(index)}
                  disabled={isCreating || items.length === 1}
                >
                  <XCircle className="h-4 w-4 text-red-500" />
                  <span className="sr-only">Remove item</span>
                </Button>
              </div>
            ))}
            <Button variant="outline" onClick={handleAddItem} disabled={isCreating}>
              <PlusCircle className="h-4 w-4 mr-2" /> Add Material Item
            </Button>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="notes">Notes (Optional)</Label>
            <Textarea
              id="notes"
              placeholder="Add any specific notes for this request..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              disabled={isCreating}
              className="min-h-[80px]"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isCreating}>
            Cancel
          </Button>
          <Button onClick={handleConfirm} disabled={isCreating}>
            {isCreating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Create Request
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
