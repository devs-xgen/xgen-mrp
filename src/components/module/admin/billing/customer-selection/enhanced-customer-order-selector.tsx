"use client";

import { useState, useEffect, useMemo } from "react";
import { Search, ShoppingCart, Calendar, DollarSign, User, X, AlertTriangle, CheckCircle, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CustomerOrder } from "@/types/admin/customer-order";
import { Status } from "@prisma/client";
import { formatCurrencyPHP } from "@/lib/constant";
import { 
  getCustomerOrdersForBilling, 
  validateOrderForBilling
} from "@/lib/actions/customer-order";
import { mapOrderItemsToInvoiceItems } from "@/lib/utils/invoice-item-utils";

interface EnhancedCustomerOrderSelectorProps {
  customerOrders: CustomerOrder[];
  selectedOrder?: CustomerOrder;
  onOrderSelect: (order: CustomerOrder, invoiceItems?: any[]) => void;
  onClear: () => void;
  disabled?: boolean;
  loading?: boolean;
  onValidationResult?: (result: { isValid: boolean; errors: string[]; warnings: string[] }) => void;
}

interface OrderValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export function EnhancedCustomerOrderSelector({
  customerOrders,
  selectedOrder,
  onOrderSelect,
  onClear,
  disabled = false,
  loading = false,
  onValidationResult,
}: EnhancedCustomerOrderSelectorProps) {
  const [open, setOpen] = useState(false);
  const [searchValue, setSearchValue] = useState("");
  const [statusFilter, setStatusFilter] = useState<Status | "all">("all");
  const [validationResult, setValidationResult] = useState<OrderValidationResult | null>(null);
  const [isValidating, setIsValidating] = useState(false);

  // Filter orders based on search and status
  const filteredOrders = useMemo(() => {
    let filtered = customerOrders;

    // Apply status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter(order => order.status === statusFilter);
    }

    // Apply search filter
    if (searchValue.trim()) {
      const searchLower = searchValue.toLowerCase();
      filtered = filtered.filter((order) => {
        return (
          order.orderNumber.toLowerCase().includes(searchLower) ||
          order.customer.name.toLowerCase().includes(searchLower) ||
          order.customer.email?.toLowerCase().includes(searchLower) ||
          formatCurrencyPHP(order.totalAmount).toLowerCase().includes(searchLower) ||
          order.notes?.toLowerCase().includes(searchLower)
        );
      });
    }

    return filtered;
  }, [customerOrders, searchValue, statusFilter]);

  // Validate selected order when it changes
  useEffect(() => {
    if (selectedOrder) {
      validateSelectedOrder(selectedOrder.id);
    } else {
      setValidationResult(null);
    }
  }, [selectedOrder]);

  const validateSelectedOrder = async (orderId: string) => {
    setIsValidating(true);
    try {
      const result = await validateOrderForBilling(orderId);
      setValidationResult(result);
      onValidationResult?.(result);
    } catch (error) {
      console.error("Error validating order:", error);
      const errorResult = {
        isValid: false,
        errors: ["Failed to validate order"],
        warnings: [],
      };
      setValidationResult(errorResult);
      onValidationResult?.(errorResult);
    } finally {
      setIsValidating(false);
    }
  };

  const handleOrderSelect = async (order: CustomerOrder) => {
    // Map order items to invoice items for auto-population
    const invoiceItems = mapOrderItemsToInvoiceItems(order.orderLines);
    
    onOrderSelect(order, invoiceItems);
    setOpen(false);
    setSearchValue("");
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'active':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'in_progress':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'completed':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'cancelled':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'inactive':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'suspended':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'on_hold':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getValidationIcon = () => {
    if (isValidating) return <Clock className="h-4 w-4 animate-spin" />;
    if (!validationResult) return null;
    if (validationResult.isValid) return <CheckCircle className="h-4 w-4 text-green-600" />;
    return <AlertTriangle className="h-4 w-4 text-red-600" />;
  };

  return (
    <div className="space-y-4" role="region" aria-labelledby="customer-order-selector-heading">
      <div className="space-y-2">
        <Label 
          htmlFor="customer-order-selector" 
          id="customer-order-selector-heading"
          className="text-sm font-medium"
        >
          Customer Order
        </Label>
        
        {/* Search and Filter Controls */}
        <div className="flex flex-col sm:flex-row gap-2 mb-2">
          <div className="flex-1">
            <Input
              id="order-search-input"
              placeholder="Search orders..."
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              disabled={disabled || loading}
              className="w-full"
              aria-label="Search customer orders"
            />
          </div>
          <Select 
            value={statusFilter} 
            onValueChange={(value) => setStatusFilter(value as Status | "all")}
          >
            <SelectTrigger className="w-full sm:w-32" aria-label="Filter by status">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value={Status.PENDING}>Pending</SelectItem>
              <SelectItem value={Status.IN_PROGRESS}>In Progress</SelectItem>
              <SelectItem value={Status.COMPLETED}>Completed</SelectItem>
              <SelectItem value={Status.CANCELLED}>Cancelled</SelectItem>
              <SelectItem value={Status.ACTIVE}>Active</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Order Selection Dropdown */}
        <div className="flex flex-col sm:flex-row gap-2">
          <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
              <Button
                id="customer-order-selector"
                variant="outline"
                role="combobox"
                aria-expanded={open}
                aria-haspopup="listbox"
                aria-label={selectedOrder ? `Selected order: ${selectedOrder.orderNumber}` : "Select a customer order"}
                className="flex-1 justify-between min-w-0"
                disabled={disabled || loading}
              >
                {selectedOrder ? (
                  <span className="truncate flex items-center gap-2">
                    {getValidationIcon()}
                    {selectedOrder.orderNumber} - {selectedOrder.customer.name}
                  </span>
                ) : (
                  <span className="text-muted-foreground">Select customer order...</span>
                )}
                <Search className="ml-2 h-4 w-4 shrink-0 opacity-50" aria-hidden="true" />
              </Button>
            </PopoverTrigger>
            <PopoverContent 
              className="w-[min(500px,calc(100vw-2rem))] p-0" 
              align="start"
              side="bottom"
              sideOffset={4}
            >
              <Command>
                <CommandInput
                  placeholder="Search orders by number, customer, or amount..."
                  value={searchValue}
                  onValueChange={setSearchValue}
                  aria-label="Search customer orders"
                />
                <CommandList role="listbox" aria-label="Customer order options">
                  <CommandEmpty role="status">
                    {loading ? "Loading orders..." : "No orders found."}
                  </CommandEmpty>
                  <CommandGroup>
                    {filteredOrders.map((order) => (
                      <CommandItem
                        key={order.id}
                        value={order.id}
                        onSelect={() => handleOrderSelect(order)}
                        className="flex flex-col items-start p-3 space-y-2 cursor-pointer"
                        role="option"
                        aria-selected={selectedOrder?.id === order.id}
                      >
                        <div className="flex items-center justify-between w-full min-w-0">
                          <div className="flex items-center gap-2 min-w-0 flex-1">
                            <ShoppingCart className="h-4 w-4 text-muted-foreground flex-shrink-0" aria-hidden="true" />
                            <span className="font-medium truncate">{order.orderNumber}</span>
                            <Badge className={`${getStatusColor(order.status)} flex-shrink-0`}>
                              {order.status}
                            </Badge>
                          </div>
                          <span className="font-semibold text-green-600 flex-shrink-0 ml-2">
                            {formatCurrencyPHP(order.totalAmount)}
                          </span>
                        </div>
                        <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground w-full">
                          <div className="flex items-center gap-1 min-w-0">
                            <User className="h-3 w-3 flex-shrink-0" aria-hidden="true" />
                            <span className="truncate">{order.customer.name}</span>
                          </div>
                          <div className="flex items-center gap-1 flex-shrink-0">
                            <Calendar className="h-3 w-3" aria-hidden="true" />
                            <span>{new Date(order.orderDate).toLocaleDateString()}</span>
                          </div>
                          <div className="text-xs flex-shrink-0">
                            {order._count?.orderLines || 0} items
                          </div>
                        </div>
                        {order.customer.email && (
                          <div className="text-xs text-muted-foreground w-full truncate">
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
              aria-label="Clear order selection"
              className="flex-shrink-0"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Validation Results */}
      {validationResult && (
        <div className="space-y-2">
          {validationResult.errors.length > 0 && (
            <Alert variant="destructive" role="alert" aria-live="polite">
              <AlertTriangle className="h-4 w-4" aria-hidden="true" />
              <AlertDescription>
                <div className="font-medium mb-1">Cannot use this order for billing:</div>
                <ul className="list-disc list-inside text-sm" role="list">
                  {validationResult.errors.map((error, index) => (
                    <li key={index} role="listitem">{error}</li>
                  ))}
                </ul>
              </AlertDescription>
            </Alert>
          )}
          
          {validationResult.warnings.length > 0 && (
            <Alert role="alert" aria-live="polite">
              <AlertTriangle className="h-4 w-4" aria-hidden="true" />
              <AlertDescription>
                <div className="font-medium mb-1">Please note:</div>
                <ul className="list-disc list-inside text-sm" role="list">
                  {validationResult.warnings.map((warning, index) => (
                    <li key={index} role="listitem">{warning}</li>
                  ))}
                </ul>
              </AlertDescription>
            </Alert>
          )}
        </div>
      )}

      {/* Selected Order Preview */}
      {selectedOrder && (
        <Card 
          className="bg-blue-50 border-blue-200"
          role="region"
          aria-labelledby="selected-order-title"
          aria-describedby="selected-order-description"
        >
          <CardHeader className="pb-3">
            <CardTitle 
              id="selected-order-title"
              className="text-base flex items-center gap-2"
            >
              <ShoppingCart className="h-4 w-4" aria-hidden="true" />
              Selected Order Details
              {getValidationIcon()}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Basic Order Information */}
            <div 
              id="selected-order-description"
              className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm"
            >
              <div>
                <span className="font-medium text-muted-foreground">Order Number:</span>
                <div className="font-semibold break-words">{selectedOrder.orderNumber}</div>
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
                <span className="font-medium text-muted-foreground">Order Date:</span>
                <div>{new Date(selectedOrder.orderDate).toLocaleDateString()}</div>
              </div>
              <div>
                <span className="font-medium text-muted-foreground">Required Date:</span>
                <div>{new Date(selectedOrder.requiredDate).toLocaleDateString()}</div>
              </div>
            </div>

            <Separator />

            {/* Customer Information */}
            <div>
              <span className="font-medium text-muted-foreground text-sm">Customer Information:</span>
              <div className="mt-1 space-y-1">
                <div className="font-semibold break-words">{selectedOrder.customer.name}</div>
                {selectedOrder.customer.email && (
                  <div className="text-sm text-muted-foreground break-all">{selectedOrder.customer.email}</div>
                )}
                {selectedOrder.customer.phone && (
                  <div className="text-sm text-muted-foreground break-all">{selectedOrder.customer.phone}</div>
                )}
                {selectedOrder.customer.paymentTerms && (
                  <div className="text-xs text-muted-foreground break-words">
                    Payment Terms: {selectedOrder.customer.paymentTerms}
                  </div>
                )}
              </div>
            </div>

            <Separator />

            {/* Financial Information */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium text-muted-foreground">Total Amount:</span>
                <div className="font-bold text-green-600 text-lg">
                  {formatCurrencyPHP(selectedOrder.totalAmount)}
                </div>
              </div>
              <div>
                <span className="font-medium text-muted-foreground">Items Count:</span>
                <div className="font-semibold">{selectedOrder._count?.orderLines || 0} items</div>
              </div>
            </div>

            {/* Order Lines Summary */}
            {selectedOrder.orderLines && selectedOrder.orderLines.length > 0 && (
              <div>
                <span className="font-medium text-muted-foreground text-sm">Order Items:</span>
                <div className="mt-2 space-y-2 max-h-32 overflow-y-auto" role="list" aria-label="Order items">
                  {selectedOrder.orderLines.slice(0, 5).map((line, index) => (
                    <div 
                      key={line.id} 
                      className="flex flex-col sm:flex-row sm:justify-between sm:items-start text-xs bg-white p-2 rounded border gap-2"
                      role="listitem"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="font-medium break-words">
                          {line.product?.name || 'Unknown Product'}
                        </div>
                        {line.productVariant && (
                          <div className="text-muted-foreground break-words">
                            {line.productVariant.displayName}
                          </div>
                        )}
                        <div className="text-muted-foreground break-all">
                          SKU: {line.productVariant?.sku || line.product?.sku || 'N/A'}
                        </div>
                      </div>
                      <div className="text-left sm:text-right sm:ml-2 flex-shrink-0">
                        <div className="font-medium">
                          {line.quantity} × {formatCurrencyPHP(line.unitPrice)}
                        </div>
                        <div className="text-muted-foreground">
                          = {formatCurrencyPHP(line.quantity * line.unitPrice)}
                        </div>
                      </div>
                    </div>
                  ))}
                  {selectedOrder.orderLines.length > 5 && (
                    <div className="text-xs text-muted-foreground text-center py-1" role="status">
                      ... and {selectedOrder.orderLines.length - 5} more items
                    </div>
                  )}
                </div>
              </div>
            )}

            {selectedOrder.notes && (
              <div>
                <span className="font-medium text-muted-foreground text-sm">Notes:</span>
                <div className="text-sm mt-1 bg-white p-2 rounded border break-words">{selectedOrder.notes}</div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Auto-population Notice */}
      {selectedOrder && validationResult?.isValid && (
        <Alert role="status" aria-live="polite">
          <CheckCircle className="h-4 w-4" aria-hidden="true" />
          <AlertDescription className="text-sm">
            <strong>Auto-populated:</strong> Customer information and invoice items will be automatically 
            filled from this order. You can modify them in the next steps if needed.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}