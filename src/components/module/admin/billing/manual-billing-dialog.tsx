"use client"

import { useState, useEffect } from "react"
import { useForm, useFieldArray } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { CalendarIcon, FileText, Plus, Trash2, Search } from "lucide-react"
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
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { createEnhancedBillingStatement, getCustomersForBilling, getItemsForBilling } from "@/lib/actions/enhanced-billing-statements"
import { useToast } from "@/hooks/use-toast"
import { formatCurrencyPHP } from "@/lib/constant"

const billingItemSchema = z.object({
  description: z.string().min(1, "Description is required"),
  quantity: z.number().min(0.01, "Quantity must be greater than 0"),
  unitPrice: z.number().min(0, "Unit price must be positive"),
  totalPrice: z.number().min(0, "Total price must be positive"),
  productId: z.string().optional(),
  materialId: z.string().optional(),
  inventoryItemId: z.string().optional(),
})

const manualBillingSchema = z.object({
  customerId: z.string().optional(),
  customerName: z.string().min(1, "Customer name is required"),
  totalAmount: z.number().min(0, "Amount must be positive"),
  billingDate: z.date(),
  dueDate: z.date(),
  status: z.enum(["DRAFT", "SENT", "PAID", "OVERDUE", "CANCELLED"]),
  notes: z.string().optional(),
  taxAmount: z.number().min(0, "Tax amount must be positive").optional(),
  discountAmount: z.number().min(0, "Discount amount must be positive").optional(),
  items: z.array(billingItemSchema).min(1, "At least one item is required"),
})

type ManualBillingFormData = z.infer<typeof manualBillingSchema>

interface ManualBillingDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

interface Customer {
  id: string
  name: string
  code: string
  email?: string
  phone?: string
}

interface Product {
  id: string
  name: string
  code: string
  sellingPrice: number
  unit: string
}

interface Material {
  id: string
  name: string
  code: string
  unitCost: number
  unit: string
}

interface InventoryItem {
  id: string
  itemName: string
  itemCode: string
  unitCost: number
  unit: string
}

