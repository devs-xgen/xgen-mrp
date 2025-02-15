// src/components/module/admin/customer-orders/customer-order-sheet.tsx
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
import { CustomerOrder } from "@/types/admin/customer-order"
import { Status } from "@prisma/client"
import { useToast } from "@/hooks/use-toast"
import { updateCustomerOrder } from "@/lib/actions/customer-order"

const formSchema = z.object({
  orderDate: z.string(),
  status: z.string(),
  notes: z.string().optional(),
})

interface CustomerOrderSheetProps {
  customerOrder: CustomerOrder
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => Promise<void>
}

export function CustomerOrderSheet({ 
    customerOrder, 
    open, 
    onOpenChange,
    onSuccess 
  }: CustomerOrderSheetProps) {
  const [isEditing, setIsEditing] = useState(false)
  const { toast } = useToast()

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      orderDate: customerOrder.orderDate.toString().split('T')[0],
      status: customerOrder.status,
      notes: customerOrder.notes || '',
    },
  })

  const { isDirty } = form.formState

  async function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      await updateCustomerOrder(customerOrder.id, {
        orderDate: new Date(values.orderDate),
        status: values.status as Status,
        notes: values.notes,
      })

      toast({
        title: "Success",
        description: "Customer order updated successfully",
      })

      setIsEditing(false)
      if (onSuccess) await onSuccess()
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update customer order",
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
              <SheetTitle>Customer Order {customerOrder.orderNumber}</SheetTitle>
              <SheetDescription>
                View and manage customer order details
              </SheetDescription>
            </SheetHeader>

            <div className="grid gap-6 py-4">
              {/* Customer Information */}
              <div className="grid gap-2">
                <h3 className="text-lg font-medium">Customer Information</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium">Name</label>
                    <p className="text-sm text-muted-foreground">
                      {customerOrder.customer.name}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Email</label>
                    <p className="text-sm text-muted-foreground">
                      {customerOrder.customer.email}
                    </p>
                  </div>
                </div>
              </div>

              {/* Order Details */}
              <div className="grid gap-4">
                <h3 className="text-lg font-medium">Order Details</h3>

                {/* Order Date */}
                <FormField
                  control={form.control}
                  name="orderDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Order Date</FormLabel>
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
