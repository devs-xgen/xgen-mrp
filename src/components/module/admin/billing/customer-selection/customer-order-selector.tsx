"use client";

import { useState, useEffect } from "react";
import { Search, ShoppingCart, Calendar, DollarSign, User, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { CustomerOrder } from "@/types/admin/customer-order";
import { formatCurrencyPHP } from "@/lib/constant";

interface CustomerOrderSelectorProps {
  orders: CustomerOrder[];
  selectedOrder?: CustomerOrder;
  onOrderSelect: (order: CustomerOrder) => void;
  onClear: () => void;
  disabled?: boolean;
  className?: string;
}

export function CustomerOrderSelector({
  orders,
  selectedOrder,
  onOrderSelect,
  onClear,
  disabled = false,
  className = "",
}: CustomerOrderSelectorProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredOrders, setFilteredOrders] = useState<CustomerOrder[]>(orders);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  // Filter orders based on search term
  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredOrders(orders);
      return;
    }

    const filtered = orders.filter((order) => {
      const searchLower = searchTerm.toLowerCase();
      return (
        order.orderNumber.toLowerCase().includes(searchLower) ||
        order.customer?.name.toLowerCase().includes(searchLower) ||
        order.customer?.email.toLowerCase().includes(searchLower) ||
        order.totalAmount.toString().includes(searchLower)
      );
    });

    setFilteredOrders(filtered);
  }, [searchTerm, orders]);

  const handleOrderSelect = (order: CustomerOrder) => {
    onOrderSelect(order);
    setIsDropdownOpen(false);
    setSearchTerm("");
  };

  const handleClear = () => {
    onClear();
    setSearchTerm("");
    setIsDropdownOpen(false);
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search by order number, customer name, or amount..."
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            setIsDropdownOpen(true);
          }}
          onFocus={() => setIsDropdownOpen(true)}
          className="pl-10"
          disabled={disabled}
        />
        {selectedOrder && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleClear}
            className="absolute right-2 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0"
            disabled={disabled}
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Selected Order Preview */}
      {selectedOrder && (
        <Card className="border-primary/20 bg-primary/5">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium flex items-center">
                <ShoppingCart className="mr-2 h-4 w-4" />
                Selected Order
              </CardTitle>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleClear}
                disabled={disabled}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">{selectedOrder.orderNumber}</span>
                <Badge variant="secondary">{selectedOrder.status}</Badge>
              </div>
              
              <div className="flex items-center text-sm text-muted-foreground">
                <User className="mr-2 h-4 w-4" />
                {selectedOrder.customer?.name}
                {selectedOrder.customer?.email && (
                  <span className="ml-2">({selectedOrder.customer.email})</span>
                )}
              </div>
              
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center text-muted-foreground">
                  <Calendar className="mr-2 h-4 w-4" />
                  {new Date(selectedOrder.orderDate).toLocaleDateString()}
                </div>
                <div className="flex items-center font-medium">
                  <DollarSign className="mr-1 h-4 w-4" />
                  {formatCurrencyPHP(selectedOrder.totalAmount)}
                </div>
              </div>

              {selectedOrder.orderLines && selectedOrder.orderLines.length > 0 && (
                <div className="pt-2 border-t">
                  <p className="text-xs text-muted-foreground mb-2">
                    {selectedOrder.orderLines.length} item(s)
                  </p>
                  <div className="space-y-1">
                    {selectedOrder.orderLines.slice(0, 3).map((line, index) => (
                      <div key={index} className="flex justify-between text-xs">
                        <span className="truncate">
                          {line.product?.name || "Unknown Product"}
                        </span>
                        <span className="ml-2 flex-shrink-0">
                          {line.quantity} × {formatCurrencyPHP(line.unitPrice)}
                        </span>
                      </div>
                    ))}
                    {selectedOrder.orderLines.length > 3 && (
                      <p className="text-xs text-muted-foreground">
                        +{selectedOrder.orderLines.length - 3} more items
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Dropdown Results */}
      {isDropdownOpen && !selectedOrder && (
        <Card className="absolute z-50 w-full max-h-96 overflow-y-auto border shadow-lg">
          <CardContent className="p-0">
            {filteredOrders.length === 0 ? (
              <div className="p-4 text-center text-muted-foreground">
                {searchTerm ? "No orders found matching your search" : "No orders available"}
              </div>
            ) : (
              <div className="divide-y">
                {filteredOrders.map((order) => (
                  <button
                    key={order.id}
                    type="button"
                    onClick={() => handleOrderSelect(order)}
                    className="w-full p-4 text-left hover:bg-muted/50 transition-colors"
                    disabled={disabled}
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-medium">{order.orderNumber}</span>
                        <Badge variant="outline" className="text-xs">
                          {order.status}
                        </Badge>
                      </div>
                      
                      <div className="flex items-center text-sm text-muted-foreground">
                        <User className="mr-2 h-3 w-3" />
                        {order.customer?.name}
                      </div>
                      
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center text-muted-foreground">
                          <Calendar className="mr-2 h-3 w-3" />
                          {new Date(order.orderDate).toLocaleDateString()}
                        </div>
                        <div className="flex items-center font-medium">
                          <DollarSign className="mr-1 h-3 w-3" />
                          {formatCurrencyPHP(order.totalAmount)}
                        </div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Click outside to close dropdown */}
      {isDropdownOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setIsDropdownOpen(false)}
        />
      )}
    </div>
  );
}