export function ManualBillingDialog({
  open,
  onOpenChange,
}: ManualBillingDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [customers, setCustomers] = useState<Customer[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [materials, setMaterials] = useState<Material[]>([])
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([])
  const [customerSearchOpen, setCustomerSearchOpen] = useState(false)
  const { toast } = useToast()

  const form = useForm<ManualBillingFormData>({
    resolver: zodResolver(manualBillingSchema),
    defaultValues: {
      customerName: "",
      totalAmount: 0,
      billingDate: new Date(),
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
      status: "DRAFT",
      notes: "",
      taxAmount: 0,
      discountAmount: 0,
      items: [
        {
          description: "",
          quantity: 1,
          unitPrice: 0,
          totalPrice: 0,
        },
      ],
    },
  })

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "items",
  })

  // Load data when dialog opens
  useEffect(() => {
    if (open) {
      loadData()
    }
  }, [open])

  const loadData = async () => {
    try {
      const [customersData, itemsData] = await Promise.all([
        getCustomersForBilling(),
        getItemsForBilling(),
      ])
      
      setCustomers(customersData)
      setProducts(itemsData.products)
      setMaterials(itemsData.materials)
      setInventoryItems(itemsData.inventoryItems)
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load data",
        variant: "destructive",
      })
    }
  }

  // Calculate totals when items change
  const watchedItems = form.watch("items")
  const watchedTaxAmount = form.watch("taxAmount") || 0
  const watchedDiscountAmount = form.watch("discountAmount") || 0

  useEffect(() => {
    const subtotal = watchedItems.reduce((sum, item) => sum + (item.totalPrice || 0), 0)
    const total = subtotal + watchedTaxAmount - watchedDiscountAmount
    form.setValue("totalAmount", Math.max(0, total))
  }, [watchedItems, watchedTaxAmount, watchedDiscountAmount, form])

  const handleItemChange = (index: number, field: keyof typeof billingItemSchema._type, value: any) => {
    const currentItem = form.getValues(`items.${index}`)
    
    if (field === "quantity" || field === "unitPrice") {
      const quantity = field === "quantity" ? value : currentItem.quantity
      const unitPrice = field === "unitPrice" ? value : currentItem.unitPrice
      const totalPrice = quantity * unitPrice
      
      form.setValue(`items.${index}.${field}`, value)
      form.setValue(`items.${index}.totalPrice`, totalPrice)
    } else {
      form.setValue(`items.${index}.${field}`, value)
    }
  }

  const addItemFromProduct = (product: Product) => {
    append({
      description: product.name,
      quantity: 1,
      unitPrice: product.sellingPrice,
      totalPrice: product.sellingPrice,
      productId: product.id,
    })
  }

  const addItemFromMaterial = (material: Material) => {
    append({
      description: material.name,
      quantity: 1,
      unitPrice: material.unitCost,
      totalPrice: material.unitCost,
      materialId: material.id,
    })
  }

  const addItemFromInventory = (item: InventoryItem) => {
    append({
      description: item.itemName,
      quantity: 1,
      unitPrice: item.unitCost,
      totalPrice: item.unitCost,
      inventoryItemId: item.id,
    })
  }

  const onSubmit = async (data: ManualBillingFormData) => {
    setIsSubmitting(true)
    try {
      await createEnhancedBillingStatement({
        type: "manual",
        customerId: data.customerId,
        customerName: data.customerName,
        totalAmount: data.totalAmount,
        billingDate: data.billingDate,
        dueDate: data.dueDate,
        status: data.status,
        notes: data.notes,
        taxAmount: data.taxAmount,
        discountAmount: data.discountAmount,
        items: data.items,
      })

      toast({
        title: "Success",
        description: "Manual billing statement created successfully",
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

  const subtotal = watchedItems.reduce((sum, item) => sum + (item.totalPrice || 0), 0)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[900px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Create Manual Billing Statement
          </DialogTitle>
          <DialogDescription>
            Create a billing statement by manually entering customer and item details
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Customer Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Customer Information</h3>
              
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="customerId"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Select Customer (Optional)</FormLabel>
                      <Popover open={customerSearchOpen} onOpenChange={setCustomerSearchOpen}>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant="outline"
                              role="combobox"
                              className={cn(
                                "w-full justify-between",
                                !field.value && "text-muted-foreground"
                              )}
                            >
                              {field.value
                                ? customers.find((customer) => customer.id === field.value)?.name
                                : "Select customer..."}
                              <Search className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-full p-0">
                          <Command>
                            <CommandInput placeholder="Search customers..." />
                            <CommandEmpty>No customer found.</CommandEmpty>
                            <CommandGroup>
                              {customers.map((customer) => (
                                <CommandItem
                                  key={customer.id}
                                  value={customer.name}
                                  onSelect={() => {
                                    field.onChange(customer.id)
                                    form.setValue("customerName", customer.name)
                                    setCustomerSearchOpen(false)
                                  }}
                                >
                                  <div className="flex flex-col">
                                    <span>{customer.name}</span>
                                    <span className="text-sm text-muted-foreground">
                                      {customer.code} • {customer.email}
                                    </span>
                                  </div>
                                </CommandItem>
                              ))}
                            </CommandGroup>
                          </Command>
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="customerName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Customer Name *</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Enter customer name" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <Separator />

            {/* Billing Items */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium">Billing Items</h3>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => append({
                      description: "",
                      quantity: 1,
                      unitPrice: 0,
                      totalPrice: 0,
                    })}
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Add Item
                  </Button>
                </div>
              </div>

              {/* Quick Add Buttons */}
              <div className="grid grid-cols-3 gap-2">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" size="sm">
                      Add Product
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-80">
                    <Command>
                      <CommandInput placeholder="Search products..." />
                      <CommandEmpty>No product found.</CommandEmpty>
                      <CommandGroup>
                        {products.map((product) => (
                          <CommandItem
                            key={product.id}
                            onSelect={() => addItemFromProduct(product)}
                          >
                            <div className="flex flex-col">
                              <span>{product.name}</span>
                              <span className="text-sm text-muted-foreground">
                                {product.code} • {formatCurrencyPHP(product.sellingPrice)}
                              </span>
                            </div>
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </Command>
                  </PopoverContent>
                </Popover>

                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" size="sm">
                      Add Material
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-80">
                    <Command>
                      <CommandInput placeholder="Search materials..." />
                      <CommandEmpty>No material found.</CommandEmpty>
                      <CommandGroup>
                        {materials.map((material) => (
                          <CommandItem
                            key={material.id}
                            onSelect={() => addItemFromMaterial(material)}
                          >
                            <div className="flex flex-col">
                              <span>{material.name}</span>
                              <span className="text-sm text-muted-foreground">
                                {material.code} • {formatCurrencyPHP(material.unitCost)}
                              </span>
                            </div>
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </Command>
                  </PopoverContent>
                </Popover>

                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" size="sm">
                      Add Inventory
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-80">
                    <Command>
                      <CommandInput placeholder="Search inventory..." />
                      <CommandEmpty>No inventory item found.</CommandEmpty>
                      <CommandGroup>
                        {inventoryItems.map((item) => (
                          <CommandItem
                            key={item.id}
                            onSelect={() => addItemFromInventory(item)}
                          >
                            <div className="flex flex-col">
                              <span>{item.itemName}</span>
                              <span className="text-sm text-muted-foreground">
                                {item.itemCode} • {formatCurrencyPHP(item.unitCost)}
                              </span>
                            </div>
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>

              {/* Items List */}
              <div className="space-y-3">
                {fields.map((field, index) => (
                  <div key={field.id} className="grid grid-cols-12 gap-2 items-end p-3 border rounded-lg">
                    <div className="col-span-4">
                      <FormField
                        control={form.control}
                        name={`items.${index}.description`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Description</FormLabel>
                            <FormControl>
                              <Input {...field} placeholder="Item description" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    <div className="col-span-2">
                      <FormField
                        control={form.control}
                        name={`items.${index}.quantity`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Quantity</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                step="0.01"
                                {...field}
                                onChange={(e) => handleItemChange(index, "quantity", parseFloat(e.target.value) || 0)}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    <div className="col-span-2">
                      <FormField
                        control={form.control}
                        name={`items.${index}.unitPrice`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Unit Price</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                step="0.01"
                                {...field}
                                onChange={(e) => handleItemChange(index, "unitPrice", parseFloat(e.target.value) || 0)}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    <div className="col-span-3">
                      <FormField
                        control={form.control}
                        name={`items.${index}.totalPrice`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Total</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                step="0.01"
                                {...field}
                                readOnly
                                className="bg-muted"
                              />
                            </FormControl>
                            <p className="text-xs text-muted-foreground">
                              {formatCurrencyPHP(field.value || 0)}
                            </p>
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    <div className="col-span-1">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => remove(index)}
                        disabled={fields.length === 1}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <Separator />

            {/* Billing Details */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Billing Details</h3>
              
              <div className="grid grid-cols-2 gap-4">
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
                                "w-full pl-3 text-left font-normal",
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
                                "w-full pl-3 text-left font-normal",
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

              <div className="grid grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="discountAmount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Discount Amount</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.01"
                          {...field}
                          onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="taxAmount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tax Amount</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.01"
                          {...field}
                          onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                        />
                      </FormControl>
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
              </div>

              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notes (Optional)</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Additional notes for this billing statement..."
                        className="resize-none"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <Separator />

            {/* Summary */}
            <div className="space-y-2">
              <h3 className="text-lg font-medium">Summary</h3>
              <div className="bg-muted p-4 rounded-lg space-y-2">
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span>{formatCurrencyPHP(subtotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Discount:</span>
                  <span>-{formatCurrencyPHP(watchedDiscountAmount)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Tax:</span>
                  <span>+{formatCurrencyPHP(watchedTaxAmount)}</span>
                </div>
                <Separator />
                <div className="flex justify-between font-bold text-lg">
                  <span>Total:</span>
                  <span>{formatCurrencyPHP(form.watch("totalAmount"))}</span>
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Creating..." : "Create Billing Statement"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}