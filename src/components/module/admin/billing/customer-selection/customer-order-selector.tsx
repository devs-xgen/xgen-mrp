"use client";

import { useState, useEffect } from "react";
import { Search, ShoppingCart, Calendar, DollarSign, User, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { CustomerOrder } from "@/types/admin/customer-order";
import { formatCurrencyPHP } from "@/lib/constant";

interface CustomerOrderSelectorProps {
  customerOrders: CustomerOrder[];
  selectedOrder?: CustomerOrder;
  onOrderSelect: (order: CustomerOrder) => void;
  onClear: () => void;
  disabled?: boolean;
  loading?: boolean;
}

export function CustomerOrderSelector({
  customerOrders,
  selectedOrder,
  onOrderSelect,
  onClear,
  disabled = false,
  loading = false,
}: CustomerOrderSelectorProps) {
  const [open, setOpen] = useState(false);
  const [searchValue, setSearchValue] = useState("");
  const [filteredOrders, setFilteredOrders] = useState<CustomerOrder[]>(customerOrders);

  // Filter orders based on search
  useEffect(() => {
    if (!searchValue.trim()) {
      setFilteredOrders(customerOrders);
      return;
    }

    const filtered = customerOrders.filter((order) => {
      const searchLower = searchValue.toLowerCase();
      return (
        order.orderNumber.toLowerCase().includes(searchLower) ||
        order.customer.name.toLowerCase().includes(searchLower) ||
        order.customer.email?.toLowerCase().includes(searchLower) ||
        formatCurrencyPHP(order.totalAmount).toLowerCase().includes(searchLower)
      );
    });

    setFilteredOrders(filtered);
  }, [searchValue, customerOrders]);

  const handleOrderSelect = (order: CustomerOrder) => {
    onOrderSelect(order);
    setOpen(false);
    setSearchValue("");
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'confirmed':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'in_progress':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'completed':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'cancelled':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="customer-order-selector">Customer Order</Label>
        <div className="flex gap-2">
          <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                role="combobox"
                aria-expanded={open}
                className="flex-1 justify-between"
                disabled={disabled || loading}
              >
                {selectedOrder ? (
                  <span className="truncate">
                    {selectedOrder.orderNumber} - {selectedOrder.customer.name}
                  </span>
                ) : (
                  <span className="text-muted-foreground">Select customer order...</span>
                )}
                <Search className="ml-2 h-4 w-4 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[400px] p-0" align="start">
              <Command>
                <CommandInput
                  placeholder="Search orders by number, customer, or amount..."
                  value={searchValue}
                  onValueChange={setSearchValue}
                />
                <CommandList>
                  <CommandEmpty>
                    {loading ? "Loading orders..." : "No orders found."}
                  </CommandEmpty>
                  <CommandGroup>
                    {filteredOrders.map((order) => (
                      <CommandItem
                        key={order.id}
                        value={order.id}
                        onSelect={() => handleOrderSelect(order)}
                        className="flex flex-col items-start p-3 space-y-2"
                      >
                        <div className="flex items-center justify-between w-full">
                          <div className="flex items-center gap-2">
                            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
                            <span className="font-medium">{order.orderNumber}</span>
                            <Badge className={getStatusColor(order.status)}>
                              {order.status}
                            </Badge>
                          </div>
                          <span className="font-semibold text-green-600">
                            {formatCurrencyPHP(order.totalAmount)}
                          </span>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground w-full">
                          <div className="flex items-center gap-1">
                            <User className="h-3 w-3" />
                            <span>{order.customer.name}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            <span>{new Date(order.orderDate).toLocaleDateString()}</span>
                          </div>
                        </div>
                        {order.customer.email && (
                          <div className="text-xs text-muted-foreground">
                            {order.customer.email}
                          </div>
                        )}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
          
          {selectedOrder && (
            <Button
              variant="outline"
              size="icon"
              onClick={onClear}
              disabled={disabled}
              title="Clear selection"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Selected Order Preview */}
      {selectedOrder && (
        <Card className="bg-blue-50 border-blue-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <ShoppingCart className="h-4 w-4" />
              Selected Order Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium text-muted-foreground">Order Number:</span>
                <div className="font-semibold">{selectedOrder.orderNumber}</div>
              </div>
              <div>
                <span className="font-medium text-muted-foreground">Status:</span>
                <div>
                  <Badge className={getStatusColor(selectedOrder.status)}>
                    {selectedOrder.status}
                  </Badge>
                </div>
              </div>
              <div>
                <span className="font-medium text-muted-foreground">Customer:</span>
                <div className="font-semibold">{selectedOrder.customer.name}</div>
                {selectedOrder.customer.email && (
                  <div className="text-xs text-muted-foreground">
                    {selectedOrder.customer.email}
                  </div>
                )}
              </div>
              <div>
                <span className="font-medium text-muted-foreground">Order Date:</span>
                <div>{new Date(selectedOrder.orderDate).toLocaleDateString()}</div>
              </div>
              <div>
                <span className="font-medium text-muted-foreground">Required Date:</span>
                <div>{new Date(selectedOrder.requiredDate).toLocaleDateString()}</div>
              </div>
              <div>
                <span className="font-medium text-muted-foreground">Total Amount:</span>
                <div className="font-bold text-green-600 text-lg">
                  {formatCurrencyPHP(selectedOrder.totalAmount)}
                </div>
              </div>
            </div>

            {/* Order Lines Summary */}
            {selectedOrder.orderLines && selectedOrder.orderLines.length > 0 && (
              <div className="pt-2 border-t">
                <span className="font-medium text-muted-foreground text-sm">Order Items:</span>
                <div className="mt-1 space-y-1">
                  {selectedOrder.orderLines.slice(0, 3).map((line, index) => (
                    <div key={line.id} className="flex justify-between text-xs">
                      <span className="truncate">
                        {line.product?.name || 'Unknown Product'} 
                        {line.productVariant && ` (${line.productVariant.displayName})`}
                      </span>
                      <span className="ml-2 font-medium">
                        {line.quantity} × {formatCurrencyPHP(line.unitPrice)}
                      </span>
                    </div>
                  ))}
                  {selectedOrder.orderLines.length > 3 && (
                    <div className="text-xs text-muted-foreground">
                      ... and {selectedOrder.orderLines.length - 3} more items
                    </div>
                  )}
                </div>
              </div>
            )}

            {selectedOrder.notes && (
              <div className="pt-2 border-t">
                <span className="font-medium text-muted-foreground text-sm">Notes:</span>
                <div className="text-sm mt-1">{selectedOrder.notes}</div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Auto-population Notice */}
      {selectedOrder && (
        <Alert>
          <AlertDescription className="text-sm">
            <strong>Auto-populated:</strong> Customer name and order details will be automatically 
            filled in the billing form. Invoice items will be pre-populated from the order lines.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}