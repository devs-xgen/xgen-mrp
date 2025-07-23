"use client";

import { useState, useEffect } from "react";
import { ShoppingCart, User, Edit, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { EnhancedCustomerOrderSelector } from "./customer-selection/enhanced-customer-order-selector";
import { DirectCustomerSelector } from "./customer-selection/direct-customer-selector";
import { ManualCustomerEntry } from "./customer-selection/manual-customer-entry";
import { Customer } from "@/types/admin/billing";
import { CustomerOrder } from "@/types/admin/customer-order";

export type BillingType = 'customer-order' | 'direct-customer' | 'manual-customer';

interface CustomerSelectionData {
  billingType: BillingType;
  customerName: string;
  customerId?: string;
  customerOrderId?: string;
  selectedCustomer?: Customer;
  selectedOrder?: CustomerOrder;
  manualCustomerDetails?: {
    name: string;
    email?: string;
    phone?: string;
    address?: string;
    city?: string;
    state?: string;
    postalCode?: string;
    country?: string;
  };
}

interface EnhancedCustomerSelectionProps {
  customers: Customer[];
  customerOrders: CustomerOrder[];
  selectedData?: CustomerSelectionData;
  onSelectionChange: (data: CustomerSelectionData, invoiceItems?: any[]) => void;
  disabled?: boolean;
  loading?: boolean;
  defaultTab?: BillingType;
}

export function EnhancedCustomerSelection({
  customers,
  customerOrders,
  selectedData,
  onSelectionChange,
  disabled = false,
  loading = false,
  defaultTab = 'customer-order',
}: EnhancedCustomerSelectionProps) {
  const [activeTab, setActiveTab] = useState<BillingType>(selectedData?.billingType || defaultTab);
  const [selectionData, setSelectionData] = useState<CustomerSelectionData>(
    selectedData || {
      billingType: defaultTab,
      customerName: "",
    }
  );

  // Update selection data when tab changes
  useEffect(() => {
    if (activeTab !== selectionData.billingType) {
      const newData: CustomerSelectionData = {
        billingType: activeTab,
        customerName: "",
        customerId: undefined,
        customerOrderId: undefined,
        selectedCustomer: undefined,
        selectedOrder: undefined,
        manualCustomerDetails: undefined,
      };
      setSelectionData(newData);
      onSelectionChange(newData);
    }
  }, [activeTab, selectionData.billingType, onSelectionChange]);

  const handleCustomerOrderSelect = (order: CustomerOrder, invoiceItems?: any[]) => {
    const newData: CustomerSelectionData = {
      billingType: 'customer-order',
      customerName: order.customer.name,
      customerOrderId: order.id,
      selectedOrder: order,
      customerId: undefined,
      selectedCustomer: undefined,
      manualCustomerDetails: undefined,
    };
    setSelectionData(newData);
    onSelectionChange(newData, invoiceItems);
  };

  const handleDirectCustomerSelect = (customer: Customer) => {
    const newData: CustomerSelectionData = {
      billingType: 'direct-customer',
      customerName: customer.name,
      customerId: customer.id,
      selectedCustomer: customer,
      customerOrderId: undefined,
      selectedOrder: undefined,
      manualCustomerDetails: undefined,
    };
    setSelectionData(newData);
    onSelectionChange(newData);
  };

  const handleManualCustomerChange = (name: string) => {
    const newData: CustomerSelectionData = {
      ...selectionData,
      billingType: 'manual-customer',
      customerName: name,
      customerId: undefined,
      customerOrderId: undefined,
      selectedCustomer: undefined,
      selectedOrder: undefined,
      manualCustomerDetails: {
        ...selectionData.manualCustomerDetails,
        name,
      },
    };
    setSelectionData(newData);
    onSelectionChange(newData);
  };

  const handleManualCustomerDetailsChange = (details: any) => {
    const newData: CustomerSelectionData = {
      ...selectionData,
      billingType: 'manual-customer',
      customerName: details.name,
      manualCustomerDetails: details,
    };
    setSelectionData(newData);
    onSelectionChange(newData);
  };

  const handleClearSelection = () => {
    const newData: CustomerSelectionData = {
      billingType: activeTab,
      customerName: "",
      customerId: undefined,
      customerOrderId: undefined,
      selectedCustomer: undefined,
      selectedOrder: undefined,
      manualCustomerDetails: undefined,
    };
    setSelectionData(newData);
    onSelectionChange(newData);
  };

  const handleResetAll = () => {
    setActiveTab(defaultTab);
    const newData: CustomerSelectionData = {
      billingType: defaultTab,
      customerName: "",
      customerId: undefined,
      customerOrderId: undefined,
      selectedCustomer: undefined,
      selectedOrder: undefined,
      manualCustomerDetails: undefined,
    };
    setSelectionData(newData);
    onSelectionChange(newData);
  };

  const getTabDescription = (tab: BillingType) => {
    switch (tab) {
      case 'customer-order':
        return 'Create billing from an existing customer order with pre-filled details';
      case 'direct-customer':
        return 'Create billing for an existing customer from your database';
      case 'manual-customer':
        return 'Create billing with manually entered customer information';
      default:
        return '';
    }
  };

  const getTabIcon = (tab: BillingType) => {
    switch (tab) {
      case 'customer-order':
        return <ShoppingCart className="h-4 w-4" />;
      case 'direct-customer':
        return <User className="h-4 w-4" />;
      case 'manual-customer':
        return <Edit className="h-4 w-4" />;
      default:
        return null;
    }
  };

  return (
    <Card className="bg-card border rounded-lg">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Customer Information</CardTitle>
          {selectionData.customerName && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleResetAll}
              disabled={disabled}
              className="text-xs"
            >
              <RotateCcw className="h-3 w-3 mr-1" />
              Reset
            </Button>
          )}
        </div>
        <p className="text-sm text-muted-foreground">
          Choose how you want to specify the customer for this billing statement
        </p>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as BillingType)}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="customer-order" className="flex items-center gap-2">
              {getTabIcon('customer-order')}
              <span className="hidden sm:inline">Customer Order</span>
              <span className="sm:hidden">Order</span>
            </TabsTrigger>
            <TabsTrigger value="direct-customer" className="flex items-center gap-2">
              {getTabIcon('direct-customer')}
              <span className="hidden sm:inline">Direct Customer</span>
              <span className="sm:hidden">Customer</span>
            </TabsTrigger>
            <TabsTrigger value="manual-customer" className="flex items-center gap-2">
              {getTabIcon('manual-customer')}
              <span className="hidden sm:inline">Manual Entry</span>
              <span className="sm:hidden">Manual</span>
            </TabsTrigger>
          </TabsList>

          {/* Tab Description */}
          <div className="mt-4 mb-6">
            <Alert>
              <AlertDescription className="text-sm">
                <strong>{activeTab === 'customer-order' ? 'Customer Order Billing' : 
                         activeTab === 'direct-customer' ? 'Direct Customer Billing' : 
                         'Manual Customer Entry'}:</strong> {getTabDescription(activeTab)}
              </AlertDescription>
            </Alert>
          </div>

          <TabsContent value="customer-order" className="space-y-4">
            <EnhancedCustomerOrderSelector
              customerOrders={customerOrders}
              selectedOrder={selectionData.selectedOrder}
              onOrderSelect={(order, invoiceItems) => {
                handleCustomerOrderSelect(order, invoiceItems);
              }}
              onClear={handleClearSelection}
              disabled={disabled}
              loading={loading}
              onValidationResult={(result) => {
                // Handle validation result if needed
                console.log('Order validation result:', result);
              }}
            />
          </TabsContent>

          <TabsContent value="direct-customer" className="space-y-4">
            <DirectCustomerSelector
              customers={customers}
              selectedCustomer={selectionData.selectedCustomer}
              onCustomerSelect={handleDirectCustomerSelect}
              onClear={handleClearSelection}
              disabled={disabled}
              loading={loading}
            />
          </TabsContent>

          <TabsContent value="manual-customer" className="space-y-4">
            <ManualCustomerEntry
              customerName={selectionData.customerName}
              onCustomerNameChange={handleManualCustomerChange}
              customerDetails={selectionData.manualCustomerDetails}
              onCustomerDetailsChange={handleManualCustomerDetailsChange}
              onClear={handleClearSelection}
              disabled={disabled}
              showAdditionalFields={true}
              required={true}
            />
          </TabsContent>
        </Tabs>

        {/* Selection Summary */}
        {selectionData.customerName && (
          <div className="mt-6 pt-4 border-t">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-sm font-medium text-muted-foreground">Selected Customer:</span>
                <div className="font-semibold">{selectionData.customerName}</div>
                <div className="text-xs text-muted-foreground">
                  via {activeTab === 'customer-order' ? 'Customer Order' : 
                       activeTab === 'direct-customer' ? 'Direct Customer' : 
                       'Manual Entry'}
                </div>
              </div>
              <div className="flex items-center gap-2">
                {getTabIcon(activeTab)}
                <span className="text-sm text-muted-foreground capitalize">
                  {activeTab.replace('-', ' ')}
                </span>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export type { CustomerSelectionData };