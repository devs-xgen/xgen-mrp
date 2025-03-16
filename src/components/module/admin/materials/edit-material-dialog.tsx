"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Status } from "@prisma/client"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter
} from "@/components/ui/dialog"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription
} from "@/components/ui/form"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"
import { updateMaterial } from "@/lib/actions/materials"
import { Separator } from "@/components/ui/separator"
import { formatDate } from "@/lib/utils"

// Schema for form validation
const materialSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  sku: z.string().min(2, "SKU must be at least 2 characters"),
  typeId: z.string().min(1, "Material type is required"),
  unitOfMeasureId: z.string().min(1, "Unit of measure is required"),
  costPerUnit: z.coerce.number().min(0, "Cost per unit must be greater than or equal to 0"),
  currentStock: z.coerce.number().int("Current stock must be a whole number").min(0),
  expectedStock: z.coerce.number().int("Expected stock must be a whole number").min(0),
  committedStock: z.coerce.number().int("Committed stock must be a whole number").min(0),
  calculatedStock: z.coerce.number().int("Calculated stock must be a whole number").min(0),
  minimumStockLevel: z.coerce.number().int("Minimum stock level must be a whole number").min(0),
  leadTime: z.coerce.number().int("Lead time must be a whole number").min(0),
  supplierId: z.string().min(1, "Supplier is required"),
  notes: z.string().optional(),
  status: z.nativeEnum(Status)
})

type MaterialFormValues = z.infer<typeof materialSchema>

// Define an interface that matches the expected format for the form
interface Material {
  id: string
  name: string
  sku: string
  typeId: string
  unitOfMeasureId: string
  costPerUnit: number // We expect this as a number, not Decimal
  currentStock: number
  expectedStock: number
  committedStock: number
  calculatedStock: number
  minimumStockLevel: number
  leadTime: number
  supplierId: string
  status: Status
  createdAt?: Date
  updatedAt?: Date
  createdBy?: string | null
  modifiedBy?: string | null
  notes?: string | null
  // Relations
  supplier?: { id: string; name: string }
  type?: { id: string; name: string }
  unitOfMeasure?: { id: string; name: string; symbol: string }
  boms?: any[]
  purchaseOrderLines?: any[]
}

interface EditMaterialDialogProps {
  material?: Material
  materialTypes?: { id: string; name: string }[]
  unitOfMeasures?: { id: string; name: string; symbol: string }[]
  suppliers?: { id: string; name: string }[]
  trigger: React.ReactNode
  onSuccess?: () => void
}

