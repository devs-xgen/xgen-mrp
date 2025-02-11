// src/components/module/admin/purchase-orders/create-dialog.tsx
"use client"

import * as React from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { Plus, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue 
} from "@/components/ui/select"
import { createPurchaseOrder } from "@/lib/actions/purchase-order"
import { useToast } from "@/hooks/use-toast"
import { ComboboxField } from "./combobox-field"


// Form Schema
const formSchema = z.object({
  supplierId: z.string({
    required_error: "Please select a supplier",
  }),
  expectedDelivery: z.string({
    required_error: "Please select an expected delivery date",
  }),
  notes: z.string().optional(),
  orderLines: z.array(z.object({
    materialId: z.string({
      required_error: "Please select a material",
    }),
    quantity: z.number({
      required_error: "Please enter a quantity",
    }).min(1),
    unitPrice: z.number({
      required_error: "Please enter a unit price",
    }).min(0),
  })).min(1, "At least one order line is required"),
})

type FormValues = z.infer<typeof formSchema>

interface Material {
  id: string
  name: string
  sku: string
  costPerUnit: number
  currentStock: number
  unitOfMeasure: {
    symbol: string
    name: string
  }
}

interface Supplier {
  id: string
  name: string
  code: string
  contactPerson: string
  email: string
  phone: string
}

interface CreatePurchaseOrderDialogProps {
  materials: Material[]
  suppliers: Supplier[]
}


export function CreatePurchaseOrderDialog({
  materials,
  suppliers
}: CreatePurchaseOrderDialogProps) {
  const [open, setOpen] = React.useState(false)
  const { toast } = useToast()
  
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      orderLines: [{ materialId: "", quantity: 1, unitPrice: 0 }],
    },
  })

  const handleMaterialSelect = (value: string, index: number) => {
    const material = materials.find(m => m.id === value)
    if (material) {
      form.setValue(`orderLines.${index}.materialId`, value)
      form.setValue(`orderLines.${index}.unitPrice`, material.costPerUnit)
    }
  }

  async function onSubmit(values: FormValues) {
    try {
      await createPurchaseOrder({
        ...values,
        expectedDelivery: new Date(values.expectedDelivery),
      })

      toast({
        title: "Success",
        description: "Purchase order created successfully",
      })
      setOpen(false)
      form.reset()
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create purchase order",
        variant: "destructive",
      })
    }
  }

  const addOrderLine = () => {
    const currentLines = form.getValues("orderLines")
    form.setValue("orderLines", [
      ...currentLines,
      { materialId: "", quantity: 1, unitPrice: 0 },
    ])
  }

  const removeOrderLine = (index: number) => {
    const currentLines = form.getValues("orderLines")
    if (currentLines.length > 1) {
      form.setValue("orderLines", currentLines.filter((_, i) => i !== index))
    }
  }


  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="h-8">
          <Plus className="mr-2 h-4 w-4" />
          Create Order
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-screen-2xl w-full h-[90vh]">
        <DialogHeader>
          <DialogTitle>Create Purchase Order</DialogTitle>
          <DialogDescription>
            Create a new purchase order with one or more items
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
              control={form.control}
              name="supplierId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Supplier</FormLabel>
                  <FormControl>
                    <ComboboxField
                      options={suppliers.map(s => ({
                        id: s.id,
                        name: s.name,
                        code: s.code
                      }))}
                      value={field.value}
                      onValueChange={field.onChange}
                      placeholder="Select supplier"
                      emptyText="No suppliers found"
                      createNewPath="/admin/suppliers"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="expectedDelivery"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Expected Delivery Date</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-medium">Order Lines</h4>
                <Button type="button" variant="outline" size="sm" onClick={addOrderLine}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Line
                </Button>
              </div>

              {form.watch("orderLines").map((_, index) => (
                <div key={index} className="flex gap-4 items-start">
                  <FormField
                    control={form.control}
                    name={`orderLines.${index}.materialId`}
                    render={({ field }) => (
                      <FormItem className="flex-1">
                        <FormControl>
                          <ComboboxField
                            options={materials.map(m => ({
                              id: m.id,
                              name: `${m.name} (${m.unitOfMeasure.symbol})`,
                              code: m.sku
                            }))}
                            value={field.value}
                            onValueChange={(value) => handleMaterialSelect(value, index)}
                            placeholder="Select material"
                            emptyText="No materials found"
                            createNewPath="/admin/materials"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name={`orderLines.${index}.quantity`}
                    render={({ field }) => (
                      <FormItem className="w-24">
                        <FormControl>
                          <Input 
                            type="number" 
                            min={1} 
                            {...field} 
                            onChange={e => field.onChange(parseInt(e.target.value) || 0)} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name={`orderLines.${index}.unitPrice`}
                    render={({ field }) => (
                      <FormItem className="w-32">
                        <FormControl>
                          <Input 
                            type="number" 
                            step="0.01" 
                            min={0} 
                            {...field} 
                            onChange={e => field.onChange(parseFloat(e.target.value) || 0)} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => removeOrderLine(index)}
                    disabled={form.watch("orderLines").length === 1}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Any additional notes..." />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button type="submit">Create Order</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )

}