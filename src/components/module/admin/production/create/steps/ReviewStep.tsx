"use client";

import { UseFormReturn } from "react-hook-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Package,
  User,
  ShoppingCart,
  Calendar,
  Clock,
  AlertTriangle,
  FileText,
  Wrench,
  CheckCircle,
  Info,
} from "lucide-react";
import { formatCurrencyPHP } from "@/lib/constant";

import type { ProductionCreateForm } from "@/lib/validation/production-create";
import type { Customer, CustomerOrder } from "@prisma/client";

interface ReviewStepProps {
  form: UseFormReturn<ProductionCreateForm>;
  products: any[];
  customers: Customer[];
  customerOrders: CustomerOrder[];
}

const PRIORITY_CONFIG = {
  LOW: { label: "Low", color: "bg-gray-500", variant: "secondary" as const },
  MEDIUM: {
    label: "Medium",
    color: "bg-blue-500",
    variant: "default" as const,
  },
  HIGH: { label: "High", color: "bg-orange-500", variant: "default" as const },
  URGENT: {
    label: "Urgent",
    color: "bg-red-500",
    variant: "destructive" as const,
  },
  CRITICAL: {
    label: "Critical",
    color: "bg-red-700",
    variant: "destructive" as const,
  },
};

export function ReviewStep({
  form,
  products,
  customers,
  customerOrders,
}: ReviewStepProps) {
  const values = form.watch();

  const selectedProduct = products.find((p) => p.id === values.productId);
  const selectedVariant = selectedProduct?.variants?.find(
    (v: any) => v.id === values.productVariantId
  );
  const selectedCustomer = customers.find((c) => c.id === values.customerId);
  const selectedOrder = customerOrders.find(
    (o) => o.id === values.customerOrderId
  );

  const priorityConfig =
    PRIORITY_CONFIG[values.priority as keyof typeof PRIORITY_CONFIG];

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      weekday: "short",
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const getDurationDays = () => {
    if (!values.startDate || !values.dueDate) return 0;
    const start = new Date(values.startDate);
    const due = new Date(values.dueDate);
    const diffTime = due.getTime() - start.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h3 className="text-lg font-semibold">Review Production Order</h3>
        <p className="text-muted-foreground">
          Please review all details before creating the production order.
        </p>
      </div>

      {/* Source Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Info className="h-5 w-5" />
            Source
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Creation Type:</span>
              <Badge
                variant={
                  values.source === "standalone" ? "default" : "secondary"
                }
              >
                {values.source === "standalone"
                  ? "Standalone Production"
                  : "From Customer Order"}
              </Badge>
            </div>

            {values.source === "customer_order" &&
              selectedCustomer &&
              selectedOrder && (
                <>
                  <Separator />
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">
                        {selectedCustomer.name}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <ShoppingCart className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">
                        Order #{selectedOrder.orderNumber}
                      </span>
                      <Badge variant="outline">{selectedOrder.status}</Badge>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Total: {formatCurrencyPHP(selectedOrder.totalAmount)}
                    </div>
                  </div>
                </>
              )}
          </div>
        </CardContent>
      </Card>

      {/* Product Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Package className="h-5 w-5" />
            Product Details
          </CardTitle>
        </CardHeader>
        <CardContent>
          {selectedProduct && (
            <div className="space-y-3">
              <div>
                <div className="font-medium">{selectedProduct.name}</div>
                <div className="text-sm text-muted-foreground">
                  SKU: {selectedProduct.sku}
                </div>
                {selectedProduct.category && (
                  <Badge variant="outline" className="mt-1">
                    {selectedProduct.category.name}
                  </Badge>
                )}
              </div>

              {selectedVariant && (
                <>
                  <Separator />
                  <div>
                    <div className="text-sm font-medium">Selected Variant:</div>
                    <div className="font-medium">
                      {selectedVariant.displayName}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      SKU: {selectedVariant.sku}
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      {selectedVariant.sizeName && (
                        <Badge variant="outline">
                          Size: {selectedVariant.sizeName}
                        </Badge>
                      )}
                      {selectedVariant.colorName && (
                        <Badge variant="outline">
                          Color: {selectedVariant.colorName}
                        </Badge>
                      )}
                    </div>
                  </div>
                </>
              )}

              <Separator />
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Current Stock:</span>
                  <div className="font-medium">
                    {selectedVariant?.currentStock ??
                      selectedProduct.currentStock}
                  </div>
                </div>
                <div>
                  <span className="text-muted-foreground">Unit Price:</span>
                  <div className="font-medium">
                    {formatCurrencyPHP(
                      selectedVariant?.unitPrice ?? selectedProduct.unitPrice
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Production Details */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Wrench className="h-5 w-5" />
            Production Details
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="text-sm text-muted-foreground">Quantity:</span>
                <div className="text-xl font-bold">{values.quantity} units</div>
              </div>
              <div>
                <span className="text-sm text-muted-foreground">Priority:</span>
                <div className="flex items-center gap-2 mt-1">
                  <div
                    className={`w-3 h-3 rounded-full ${priorityConfig?.color}`}
                  />
                  <Badge variant={priorityConfig?.variant}>
                    {priorityConfig?.label}
                  </Badge>
                </div>
              </div>
            </div>

            <Separator />

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  Start Date
                </div>
                <div className="font-medium">
                  {formatDate(values.startDate)}
                </div>
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Clock className="h-4 w-4" />
                  Due Date
                </div>
                <div className="font-medium">{formatDate(values.dueDate)}</div>
              </div>
            </div>

            <div className="p-3 bg-blue-50 rounded-lg">
              <div className="flex items-center gap-2 text-blue-800">
                <Clock className="h-4 w-4" />
                <span className="font-medium">
                  Duration: {getDurationDays()} days
                </span>
              </div>
            </div>

            {values.notes && (
              <>
                <Separator />
                <div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                    <FileText className="h-4 w-4" />
                    Notes
                  </div>
                  <div className="text-sm bg-gray-50 p-3 rounded-lg">
                    {values.notes}
                  </div>
                </div>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Options */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Production Options</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Package className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">Generate BOM:</span>
              </div>
              <Badge variant={values.generateBOM ? "default" : "secondary"}>
                {values.generateBOM ? "Enabled" : "Disabled"}
              </Badge>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Wrench className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">Reserve Materials:</span>
              </div>
              <Badge
                variant={values.reserveMaterials ? "default" : "secondary"}
              >
                {values.reserveMaterials ? "Enabled" : "Disabled"}
              </Badge>
            </div>
          </div>

          {(values.generateBOM || values.reserveMaterials) && (
            <div className="mt-4 p-3 bg-green-50 rounded-lg border border-green-200">
              <div className="flex items-start gap-2">
                <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
                <div className="text-sm text-green-800">
                  <p className="font-medium">Material Planning Enabled</p>
                  <p>
                    {values.generateBOM &&
                      "BOM will be generated automatically. "}
                    {values.reserveMaterials &&
                      "Materials will be reserved from available inventory."}
                  </p>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Warnings */}
      {(values.priority === "URGENT" ||
        values.priority === "CRITICAL" ||
        getDurationDays() < 3) && (
        <Card className="border-amber-200 bg-amber-50">
          <CardContent className="p-4">
            <div className="flex items-start gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5" />
              <div className="space-y-1">
                <p className="font-medium text-amber-800">
                  Production Warnings
                </p>
                <div className="text-sm text-amber-700 space-y-1">
                  {(values.priority === "URGENT" ||
                    values.priority === "CRITICAL") && (
                    <p>
                      • High priority production order - ensure resources are
                      available
                    </p>
                  )}
                  {getDurationDays() < 3 && (
                    <p>
                      • Short production timeline - consider resource allocation
                      carefully
                    </p>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Final Confirmation */}
      <Card className="border-blue-200 bg-blue-50">
        <CardContent className="p-4">
          <div className="flex items-start gap-2">
            <Info className="h-5 w-5 text-blue-600 mt-0.5" />
            <div className="text-sm text-blue-800">
              <p className="font-medium">Ready to Create</p>
              <p>
                Once created, this production order will be added to the
                production queue. You can track its progress and make
                adjustments from the production management page.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
