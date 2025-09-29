"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Search, User, ShoppingCart, Edit3 } from "lucide-react";
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
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Customer } from "@/types/admin/billing";
import type { CustomerOrder } from "@/types/admin/customer-order";

export type CustomerSourceType = "manual" | "customer_order" | "manual_input";

export interface CustomerSelectionData {
  sourceType: CustomerSourceType;
  selectedCustomer?: Customer;
  selectedCustomerOrder?: CustomerOrder;
  manualCustomerName?: string;
}

interface CustomerSelectionStepProps {
  customers: Customer[];
  customerOrders: CustomerOrder[];
  data: CustomerSelectionData;
  onChange: (data: CustomerSelectionData) => void;
}

export function CustomerSelectionStep({
  customers,
  customerOrders,
  data,
  onChange,
}: CustomerSelectionStepProps) {
  const [customerOpen, setCustomerOpen] = useState(false);
  const [customerOrderOpen, setCustomerOrderOpen] = useState(false);
  const [customerSearch, setCustomerSearch] = useState("");
  const [customerOrderSearch, setCustomerOrderSearch] = useState("");

  const handleSourceTypeChange = (sourceType: CustomerSourceType) => {
    onChange({
      sourceType,
      selectedCustomer: undefined,
      selectedCustomerOrder: undefined,
      manualCustomerName: "",
    });
  };

  const handleCustomerSelect = (customer: Customer) => {
    onChange({
      ...data,
      selectedCustomer: customer,
    });
    setCustomerOpen(false);
  };

  const handleCustomerOrderSelect = (customerOrder: CustomerOrder) => {
    onChange({
      ...data,
      selectedCustomerOrder: customerOrder,
    });
    setCustomerOrderOpen(false);
  };

  const handleManualCustomerNameChange = (name: string) => {
    onChange({
      ...data,
      manualCustomerName: name,
    });
  };

  const filteredCustomers = customers.filter((customer) =>
    customer.name.toLowerCase().includes(customerSearch.toLowerCase()) ||
    customer.code.toLowerCase().includes(customerSearch.toLowerCase()) ||
    customer.email?.toLowerCase().includes(customerSearch.toLowerCase())
  );

  const filteredCustomerOrders = customerOrders.filter((order) =>
    order.orderNumber.toLowerCase().includes(customerOrderSearch.toLowerCase()) ||
    order.customer.name.toLowerCase().includes(customerOrderSearch.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Customer Selection</h2>
        <p className="text-muted-foreground">
          Choose how you want to select or enter customer information for this billing statement.
        </p>
      </div>

      <RadioGroup
        value={data.sourceType}
        onValueChange={handleSourceTypeChange}
        className="space-y-4"
      >
        <Card className={cn("cursor-pointer transition-colors", data.sourceType === "manual" && "ring-2 ring-primary")}
        >
          <CardHeader className="pb-3">
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="manual" id="manual" />
              <Label htmlFor="manual" className="flex items-center space-x-2 cursor-pointer">
                <User className="w-4 h-4" />
                <span className="font-medium">Select Existing Customer</span>
              </Label>
            </div>
            <p className="text-sm text-muted-foreground ml-6">
              Choose from your existing customer database
            </p>
          </CardHeader>
          {data.sourceType === "manual" && (
            <CardContent className="pt-0">
              <div className="space-y-3">
                <Popover open={customerOpen} onOpenChange={setCustomerOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={customerOpen}
                      className="w-full justify-between"
                    >
                      {data.selectedCustomer ? (
                        <div className="flex items-center space-x-2">
                          <span>{data.selectedCustomer.name}</span>
                          <Badge variant="secondary">{data.selectedCustomer.code}</Badge>
                        </div>
                      ) : (
                        <span className="text-muted-foreground">Search and select customer...</span>
                      )}
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-full p-0" align="start">
                    <Command>
                      <CommandInput
                        placeholder="Search customers..."
                        value={customerSearch}
                        onValueChange={setCustomerSearch}
                      />
                      <CommandList>
                        <CommandEmpty>No customers found.</CommandEmpty>
                        <CommandGroup>
                          {filteredCustomers.map((customer) => (
                            <CommandItem
                              key={customer.id}
                              value={customer.id}
                              onSelect={() => handleCustomerSelect(customer)}
                            >
                              <Check
                                className={cn(
                                  "mr-2 h-4 w-4",
                                  data.selectedCustomer?.id === customer.id ? "opacity-100" : "opacity-0"
                                )}
                              />
                              <div className="flex-1">
                                <div className="flex items-center space-x-2">
                                  <span className="font-medium">{customer.name}</span>
                                  <Badge variant="outline">{customer.code}</Badge>
                                </div>
                                <div className="text-sm text-muted-foreground">
                                  {customer.email} • {customer.phone}
                                </div>
                              </div>
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>

                {data.selectedCustomer && (
                  <div className="p-3 bg-muted rounded-lg">
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <span className="font-medium">Contact:</span> {data.selectedCustomer.contactPerson}
                      </div>
                      <div>
                        <span className="font-medium">Email:</span> {data.selectedCustomer.email}
                      </div>
                      <div>
                        <span className="font-medium">Phone:</span> {data.selectedCustomer.phone}
                      </div>
                      <div>
                        <span className="font-medium">Payment Terms:</span> {data.selectedCustomer.paymentTerms || "N/A"}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          )}
        </Card>

        <Card className={cn("cursor-pointer transition-colors", data.sourceType === "customer_order" && "ring-2 ring-primary")}
        >
          <CardHeader className="pb-3">
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="customer_order" id="customer_order" />
              <Label htmlFor="customer_order" className="flex items-center space-x-2 cursor-pointer">
                <ShoppingCart className="w-4 h-4" />
                <span className="font-medium">Select from Customer Order</span>
              </Label>
            </div>
            <p className="text-sm text-muted-foreground ml-6">
              Choose from existing customer orders
            </p>
          </CardHeader>
          {data.sourceType === "customer_order" && (
            <CardContent className="pt-0">
              <div className="space-y-3">
                <Popover open={customerOrderOpen} onOpenChange={setCustomerOrderOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={customerOrderOpen}
                      className="w-full justify-between"
                    >
                      {data.selectedCustomerOrder ? (
                        <div className="flex items-center space-x-2">
                          <span>{data.selectedCustomerOrder.orderNumber}</span>
                          <Badge variant="secondary">{data.selectedCustomerOrder.customer.name}</Badge>
                        </div>
                      ) : (
                        <span className="text-muted-foreground">Search and select customer order...</span>
                      )}
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-full p-0" align="start">
                    <Command>
                      <CommandInput
                        placeholder="Search customer orders..."
                        value={customerOrderSearch}
                        onValueChange={setCustomerOrderSearch}
                      />
                      <CommandList>
                        <CommandEmpty>No customer orders found.</CommandEmpty>
                        <CommandGroup>
                          {filteredCustomerOrders.map((order) => (
                            <CommandItem
                              key={order.id}
                              value={order.id}
                              onSelect={() => handleCustomerOrderSelect(order)}
                            >
                              <Check
                                className={cn(
                                  "mr-2 h-4 w-4",
                                  data.selectedCustomerOrder?.id === order.id ? "opacity-100" : "opacity-0"
                                )}
                              />
                              <div className="flex-1">
                                <div className="flex items-center space-x-2">
                                  <span className="font-medium">{order.orderNumber}</span>
                                  <Badge variant="outline">{order.customer.name}</Badge>
                                  <Badge variant="secondary">₱{order.totalAmount.toLocaleString()}</Badge>
                                </div>
                                <div className="text-sm text-muted-foreground">
                                  Order Date: {new Date(order.orderDate).toLocaleDateString()} • Status: {order.status}
                                </div>
                              </div>
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>

                {data.selectedCustomerOrder && (
                  <div className="p-3 bg-muted rounded-lg">
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <span className="font-medium">Customer:</span> {data.selectedCustomerOrder.customer.name}
                      </div>
                      <div>
                        <span className="font-medium">Order Date:</span> {new Date(data.selectedCustomerOrder.orderDate).toLocaleDateString()}
                      </div>
                      <div>
                        <span className="font-medium">Total Amount:</span> ₱{data.selectedCustomerOrder.totalAmount.toLocaleString()}
                      </div>
                      <div>
                        <span className="font-medium">Status:</span> {data.selectedCustomerOrder.status}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          )}
        </Card>

        <Card className={cn("cursor-pointer transition-colors", data.sourceType === "manual_input" && "ring-2 ring-primary")}
        >
          <CardHeader className="pb-3">
            <div className="flex items-centered space-x-2">
              <RadioGroupItem value="manual_input" id="manual_input" />
              <Label htmlFor="manual_input" className="flex items-center space-x-2 cursor-pointer">
                <Edit3 className="w-4 h-4" />
                <span className="font-medium">Manual Customer Entry</span>
              </Label>
            </div>
            <p className="text-sm text-muted-foreground ml-6">
              Enter a new customer name manually
            </p>
          </CardHeader>
          {data.sourceType === "manual_input" && (
            <CardContent className="pt-0">
              <div className="space-y-3">
                <div>
                  <Label htmlFor="manual-customer-name">Customer Name</Label>
                  <Input
                    id="manual-customer-name"
                    placeholder="Enter customer name..."
                    value={data.manualCustomerName || ""}
                    onChange={(e) => handleManualCustomerNameChange(e.target.value)}
                  />
                </div>
                {data.manualCustomerName && (
                  <div className="p-3 bg-muted rounded-lg">
                    <div className="text-sm">
                      <span className="font-medium">Customer Name:</span> {data.manualCustomerName}
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      This will create a billing statement with the manually entered customer name.
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          )}
        </Card>
      </RadioGroup>
    </div>
  );
}
