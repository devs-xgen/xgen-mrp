"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, Save, Plus, X, Edit, Package, Calendar, User } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Badge } from "@/components/ui/badge";

import { formatCurrencyPHP } from "@/lib/constant";
import { customerOrderEditSchema, type CustomerOrderEditForm } from "@/lib/validation/customer-order-edit";
import { updateCustomerOrderWithLines } from "@/lib/actions/customer-order";
import type { Customer } from "@prisma/client";

interface OrderLine {
  id?: string;
  productId: string;
  productVariantId?: string | null;
  quantity: number;
  unitPrice: number;
  status?: string;
  notes?: string;
  product?: {
    id: string;
    name: string;
    sku: string;
    sellingPrice: number;
    hasVariants?: boolean;
    variants?: any[];
  };
  productVariant?: {
    id: string;
    displayName: string;
    sku: string;
    sellingPrice: number;
  };
}

interface CustomerOrderEditClientProps {
  order: {
    id: string;
    orderNumber: string;
    customerId: string;
    orderDate: string;
    requiredDate: string;
    shippingAddress?: string;
    billingAddress?: string;
    notes?: string;
    status: string;
    totalAmount: number;
    customer: {
      id: string;
      name: string;
      code: string;
      email?: string;
      phone?: string;
    };
    orderLines: OrderLine[];
  };
  customers: Customer[];
  products: any[];
}

