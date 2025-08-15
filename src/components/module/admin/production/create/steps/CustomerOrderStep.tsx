"use client";

import { UseFormReturn } from "react-hook-form";
import { useState, useEffect } from "react";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatCurrencyPHP } from "@/lib/constant";

import type { ProductionCreateForm } from "@/lib/validation/production-create";
import type { Customer, CustomerOrder } from "@prisma/client";

interface CustomerOrderStepProps {
  form: UseFormReturn<ProductionCreateForm>;
  customers: Customer[];
  customerOrders: (CustomerOrder & {
    customer: Customer;
    orderLines: Array<{
      id: string;
      productId: string;
      productVariantId?: string | null;
      quantity: number;
      unitPrice: number;
      product: {
        id: string;
        name: string;
        sku: string;
        hasVariants: boolean;
      };
      productVariant?: {
        id: string;
        displayName: string;
        sku: string;
      } | null;
    }>;
  })[];
}

export function CustomerOrderStep({
  form,
  customers,
  customerOrders,
}: CustomerOrderStepProps) {
  const {
    watch,
    setValue,
    formState: { errors },
  } = form;
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(
    null
  );
  const [availableOrders, setAvailableOrders] = useState<typeof customerOrders>(
    []
  );
  const [selectedOrder, setSelectedOrder] = useState<
    (typeof customerOrders)[0] | null
  >(null);

  const customerId = watch("customerId");
  const customerOrderId = watch("customerOrderId");

  useEffect(() => {
    if (customerId) {
      const customer = customers.find((c) => c.id === customerId);
      setSelectedCustomer(customer || null);

      const orders = customerOrders.filter((o) => o.customerId === customerId);
      setAvailableOrders(orders);

      // Reset order selection if customer changes
      if (customerOrderId && !orders.find((o) => o.id === customerOrderId)) {
        setValue("customerOrderId", "");
        setSelectedOrder(null);
      }
    } else {
      setSelectedCustomer(null);
      setAvailableOrders([]);
      setSelectedOrder(null);
    }
  }, [customerId, customers, customerOrders, customerOrderId, setValue]);

  useEffect(() => {
    if (customerOrderId) {
      const order = customerOrders.find((o) => o.id === customerOrderId);
      setSelectedOrder(order || null);
    } else {
      setSelectedOrder(null);
    }
  }, [customerOrderId, customerOrders]);

  const handleOrderLineSelect = (
    orderLine: (typeof selectedOrder)["orderLines"][0]
  ) => {
    if (!orderLine) return;

    setValue("productId", orderLine.productId);
    setValue("productVariantId", orderLine.productVariantId || "");
    setValue("quantity", orderLine.quantity);
  };

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h3 className="text-lg font-semibold">Select Customer Order</h3>
        <p className="text-muted-foreground">
          Choose the customer and order that this production will fulfill.
        </p>
      </div>

      {/* Customer Selection */}
      <div className="space-y-2">
        <Label htmlFor="customer">Customer</Label>
        <Select
          value={customerId || ""}
          onValueChange={(value) => {
            setValue("customerId", value);
            setValue("customerOrderId", ""); // Reset order when customer changes
          }}
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
          <p className="text-sm text-destructive">
            {errors.customerId.message}
          </p>
        )}
      </div>

      {/* Customer Order Selection */}
      {selectedCustomer && (
        <div className="space-y-2">
          <Label htmlFor="customerOrder">Customer Order</Label>
          <Select
            value={customerOrderId || ""}
            onValueChange={(value) => setValue("customerOrderId", value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select an order" />
            </SelectTrigger>
            <SelectContent>
              {availableOrders.map((order) => (
                <SelectItem key={order.id} value={order.id}>
                  <div className="flex flex-col">
                    <span>Order #{order.orderNumber}</span>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <span>{formatCurrencyPHP(order.totalAmount)}</span>
                      <Badge variant="outline">{order.status}</Badge>
                    </div>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.customerOrderId && (
            <p className="text-sm text-destructive">
              {errors.customerOrderId.message}
            </p>
          )}
        </div>
      )}

      {/* Order Lines */}
      {selectedOrder && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Order Items</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {selectedOrder.orderLines.map((line) => (
                <Card
                  key={line.id}
                  className="cursor-pointer hover:bg-muted/50 transition-colors"
                  onClick={() => handleOrderLineSelect(line)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <div className="font-medium">{line.product.name}</div>
                        {line.productVariant && (
                          <div className="text-sm text-muted-foreground">
                            Variant: {line.productVariant.displayName}
                          </div>
                        )}
                        <div className="text-sm text-muted-foreground">
                          SKU: {line.productVariant?.sku || line.product.sku}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-medium">Qty: {line.quantity}</div>
                        <div className="text-sm text-muted-foreground">
                          {formatCurrencyPHP(line.unitPrice)}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
            <p className="text-sm text-muted-foreground mt-4">
              Click on an item to pre-fill the production order details.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
