"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ShoppingCart, Users, Edit, Info } from "lucide-react";

import { CustomerOrderSelector, DirectCustomerSelector, ManualCustomerEntry } from "./customer-selection";
import { Customer } from "@/types/admin/billing";
import { CustomerOrder } from "@/types/admin/customer-order";
import { BillingTypeId } from "@/types/admin/billing-types";

interface ManualCustomerDetails {
  name: string;
  email?: string;
  phone?: string;
  address?: string;
}

interface EnhancedCustomerSelectionProps {
  customers: Customer[];
  customerOrders: CustomerOrder[];
  selectedBillingType?: BillingTypeId;
  selectedCustomer?: Customer;
  selectedCustomerOrder?: CustomerOrder;
  manualCustomerName?: string;
  manualCustomerDetails?: ManualCustomerDetails;
  onCustomerSelect: (customer: Customer) => void;
  onCustomerOrderSelect: (order: CustomerOrder) => void;
  onManualCustomerChange: (name: string, details?: ManualCustomerDetails) => void;
  onClearSelection: () => void;
  disabled?: boolean;
  className?: string;
}

export function EnhancedCustomerSelection({
  customers,
  customerOrders,
  selectedBillingType,
  selectedCustomer,
  selectedCustomerOrder,
  manualCustomerName = "",
  manualCustomerDetails,
  onCustomerSelect,
  onCustomerOrderSelect,
  onManualCustomerChange,
  onClearSelection,
  disabled = false,
  className = "",
}: EnhancedCustomerSelectionProps) {
  const [activeTab, setActiveTab] = useState<string>("customer-order");

  // Update active tab based on selected billing type
  useEffect(() => {
    if (selectedBillingType) {
      switch (selectedBillingType) {
        case "customer-order":
          setActiveTab("customer-order");
          break;
        case "direct-customer":
          setActiveTab("direct-customer");
          break;
        case "manual-customer":
          setActiveTab("manual-customer");
          break;
        default:
          setActiveTab("customer-order");
      }
    }
  }, [selectedBillingType]);

  const handleTabChange = (value: string) => {
    setActiveTab(value);
    // Clear any existing selections when switching tabs
    onClearSelection();
  };

  const handleManualCustomerDetailsChange = (details: ManualCustomerDetails) => {
    onManualCustomerChange(details.name, details);
  };

  // Determine which selection is active
  const hasSelection = selectedCustomer || selectedCustomerOrder || manualCustomerName;
  const selectionType = selectedCustomer 
    ? "direct-customer" 
    : selectedCustomerOrder 
    ? "customer-order" 
    : manualCustomerName 
    ? "manual-customer" 
    : null;

  return (
    <Card className={`bg-card border rounded-lg ${className}`}>
      <CardHeader className="pb-4">
        <CardTitle className="text-lg">Customer Information</CardTitle>
        <p className="text-sm text-muted-foreground">
          Choose how you want to specify the customer for this billing statement
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Selection Status Alert */}
        {hasSelection && (
          <Alert className="border-primary/20 bg-primary/5">
            <Info className="h-4 w-4" />
            <AlertDescription>
              <strong>Customer Selected:</strong>{" "}
              {selectedCustomer?.name || 
               selectedCustomerOrder?.customer?.name || 
               manualCustomerName} 
              {selectionType && (
                <span className="ml-2 text-xs bg-primary/20 text-primary px-2 py-1 rounded">
                  {selectionType === "direct-customer" && "From Database"}
                  {selectionType === "customer-order" && "From Order"}
                  {selectionType === "manual-customer" && "Manual Entry"}
                </span>
              )}
            </AlertDescription>
          </Alert>
        )}

        <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="customer-order" className="flex items-center gap-2">
              <ShoppingCart className="h-4 w-4" />
              <span className="hidden sm:inline">Customer Order</span>
              <span className="sm:hidden">Order</span>
            </TabsTrigger>
            <TabsTrigger value="direct-customer" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              <span className="hidden sm:inline">Direct Customer</span>
              <span className="sm:hidden">Customer</span>
            </TabsTrigger>
            <TabsTrigger value="manual-customer" className="flex items-center gap-2">
              <Edit className="h-4 w-4" />
              <span className="hidden sm:inline">Manual Entry</span>
              <span className="sm:hidden">Manual</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="customer-order" className="space-y-4 mt-4">
            <div className="space-y-2">
              <h3 className="font-medium">Select from Customer Orders</h3>
              <p className="text-sm text-muted-foreground">
                Choose an existing customer order to automatically populate customer details and order items.
              </p>
            </div>
            <CustomerOrderSelector
              orders={customerOrders}
              selectedOrder={selectedCustomerOrder}
              onOrderSelect={onCustomerOrderSelect}
              onClear={onClearSelection}
              disabled={disabled}
            />
          </TabsContent>

          <TabsContent value="direct-customer" className="space-y-4 mt-4">
            <div className="space-y-2">
              <h3 className="font-medium">Select from Customer Database</h3>
              <p className="text-sm text-muted-foreground">
                Choose an existing customer from your database to automatically populate their information.
              </p>
            </div>
            <DirectCustomerSelector
              customers={customers}
              selectedCustomer={selectedCustomer}
              onCustomerSelect={onCustomerSelect}
              onClear={onClearSelection}
              disabled={disabled}
            />
          </TabsContent>

          <TabsContent value="manual-customer" className="space-y-4 mt-4">
            <div className="space-y-2">
              <h3 className="font-medium">Manual Customer Entry</h3>
              <p className="text-sm text-muted-foreground">
                Enter customer information manually. This won't create a permanent customer record.
              </p>
            </div>
            <ManualCustomerEntry
              customerName={manualCustomerName}
              onCustomerNameChange={(name) => onManualCustomerChange(name, manualCustomerDetails)}
              customerDetails={manualCustomerDetails}
              onCustomerDetailsChange={handleManualCustomerDetailsChange}
              onClear={onClearSelection}
              disabled={disabled}
              showAdditionalFields={true}
            />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}