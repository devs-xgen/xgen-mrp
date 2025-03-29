// src/components/module/admin/customer-orders/create-dialog.tsx
"use client";

import * as React from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useFieldArray } from "react-hook-form";
import * as z from "zod";
import { Plus, X, AlertTriangle, ArrowRight } from "lucide-react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { createProductionOrder } from "@/lib/actions/production-order";
import { useRouter } from "next/navigation";

// Format currency utility function
const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "PHP", // Change this to your desired currency
    minimumFractionDigits: 2,
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
  email?: string;
}

interface Product {
  id: string;
  name: string;
  unitPrice: number;
  sku?: string;
  currentStock?: number;
  minimumStockLevel?: number;
}

interface CreateCustomerOrderDialogProps {
  customers: Customer[];
  products: Product[];
  workCenters?: any[]; // Optional work centers for production orders
}

export function CreateCustomerOrderDialog({
  customers,
  products,
  workCenters = [],
}: CreateCustomerOrderDialogProps) {
  const [open, setOpen] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [showProductionPrompt, setShowProductionPrompt] = React.useState(false);
  const [lowStockProducts, setLowStockProducts] = React.useState<Product[]>([]);
  const { toast } = useToast();
  const router = useRouter();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      orderDate: new Date().toISOString().split("T")[0], // Set default to today
      notes: "",
      orderLines: [{ productId: "", quantity: 1, unitPrice: 0 }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "orderLines",
  });

  // Calculate the total price
  const calculateTotal = () => {
    const orderLines = form.getValues("orderLines");
    return orderLines.reduce((total, line) => {
      return total + line.quantity * line.unitPrice;
    }, 0);
  };

  // Check for low stock products (if stock information is available)
  const checkLowStockProducts = (formData: FormValues) => {
    const lowStock: Product[] = [];

    formData.orderLines.forEach((line) => {
      const product = products.find((p) => p.id === line.productId);
      if (
        product &&
        product.currentStock !== undefined &&
        line.quantity > (product.currentStock || 0)
      ) {
        lowStock.push(product);
      }
    });

    return lowStock;
  };

  async function onSubmit(values: FormValues) {
    try {
      setIsSubmitting(true);

      // Check for low stock products if we have stock information
      const hasStockInfo = products.some((p) => p.currentStock !== undefined);
      if (hasStockInfo) {
        const lowStock = checkLowStockProducts(values);
        if (lowStock.length > 0 && workCenters.length > 0) {
          setLowStockProducts(lowStock);
          setShowProductionPrompt(true);
          setIsSubmitting(false);
          return;
        }
      }

      await submitOrder(values);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create customer order",
        variant: "destructive",
      });
      setIsSubmitting(false);
    }
  }

  const submitOrder = async (values: FormValues) => {
    try {
      await createCustomerOrder({
        ...values,
        orderDate: new Date(values.orderDate),
        requiredDate: new Date(values.requiredDate),
        deliveryDate: undefined,
      });

      toast({
        title: "Success",
        description: "Customer order created successfully",
      });

      setOpen(false);
      form.reset();
      router.refresh();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create customer order",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const createProductionOrders = async () => {
    // Only proceed if we have necessary information
    if (!workCenters.length) {
      return submitOrder(form.getValues());
    }

    try {
      setIsSubmitting(true);

      // First create the customer order
      const orderResponse = await createCustomerOrder({
        ...form.getValues(),
        orderDate: new Date(form.getValues().orderDate),
        requiredDate: new Date(form.getValues().requiredDate),
        deliveryDate: undefined,
      });

      // Now create production orders for low stock items
      const productionPromises = lowStockProducts.map(async (product) => {
        const orderLine = form
          .getValues()
          .orderLines.find((line) => line.productId === product.id);
        if (!orderLine) return null;

        const neededQuantity = Math.max(
          orderLine.quantity - (product.currentStock || 0),
          product.minimumStockLevel || 0
        );

        // Calculate dates with a two-week lead time
        const startDate = new Date();
        const dueDate = new Date();
        dueDate.setDate(dueDate.getDate() + 14);

        // Create basic operations - assuming there is at least one work center
        const operations =
          workCenters.length > 0
            ? [
                {
                  workCenterId: workCenters[0].id,
                  startTime: startDate,
                  endTime: dueDate,
                },
              ]
            : [];

        return createProductionOrder({
          productId: product.id,
          quantity: neededQuantity,
          startDate,
          dueDate,
          priority: "MEDIUM",
          customerOrderId: orderResponse?.id,
          notes: `Automatically created for customer order`,
          operations,
        });
      });

      await Promise.all(productionPromises);

      toast({
        title: "Success",
        description: "Order and production orders created successfully",
      });

      setOpen(false);
      setShowProductionPrompt(false);
      form.reset();
      router.refresh();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create production orders",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Helper function to get product details
  const getProductDetails = (productId: string) => {
    return products.find((p) => p.id === productId);
  };

  return (
    <>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button size="sm">
            <Plus className="mr-2 h-4 w-4" /> Create Order
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-[800px] h-[600px] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl">Create Customer Order</DialogTitle>
            <DialogDescription>
              Fill in the details to create a new customer order.
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* Order Details Card */}
              <Card className="border border-muted">
                <CardContent className="pt-6">
                  <h3 className="text-lg font-medium mb-4">
                    Customer Order Details
                  </h3>
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
                                email: c.email,
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
                      <div
                        key={field.id}
                        className="flex flex-col gap-4 p-4 border rounded-lg"
                      >
                        <div className="flex justify-between items-center">
                          <h4 className="font-medium">Item #{index + 1}</h4>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => remove(index)}
                            className="h-8 w-8"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>

                        {/* Product Selection */}
                        <FormField
                          control={form.control}
                          name={`orderLines.${index}.productId`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Product</FormLabel>
                              <FormControl>
                                <Select
                                  onValueChange={(value) => {
                                    field.onChange(value);
                                    // Auto-populate price when product changes
                                    const product = getProductDetails(value);
                                    if (product) {
                                      form.setValue(
                                        `orderLines.${index}.unitPrice`,
                                        product.unitPrice
                                      );
                                    }
                                  }}
                                  value={field.value}
                                >
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select a product" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {products.map((product) => (
                                      <SelectItem
                                        key={product.id}
                                        value={product.id}
                                      >
                                        <div className="flex flex-col">
                                          <span>{product.name}</span>
                                          {product.sku && (
                                            <span className="text-xs text-muted-foreground">
                                              SKU: {product.sku}
                                            </span>
                                          )}
                                        </div>
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <div className="grid grid-cols-2 gap-4">
                          {/* Quantity */}
                          <FormField
                            control={form.control}
                            name={`orderLines.${index}.quantity`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Quantity</FormLabel>
                                <FormControl>
                                  <Input
                                    type="number"
                                    placeholder="Quantity"
                                    {...field}
                                    onChange={(e) =>
                                      field.onChange(
                                        Number(e.target.value) || 0
                                      )
                                    }
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
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Unit Price</FormLabel>
                                <FormControl>
                                  <Input
                                    type="number"
                                    step="0.01"
                                    placeholder="Price"
                                    {...field}
                                    onChange={(e) =>
                                      field.onChange(
                                        Number(e.target.value) || 0
                                      )
                                    }
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>

                        {/* Show stock warning if needed */}
                        {field.productId &&
                          (() => {
                            const product = getProductDetails(field.productId);
                            if (!product || product.currentStock === undefined)
                              return null;

                            const quantity = form.getValues(
                              `orderLines.${index}.quantity`
                            );

                            if (quantity > product.currentStock) {
                              return (
                                <div className="bg-amber-50 text-amber-800 p-2 rounded-md text-sm flex items-center">
                                  <AlertTriangle className="h-4 w-4 mr-2" />
                                  <span>
                                    Warning: Ordering {quantity} units but only{" "}
                                    {product.currentStock} in stock. A
                                    production order will be needed.
                                  </span>
                                </div>
                              );
                            }
                            return null;
                          })()}
                      </div>
                    ))}

                    <Button
                      type="button"
                      variant="outline"
                      className="w-full"
                      onClick={() =>
                        append({ productId: "", quantity: 1, unitPrice: 0 })
                      }
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      Add Product
                    </Button>
                  </div>
                </CardContent>
                <CardFooter className="bg-muted/30 flex justify-between">
                  <div>
                    <span className="text-sm font-medium">Total:</span>
                  </div>
                  <div>
                    <span className="text-lg font-bold">
                      {formatCurrency(calculateTotal())}
                    </span>
                  </div>
                </CardFooter>
              </Card>

              {/* Notes Card */}
              <Card className="border border-muted">
                <CardContent className="pt-6">
                  <h3 className="text-lg font-medium mb-4">
                    Additional Information
                  </h3>
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
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? "Creating..." : "Create Order"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Production Order Prompt Dialog */}
      {showProductionPrompt && (
        <Dialog
          open={showProductionPrompt}
          onOpenChange={setShowProductionPrompt}
        >
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle className="text-xl">Low Stock Warning</DialogTitle>
              <DialogDescription>
                Some products in this order have insufficient inventory. Would
                you like to create production orders automatically?
              </DialogDescription>
            </DialogHeader>

            <div className="py-4">
              <h3 className="text-sm font-medium mb-2">
                Products with low stock:
              </h3>
              <div className="space-y-2 mt-4">
                {lowStockProducts.map((product) => (
                  <div
                    key={product.id}
                    className="flex items-center justify-between p-3 border rounded-md"
                  >
                    <div>
                      <p className="font-medium">{product.name}</p>
                      {product.sku && (
                        <p className="text-sm text-muted-foreground">
                          SKU: {product.sku}
                        </p>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="text-sm">
                        Stock:{" "}
                        <span className="font-medium">
                          {product.currentStock}
                        </span>
                      </p>
                      {product.minimumStockLevel !== undefined && (
                        <p className="text-sm">
                          Minimum:{" "}
                          <span className="font-medium">
                            {product.minimumStockLevel}
                          </span>
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex flex-col gap-2 py-4">
              <p>You have two options:</p>
              <ol className="list-decimal list-inside space-y-2 ml-4">
                <li>
                  Create both customer order and production orders at once
                </li>
                <li>
                  Just create the customer order (you can add production orders
                  later)
                </li>
              </ol>
            </div>

            <DialogFooter className="flex flex-col sm:flex-row gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setShowProductionPrompt(false);
                  submitOrder(form.getValues());
                }}
                disabled={isSubmitting}
              >
                Customer Order Only
              </Button>
              <Button
                onClick={createProductionOrders}
                disabled={isSubmitting}
                className="gap-2"
              >
                {isSubmitting ? "Creating..." : "Create Both"}
                <ArrowRight className="h-4 w-4" />
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}
