"use client"

import type React from "react"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { format } from "date-fns"
import { CalendarIcon, Plus, Trash2, Package, AlertCircle } from "lucide-react"
import { cn } from "@/lib/utils"

interface MaterialRequestItem {
  id?: string
  inventoryItemId: string
  inventoryItemName?: string
  quantityRequested: number
  unit: string
  notes?: string
}

interface MaterialRequestFormData {
  workCenterId: string
  priority: "LOW" | "MEDIUM" | "HIGH" | "URGENT"
  requiredDate: Date
  notes?: string
  productionOrderId?: string
  items: MaterialRequestItem[]
}

interface WorkCenter {
  id: string
  name: string
}

interface InventoryItem {
  id: string
  name: string
  sku: string
  unit: string
  availableQuantity: number
}

interface MaterialRequestFormProps {
  workCenters: WorkCenter[]
  inventoryItems: InventoryItem[]
  onSubmit: (data: MaterialRequestFormData) => Promise<void>
  onCancel: () => void
  defaultWorkCenterId?: string
  defaultProductionOrderId?: string
}

export function MaterialRequestForm({
  workCenters,
  inventoryItems,
  onSubmit,
  onCancel,
  defaultWorkCenterId,
  defaultProductionOrderId,
}: MaterialRequestFormProps) {
  const [formData, setFormData] = useState<MaterialRequestFormData>({
    workCenterId: defaultWorkCenterId || "",
    priority: "MEDIUM",
    requiredDate: new Date(),
    notes: "",
    productionOrderId: defaultProductionOrderId || "",
    items: [
      {
        inventoryItemId: "",
        quantityRequested: 1,
        unit: "",
        notes: "",
      },
    ],
  })

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const addItem = () => {
    setFormData((prev) => ({
      ...prev,
      items: [
        ...prev.items,
        {
          inventoryItemId: "",
          quantityRequested: 1,
          unit: "",
          notes: "",
        },
      ],
    }))
  }

  const removeItem = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index),
    }))
  }

  const updateItem = (index: number, field: keyof MaterialRequestItem, value: any) => {
    setFormData((prev) => ({
      ...prev,
      items: prev.items.map((item, i) => {
        if (i === index) {
          const updatedItem = { ...item, [field]: value }

          // Auto-fill unit when inventory item is selected
          if (field === "inventoryItemId") {
            const selectedInventoryItem = inventoryItems.find((inv) => inv.id === value)
            if (selectedInventoryItem) {
              updatedItem.unit = selectedInventoryItem.unit
              updatedItem.inventoryItemName = selectedInventoryItem.name
            }
          }

          return updatedItem
        }
        return item
      }),
    }))
  }

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.workCenterId) {
      newErrors.workCenterId = "Work center is required"
    }

    if (!formData.requiredDate) {
      newErrors.requiredDate = "Required date is required"
    }

    if (formData.items.length === 0) {
      newErrors.items = "At least one item is required"
    }

    formData.items.forEach((item, index) => {
      if (!item.inventoryItemId) {
        newErrors[`item-${index}-inventoryItemId`] = "Material is required"
      }
      if (!item.quantityRequested || item.quantityRequested <= 0) {
        newErrors[`item-${index}-quantityRequested`] = "Quantity must be greater than 0"
      }
    })

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    setIsSubmitting(true)
    try {
      await onSubmit(formData)
    } catch (error) {
      console.error("Error submitting material request:", error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "URGENT":
        return "bg-red-100 text-red-800"
      case "HIGH":
        return "bg-orange-100 text-orange-800"
      case "MEDIUM":
        return "bg-yellow-100 text-yellow-800"
      case "LOW":
        return "bg-green-100 text-green-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Create Material Request
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="workCenter">Work Center *</Label>
                <Select
                  value={formData.workCenterId}
                  onValueChange={(value) => setFormData((prev) => ({ ...prev, workCenterId: value }))}
                >
                  <SelectTrigger className={errors.workCenterId ? "border-red-500" : ""}>
                    <SelectValue placeholder="Select work center" />
                  </SelectTrigger>
                  <SelectContent>
                    {workCenters.map((wc) => (
                      <SelectItem key={wc.id} value={wc.id}>
                        {wc.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.workCenterId && <p className="text-sm text-red-500">{errors.workCenterId}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="priority">Priority</Label>
                <Select
                  value={formData.priority}
                  onValueChange={(value: "LOW" | "MEDIUM" | "HIGH" | "URGENT") =>
                    setFormData((prev) => ({ ...prev, priority: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="LOW">
                      <div className="flex items-center gap-2">
                        <Badge className={getPriorityColor("LOW")}>LOW</Badge>
                      </div>
                    </SelectItem>
                    <SelectItem value="MEDIUM">
                      <div className="flex items-center gap-2">
                        <Badge className={getPriorityColor("MEDIUM")}>MEDIUM</Badge>
                      </div>
                    </SelectItem>
                    <SelectItem value="HIGH">
                      <div className="flex items-center gap-2">
                        <Badge className={getPriorityColor("HIGH")}>HIGH</Badge>
                      </div>
                    </SelectItem>
                    <SelectItem value="URGENT">
                      <div className="flex items-center gap-2">
                        <Badge className={getPriorityColor("URGENT")}>URGENT</Badge>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="requiredDate">Required Date *</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !formData.requiredDate && "text-muted-foreground",
                        errors.requiredDate && "border-red-500",
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {formData.requiredDate ? format(formData.requiredDate, "PPP") : <span>Pick a date</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={formData.requiredDate}
                      onSelect={(date) => date && setFormData((prev) => ({ ...prev, requiredDate: date }))}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                {errors.requiredDate && <p className="text-sm text-red-500">{errors.requiredDate}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="productionOrderId">Production Order ID (Optional)</Label>
                <Input
                  id="productionOrderId"
                  value={formData.productionOrderId}
                  onChange={(e) => setFormData((prev) => ({ ...prev, productionOrderId: e.target.value }))}
                  placeholder="Enter production order ID"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notes (Optional)</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData((prev) => ({ ...prev, notes: e.target.value }))}
                placeholder="Additional notes or requirements..."
                rows={3}
              />
            </div>

            {/* Material Items */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label className="text-base font-semibold">Material Items *</Label>
                <Button type="button" onClick={addItem} variant="outline" size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Item
                </Button>
              </div>

              {errors.items && (
                <div className="flex items-center gap-2 text-red-500 text-sm">
                  <AlertCircle className="h-4 w-4" />
                  {errors.items}
                </div>
              )}

              <div className="space-y-4">
                {formData.items.map((item, index) => (
                  <Card key={index} className="p-4">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor={`material-${index}`}>Material *</Label>
                        <Select
                          value={item.inventoryItemId}
                          onValueChange={(value) => updateItem(index, "inventoryItemId", value)}
                        >
                          <SelectTrigger className={errors[`item-${index}-inventoryItemId`] ? "border-red-500" : ""}>
                            <SelectValue placeholder="Select material" />
                          </SelectTrigger>
                          <SelectContent>
                            {inventoryItems.map((invItem) => (
                              <SelectItem key={invItem.id} value={invItem.id}>
                                <div className="flex flex-col">
                                  <span>{invItem.name}</span>
                                  <span className="text-xs text-muted-foreground">
                                    SKU: {invItem.sku} | Available: {invItem.availableQuantity} {invItem.unit}
                                  </span>
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {errors[`item-${index}-inventoryItemId`] && (
                          <p className="text-sm text-red-500">{errors[`item-${index}-inventoryItemId`]}</p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor={`quantity-${index}`}>Quantity *</Label>
                        <Input
                          id={`quantity-${index}`}
                          type="number"
                          min="1"
                          value={item.quantityRequested}
                          onChange={(e) => updateItem(index, "quantityRequested", Number.parseInt(e.target.value) || 0)}
                          className={errors[`item-${index}-quantityRequested`] ? "border-red-500" : ""}
                        />
                        {errors[`item-${index}-quantityRequested`] && (
                          <p className="text-sm text-red-500">{errors[`item-${index}-quantityRequested`]}</p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor={`unit-${index}`}>Unit</Label>
                        <Input
                          id={`unit-${index}`}
                          value={item.unit}
                          onChange={(e) => updateItem(index, "unit", e.target.value)}
                          placeholder="Unit"
                          readOnly
                          className="bg-gray-50"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor={`item-notes-${index}`}>Notes</Label>
                        <div className="flex gap-2">
                          <Input
                            id={`item-notes-${index}`}
                            value={item.notes}
                            onChange={(e) => updateItem(index, "notes", e.target.value)}
                            placeholder="Item notes..."
                          />
                          {formData.items.length > 1 && (
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => removeItem(index)}
                              className="text-red-500 hover:text-red-700"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end gap-4 pt-4 border-t">
              <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Creating Request..." : "Create Request"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
