// src/components/module/admin/purchase-orders/purchase-order-sheet.tsx
"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
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
  SelectValue,
} from "@/components/ui/select"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { PurchaseOrder } from "@/types/admin/purchase-order"
import { Status } from "@prisma/client"
import { useToast } from "@/hooks/use-toast"
import { updatePurchaseOrder } from "@/lib/actions/purchase-order"

const formSchema = z.object({
  expectedDelivery: z.string(),
  status: z.string(),
  notes: z.string().optional(),
})

interface PurchaseOrderSheetProps {
  purchaseOrder: PurchaseOrder
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => Promise<void>
}

export function PurchaseOrderSheet({ 
    purchaseOrder, 
    open, 
    onOpenChange,
    onSuccess 
  }: PurchaseOrderSheetProps) {
  const [isEditing, setIsEditing] = useState(false)
  const { toast } = useToast()

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      expectedDelivery: purchaseOrder.expectedDelivery.toString().split('T')[0],
      status: purchaseOrder.status,
      notes: purchaseOrder.notes || '',
    },
  })

  const { isDirty } = form.formState

  async function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      await updatePurchaseOrder(purchaseOrder.id, {
        expectedDelivery: new Date(values.expectedDelivery),
        status: values.status as Status,
        notes: values.notes,
      })

      toast({
        title: "Success",
        description: "Purchase order updated successfully",
      })

      setIsEditing(false)
      if (onSuccess) await onSuccess()
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update purchase order",
        variant: "destructive",
      })
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-[600px]">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <SheetHeader>
              <SheetTitle>Purchase Order {purchaseOrder.poNumber}</SheetTitle>
              <SheetDescription>
                View and manage purchase order details
              </SheetDescription>
            </SheetHeader>

            <div className="grid gap-6 py-4">
              {/* Supplier Information */}
              <div className="grid gap-2">
                <h3 className="text-lg font-medium">Supplier Information</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium">Name</label>
                    <p className="text-sm text-muted-foreground">
                      {purchaseOrder.supplier.name}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Code</label>
                    <p className="text-sm text-muted-foreground">
                      {purchaseOrder.supplier.code}
                    </p>
                  </div>
                </div>
              </div>

              {/* Order Details */}
              <div className="grid gap-4">
                <h3 className="text-lg font-medium">Order Details</h3>

                {/* Expected Delivery Date */}
                <FormField
                  control={form.control}
                  name="expectedDelivery"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Expected Delivery Date</FormLabel>
                      <FormControl>
                        <Input 
                          type="date" 
                          {...field} 
                          disabled={!isEditing}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Status */}
                <FormField
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Status</FormLabel>
                      <Select
                        disabled={!isEditing}
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
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
                    <FormItem>
                      <FormLabel>Notes</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          disabled={!isEditing}
                          placeholder="Add notes..."
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Order Lines */}
              <div className="grid gap-2">
                <h3 className="text-lg font-medium">Order Lines</h3>
                <div className="rounded-md border">
                  <table className="w-full">
                    <thead className="bg-muted">
                      <tr className="text-left">
                        <th className="p-2">Material</th>
                        <th className="p-2">Quantity</th>
                        <th className="p-2">Unit Price</th>
                        <th className="p-2">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {purchaseOrder.orderLines.map((line) => {
                        const lineTotal = Number(line.quantity) * Number(line.unitPrice)

                        return (
                          <tr key={line.id} className="border-t">
                            <td className="p-2">
                              {line.material.name}
                              <br />
                              <span className="text-sm text-muted-foreground">
                                {line.material.sku}
                              </span>
                            </td>
                            <td className="p-2">
                              {line.quantity} {line.material.unitOfMeasure.symbol}
                            </td>
                            <td className="p-2">
                              {new Intl.NumberFormat("en-US", {
                                style: "currency",
                                currency: "PHP",
                              }).format(Number(line.unitPrice))}
                            </td>
                            <td className="p-2">
                              {new Intl.NumberFormat("en-US", {
                                style: "currency",
                                currency: "PHP",
                              }).format(Number(lineTotal))}
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                    <tfoot className="bg-muted">
                      <tr>
                        <td colSpan={3} className="p-2 text-right font-medium">
                          Total Amount:
                        </td>
                        <td className="p-2 font-medium">
                          {new Intl.NumberFormat("en-US", {
                            style: "currency",
                            currency: "PHP",
                          }).format(Number(purchaseOrder.totalAmount))}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
            </div>

            <SheetFooter>
              {isEditing ? (
                <>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      form.reset()
                      setIsEditing(false)
                    }}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={!isDirty}>
                    Save changes
                  </Button>
                </>
              ) : (
                <Button type="button" onClick={() => setIsEditing(true)}>
                  Edit
                </Button>
              )}
            </SheetFooter>
          </form>
        </Form>
      </SheetContent>
    </Sheet>
  )
}