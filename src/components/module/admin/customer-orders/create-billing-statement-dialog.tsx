"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { CalendarIcon, FileText, Truck } from "lucide-react"
import { format } from "date-fns"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
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
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { CustomerOrderColumn } from "@/types/admin/customer-order"
import { createEnhancedBillingStatement } from "@/lib/actions/enhanced-billing-statements"
import { useToast } from "@/hooks/use-toast"
import { formatCurrencyPHP } from "@/lib/constant"

const billingStatementSchema = z.object({
  customerOrderId: z.string(),
  customerName: z.string().min(1, "Customer name is required"),
  totalAmount: z.number().min(0, "Amount must be positive"),
  billingDate: z.date(),
  dueDate: z.date(),
  status: z.enum(["DRAFT", "SENT", "PAID", "OVERDUE", "CANCELLED"]),
  notes: z.string().optional(),
  // Delivery receipt fields
  createDeliveryReceipt: z.boolean().default(true),
  deliveryAddress: z.string().optional(),
  deliveryDate: z.date().optional(),
  receivedBy: z.string().optional(),
  receivedByTitle: z.string().optional(),
  deliveryNotes: z.string().optional(),
})

type BillingStatementFormData = z.infer<typeof billingStatementSchema>

interface CreateBillingStatementDialogProps {
  customerOrder: CustomerOrderColumn
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function CreateBillingStatementDialog({
  customerOrder,
  open,
  onOpenChange,
}: CreateBillingStatementDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { toast } = useToast()

  const form = useForm<BillingStatementFormData>({
    resolver: zodResolver(billingStatementSchema),
    defaultValues: {
      customerOrderId: customerOrder.id,
      customerName: customerOrder.customerName,
      totalAmount: customerOrder.totalAmount,
      billingDate: new Date(),
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
      status: "DRAFT",
      notes: `Billing statement for order ${customerOrder.orderNumber}`,
      createDeliveryReceipt: true,
      deliveryDate: new Date(),
      receivedBy: customerOrder.customerName || "To be determined",
      deliveryNotes: `Delivery for order ${customerOrder.orderNumber}`,
    },
  })

  const onSubmit = async (data: BillingStatementFormData) => {
    setIsSubmitting(true)
    try {
      await createEnhancedBillingStatement({
        type: "customer_order",
        customerOrderId: data.customerOrderId,
        billingDate: data.billingDate,
        dueDate: data.dueDate,
        status: data.status,
        notes: data.notes,
        totalAmount: data.totalAmount,
        taxAmount: 0,
        discountAmount: 0,
        // Delivery receipt data
        createDeliveryReceipt: data.createDeliveryReceipt,
        deliveryAddress: data.deliveryAddress,
        deliveryDate: data.deliveryDate,
        receivedBy: data.receivedBy,
        receivedByTitle: data.receivedByTitle,
        deliveryNotes: data.deliveryNotes,
      })

      const successMessage = data.createDeliveryReceipt 
        ? "Billing statement, sales invoice, and delivery receipt created successfully"
        : "Billing statement and sales invoice created successfully";

      toast({
        title: "Success",
        description: successMessage,
      })

      onOpenChange(false)
      form.reset()
      
      // Redirect to billing statements page
      window.location.href = "/admin/billing/billing-statements"
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create billing statement",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[95vw] sm:max-w-[600px] lg:max-w-[700px] max-h-[90vh] overflow-hidden flex flex-col p-4 sm:p-6">
        <DialogHeader className="space-y-2 pb-4">
          <DialogTitle className="flex items-center gap-2 text-lg sm:text-xl">
            <FileText className="h-5 w-5" />
            Create Billing Statement
          </DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground">
            Create a billing statement for order {customerOrder.orderNumber}. 
            This will also generate a sales invoice and optionally a delivery receipt.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto">
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pb-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="customerName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Customer Name</FormLabel>
                    <FormControl>
                    <Input {...field} className="text-sm sm:text-base" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="totalAmount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Total Amount</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                      className="text-sm sm:text-base"
                        {...field}
                        onChange={(e) => field.onChange(parseFloat(e.target.value))}
                      />
                    </FormControl>
                    <FormMessage />
                    <p className="text-sm text-muted-foreground">
                      {formatCurrencyPHP(field.value || 0)}
                    </p>
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="billingDate"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Billing Date</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant={"outline"}
                            className={cn(
                              "w-full pl-3 text-left font-normal text-sm sm:text-base",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            {field.value ? (
                              format(field.value, "PPP")
                            ) : (
                              <span>Pick a date</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          disabled={(date) =>
                            date > new Date() || date < new Date("1900-01-01")
                          }
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="dueDate"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Due Date</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant={"outline"}
                            className={cn(
                              "w-full pl-3 text-left font-normal text-sm sm:text-base",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            {field.value ? (
                              format(field.value, "PPP")
                            ) : (
                              <span>Pick a date</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          disabled={(date) => date < new Date()}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Status</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger className="text-sm sm:text-base">
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="DRAFT">Draft</SelectItem>
                      <SelectItem value="SENT">Sent</SelectItem>
                      <SelectItem value="PAID">Paid</SelectItem>
                      <SelectItem value="OVERDUE">Overdue</SelectItem>
                      <SelectItem value="CANCELLED">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes (Optional)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Additional notes for this billing statement..."
                      className="resize-none text-sm sm:text-base"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Delivery Receipt Section */}
            <div className="space-y-4 border-t pt-4 mt-6">
              <div className="flex items-center space-x-2">
                <Truck className="h-5 w-5 text-blue-600" />
                <h3 className="text-base sm:text-lg font-semibold">Delivery Receipt</h3>
              </div>
              
              <FormField
                control={form.control}
                name="createDeliveryReceipt"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>
                        Create delivery receipt automatically
                      </FormLabel>
                      <p className="text-sm text-muted-foreground">
                        Generate a delivery receipt along with the billing statement and sales invoice
                      </p>
                    </div>
                  </FormItem>
                )}
              />

              {form.watch("createDeliveryReceipt") && (
                <div className="space-y-4 ml-0 sm:ml-8 border-l-0 sm:border-l-2 border-blue-100 pl-0 sm:pl-4 border-t-2 sm:border-t-0 pt-4 sm:pt-0">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="deliveryDate"
                      render={({ field }) => (
                        <FormItem className="flex flex-col">
                          <FormLabel>Delivery Date</FormLabel>
                          <Popover>
                            <PopoverTrigger asChild>
                              <FormControl>
                                <Button
                                  variant={"outline"}
                                  className={cn(
                                    "w-full pl-3 text-left font-normal text-sm sm:text-base",
                                    !field.value && "text-muted-foreground"
                                  )}
                                >
                                  {field.value ? (
                                    format(field.value, "PPP")
                                  ) : (
                                    <span>Pick a date</span>
                                  )}
                                  <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                </Button>
                              </FormControl>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                              <Calendar
                                mode="single"
                                selected={field.value}
                                onSelect={field.onChange}
                                initialFocus
                              />
                            </PopoverContent>
                          </Popover>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="receivedBy"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Received By</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Person who will receive the delivery"
                              className="text-sm sm:text-base"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="deliveryAddress"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Delivery Address (Optional)</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="Will use customer address if empty"
                              className="resize-none text-sm sm:text-base"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="receivedByTitle"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Position/Title (Optional)</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="e.g., Warehouse Manager"
                              className="text-sm sm:text-base"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="deliveryNotes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Delivery Notes (Optional)</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Special delivery instructions or notes..."
                            className="resize-none text-sm sm:text-base"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              )}
            </div>

              <DialogFooter className="flex-col-reverse sm:flex-row gap-2 sm:gap-0 pt-4 border-t mt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isSubmitting}
                  className="w-full sm:w-auto"
              >
                Cancel
              </Button>
                <Button type="submit" disabled={isSubmitting} className="w-full sm:w-auto">
                  {isSubmitting ? "Creating..." : `Create ${form.watch("createDeliveryReceipt") ? "All Documents" : "Billing Statement"}`}
              </Button>
            </DialogFooter>
          </form>
        </Form>
        </div>
      </DialogContent>
    </Dialog>
  )
}