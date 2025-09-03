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

interface OrderLine {
  productId: string;
  productVariantId?: string;
  quantity: number;
  unitPrice: number;
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

type CustomerOrderForm = CustomerOrderCreateForm;

interface CustomerOrderCreateV2ClientProps {
  customers: Customer[];
  products: any[]; // From getProductsWithVariantsForOrders
}

const STEPS = [
  { id: "customer", title: "Customer", description: "Select customer" },
  { id: "products", title: "Products", description: "Add order items" },
  { id: "details", title: "Details", description: "Order details" },
  { id: "review", title: "Review", description: "Confirm & submit" },
];

export function CustomerOrderCreateV2Client({
  customers,
  products,
}: CustomerOrderCreateV2ClientProps) {
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

  useEffect(() => {
    setValue("orderLines", orderLines, { shouldValidate: true, shouldDirty: true });
  }, [orderLines, setValue]);

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
      case 0: // Customer step
        return customerId !== "";
      case 1: // Products step
        return orderLines.length > 0 && orderLines.every(line => 
          line.productId !== "" && line.quantity > 0 && line.unitPrice >= 0
        );
      case 2: // Details step
        return true; // Always allow going to review
      default:
        return true;
    }
  };

  const addOrderLine = () => {
    setOrderLines([
      ...orderLines,
      {
        productId: "",
        productVariantId: "",
        quantity: 1,
        unitPrice: 0,
      },
    ]);
  };

  const removeOrderLine = (index: number) => {
    setOrderLines(orderLines.filter((_, i) => i !== index));
  };

  const updateOrderLine = (index: number, updates: Partial<OrderLine>) => {
    setOrderLines(
      orderLines.map((line, i) => (i === index ? { ...line, ...updates } : line))
    );
  };

  const calculateTotal = () => {
    return orderLines.reduce((sum, line) => sum + (line.quantity * line.unitPrice), 0);
  };

  const onSubmit = async (data: CustomerOrderForm) => {
    if (orderLines.length === 0) {
      toast.error("Please add at least one order line");
      return;
    }
    const invalidOrderLine = orderLines.some(line => line.productId === "" || line.quantity <= 0 || line.unitPrice < 0);
    if (invalidOrderLine) {
      toast.error("Please ensure all order lines have a selected product, quantity greater than 0, and a valid unit price.");
      return;
    }

    setIsSubmitting(true);
    const normalizedOrderLines = orderLines.map((line) => ({
      ...line,
      productVariantId:
        line.productVariantId && line.productVariantId.trim() !== ""
          ? line.productVariantId
          : null,
    }));
    try {
      const orderData = {
        ...data,
        orderLines: normalizedOrderLines,
      };

      const result = await createCustomerOrder(orderData);
      toast.success("Customer order created successfully!");
      // Redirect to V2 order detail page instead of the original
      router.push(`/admin/customer-orders-v2/${result.id}`);
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
      <div className="grid gap-4">
        <div className="space-y-2">
          <Label htmlFor="customer">Customer *</Label>
          <Select
            value={customerId}
            onValueChange={(value) => setValue("customerId", value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select a customer" />
            </SelectTrigger>
            <SelectContent>
              {customers.map((customer) => (
                <SelectItem key={customer.id} value={customer.id}>
                  {customer.name} ({customer.code})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.customerId && (
            <p className="text-sm text-destructive">{errors.customerId.message}</p>
          )}
        </div>

        {selectedCustomer && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Customer Details</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="font-medium">Contact Person</p>
                  <p className="text-muted-foreground">{selectedCustomer.contactPerson}</p>
                </div>
                <div>
                  <p className="font-medium">Email</p>
                  <p className="text-muted-foreground">{selectedCustomer.email}</p>
                </div>
                <div>
                  <p className="font-medium">Phone</p>
                  <p className="text-muted-foreground">{selectedCustomer.phone}</p>
                </div>
                <div>
                  <p className="font-medium">Credit Limit</p>
                  <p className="text-muted-foreground">
                    {selectedCustomer.creditLimit
                      ? formatCurrencyPHP(Number(selectedCustomer.creditLimit))
                      : "No limit set"}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );

  const renderProductsStep = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium">Order Items</h3>
        <Button onClick={addOrderLine} size="sm">
          <Plus className="h-4 w-4 mr-2" />
          Add Item
        </Button>
      </div>

      {orderLines.length === 0 ? (
        <Card>
          <CardContent className="p-6 text-center">
            <Package className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground">No items added yet</p>
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
                  <TableHead className="w-24">Quantity</TableHead>
                  <TableHead className="w-32">Unit Price</TableHead>
                  <TableHead className="w-32">Total</TableHead>
                  <TableHead className="w-12"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {orderLines.map((line, index) => {
                  const product = products.find(p => p.id === line.productId);
                  return (
                    <TableRow key={index}>
                      <TableCell>
                        <Select
                          value={line.productId}
                          onValueChange={(value) => {
                            const selectedProduct = products.find(p => p.id === value);
                            updateOrderLine(index, {
                              productId: value,
                              productVariantId: "",
                              unitPrice: selectedProduct?.sellingPrice || 0,
                              product: selectedProduct,
                            });
                          }}
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
                        {product?.hasVariants && product.variants?.length > 0 ? (
                          <Select
                            value={line.productVariantId || ""}
                            onValueChange={(value) => {
                              const selectedVariant = product.variants.find(v => v.id === value);
                              updateOrderLine(index, {
                                productVariantId: value,
                                unitPrice: selectedVariant?.sellingPrice || product.sellingPrice,
                                productVariant: selectedVariant,
                              });
                            }}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select variant" />
                            </SelectTrigger>
                            <SelectContent>
                              {product.variants.map((variant) => (
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
                          onChange={(e) =>
                            updateOrderLine(index, { quantity: parseInt(e.target.value) || 1 })
                          }
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          min="0"
                          step="0.01"
                          value={line.unitPrice}
                          onChange={(e) =>
                            updateOrderLine(index, { unitPrice: parseFloat(e.target.value) || 0 })
                          }
                        />
                      </TableCell>
                      <TableCell className="font-medium">
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
        <div className="flex justify-end">
          <div className="text-right">
            <p className="text-lg font-medium">
              Total: {formatCurrencyPHP(calculateTotal())}
            </p>
          </div>
        </div>
      )}
    </div>
  );

  const renderDetailsStep = () => (
    <div className="space-y-6">
      <div className="grid gap-4">
        <div className="space-y-2">
          <Label htmlFor="requiredDate">Required Date *</Label>
          <Input
            type="date"
            {...form.register("requiredDate")}
          />
          {errors.requiredDate && (
            <p className="text-sm text-destructive">{errors.requiredDate.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="notes">Notes</Label>
          <Textarea
            placeholder="Add any special instructions or notes for this order..."
            {...form.register("notes")}
          />
        </div>
      </div>
    </div>
  );

  const renderReviewStep = () => (
    <div className="space-y-6">
      {/* Customer Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <ShoppingCart className="h-5 w-5 mr-2" />
            Order Summary
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="font-medium">Customer</p>
              <p className="text-muted-foreground">
                {selectedCustomer?.name} ({selectedCustomer?.code})
              </p>
            </div>
            <div>
              <p className="font-medium">Required Date</p>
              <p className="text-muted-foreground">{watch("requiredDate")}</p>
            </div>
          </div>
          
          {watch("notes") && (
            <div>
              <p className="font-medium">Notes</p>
              <p className="text-muted-foreground">{watch("notes")}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Order Items */}
      <Card>
        <CardHeader>
          <CardTitle>Order Items ({orderLines.length})</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Product</TableHead>
                <TableHead>Variant</TableHead>
                <TableHead className="text-right">Qty</TableHead>
                <TableHead className="text-right">Unit Price</TableHead>
                <TableHead className="text-right">Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {orderLines.map((line, index) => (
                <TableRow key={index}>
                  <TableCell>
                    <div>
                      <p className="font-medium">{line.product?.name}</p>
                      <p className="text-sm text-muted-foreground">{line.product?.sku}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    {line.productVariant ? (
                      <div>
                        <p>{line.productVariant.displayName}</p>
                        <p className="text-sm text-muted-foreground">{line.productVariant.sku}</p>
                      </div>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">{line.quantity}</TableCell>
                  <TableCell className="text-right">
                    {formatCurrencyPHP(line.unitPrice)}
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    {formatCurrencyPHP(line.quantity * line.unitPrice)}
                  </TableCell>
                </TableRow>
              ))}
              <TableRow>
                <TableCell colSpan={4} className="font-medium">Total</TableCell>
                <TableCell className="text-right font-bold text-lg">
                  {formatCurrencyPHP(calculateTotal())}
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>
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
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Progress Header */}
      <Card>
        <CardContent className="p-6">
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-medium">Create Customer Order</h3>
              <span className="text-sm text-muted-foreground">
                Step {currentStep + 1} of {STEPS.length}
              </span>
            </div>
            
            <Progress value={progress} className="w-full" />
            
            <div className="flex justify-between">
              {STEPS.map((step, index) => (
                <div
                  key={step.id}
                  className={`flex items-center space-x-2 ${
                    index <= currentStep ? "text-primary" : "text-muted-foreground"
                  }`}
                >
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                      index < currentStep
                        ? "bg-primary text-primary-foreground"
                        : index === currentStep
                        ? "bg-primary/20 text-primary"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {index < currentStep ? (
                      <Check className="h-4 w-4" />
                    ) : (
                      index + 1
                    )}
                  </div>
                  <div className="hidden sm:block">
                    <p className="text-sm font-medium">{step.title}</p>
                    <p className="text-xs text-muted-foreground">{step.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Step Content */}
      <Card>
        <CardHeader>
          <CardTitle>{STEPS[currentStep].title}</CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <form onSubmit={handleSubmit(onSubmit)}>
            {renderCurrentStep()}
          </form>
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex justify-between">
        <div>
          {currentStep > 0 ? (
            <Button variant="outline" onClick={prevStep}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Previous
            </Button>
          ) : (
            <Button variant="outline" asChild>
              <Link href="/admin/customer-orders-v2">
                Cancel
              </Link>
            </Button>
          )}
        </div>

        <div>
          {currentStep < STEPS.length - 1 ? (
            <Button onClick={nextStep} disabled={!canGoNext()}>
              Next
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          ) : (
            <Button 
              onClick={handleSubmit(onSubmit)} 
              disabled={isSubmitting || !canGoNext()}
            >
              {isSubmitting ? "Creating..." : "Create Order"}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
