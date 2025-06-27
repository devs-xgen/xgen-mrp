"use client"

import type React from "react"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { X, Upload, AlertCircle, CheckCircle, Loader2 } from "lucide-react"
import { UpdateFormData } from "@/types/inspector/inspector"
import { Status } from "@prisma/client"


interface TaskUpdateFormProps {
  taskId: string | null
  onSubmit: (data: UpdateFormData) => Promise<void>
  onClose: () => void
}

export function TaskUpdateForm({ taskId, onSubmit, onClose }: TaskUpdateFormProps) {
  const [formData, setFormData] = useState<UpdateFormData>({
    taskId: taskId || "",
    checkType: "",
    status: Status.PENDING, // Use proper enum value as default
    defectsFound: "",
    actionTaken: "",
    notes: "",
    quantityChecked: 0,
    passedQuantity: 0,
    failedQuantity: 0,
    severity: "LOW",
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!formData.checkType) {
      newErrors.checkType = "Check type is required"
    }
    if (!formData.status) {
      newErrors.status = "Status is required"
    }
    if (formData.quantityChecked <= 0) {
      newErrors.quantityChecked = "Quantity checked must be greater than 0"
    }
    if (formData.passedQuantity + formData.failedQuantity !== formData.quantityChecked) {
      newErrors.quantities = "Passed + Failed quantities must equal total quantity checked"
    }
    if (formData.status === Status.CANCELLED && !formData.defectsFound.trim()) {
      newErrors.defectsFound = "Defects description is required when status is Failed"
    }

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
      console.error("Error submitting form:", error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleInputChange = (field: keyof UpdateFormData, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }))

    // Clear error when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }))
    }
  }

  const handleQuantityChange = (field: "quantityChecked" | "passedQuantity" | "failedQuantity", value: string) => {
    const numValue = Number.parseInt(value) || 0
    const newFormData = { ...formData, [field]: numValue }

    // Auto-calculate failed quantity if passed quantity is entered
    if (field === "passedQuantity" && formData.quantityChecked > 0) {
      newFormData.failedQuantity = Math.max(0, formData.quantityChecked - numValue)
    }
    // Auto-calculate passed quantity if failed quantity is entered
    else if (field === "failedQuantity" && formData.quantityChecked > 0) {
      newFormData.passedQuantity = Math.max(0, formData.quantityChecked - numValue)
    }

    setFormData(newFormData)

    // Clear quantity errors
    if (errors.quantities) {
      setErrors((prev) => ({ ...prev, quantities: "" }))
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Add Quality Check</CardTitle>
            <CardDescription>{taskId ? `Task ID: ${taskId}` : "New Quality Check"}</CardDescription>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} disabled={isSubmitting}>
            <X className="w-4 h-4" />
          </Button>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Check Type and Status */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="checkType">Check Type *</Label>
                <Select value={formData.checkType} onValueChange={(value) => handleInputChange("checkType", value)}>
                  <SelectTrigger className={errors.checkType ? "border-red-500" : ""}>
                    <SelectValue placeholder="Select check type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="VISUAL_INSPECTION">Visual Inspection</SelectItem>
                    <SelectItem value="DIMENSIONAL_CHECK">Dimensional Check</SelectItem>
                    <SelectItem value="FUNCTIONAL_TEST">Functional Test</SelectItem>
                    <SelectItem value="MATERIAL_QUALITY">Material Quality</SelectItem>
                    <SelectItem value="FINAL_INSPECTION">Final Inspection</SelectItem>
                    <SelectItem value="IN_PROCESS_CHECK">In-Process Check</SelectItem>
                  </SelectContent>
                </Select>
                {errors.checkType && <p className="text-sm text-red-600">{errors.checkType}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="status">Status *</Label>
                <Select value={formData.status} onValueChange={(value: Status) => handleInputChange("status", value)}>
                  <SelectTrigger className={errors.status ? "border-red-500" : ""}>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={Status.COMPLETED}>
                      <div className="flex items-center">
                        <CheckCircle className="w-4 h-4 text-green-600 mr-2" />
                        Passed
                      </div>
                    </SelectItem>
                    <SelectItem value={Status.CANCELLED}>
                      <div className="flex items-center">
                        <AlertCircle className="w-4 h-4 text-red-600 mr-2" />
                        Failed
                      </div>
                    </SelectItem>
                    <SelectItem value={Status.PENDING}>
                      <div className="flex items-center">
                        <AlertCircle className="w-4 h-4 text-yellow-600 mr-2" />
                        Conditional Pass
                      </div>
                    </SelectItem>
                    <SelectItem value={Status.IN_PROGRESS}>Rework Required</SelectItem>
                  </SelectContent>
                </Select>
                {errors.status && <p className="text-sm text-red-600">{errors.status}</p>}
              </div>
            </div>

            {/* Quantity Information */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="quantityChecked">Quantity Checked *</Label>
                <Input
                  id="quantityChecked"
                  type="number"
                  min="1"
                  value={formData.quantityChecked || ""}
                  onChange={(e) => handleQuantityChange("quantityChecked", e.target.value)}
                  placeholder="Enter quantity"
                  className={errors.quantityChecked ? "border-red-500" : ""}
                />
                {errors.quantityChecked && <p className="text-sm text-red-600">{errors.quantityChecked}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="passedQuantity">Passed Quantity</Label>
                <Input
                  id="passedQuantity"
                  type="number"
                  min="0"
                  max={formData.quantityChecked}
                  value={formData.passedQuantity || ""}
                  onChange={(e) => handleQuantityChange("passedQuantity", e.target.value)}
                  placeholder="Enter passed qty"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="failedQuantity">Failed Quantity</Label>
                <Input
                  id="failedQuantity"
                  type="number"
                  min="0"
                  max={formData.quantityChecked}
                  value={formData.failedQuantity || ""}
                  onChange={(e) => handleQuantityChange("failedQuantity", e.target.value)}
                  placeholder="Enter failed qty"
                />
              </div>
            </div>

            {errors.quantities && <p className="text-sm text-red-600">{errors.quantities}</p>}

            {/* Defects and Actions */}
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="defectsFound">Defects Found {formData.status === "FAILED" && "*"}</Label>
                <Textarea
                  id="defectsFound"
                  value={formData.defectsFound}
                  onChange={(e) => handleInputChange("defectsFound", e.target.value)}
                  placeholder="Describe any defects found (leave blank if none)"
                  rows={3}
                  className={errors.defectsFound ? "border-red-500" : ""}
                />
                {errors.defectsFound && <p className="text-sm text-red-600">{errors.defectsFound}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="actionTaken">Action Taken</Label>
                <Textarea
                  id="actionTaken"
                  value={formData.actionTaken}
                  onChange={(e) => handleInputChange("actionTaken", e.target.value)}
                  placeholder="Describe actions taken or recommendations"
                  rows={3}
                />
              </div>
            </div>

            {/* Severity and Notes */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="severity">Issue Severity</Label>
                <Select value={formData.severity} onValueChange={(value: any) => handleInputChange("severity", value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="LOW">
                      <Badge className="bg-green-100 text-green-800">Low</Badge>
                    </SelectItem>
                    <SelectItem value="MEDIUM">
                      <Badge className="bg-yellow-100 text-yellow-800">Medium</Badge>
                    </SelectItem>
                    <SelectItem value="HIGH">
                      <Badge className="bg-red-100 text-red-800">High</Badge>
                    </SelectItem>
                    <SelectItem value="CRITICAL">
                      <Badge className="bg-red-600 text-white">Critical</Badge>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Additional Notes</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => handleInputChange("notes", e.target.value)}
                placeholder="Any additional comments or observations"
                rows={2}
              />
            </div>

            {/* File Upload Section */}
            <div className="space-y-2">
              <Label>Attachments (Optional)</Label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-gray-400 transition-colors">
                <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                <p className="text-sm text-gray-600">Click to upload photos or documents</p>
                <p className="text-xs text-gray-500 mt-1">PNG, JPG, PDF up to 10MB</p>
              </div>
            </div>

            {/* Form Actions */}
            <div className="flex gap-3 pt-4">
              <Button type="submit" disabled={isSubmitting} className="flex-1 bg-blue-600 hover:bg-blue-700">
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  "Submit Quality Check"
                )}
              </Button>
              <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