export function CustomerOrderEditClient({
  order,
  customers,
  products,
}: CustomerOrderEditClientProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [orderLines, setOrderLines] = useState<OrderLine[]>(order.orderLines || []);

  const form = useForm<CustomerOrderEditForm>({
    resolver: zodResolver(customerOrderEditSchema),
    defaultValues: {
      id: order.id,
      customerId: order.customerId,
      orderDate: new Date(order.orderDate).toISOString().split('T')[0], // Convert to YYYY-MM-DD format
      requiredDate: new Date(order.requiredDate).toISOString().split('T')[0],
      shippingAddress: order.shippingAddress || "",
      billingAddress: order.billingAddress || "",
      notes: order.notes || "",
      status: order.status,
      orderLines: order.orderLines.map(line => ({
        id: line.id,
        productId: line.productId,
        productVariantId: line.productVariantId || undefined,
        quantity: line.quantity,
        unitPrice: line.unitPrice,
        status: line.status || "ACTIVE",
        notes: line.notes || "",
      })),
    },
  });

  const { handleSubmit, setValue, watch, formState: { errors, isDirty } } = form;

  // Watch for changes to update order lines state
  const watchedOrderLines = watch("orderLines");
  
  useEffect(() => {
    setOrderLines(watchedOrderLines.map(line => {
      const product = products.find(p => p.id === line.productId);
      const variant = line.productVariantId 
        ? product?.variants?.find((v: any) => v.id === line.productVariantId)
        : undefined;
      
      return {
        ...line,
        product,
        productVariant: variant,
      };
    }));
  }, [watchedOrderLines, products]);

  const addOrderLine = () => {
    const newLine = {
      productId: "",
      quantity: 1,
      unitPrice: 0,
      status: "ACTIVE",
      notes: "",
    };
    const currentLines = form.getValues("orderLines");
    setValue("orderLines", [...currentLines, newLine]);
  };

  const removeOrderLine = (index: number) => {
    const currentLines = form.getValues("orderLines");
    setValue("orderLines", currentLines.filter((_, i) => i !== index));
  };

  const updateOrderLine = (index: number, field: string, value: any) => {
    const currentLines = form.getValues("orderLines");
    const updatedLines = [...currentLines];
    
    if (field === "productId") {
      const product = products.find(p => p.id === value);
      updatedLines[index] = {
        ...updatedLines[index],
        productId: value,
        productVariantId: undefined, // Reset variant when product changes
        unitPrice: product?.sellingPrice || 0,
      };
    } else if (field === "productVariantId") {
      const product = products.find(p => p.id === updatedLines[index].productId);
      const variant = value !== "no-variant" ? product?.variants?.find((v: any) => v.id === value) : undefined;
      updatedLines[index] = {
        ...updatedLines[index],
        productVariantId: value === "no-variant" ? undefined : value,
        unitPrice: variant?.sellingPrice || product?.sellingPrice || 0,
      };
    } else {
      updatedLines[index] = {
        ...updatedLines[index],
        [field]: value,
      };
    }
    
    setValue("orderLines", updatedLines);
  };

  const calculateTotal = () => {
    return orderLines.reduce((total, line) => {
      return total + (line.quantity * line.unitPrice);
    }, 0);
  };

  const onSubmit = async (data: CustomerOrderEditForm) => {
    setIsSubmitting(true);
    try {
      const updateData = {
        ...data,
        totalAmount: calculateTotal(),
        modifiedBy: "current-user", // Replace with actual user ID
        orderLines: data.orderLines.map(line => ({
          ...line,
          createdBy: line.id ? undefined : "current-user", // Only for new lines
          modifiedBy: "current-user",
        })),
      };

      // Use server action instead of fetch - no more connection issues!
      await updateCustomerOrderWithLines(order.id, updateData);

      // Server action succeeded if we reach here

      toast.success("Order updated successfully!");
      router.push(`/admin/customer-orders/${order.id}`);
      router.refresh();
    } catch (error) {
      console.error("Error updating order:", error);
      toast.error("Failed to update order. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusColor = (status: string) => {
    const colors = {
      PENDING: "bg-yellow-500 text-white",
      IN_PROGRESS: "bg-blue-500 text-white",
      COMPLETED: "bg-green-500 text-white",
      CANCELLED: "bg-red-500 text-white",
      ACTIVE: "bg-blue-500 text-white",
    };
    return colors[status as keyof typeof colors] || "bg-gray-500 text-white";
  };

  return (
    <div className="space-y-6">
      {/* Header Actions */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href={`/admin/customer-orders/${order.id}`}>
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Order
            </Button>
          </Link>
          <Badge className={getStatusColor(order.status)}>
            {order.status.toLowerCase().replace("_", " ")}
          </Badge>
        </div>
        <div className="flex items-center gap-2">
          <Button
            onClick={handleSubmit(onSubmit)}
            disabled={isSubmitting || !isDirty}
            className="flex items-center gap-2"
          >
            <Save className="h-4 w-4" />
            {isSubmitting ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Order Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Edit className="h-5 w-5" />
                Order Information
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="customerId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Customer</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select customer" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {customers.map((customer) => (
                          <SelectItem key={customer.id} value={customer.id}>
                            {customer.name} ({customer.code})
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
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="PENDING">Pending</SelectItem>
                        <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                        <SelectItem value="COMPLETED">Completed</SelectItem>
                        <SelectItem value="ACTIVE">Active</SelectItem>
                        <SelectItem value="CANCELLED">Cancelled</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

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

              <FormField
                control={form.control}
                name="shippingAddress"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Shipping Address</FormLabel>
                    <FormControl>
                      <Textarea {...field} rows={3} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="billingAddress"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Billing Address</FormLabel>
                    <FormControl>
                      <Textarea {...field} rows={3} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="lg:col-span-2">
                <FormField
                  control={form.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Notes</FormLabel>
                      <FormControl>
                        <Textarea {...field} rows={3} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
          </Card>

          {/* Order Lines */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  Order Items
                </CardTitle>
                <Button type="button" onClick={addOrderLine} size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Item
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {orderLines.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No order items. Click "Add Item" to get started.
                </div>
              ) : (
                <div className="space-y-4">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Product</TableHead>
                        <TableHead>Variant</TableHead>
                        <TableHead>Quantity</TableHead>
                        <TableHead>Unit Price</TableHead>
                        <TableHead>Total</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="w-[50px]">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {orderLines.map((line, index) => (
                        <TableRow key={index}>
                          <TableCell>
                            <Select
                              value={line.productId}
                              onValueChange={(value) => updateOrderLine(index, "productId", value)}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Select product" />
                              </SelectTrigger>
                              <SelectContent>
                                {products.map((product) => (
                                  <SelectItem key={product.id} value={product.id}>
                                    {product.name} ({product.sku})
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </TableCell>
                          <TableCell>
                            {line.product?.variants && line.product.variants.length > 0 ? (
                              <Select
                                value={line.productVariantId || "no-variant"}
                                onValueChange={(value) => updateOrderLine(index, "productVariantId", value === "no-variant" ? undefined : value)}
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder="Select variant" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="no-variant">No variant</SelectItem>
                                  {line.product.variants.map((variant: any) => (
                                    <SelectItem key={variant.id} value={variant.id}>
                                      {variant.displayName}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            ) : (
                              <span className="text-sm text-muted-foreground">No variants</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <Input
                              type="number"
                              min="1"
                              value={line.quantity}
                              onChange={(e) => updateOrderLine(index, "quantity", parseInt(e.target.value) || 1)}
                              className="w-20"
                            />
                          </TableCell>
                          <TableCell>
                            <Input
                              type="number"
                              step="0.01"
                              min="0"
                              value={line.unitPrice}
                              onChange={(e) => updateOrderLine(index, "unitPrice", parseFloat(e.target.value) || 0)}
                              className="w-28"
                            />
                          </TableCell>
                          <TableCell>
                            <span className="font-medium">
                              {formatCurrencyPHP(line.quantity * line.unitPrice)}
                            </span>
                          </TableCell>
                          <TableCell>
                            <Select
                              value={line.status || "ACTIVE"}
                              onValueChange={(value) => updateOrderLine(index, "status", value)}
                            >
                              <SelectTrigger className="w-28">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="ACTIVE">Active</SelectItem>
                                <SelectItem value="CANCELLED">Cancelled</SelectItem>
                              </SelectContent>
                            </Select>
                          </TableCell>
                          <TableCell>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => removeOrderLine(index)}
                              className="text-red-600 hover:text-red-800"
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>

                  {/* Order Total */}
                  <div className="flex justify-end pt-4 border-t">
                    <div className="text-right">
                      <p className="text-sm text-muted-foreground">Total Amount</p>
                      <p className="text-2xl font-bold">{formatCurrencyPHP(calculateTotal())}</p>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </form>
      </Form>
    </div>
  );
}