export function EditMaterialDialog({
  material,
  materialTypes = [],
  unitOfMeasures = [],
  suppliers = [],
  trigger,
  onSuccess
}: EditMaterialDialogProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState("details")
  const { toast } = useToast()

  const form = useForm<MaterialFormValues>({
    resolver: zodResolver(materialSchema),
    defaultValues: material ? {
      name: material.name,
      sku: material.sku,
      typeId: material.typeId,
      unitOfMeasureId: material.unitOfMeasureId,
      costPerUnit: material.costPerUnit,
      currentStock: material.currentStock,
      expectedStock: material.expectedStock || 0,
      committedStock: material.committedStock || 0,
      calculatedStock: material.calculatedStock || 0,
      minimumStockLevel: material.minimumStockLevel,
      leadTime: material.leadTime,
      supplierId: material.supplierId,
      notes: material.notes || "",
      status: material.status
    } : {
      name: "",
      sku: "",
      typeId: "",
      unitOfMeasureId: "",
      costPerUnit: 0,
      currentStock: 0,
      expectedStock: 0,
      committedStock: 0,
      calculatedStock: 0,
      minimumStockLevel: 0,
      leadTime: 0,
      supplierId: "",
      notes: "",
      status: Status.ACTIVE
    },
  })

  async function onSubmit(data: MaterialFormValues) {
    try {
      setLoading(true)
      if (!material?.id) {
        throw new Error("Material ID is required for updating")
      }
      
      await updateMaterial({
        id: material.id,
        ...data
      })
      
      toast({
        title: "Success",
        description: "Material updated successfully",
      })
      setOpen(false)
      if (onSuccess) onSuccess()
    } catch (error) {
      console.error("Error updating material:", error)
      toast({
        title: "Error",
        description: "Failed to update material",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  // Calculate the effective stock level
  const effectiveStock = form.watch("currentStock") + form.watch("expectedStock") - form.watch("committedStock")

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger}
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Material</DialogTitle>
          <DialogDescription>
            Update the material details below.
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="details" value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid grid-cols-3">
            <TabsTrigger value="details">Basic Details</TabsTrigger>
            <TabsTrigger value="inventory">Inventory</TabsTrigger>
            <TabsTrigger value="metadata">Metadata</TabsTrigger>
          </TabsList>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 pt-4">
              <TabsContent value="details" className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  {/* Basic Information */}
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Name</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="sku"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>SKU</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Type and Unit */}
                  <FormField
                    control={form.control}
                    name="typeId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Material Type</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select material type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {materialTypes.map((type) => (
                              <SelectItem key={type.id} value={type.id}>
                                {type.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="unitOfMeasureId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Unit of Measure</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select unit" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {unitOfMeasures.map((unit) => (
                              <SelectItem key={unit.id} value={unit.id}>
                                {unit.name} ({unit.symbol})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Cost */}
                  <FormField
                    control={form.control}
                    name="costPerUnit"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Cost Per Unit</FormLabel>
                        <FormControl>
                          <Input type="number" step="0.01" min="0" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Lead Time */}
                  <FormField
                    control={form.control}
                    name="leadTime"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Lead Time (days)</FormLabel>
                        <FormControl>
                          <Input type="number" min="0" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Supplier */}
                  <FormField
                    control={form.control}
                    name="supplierId"
                    render={({ field }) => (
                      <FormItem className="col-span-2">
                        <FormLabel>Supplier</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select supplier" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {suppliers.map((supplier) => (
                              <SelectItem key={supplier.id} value={supplier.id}>
                                {supplier.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Status */}
                  <FormField
                    control={form.control}
                    name="status"
                    render={({ field }) => (
                      <FormItem className="col-span-2">
                        <FormLabel>Status</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select status" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {Object.values(Status).map((status) => (
                              <SelectItem key={status} value={status}>
                                {status}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Notes */}
                  <FormField
                    control={form.control}
                    name="notes"
                    render={({ field }) => (
                      <FormItem className="col-span-2">
                        <FormLabel>Notes</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Additional notes about the material..."
                            className="min-h-[120px]"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </TabsContent>
              
              <TabsContent value="inventory" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Stock Levels</CardTitle>
                    <CardDescription>
                      Manage current, expected, and committed stock levels
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="currentStock"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Current Stock</FormLabel>
                            <FormControl>
                              <Input type="number" min="0" {...field} />
                            </FormControl>
                            <FormDescription>
                              Actual physical stock on hand
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="expectedStock"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Expected Stock</FormLabel>
                            <FormControl>
                              <Input type="number" min="0" {...field} />
                            </FormControl>
                            <FormDescription>
                              Stock on order or in transit
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="committedStock"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Committed Stock</FormLabel>
                            <FormControl>
                              <Input type="number" min="0" {...field} />
                            </FormControl>
                            <FormDescription>
                              Stock allocated to production orders
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="calculatedStock"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Calculated Stock</FormLabel>
                            <FormControl>
                              <Input 
                                type="number" 
                                value={effectiveStock} 
                                disabled 
                                className="bg-muted"
                              />
                            </FormControl>
                            <FormDescription>
                              Effective available stock (calculated)
                            </FormDescription>
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="minimumStockLevel"
                        render={({ field }) => (
                          <FormItem className="col-span-2">
                            <FormLabel>Minimum Stock Level</FormLabel>
                            <FormControl>
                              <Input type="number" min="0" {...field} />
                            </FormControl>
                            <FormDescription>
                              Threshold for reordering
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </CardContent>
                </Card>

                {material?.purchaseOrderLines && material.purchaseOrderLines.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Purchase Orders</CardTitle>
                      <CardDescription>
                        Related purchase order lines for this material
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="rounded-md border">
                        <table className="min-w-full divide-y divide-border">
                          <thead>
                            <tr className="bg-muted/50">
                              <th className="px-4 py-2 text-left text-sm font-medium">PO #</th>
                              <th className="px-4 py-2 text-left text-sm font-medium">Date</th>
                              <th className="px-4 py-2 text-left text-sm font-medium">Quantity</th>
                              <th className="px-4 py-2 text-left text-sm font-medium">Status</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-border">
                            {material.purchaseOrderLines.map((line, index) => (
                              <tr key={index}>
                                <td className="px-4 py-2 text-sm">{line.purchaseOrder?.poNumber || "N/A"}</td>
                                <td className="px-4 py-2 text-sm">{formatDate(line.createdAt)}</td>
                                <td className="px-4 py-2 text-sm">{line.quantity}</td>
                                <td className="px-4 py-2 text-sm">{line.status}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {material?.boms && material.boms.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Bill of Materials</CardTitle>
                      <CardDescription>
                        Products that use this material
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="rounded-md border">
                        <table className="min-w-full divide-y divide-border">
                          <thead>
                            <tr className="bg-muted/50">
                              <th className="px-4 py-2 text-left text-sm font-medium">Product</th>
                              <th className="px-4 py-2 text-left text-sm font-medium">Quantity</th>
                              <th className="px-4 py-2 text-left text-sm font-medium">Status</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-border">
                            {material.boms.map((bom, index) => (
                              <tr key={index}>
                                <td className="px-4 py-2 text-sm">{bom.product?.name || "N/A"}</td>
                                <td className="px-4 py-2 text-sm">{bom.quantity}</td>
                                <td className="px-4 py-2 text-sm">{bom.status}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>
              
              <TabsContent value="metadata" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Audit Information</CardTitle>
                    <CardDescription>
                      Creation and modification history
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex justify-between py-1">
                        <span className="text-sm font-medium">Created At</span>
                        <span className="text-sm text-muted-foreground">
                          {material?.createdAt ? formatDate(material.createdAt) : "N/A"}
                        </span>
                      </div>
                      <Separator />
                      <div className="flex justify-between py-1">
                        <span className="text-sm font-medium">Last Updated</span>
                        <span className="text-sm text-muted-foreground">
                          {material?.updatedAt ? formatDate(material.updatedAt) : "N/A"}
                        </span>
                      </div>
                      <Separator />
                      <div className="flex justify-between py-1">
                        <span className="text-sm font-medium">Created By</span>
                        <span className="text-sm text-muted-foreground">
                          {material?.createdBy || "N/A"}
                        </span>
                      </div>
                      <Separator />
                      <div className="flex justify-between py-1">
                        <span className="text-sm font-medium">Last Modified By</span>
                        <span className="text-sm text-muted-foreground">
                          {material?.modifiedBy || "N/A"}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader>
                    <CardTitle>Related Information</CardTitle>
                    <CardDescription>
                      Details about related entities
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex justify-between py-1">
                        <span className="text-sm font-medium">Material Type</span>
                        <span className="text-sm text-muted-foreground">
                          {material?.type?.name || "N/A"}
                        </span>
                      </div>
                      <Separator />
                      <div className="flex justify-between py-1">
                        <span className="text-sm font-medium">Unit of Measure</span>
                        <span className="text-sm text-muted-foreground">
                          {material?.unitOfMeasure 
                            ? `${material.unitOfMeasure.name} (${material.unitOfMeasure.symbol})` 
                            : "N/A"}
                        </span>
                      </div>
                      <Separator />
                      <div className="flex justify-between py-1">
                        <span className="text-sm font-medium">Supplier</span>
                        <span className="text-sm text-muted-foreground">
                          {material?.supplier?.name || "N/A"}
                        </span>
                      </div>
                      <Separator />
                      <div className="flex justify-between py-1">
                        <span className="text-sm font-medium">Purchase Order Lines</span>
                        <span className="text-sm text-muted-foreground">
                          {material?.purchaseOrderLines?.length || 0}
                        </span>
                      </div>
                      <Separator />
                      <div className="flex justify-between py-1">
                        <span className="text-sm font-medium">BOMs</span>
                        <span className="text-sm text-muted-foreground">
                          {material?.boms?.length || 0}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <DialogFooter>
                <Button
                  type="button" 
                  variant="outline"
                  onClick={() => setOpen(false)}
                  disabled={loading}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={loading}>
                  {loading ? "Updating..." : "Update Material"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}