"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, ArrowRight, Check, Plus, X, Package, ShoppingCart } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
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

import { createCustomerOrder } from "@/lib/actions/customer-order";
import { formatCurrencyPHP } from "@/lib/constant";
import { customerOrderCreateSchema, type CustomerOrderCreateForm } from "@/lib/validation/customer-order-create";
import type { Customer } from "@prisma/client";

// Types for the form
interface OrderLine {
  productId: string;
  productVariantId?: string;
  quantity: number;
  unitPrice: number;
  product?: {
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

// Use the validation schema types
type CustomerOrderForm = CustomerOrderCreateForm;

interface CustomerOrderCreateClientProps {
  customers: Customer[];
  products: any[]; // From getProductsWithVariantsForOrders
}

const STEPS = [
  { id: "customer", title: "Customer", description: "Select customer" },
  { id: "products", title: "Products", description: "Add order items" },
  { id: "details", title: "Details", description: "Order details" },
  { id: "review", title: "Review", description: "Confirm & submit" },
];

export function CustomerOrderCreateClient({
  customers,
  products,
}: CustomerOrderCreateClientProps) {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [orderLines, setOrderLines] = useState<OrderLine[]>([]);

  const form = useForm<CustomerOrderForm>({
    resolver: zodResolver(customerOrderCreateSchema),
    defaultValues: {
      customerId: "",
      requiredDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
        .toISOString()
        .split("T")[0], // 7 days from now
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
  const customerId = watch("customerId");

  useEffect(() => {
    if (customerId) {
      const customer = customers.find((c) => c.id === customerId);
      setSelectedCustomer(customer || null);
    } else {
      setSelectedCustomer(null);
    }
  }, [customerId, customers]);

  const nextStep = () => {
    if (currentStep < STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const canGoNext = () => {
    switch (currentStep) {
      case 0: // Customer
        return customerId !== "";
      case 1: // Products
        return orderLines.length > 0;
      case 2: // Details
        return watch("requiredDate") !== "";
      case 3: // Review
        return true;
      default:
        return false;
    }
  };

  const addOrderLine = () => {
    const newLine: OrderLine = {
      productId: "",
      productVariantId: "",
      quantity: 1,
      unitPrice: 0,
    };
    setOrderLines([...orderLines, newLine]);
  };

  const removeOrderLine = (index: number) => {
    const newLines = orderLines.filter((_, i) => i !== index);
    setOrderLines(newLines);
  };

  const updateOrderLine = (index: number, field: string, value: any) => {
    const newLines = [...orderLines];
    const line = newLines[index];
    
    if (field === "productId") {
      const product = products.find((p) => p.id === value);
      if (product) {
        line.productId = value;
        line.product = {
          name: product.name,
          sku: product.sku,
          sellingPrice: product.sellingPrice,
          hasVariants: product.hasVariants,
        };
        line.unitPrice = product.sellingPrice;
        // Reset variant selection when product changes
        line.productVariantId = "";
        line.productVariant = undefined;
      }
    } else if (field === "productVariantId") {
      const product = products.find((p) => p.id === line.productId);
      if (product && value) {
        const variant = product.variants?.find((v: any) => v.id === value);
        if (variant) {
          line.productVariantId = value;
          line.productVariant = {
            displayName: variant.displayName,
            sku: variant.sku,
            sellingPrice: variant.sellingPrice,
          };
          line.unitPrice = variant.sellingPrice;
        }
      } else {
        line.productVariantId = "";
        line.productVariant = undefined;
        // Reset to product price if no variant
        if (line.product) {
          line.unitPrice = line.product.sellingPrice;
        }
      }
    } else {
      (line as any)[field] = value;
    }
    
    setOrderLines(newLines);
  };

  const calculateTotal = () => {
    return orderLines.reduce((sum, line) => sum + (line.quantity * line.unitPrice), 0);
  };

  const onSubmit = async (data: CustomerOrderForm) => {
    if (orderLines.length === 0) {
      toast.error("Please add at least one order line");
      return;
    }

    setIsSubmitting(true);
    try {
      // Prepare the order data with order lines from state
      const orderData = {
        ...data,
        orderLines: orderLines.map((line) => ({
          productId: line.productId,
          productVariantId: line.productVariantId || null,
          quantity: line.quantity,
          unitPrice: line.unitPrice,
        })),
      };

      const result = await createCustomerOrder(orderData);
      
      toast.success("Customer order created successfully!");
      router.push(`/admin/customer-orders/${result.id}`);
    } catch (error) {
      console.error("Error creating customer order:", error);
      toast.error("Failed to create customer order");
    } finally {
      setIsSubmitting(false);
    }
  };

  const progress = ((currentStep + 1) / STEPS.length) * 100;

  const renderCustomerStep = () => (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h3 className="text-lg font-semibold">Select Customer</h3>
        <p className="text-muted-foreground">
          Choose the customer for this order.
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="customer">Customer</Label>
        <Select
          value={customerId || ""}
          onValueChange={(value) => setValue("customerId", value)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select a customer" />
          </SelectTrigger>
          <SelectContent>
            {customers.map((customer) => (
              <SelectItem key={customer.id} value={customer.id}>
                <div className="flex flex-col">
                  <span>{customer.name}</span>
                  <span className="text-sm text-muted-foreground">
                    {customer.email}
                  </span>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {errors.customerId && (
          <p className="text-sm text-destructive mt-1">
            {errors.customerId.message}
          </p>
        )}
      </div>

      {selectedCustomer && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Customer Details</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              <div><strong>Name:</strong> {selectedCustomer.name}</div>
              <div><strong>Email:</strong> {selectedCustomer.email}</div>
              <div><strong>Phone:</strong> {selectedCustomer.phone}</div>
              {selectedCustomer.address && (
                <div><strong>Address:</strong> {selectedCustomer.address}</div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );

  const renderProductsStep = () => (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h3 className="text-lg font-semibold">Add Order Items</h3>
        <p className="text-muted-foreground">
          Add products and quantities for this order.
        </p>
      </div>

      <div className="flex justify-between items-center">
        <h4 className="font-medium">Order Lines</h4>
        <Button onClick={addOrderLine} size="sm">
          <Plus className="mr-2 h-4 w-4" />
          Add Item
        </Button>
      </div>

      {orderLines.length === 0 ? (
        <Card>
          <CardContent className="py-8">
            <div className="text-center space-y-2">
              <Package className="mx-auto h-8 w-8 text-muted-foreground" />
              <p className="text-muted-foreground">
                No items added yet. Click "Add Item" to start.
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead>Variant</TableHead>
                  <TableHead>Quantity</TableHead>
                  <TableHead>Unit Price</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {orderLines.map((line, index) => {
                  const product = products.find((p) => p.id === line.productId);
                  return (
                    <TableRow key={index}>
                      <TableCell>
                        <Select
                          value={line.productId || ""}
                          onValueChange={(value) =>
                            updateOrderLine(index, "productId", value)
                          }
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select product" />
                          </SelectTrigger>
                          <SelectContent>
                            {products.map((product) => (
                              <SelectItem key={product.id} value={product.id}>
                                <div className="flex flex-col">
                                  <span>{product.name}</span>
                                  <span className="text-sm text-muted-foreground">
                                    {product.sku} - {formatCurrencyPHP(product.sellingPrice)}
                                  </span>
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>
                        {product?.hasVariants && product.variants?.length > 0 ? (
                          <Select
                            value={line.productVariantId || ""}
                            onValueChange={(value) =>
                              updateOrderLine(index, "productVariantId", value)
                            }
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select variant" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="">No variant</SelectItem>
                              {product.variants.map((variant: any) => (
                                <SelectItem key={variant.id} value={variant.id}>
                                  <div className="flex flex-col">
                                    <span>{variant.displayName}</span>
                                    <span className="text-sm text-muted-foreground">
                                      {variant.sku} - {formatCurrencyPHP(variant.sellingPrice)}
                                    </span>
                                  </div>
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
                          onChange={(e) =>
                            updateOrderLine(index, "quantity", parseInt(e.target.value) || 1)
                          }
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          value={line.unitPrice}
                          onChange={(e) =>
                            updateOrderLine(index, "unitPrice", parseFloat(e.target.value) || 0)
                          }
                        />
                      </TableCell>
                      <TableCell>
                        {formatCurrencyPHP(line.quantity * line.unitPrice)}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeOrderLine(index)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {orderLines.length > 0 && (
        <div className="text-right">
          <div className="text-lg font-semibold">
            Total: {formatCurrencyPHP(calculateTotal())}
          </div>
        </div>
      )}
    </div>
  );

  const renderDetailsStep = () => (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h3 className="text-lg font-semibold">Order Details</h3>
        <p className="text-muted-foreground">
          Set the required date and add any notes for this order.
        </p>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="requiredDate">Required Date</Label>
          <Input
            id="requiredDate"
            type="date"
            value={watch("requiredDate")}
            onChange={(e) => setValue("requiredDate", e.target.value)}
          />
          {errors.requiredDate && (
            <p className="text-sm text-destructive mt-1">
              {errors.requiredDate.message}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="notes">Notes (Optional)</Label>
          <Textarea
            id="notes"
            placeholder="Add any special instructions or notes for this order..."
            value={watch("notes") || ""}
            onChange={(e) => setValue("notes", e.target.value)}
            rows={4}
          />
        </div>
      </div>
    </div>
  );

  const renderReviewStep = () => (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h3 className="text-lg font-semibold">Review Order</h3>
        <p className="text-muted-foreground">
          Please review your order details before submitting.
        </p>
      </div>

      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Customer Information</CardTitle>
          </CardHeader>
          <CardContent>
            {selectedCustomer && (
              <div className="space-y-2 text-sm">
                <div><strong>Name:</strong> {selectedCustomer.name}</div>
                <div><strong>Email:</strong> {selectedCustomer.email}</div>
                <div><strong>Phone:</strong> {selectedCustomer.phone}</div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Order Details</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              <div><strong>Required Date:</strong> {watch("requiredDate")}</div>
              {watch("notes") && (
                <div><strong>Notes:</strong> {watch("notes")}</div>
              )}
              <div><strong>Total Items:</strong> {orderLines.length}</div>
              <div><strong>Total Amount:</strong> {formatCurrencyPHP(calculateTotal())}</div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Order Items</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {orderLines.map((line, index) => (
                <div key={index} className="flex justify-between items-center p-2 border rounded">
                  <div>
                    <div className="font-medium">
                      {line.product?.name}
                      {line.productVariant && (
                        <span className="text-muted-foreground ml-2">
                          ({line.productVariant.displayName})
                        </span>
                      )}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Qty: {line.quantity} × {formatCurrencyPHP(line.unitPrice)}
                    </div>
                  </div>
                  <div className="font-medium">
                    {formatCurrencyPHP(line.quantity * line.unitPrice)}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 0:
        return renderCustomerStep();
      case 1:
        return renderProductsStep();
      case 2:
        return renderDetailsStep();
      case 3:
        return renderReviewStep();
      default:
        return null;
    }
  };

  return (
    <div className="flex gap-6 h-[calc(100vh-200px)]">
      {/* Left Sidebar - Steps */}
      <div className="w-80 flex flex-col border rounded-lg bg-card">
        {/* Header */}
        <div className="p-6 border-b border-border">
          <div className="flex items-center gap-2 mb-2">
            <ShoppingCart className="h-5 w-5 text-primary" />
            <h1 className="text-lg font-semibold">Create Customer Order</h1>
          </div>
          <p className="text-muted-foreground text-sm mt-1">
            Create an order independently for archiving. Production planning happens separately.
          </p>
        </div>

        {/* Progress Section */}
        <div className="p-6 border-b border-border">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">
                Step {currentStep + 1} of {STEPS.length}
              </span>
              <span className="text-sm text-muted-foreground">
                {Math.round(progress)}%
              </span>
            </div>
            <Progress value={progress} className="w-full" />
          </div>
        </div>

        {/* Steps List */}
        <div className="flex-1 p-6 space-y-3 overflow-y-auto">
          {STEPS.map((step, index) => {
            const isActive = index === currentStep;
            const isCompleted = index < currentStep;

            return (
              <div
                key={step.id}
                className={`flex items-start space-x-3 p-3 rounded-lg transition-colors ${
                  isActive
                    ? "bg-primary/10 border-2 border-primary/20"
                    : isCompleted
                    ? "bg-green-50 border border-green-200"
                    : "bg-muted/30 border border-border"
                }`}
              >
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium flex-shrink-0 ${
                    isCompleted
                      ? "bg-green-600 text-white"
                      : isActive
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground"
                  }`}
                >
                  {isCompleted ? <Check className="w-4 h-4" /> : index + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm">{step.title}</div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {step.description}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Navigation - Fixed at bottom */}
        <div className="p-6 border-t border-border bg-background">
          <div className="flex justify-between space-x-3">
            <Button
              variant="outline"
              onClick={prevStep}
              disabled={currentStep === 0}
              className="flex-1"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Previous
            </Button>

            {currentStep === STEPS.length - 1 ? (
              <Button
                onClick={handleSubmit(onSubmit)}
                disabled={!canGoNext() || isSubmitting}
                className="flex-1"
              >
                {isSubmitting ? "Creating..." : "Create Order"}
              </Button>
            ) : (
              <Button onClick={nextStep} disabled={!canGoNext()} className="flex-1">
                Next
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Right Content Area - Scrollable */}
      <div className="flex-1 flex flex-col min-h-0">
        {/* Back Button */}
        <div className="mb-4">
          <Link href="/admin/customer-orders">
            <Button variant="outline" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Customer Orders
            </Button>
          </Link>
        </div>

        {/* Form Content */}
        <div className="flex-1 overflow-y-auto">
          <Card className="max-w-4xl">
            <CardHeader className="pb-4">
              <CardTitle className="text-xl">
                {STEPS[currentStep]?.title}
              </CardTitle>
              <p className="text-muted-foreground text-sm">
                {STEPS[currentStep]?.description}
              </p>
            </CardHeader>
            <CardContent>
              {renderCurrentStep()}
            </CardContent>
          </Card>
        </div>

        {/* Mobile Navigation - Fixed at bottom on small screens */}
        <div className="lg:hidden bg-card border-t border-border p-4">
          <div className="flex justify-between space-x-3">
            <Button
              variant="outline"
              onClick={prevStep}
              disabled={currentStep === 0}
              className="flex-1"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Previous
            </Button>

            {currentStep === STEPS.length - 1 ? (
              <Button
                onClick={handleSubmit(onSubmit)}
                disabled={!canGoNext() || isSubmitting}
                className="flex-1"
              >
                {isSubmitting ? "Creating..." : "Create Order"}
              </Button>
            ) : (
              <Button onClick={nextStep} disabled={!canGoNext()} className="flex-1">
                Next
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
