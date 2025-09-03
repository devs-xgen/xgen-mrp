"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, Save, Package, ShoppingCart, AlertCircle } from "lucide-react";
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
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";

import { updateCustomerOrderWithLines } from "@/lib/actions/customer-order";
import { formatCurrencyPHP } from "@/lib/constant";
import { customerOrderCreateSchema, type CustomerOrderCreateForm } from "@/lib/validation/customer-order-create";
import type { Customer } from "@prisma/client";
import { Status } from "@prisma/client";

interface OrderLine {
  id?: string;
  productId: string;
  productVariantId?: string;
  quantity: number;
  unitPrice: number;
  status?: Status;
  product?: {
    variants: any[];
    name: string;
    sku: string;
    sellingPrice: number;
    hasVariants: boolean;
  };
  productVariant?: {
    displayName: string;
    sku: string;
    sellingPrice: number;
  };
}

interface CustomerOrderEditClientProps {
  order: any; // The existing order from getCustomerOrderById
  customers: Customer[];
  products: any[]; // From getProducts
}

export function CustomerOrderEditClient({
  order,
  customers,
  products,
}: CustomerOrderEditClientProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [orderLines, setOrderLines] = useState<OrderLine[]>([]);
  const [hasProductionOrders, setHasProductionOrders] = useState(false);

  const form = useForm<CustomerOrderCreateForm>({
    resolver: zodResolver(customerOrderCreateSchema),
    defaultValues: {
      customerId: "",
      requiredDate: "",
      notes: "",
      orderLines: [],
    },
  });

  const {
    watch,
    setValue,
    handleSubmit,
    formState: { errors }
  } = form;

  // Initialize form with existing order data
  useEffect(() => {
    if (order && customers.length > 0 && products.length > 0) {
      console.log("Initializing form with order:", order);
      console.log("Customer ID from order:", order.customerId);
      
      // Find and set customer
      const customer = customers.find(c => c.id === order.customerId);
      console.log("Found customer:", customer);
      setSelectedCustomer(customer || null);
      
      // Set form values
      setValue("customerId", order.customerId);
      setValue("requiredDate", order.requiredDate ? new Date(order.requiredDate).toISOString().split('T')[0] : "");
      setValue("notes", order.notes || "");

      // Convert existing order lines
      const existingLines: OrderLine[] = order.orderLines?.map((line: any) => {
        const product = products.find(p => p.id === line.productId);
        const variant = product?.variants?.find((v: any) => v.id === line.productVariantId);
        
        return {
          id: line.id,
          productId: line.productId,
          productVariantId: line.productVariantId || undefined,
          quantity: line.quantity,
          unitPrice: typeof line.unitPrice === 'number' ? line.unitPrice : Number(line.unitPrice) || 0,
          status: line.status,
          product,
          productVariant: variant,
        };
      }) || [];

      console.log("Setting order lines:", existingLines);
      setOrderLines(existingLines);
      setHasProductionOrders(order.productionOrders?.length > 0);
    }
  }, [order, customers, products, setValue]);

  // Calculate totals
  const subtotal = orderLines.reduce((sum, line) => sum + (line.quantity * line.unitPrice), 0);
  const totalAmount = subtotal;

  const onSubmit = async (data: CustomerOrderCreateForm) => {
    if (orderLines.length === 0) {
      toast.error("Please add at least one product to the order");
      return;
    }

    setIsSubmitting(true);
    try {
      await updateCustomerOrderWithLines(order.id, {
        customerId: data.customerId,
        requiredDate: new Date(data.requiredDate),
        notes: data.notes,
        totalAmount,
        status: Status.PENDING, // Keep existing status or update as needed
        orderLines: orderLines.map(line => ({
          id: line.id,
          productId: line.productId,
          productVariantId: line.productVariantId,
          quantity: line.quantity,
          unitPrice: line.unitPrice,
          status: line.status || Status.PENDING,
        })),
      });

      toast.success("Customer order updated successfully!");
      router.push(`/admin/customer-orders-v2/${order.id}`);
    } catch (error) {
      console.error("Error updating customer order:", error);
      toast.error("Failed to update customer order. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const addOrderLine = () => {
    setOrderLines(prev => [...prev, {
      productId: "",
      quantity: 1,
      unitPrice: 0,
    }]);
  };

  const updateOrderLine = (index: number, updates: Partial<OrderLine>) => {
    setOrderLines(prev => prev.map((line, i) => 
      i === index ? { ...line, ...updates } : line
    ));
  };

  const removeOrderLine = (index: number) => {
    setOrderLines(prev => prev.filter((_, i) => i !== index));
  };

  const handleProductSelect = (index: number, productId: string) => {
    const product = products.find(p => p.id === productId);
    if (product) {
      updateOrderLine(index, {
        productId,
        product,
        productVariantId: undefined,
        productVariant: undefined,
        unitPrice: Number(product.sellingPrice) || 0,
      });
    }
  };

  const handleVariantSelect = (index: number, variantId: string) => {
    const line = orderLines[index];
    const variant = line.product?.variants?.find((v: any) => v.id === variantId);
    if (variant) {
      updateOrderLine(index, {
        productVariantId: variantId,
        productVariant: variant,
        unitPrice: Number(variant.sellingPrice) || 0,
      });
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Page Header with Order Info */}
      <div className="space-y-4">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" asChild>
            <Link href={`/admin/customer-orders-v2/${order.id}`}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Order
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-semibold">Edit Order {order.orderNumber}</h1>
            <p className="text-muted-foreground">Modify order details and items</p>
          </div>
        </div>

        {/* Order Status and Key Info */}
        <Card>
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">Status</p>
                <Badge variant="outline" className="mt-1">{order.status}</Badge>
              </div>
              <div>
                <p className="text-muted-foreground">Order Date</p>
                <p className="font-medium">{new Date(order.orderDate).toLocaleDateString()}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Required Date</p>
                <p className="font-medium">{order.requiredDate ? new Date(order.requiredDate).toLocaleDateString() : "—"}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Total Amount</p>
                <p className="font-medium">{formatCurrencyPHP(order.totalAmount || 0)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Warning for orders with production orders */}
      {hasProductionOrders && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            This order has {order.productionOrders?.length} associated production order(s). 
            Changing quantities or removing items may affect production planning.
          </AlertDescription>
        </Alert>
      )}

      {/* Action Buttons */}
      <div className="flex items-center justify-end gap-4 p-4 bg-muted/30 rounded-lg">
        <Button
          type="button"
          variant="outline"
          asChild
        >
          <Link href={`/admin/customer-orders-v2/${order.id}`}>
            Cancel
          </Link>
        </Button>
        <Button
          type="submit"
          disabled={isSubmitting || orderLines.length === 0}
          onClick={handleSubmit(onSubmit)}
        >
          <Save className="w-4 h-4 mr-2" />
          {isSubmitting ? "Updating..." : "Update Order"}
        </Button>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Customer Details Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShoppingCart className="w-5 h-5" />
              Customer Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="customerId">Customer *</Label>
                <Select
                  value={watch("customerId") || ""}
                  onValueChange={(value) => {
                    setValue("customerId", value);
                    const customer = customers.find(c => c.id === value);
                    setSelectedCustomer(customer || null);
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a customer" />
                  </SelectTrigger>
                  <SelectContent>
                    {customers.map((customer) => (
                      <SelectItem key={customer.id} value={customer.id}>
                        {customer.name} - {customer.email}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.customerId && (
                  <p className="text-sm text-destructive">{errors.customerId.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="requiredDate">Required Date *</Label>
                <Input
                  type="date"
                  {...form.register("requiredDate")}
                  className="w-full"
                />
                {errors.requiredDate && (
                  <p className="text-sm text-destructive">{errors.requiredDate.message}</p>
                )}
              </div>
            </div>

            {selectedCustomer && (
              <div className="p-4 bg-muted rounded-lg text-sm space-y-2">
                <h4 className="font-medium">Customer Information</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <p className="text-muted-foreground">Contact</p>
                    <p>{selectedCustomer.phone || "—"}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Address</p>
                    <p>{selectedCustomer.address || "—"}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Payment Terms</p>
                    <p>{selectedCustomer.paymentTerms || "—"}</p>
                  </div>
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                {...form.register("notes")}
                placeholder="Additional notes or special instructions..."
                rows={3}
              />
            </div>
          </CardContent>
        </Card>

        {/* Order Items */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Package className="w-5 h-5" />
                Order Items
              </div>
              <Button type="button" onClick={addOrderLine} size="sm">
                Add Item
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {orderLines.length > 0 ? (
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
                      <TableHead>Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {orderLines.map((line, index) => (
                      <TableRow key={line.id || index}>
                        <TableCell>
                          <Select
                            value={line.productId}
                            onValueChange={(value) => handleProductSelect(index, value)}
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
                          {line.product?.hasVariants ? (
                            <Select
                              value={line.productVariantId || ""}
                              onValueChange={(value) => handleVariantSelect(index, value)}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Select variant" />
                              </SelectTrigger>
                              <SelectContent>
                                {line.product.variants?.map((variant: any) => (
                                  <SelectItem key={variant.id} value={variant.id}>
                                    {variant.displayName}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          ) : (
                            <span className="text-muted-foreground text-sm">No variants</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            min="1"
                            value={line.quantity}
                            onChange={(e) => updateOrderLine(index, { 
                              quantity: parseInt(e.target.value) || 1 
                            })}
                            className="w-20"
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            step="0.01"
                            min="0"
                            value={line.unitPrice}
                            onChange={(e) => updateOrderLine(index, { 
                              unitPrice: parseFloat(e.target.value) || 0 
                            })}
                            className="w-24"
                          />
                        </TableCell>
                        <TableCell>
                          {formatCurrencyPHP(line.quantity * line.unitPrice)}
                        </TableCell>
                        <TableCell>
                          {line.status && (
                            <Badge variant="outline">
                              {line.status}
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => removeOrderLine(index)}
                          >
                            Remove
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>

                {/* Order Summary */}
                <div className="flex justify-end">
                  <Card className="w-80">
                    <CardHeader>
                      <CardTitle className="text-lg">Order Summary</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Items:</span>
                        <span>{orderLines.length}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Total Quantity:</span>
                        <span>{orderLines.reduce((sum, line) => sum + line.quantity, 0)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Subtotal:</span>
                        <span>{formatCurrencyPHP(subtotal)}</span>
                      </div>
                      <div className="flex justify-between font-semibold text-lg border-t pt-2">
                        <span>Total Amount:</span>
                        <span>{formatCurrencyPHP(totalAmount)}</span>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <Package className="w-16 h-16 mx-auto mb-4 opacity-50" />
                <p className="text-lg mb-2">No items in this order</p>
                <p className="text-sm mb-4">Add products to start building the order</p>
                <Button type="button" onClick={addOrderLine}>
                  Add First Item
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </form>
    </div>
  );
}
