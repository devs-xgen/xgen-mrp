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

// Define schema for the form
const formSchema = z.object({
  customerId: z.string().min(1, "Customer is required"),
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
        requiredDate: new Date(values.requiredDate),
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
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create Customer Order</DialogTitle>
          <DialogDescription>Fill in the details to create a new customer order.</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* Customer Selection */}
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

            {/* Required Date */}
            <FormField
              control={form.control}
              name="requiredDate"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Input
                      type="date"
                      {...field}
                      onChange={(e) => field.onChange(new Date(e.target.value))} // Ensure it's a Date
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Required Date */}
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

            {/* Order Lines */}
            <div>
              <FormLabel>Order Lines</FormLabel>
              {fields.map((field, index) => (
                <div key={field.id} className="flex items-center space-x-2">
                  {/* Product Selection */}
                  <FormField
                    control={form.control}
                    name={`orderLines.${index}.productId`}
                    render={({ field }) => (
                      <FormItem>
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
                      <FormItem>
                        <FormControl>
                          <Input type="number" {...field} placeholder="Qty" onChange={(e) => field.onChange(Number(e.target.value) || 0)}/>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Unit Price */}
                  <FormField
                    control={form.control}
                    name={`orderLines.${index}.unitPrice`}
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <Input type="number" {...field} placeholder="Price" onChange={(e) => field.onChange(Number(e.target.value) || 0)}/>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
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

            {/* Notes */}
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
