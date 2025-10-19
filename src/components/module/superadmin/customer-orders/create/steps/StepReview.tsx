"use client";

import { UseFormReturn } from "react-hook-form";
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, AlertCircle, Factory, Zap } from "lucide-react";
import { format } from "date-fns";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface StepReviewProps {
  form: UseFormReturn<any>;
  customers: Array<{
    id: string;
    name: string;
    email: string;
  }>;
  products: Array<{
    id: string;
    name: string;
    sku: string;
    variants: Array<{
      id: string;
      displayName: string;
    }>;
  }>;
  tenants: Array<{
    id: string;
    name: string;
  }>;
}

export function StepReview({ form, customers, products, tenants }: StepReviewProps) {
  const values = form.watch();

  const customer = customers.find((c) => c.id === values.customerId);
  const tenant = tenants.find((t) => t.id === values.tenantId);
  const orderLines = values.orderLines || [];

  const totalAmount = orderLines.reduce(
    (sum: number, line: any) => sum + line.quantity * line.unitPrice,
    0
  );

  const getProductName = (line: any) => {
    const product = products.find((p) => p.id === line.productId);
    if (!product) return "Unknown Product";

    if (line.productVariantId) {
      const variant = product.variants.find((v) => v.id === line.productVariantId);
      return `${product.name} - ${variant?.displayName || "Unknown Variant"}`;
    }

    return product.name;
  };

  const hasOverrides = values.skipDateValidation || values.skipStockCheck || values.customPricing;

  return (
    <div className="space-y-6">
      {/* Summary Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-green-600" />
            Order Summary
          </CardTitle>
          <CardDescription>
            Review the order details before creating
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <div className="text-sm font-medium text-muted-foreground">Customer</div>
              <div className="text-lg font-medium">{customer?.name || "N/A"}</div>
              <div className="text-xs text-muted-foreground">{customer?.email}</div>
            </div>

            <div>
              <div className="text-sm font-medium text-muted-foreground">Tenant</div>
              <div className="text-lg font-medium">{tenant?.name || "N/A"}</div>
            </div>

            <div>
              <div className="text-sm font-medium text-muted-foreground">Order Date</div>
              <div className="text-lg font-medium">
                {values.orderDate ? format(new Date(values.orderDate), "MMM dd, yyyy") : "Today"}
              </div>
            </div>

            <div>
              <div className="text-sm font-medium text-muted-foreground">Delivery Date</div>
              <div className="text-lg font-medium">
                {values.deliveryDate ? format(new Date(values.deliveryDate), "MMM dd, yyyy") : "Not set"}
              </div>
            </div>
          </div>

          {values.notes && (
            <div>
              <div className="text-sm font-medium text-muted-foreground mb-1">Notes</div>
              <div className="text-sm bg-muted p-3 rounded-md">{values.notes}</div>
            </div>
          )}

          <div className="border-t pt-4">
            <div className="text-sm font-medium text-muted-foreground mb-2">Order Lines ({orderLines.length})</div>
            <div className="space-y-2">
              {orderLines.map((line: any, index: number) => (
                <div key={index} className="flex items-center justify-between p-2 bg-muted rounded-md">
                  <div>
                    <div className="font-medium text-sm">{getProductName(line)}</div>
                    <div className="text-xs text-muted-foreground">Qty: {line.quantity} × ${line.unitPrice.toFixed(2)}</div>
                  </div>
                  <div className="font-medium">${(line.quantity * line.unitPrice).toFixed(2)}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="border-t pt-4 flex items-center justify-between">
            <div className="text-lg font-semibold">Total Amount</div>
            <div className="text-2xl font-bold text-primary">${totalAmount.toFixed(2)}</div>
          </div>
        </CardContent>
      </Card>

      {/* Overrides Warning */}
      {hasOverrides && (
        <Alert variant="destructive" className="bg-amber-50 dark:bg-amber-950 border-amber-200 dark:border-amber-800">
          <AlertCircle className="h-4 w-4 text-amber-600" />
          <AlertTitle className="text-amber-900 dark:text-amber-100">
            SuperAdmin Overrides Enabled
          </AlertTitle>
          <AlertDescription className="text-amber-800 dark:text-amber-200">
            <div className="mt-2 space-y-1">
              {values.skipDateValidation && <div>• Skip Date Validation</div>}
              {values.skipStockCheck && <div>• Skip Stock Check</div>}
              {values.customPricing && <div>• Custom Pricing Applied</div>}
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Production Options */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Factory className="h-5 w-5 text-blue-600" />
            Production Options
          </CardTitle>
          <CardDescription>
            Automatically create production orders and set order status
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <FormField
            control={form.control}
            name="createProductionOrders"
            render={({ field }) => (
              <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                <FormControl>
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
                <div className="space-y-1 leading-none">
                  <FormLabel>
                    Create Production Orders
                  </FormLabel>
                  <FormDescription>
                    Automatically create production orders for all order lines ({orderLines.length} PO{orderLines.length > 1 ? "s" : ""})
                  </FormDescription>
                </div>
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="autoApprove"
            render={({ field }) => (
              <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                <FormControl>
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
                <div className="space-y-1 leading-none">
                  <FormLabel className="flex items-center gap-2">
                    Auto-Approve Order
                    <Zap className="h-3 w-3 text-amber-500" />
                  </FormLabel>
                  <FormDescription>
                    Set order status to APPROVED immediately (skips PENDING status)
                  </FormDescription>
                </div>
              </FormItem>
            )}
          />
        </CardContent>
      </Card>

      {/* Audit Reason */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-red-600" />
            Audit Reason (Required)
          </CardTitle>
          <CardDescription>
            Document why you're creating this customer order
            {hasOverrides && " and using SuperAdmin overrides"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <FormField
            control={form.control}
            name="reason"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Reason (Min 15 characters) *</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Explain why you're creating this customer order..."
                    className="min-h-[120px]"
                    {...field}
                  />
                </FormControl>
                <FormDescription>
                  This will be logged in the audit trail for compliance
                  {hasOverrides && " and must justify the use of overrides"}
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </CardContent>
      </Card>
    </div>
  );
}
