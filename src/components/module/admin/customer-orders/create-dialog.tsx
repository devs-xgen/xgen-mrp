"use client";

import * as React from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useFieldArray } from "react-hook-form";
import * as z from "zod";
import { Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { createCustomerOrder } from "@/lib/actions/customer-order";
import { useToast } from "@/hooks/use-toast";
import { CustomerCombobox } from "./combobox-field";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";

// Format currency utility function
const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'PHP', // Change this to your desired currency
    minimumFractionDigits: 2
  }).format(amount);
};

// Define schema for the form
const formSchema = z.object({
  customerId: z.string().min(1, "Customer is required"),
  orderDate: z.string().min(1, "Order date is required"),
  requiredDate: z.string().min(1, "Required date is required"),
  notes: z.string().optional(),
  orderLines: z
    .array(
      z.object({
        productId: z.string().min(1, "Product is required"),
        quantity: z.number().min(1, "Quantity must be at least 1"),
        unitPrice: z.number().min(0, "Price must be positive"),
      })
    )
    .nonempty("At least one order line is required"),
});

type FormValues = z.infer<typeof formSchema>;

interface Customer {
  id: string;
  name: string;
}

interface Product {
  id: string;
  name: string;
  unitPrice: number;
}

interface CreateCustomerOrderDialogProps {
  customers: Customer[];
  products: Product[];
}

export function CreateCustomerOrderDialog({ customers, products }: CreateCustomerOrderDialogProps) {
  const [open, setOpen] = React.useState(false);
  const { toast } = useToast();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      orderDate: new Date().toISOString().split('T')[0], // Set default to today
      notes: "",
      orderLines: [{ productId: "", quantity: 1, unitPrice: 0 }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "orderLines",
  });

  async function onSubmit(values: FormValues) {
    try {
      await createCustomerOrder({
        ...values,
        orderDate: new Date(values.orderDate),
        requiredDate: new Date(values.requiredDate),
        deliveryDate: undefined
      });
      toast({ title: "Success", description: "Customer order created successfully" });
      setOpen(false);
      form.reset();
    } catch (error) {
      toast({ title: "Error", description: "Failed to create customer order", variant: "destructive" });
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">
          <Plus className="mr-2 h-4 w-4" /> Create Order
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[800px] h-[600px] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl">Create Customer Order</DialogTitle>
          <DialogDescription>Fill in the details to create a new customer order.</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Order Details Card */}
            <Card className="border border-muted">
              <CardContent className="pt-6">
                <h3 className="text-lg font-medium mb-4">Customer Order Details</h3>
                <div className="space-y-4">
                  <FormField
                    control={form.control}
                    name="customerId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Customer</FormLabel>
                        <FormControl>
                          <CustomerCombobox
                            customers={customers.map((c) => ({
                              id: c.id,
                              name: c.name,
                            }))}
                            value={field.value}
                            onValueChange={field.onChange}
                            placeholder="Select a customer"
                            emptyText="No Customer found"
                            createNewPath="/admin/customers"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="orderDate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Order Date</FormLabel>
                          <FormControl>
                            <Input type="date" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="requiredDate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Required Date</FormLabel>
                          <FormControl>
                            <Input type="date" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Order Lines Card */}
            <Card className="border border-muted">
              <CardContent className="pt-6">
                <h3 className="text-lg font-medium mb-4">Order Lines</h3>
                <div className="space-y-4">
                  {fields.map((field, index) => (
                    <div key={field.id} className="flex items-center space-x-2">
                      {/* Product Selection */}
                      <FormField
                        control={form.control}
                        name={`orderLines.${index}.productId`}
                        render={({ field }) => (
                          <FormItem className="flex-1">
                            <FormControl>
                              <Select onValueChange={field.onChange} value={field.value}>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select a product" />
                                </SelectTrigger>
                                <SelectContent>
                                  {products.map((product) => (
                                    <SelectItem key={product.id} value={product.id}>
                                      {product.name}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {/* Quantity */}
                      <FormField
                        control={form.control}
                        name={`orderLines.${index}.quantity`}
                        render={({ field }) => (
                          <FormItem className="w-24">
                            <FormControl>
                              <Input 
                                type="number" 
                                placeholder="Qty" 
                                {...field} 
                                onChange={(e) => field.onChange(Number(e.target.value) || 0)}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {/* Unit Price */}
                      <FormField
                        control={form.control}
                        name={`orderLines.${index}.unitPrice`}
                        render={({ field }) => {
                          // Format the price when displayed
                          const displayValue = field.value ? formatCurrency(field.value) : '';
                          
                          return (
                            <FormItem className="w-32">
                              <FormControl>
                                <Input 
                                  type="number" 
                                  placeholder="Price" 
                                  {...field} 
                                  onChange={(e) => field.onChange(Number(e.target.value) || 0)}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          );
                        }}
                      />

                      {/* Remove Button */}
                      <Button
                        type="button"
                        variant="destructive"
                        size="icon"
                        onClick={() => remove(index)}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                  
                  <Button
                    type="button"
                    className="mt-2"
                    onClick={() => append({ productId: "", quantity: 1, unitPrice: 0 })}
                  >
                    Add Product
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Notes Card */}
            <Card className="border border-muted">
              <CardContent className="pt-6">
                <h3 className="text-lg font-medium mb-4">Additional Information</h3>
                <FormField
                  control={form.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Notes</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Additional notes..." />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            {/* Submit Button */}
            <DialogFooter>
              <Button type="submit">Create Order</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}