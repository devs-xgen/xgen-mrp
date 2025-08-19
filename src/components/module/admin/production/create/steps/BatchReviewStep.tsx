"use client";

import { UseFormReturn } from "react-hook-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Package,
  Factory,
  Calendar,
  Clock,
  AlertTriangle,
  CheckCircle,
  Info,
  ShoppingCart,
} from "lucide-react";
import { formatCurrencyPHP } from "@/lib/constant";

import type { ProductionCreateForm } from "@/lib/validation/production-create";
import type { Customer, CustomerOrder } from "@prisma/client";

interface BatchReviewStepProps {
  form: UseFormReturn<ProductionCreateForm>;
  products: any[];
  customers: Customer[];
  customerOrders: CustomerOrder[];
  batchItems: Array<{
    productId: string;
    productVariantId?: string;
    quantity: number;
    customerOrderId?: string;
    priority?: "LOW" | "MEDIUM" | "HIGH" | "URGENT" | "CRITICAL";
    notes?: string;
  }>;
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

export function BatchReviewStep({
  form,
  products,
  customers,
  customerOrders,
  batchItems,
}: BatchReviewStepProps) {
  const watchedValues = form.watch();

  // Calculate batch statistics
  const totalQuantity = batchItems.reduce((sum, item) => sum + item.quantity, 0);
  const uniqueCustomers = new Set(
    batchItems
      .map(item => item.customerOrderId)
      .filter(Boolean)
      .map(orderId => {
        const order = customerOrders.find(o => o.id === orderId);
        return order?.customerId;
      })
      .filter(Boolean)
  ).size;

  const estimatedTotalCost = batchItems.reduce((sum, item) => {
    const product = products.find(p => p.id === item.productId);
    if (product) {
      const variant = product.variants?.find((v: any) => v.id === item.productVariantId);
      const unitCost = variant ? variant.unitCost : product.unitCost;
      return sum + (item.quantity * (unitCost || 0));
    }
    return sum;
  }, 0);

  return (
    <div className="space-y-6">
      {/* Batch Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Factory className="h-5 w-5" />
            Batch Production Overview
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Production Orders</p>
              <p className="text-2xl font-bold">{batchItems.length}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Total Quantity</p>
              <p className="text-2xl font-bold">{totalQuantity}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Customer Orders</p>
              <p className="text-2xl font-bold">{uniqueCustomers || 'N/A'}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Est. Total Cost</p>
              <p className="text-2xl font-bold">{formatCurrencyPHP(estimatedTotalCost)}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Common Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5" />
            Common Settings
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Start Date</p>
                  <p className="text-sm text-muted-foreground">
                    {new Date(watchedValues.startDate).toLocaleDateString()}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Due Date</p>
                  <p className="text-sm text-muted-foreground">
                    {new Date(watchedValues.dueDate).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <AlertTriangle className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Default Priority</p>
                  <Badge 
                    variant={PRIORITY_CONFIG[watchedValues.priority].variant}
                    className="mt-1"
                  >
                    {PRIORITY_CONFIG[watchedValues.priority].label}
                  </Badge>
                </div>
              </div>

              {watchedValues.notes && (
                <div className="flex items-start gap-3">
                  <Info className="h-4 w-4 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-sm font-medium">Default Notes</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      {watchedValues.notes}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Production Orders List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Production Orders to Create
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {batchItems.map((item, index) => {
              const product = products.find(p => p.id === item.productId);
              const variant = product?.variants?.find((v: any) => v.id === item.productVariantId);
              const customerOrder = item.customerOrderId 
                ? customerOrders.find(o => o.id === item.customerOrderId)
                : null;
              const customer = customerOrder 
                ? customers.find(c => c.id === customerOrder.customerId)
                : null;

              return (
                <div key={index} className="border rounded-lg p-4 space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Package className="h-4 w-4 text-muted-foreground" />
                        <h4 className="font-medium">
                          {product?.name || 'Unknown Product'}
                        </h4>
                        {item.priority && item.priority !== watchedValues.priority && (
                          <Badge 
                            variant={PRIORITY_CONFIG[item.priority].variant}
                            className="text-xs"
                          >
                            {PRIORITY_CONFIG[item.priority].label}
                          </Badge>
                        )}
                      </div>
                      
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span>SKU: {product?.sku || 'N/A'}</span>
                        {variant && (
                          <span>Variant: {variant.displayName}</span>
                        )}
                      </div>

                      {customerOrder && (
                        <div className="flex items-center gap-2 text-sm">
                          <ShoppingCart className="h-3 w-3 text-muted-foreground" />
                          <span className="text-muted-foreground">
                            Order: {customerOrder.orderNumber}
                          </span>
                          {customer && (
                            <span className="text-muted-foreground">
                              | Customer: {customer.name}
                            </span>
                          )}
                        </div>
                      )}

                      {item.notes && item.notes !== watchedValues.notes && (
                        <div className="text-sm text-muted-foreground bg-muted p-2 rounded">
                          <Info className="h-3 w-3 inline mr-1" />
                          {item.notes}
                        </div>
                      )}
                    </div>

                    <div className="text-right space-y-1">
                      <div className="text-lg font-bold">
                        {item.quantity}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        units
                      </div>
                    </div>
                  </div>

                  {index < batchItems.length - 1 && (
                    <Separator className="mt-4" />
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Options */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5" />
            Production Options
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-3">
            <div className={`w-4 h-4 rounded flex items-center justify-center ${
              watchedValues.generateBOM ? 'bg-green-600' : 'bg-gray-300'
            }`}>
              {watchedValues.generateBOM && (
                <CheckCircle className="w-3 h-3 text-white" />
              )}
            </div>
            <div>
              <p className="text-sm font-medium">Generate BOM</p>
              <p className="text-xs text-muted-foreground">
                {watchedValues.generateBOM 
                  ? "Bill of Materials will be automatically generated for all orders"
                  : "BOM generation disabled - materials must be added manually"
                }
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className={`w-4 h-4 rounded flex items-center justify-center ${
              watchedValues.reserveMaterials ? 'bg-green-600' : 'bg-gray-300'
            }`}>
              {watchedValues.reserveMaterials && (
                <CheckCircle className="w-3 h-3 text-white" />
              )}
            </div>
            <div>
              <p className="text-sm font-medium">Reserve Materials</p>
              <p className="text-xs text-muted-foreground">
                {watchedValues.reserveMaterials 
                  ? "Materials will be automatically reserved for all production orders"
                  : "Material reservation disabled - materials must be reserved manually"
                }
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary Alert */}
      <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <Info className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
              Ready to Create {batchItems.length} Production Orders
            </p>
            <p className="text-sm text-blue-700 dark:text-blue-200">
              All {batchItems.length} production orders will be created with the common settings shown above.
              Individual priorities and notes will be applied where specified.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
