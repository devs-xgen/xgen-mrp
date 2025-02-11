// src/components/module/admin/materials/create-material-dialog.tsx
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
} from "@/components/ui/dialog"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
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
import { createMaterial } from "@/lib/actions/materials"
import { useToast } from "@/hooks/use-toast"
import { Plus } from "lucide-react"
import { RichTextEditor } from "@/components/global/rich-text-editor"

// Schema for form validation
const materialSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  sku: z.string().min(2, "SKU must be at least 2 characters"),
  typeId: z.string().min(1, "Material type is required"),
  unitOfMeasureId: z.string().min(1, "Unit of measure is required"),
  costPerUnit: z.string().transform((val) => parseFloat(val)),
  currentStock: z.string().transform((val) => parseInt(val)),
  minimumStockLevel: z.string().transform((val) => parseInt(val)),
  leadTime: z.string().transform((val) => parseInt(val)),
  supplierId: z.string().min(1, "Supplier is required"),
  notes: z.string().optional(),
  status: z.nativeEnum(Status).default(Status.ACTIVE),
})

type MaterialFormValues = z.infer<typeof materialSchema>

interface CreateMaterialDialogProps {
  materialTypes: { id: string; name: string }[]
  unitOfMeasures: { id: string; name: string; symbol: string }[]
  suppliers: { id: string; name: string }[]
}

export function CreateMaterialDialog({
  materialTypes,
  unitOfMeasures,
  suppliers,
}: CreateMaterialDialogProps) {
  const [open, setOpen] = useState(false)
  const { toast } = useToast()
  
  const form = useForm<MaterialFormValues>({
    resolver: zodResolver(materialSchema),
    defaultValues: {
      name: "",
      sku: "",
      costPerUnit: "0",
      currentStock: "0",
      minimumStockLevel: "0",
      leadTime: "0",
      notes: "",
      status: Status.ACTIVE,
    },
  })

  async function onSubmit(data: MaterialFormValues) {
    try {
      await createMaterial(data)
      setOpen(false)
      form.reset()
      toast({
        title: "Success",
        description: "Material created successfully",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create material",
        variant: "destructive",
      })
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Add Material
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-screen-lg">
        <DialogHeader>
          <DialogTitle>Add New Material</DialogTitle>
          <DialogDescription>
            Create a new material in your inventory system.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              {/* Basic Information */}
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Material name" {...field} />
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
                      <Input placeholder="SKU number" {...field} />
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

              {/* Cost and Stock */}
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

              <FormField
                control={form.control}
                name="currentStock"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Current Stock</FormLabel>
                    <FormControl>
                      <Input type="number" min="0" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="minimumStockLevel"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Minimum Stock Level</FormLabel>
                    <FormControl>
                      <Input type="number" min="0" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

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

              {/* Supplier and Status */}
              <FormField
                control={form.control}
                name="supplierId"
                render={({ field }) => (
                  <FormItem>
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

              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
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
            </div>

            {/* Notes */}
            <FormField
  control={form.control}
  name="notes"
  render={({ field }) => (
    <FormItem>
      <FormLabel>Notes</FormLabel>
      <FormControl>
        <RichTextEditor
          value={field.value || ''}
          onChange={field.onChange}
          placeholder="Additional notes about the material..."
        />
      </FormControl>
      <FormMessage />
    </FormItem>
  )}
/>

            <div className="flex justify-end space-x-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit">Create Material</Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}