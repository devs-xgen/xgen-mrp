"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, Plus, X } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { CustomerOrder } from "@/types/admin/customer-order";
import { Customer } from "@/types/admin/customer";
import { Product } from "@/types/admin/product";
import { useToast } from "@/hooks/use-toast";

interface OrderLine {
  productId: string;
  quantity: number;
  unitPrice: number;
  notes?: string;
}

interface CreateOrderDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  customers: Customer[];
  products: Product[];
  onOrderCreated: (order: CustomerOrder) => void;
}

export function CreateOrderDialog({
  open,
  onOpenChange,
  customers,
  products,
  onOrderCreated,
}: CreateOrderDialogProps) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [requiredDate, setRequiredDate] = useState<Date>();

  const [formData, setFormData] = useState({
    customerId: "",
    requiredDate: "",
    shippingAddress: "",
    billingAddress: "",
    notes: "",
  });

  const [orderLines, setOrderLines] = useState<OrderLine[]>([
    { productId: "", quantity: 1, unitPrice: 0 }
  ]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.customerId) {
      toast({
        title: "Validation Error",
        description: "Please select a customer.",
        variant: "destructive",
      });
      return;
    }

    if (!requiredDate) {
      toast({
        title: "Validation Error",
        description: "Please select a required date.",
        variant: "destructive",
      });
      return;
    }

    const validOrderLines = orderLines.filter(line => 
      line.productId && line.quantity > 0 && line.unitPrice >= 0
    );

    if (validOrderLines.length === 0) {
      toast({
        title: "Validation Error",
        description: "Please add at least one valid order line.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      // TODO: Call the actual create order API
      // const newOrder = await createCustomerOrder({
      //   ...formData,
      //   requiredDate,
      //   orderLines: validOrderLines,
      // });

      // Mock response for now
      const totalAmount = validOrderLines.reduce(
        (sum, line) => sum + (line.quantity * line.unitPrice), 0
      );

      const mockOrder: CustomerOrder = {
        id: `order_${Date.now()}`,
        orderNumber: `ORD-${Date.now().toString().slice(-6)}`,
        customerId: formData.customerId,
        customerName: customers.find(c => c.id === formData.customerId)?.name || "Unknown",
        orderDate: new Date(),
        requiredDate: requiredDate,
        status: "PENDING",
        totalAmount: totalAmount,
        shippingAddress: formData.shippingAddress,
        billingAddress: formData.billingAddress,
        notes: formData.notes,
        createdAt: new Date(),
        updatedAt: new Date(),
        orderLines: validOrderLines.map((line, index) => ({
          id: `line_${Date.now()}_${index}`,
          orderId: `order_${Date.now()}`,
          productId: line.productId,
          quantity: line.quantity,
          unitPrice: line.unitPrice,
          status: "PENDING",
          fulfillmentType: "PENDING",
          fulfillmentStatus: "PENDING",
          stockAllocated: 0,
          productionQuantity: 0,
          notes: line.notes,
          createdAt: new Date(),
          updatedAt: new Date(),
          product: products.find(p => p.id === line.productId),
        })),
      };

      onOrderCreated(mockOrder);
      handleReset();

    } catch (error) {
      toast({
        title: "Create Failed",
        description: "Failed to create customer order. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setFormData({
      customerId: "",
      requiredDate: "",
      shippingAddress: "",
      billingAddress: "",
      notes: "",
    });
    setOrderLines([{ productId: "", quantity: 1, unitPrice: 0 }]);
    setRequiredDate(undefined);
  };

  const addOrderLine = () => {
    setOrderLines([...orderLines, { productId: "", quantity: 1, unitPrice: 0 }]);
  };

  const removeOrderLine = (index: number) => {
    if (orderLines.length > 1) {
      setOrderLines(orderLines.filter((_, i) => i !== index));
    }
  };

  const updateOrderLine = (index: number, field: keyof OrderLine, value: any) => {
    const updated = [...orderLines];
    updated[index] = { ...updated[index], [field]: value };
    
    // Auto-fill unit price when product is selected
    if (field === "productId" && value) {
      const product = products.find(p => p.id === value);
      if (product) {
        updated[index].unitPrice = Number(product.sellingPrice);
      }
    }
    
    setOrderLines(updated);
  };

  const selectedCustomer = customers.find(c => c.id === formData.customerId);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Customer Order</DialogTitle>
          <DialogDescription>
            Create a new customer order with product line items and delivery details.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Customer Selection */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="customer">Customer *</Label>
              <Select
                value={formData.customerId}
                onValueChange={(value) => {
                  setFormData(prev => ({ ...prev, customerId: value }));
                  // Auto-fill addresses if customer has them
                  const customer = customers.find(c => c.id === value);
                  if (customer) {
                    setFormData(prev => ({
                      ...prev,
                      shippingAddress: customer.address || "",
                      billingAddress: customer.address || "",
                    }));
                  }
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a customer" />
                </SelectTrigger>
                <SelectContent>
                  {customers.map((customer) => (
                    <SelectItem key={customer.id} value={customer.id}>
                      <div>
                        <div className="font-medium">{customer.name}</div>
                        <div className="text-sm text-muted-foreground">{customer.code}</div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {selectedCustomer && (
                <div className="text-sm text-muted-foreground">
                  {selectedCustomer.email} • {selectedCustomer.phone}
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label>Required Date *</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !requiredDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {requiredDate ? format(requiredDate, "PPP") : "Pick a date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={requiredDate}
                    onSelect={setRequiredDate}
                    disabled={(date) => date < new Date()}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          {/* Addresses */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="shippingAddress">Shipping Address</Label>
              <Textarea
                id="shippingAddress"
                value={formData.shippingAddress}
                onChange={(e) => setFormData(prev => ({ ...prev, shippingAddress: e.target.value }))}
                placeholder="Enter shipping address..."
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="billingAddress">Billing Address</Label>
              <Textarea
                id="billingAddress"
                value={formData.billingAddress}
                onChange={(e) => setFormData(prev => ({ ...prev, billingAddress: e.target.value }))}
                placeholder="Enter billing address (or leave empty to use shipping address)..."
                rows={3}
              />
            </div>
          </div>

          {/* Order Lines */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label className="text-base font-medium">Order Items *</Label>
              <Button type="button" variant="outline" size="sm" onClick={addOrderLine}>
                <Plus className="h-4 w-4 mr-2" />
                Add Item
              </Button>
            </div>

            <div className="space-y-3">
              {orderLines.map((line, index) => (
                <div key={index} className="grid grid-cols-12 gap-3 p-4 border rounded-lg">
                  {/* Product */}
                  <div className="col-span-4">
                    <Select
                      value={line.productId}
                      onValueChange={(value) => updateOrderLine(index, "productId", value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select product" />
                      </SelectTrigger>
                      <SelectContent>
                        {products.map((product) => (
                          <SelectItem key={product.id} value={product.id}>
                            <div>
                              <div className="font-medium">{product.name}</div>
                              <div className="text-sm text-muted-foreground">
                                {product.sku} • ${Number(product.sellingPrice).toFixed(2)}
                              </div>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Quantity */}
                  <div className="col-span-2">
                    <Input
                      type="number"
                      min="1"
                      value={line.quantity}
                      onChange={(e) => updateOrderLine(index, "quantity", parseInt(e.target.value) || 1)}
                      placeholder="Qty"
                    />
                  </div>

                  {/* Unit Price */}
                  <div className="col-span-2">
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      value={line.unitPrice}
                      onChange={(e) => updateOrderLine(index, "unitPrice", parseFloat(e.target.value) || 0)}
                      placeholder="Price"
                    />
                  </div>

                  {/* Total */}
                  <div className="col-span-2 flex items-center">
                    <span className="text-sm font-medium">
                      ${(line.quantity * line.unitPrice).toFixed(2)}
                    </span>
                  </div>

                  {/* Notes */}
                  <div className="col-span-1">
                    <Input
                      value={line.notes || ""}
                      onChange={(e) => updateOrderLine(index, "notes", e.target.value)}
                      placeholder="Notes"
                    />
                  </div>

                  {/* Remove */}
                  <div className="col-span-1 flex items-center">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeOrderLine(index)}
                      disabled={orderLines.length === 1}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>

            {/* Order Total */}
            <div className="flex justify-end">
              <div className="text-lg font-medium">
                Total: ${orderLines.reduce((sum, line) => sum + (line.quantity * line.unitPrice), 0).toFixed(2)}
              </div>
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Order Notes</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              placeholder="Additional order instructions or notes..."
              rows={3}
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Creating..." : "Create Order"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
