"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { FormFieldError } from "@/components/ui/form-field-error";
import { User, ShoppingCart, Edit, CheckCircle } from "lucide-react";
import { formatCurrencyPHP } from "@/lib/constant";
import { BillingTypeSelector } from "../billing-type-selector";
import { EnhancedCustomerSelection, CustomerSelectionData } from "../enhanced-customer-selection";
import { Customer } from "@/types/admin/billing";
import { CustomerOrder } from "@/types/admin/customer-order";
import { BillingTypeId } from "@/types/admin/billing-types";

interface CustomerInformationCardProps {
  customers: Customer[];
  customerOrders: CustomerOrder[];
  selectedBillingType?: BillingTypeId;
  selectedCustomerData?: CustomerSelectionData;
  onBillingTypeChange: (type: BillingTypeId) => void;
  onCustomerSelectionChange: (data: CustomerSelectionData, invoiceItems?: any[]) => void;
  disabled?: boolean;
  loading?: boolean;
  showBillingTypeSelector?: boolean;
  errors?: Record<string, string | string[]>;
}

export function CustomerInformationCard({
  customers,
  customerOrders,
  selectedBillingType,
  selectedCustomerData,
  onBillingTypeChange,
  onCustomerSelectionChange,
  disabled = false,
  loading = false,
  showBillingTypeSelector = true,
  errors = {},
}: CustomerInformationCardProps) {
  const [localBillingType, setLocalBillingType] = useState<BillingTypeId | undefined>(selectedBillingType);
  const [localCustomerData, setLocalCustomerData] = useState<CustomerSelectionData | undefined>(selectedCustomerData);

  // Update local state when props change
  useEffect(() => {
    setLocalBillingType(selectedBillingType);
  }, [selectedBillingType]);

  useEffect(() => {
    setLocalCustomerData(selectedCustomerData);
  }, [selectedCustomerData]);

  const handleBillingTypeSelect = (type: BillingTypeId) => {
    setLocalBillingType(type);
    onBillingTypeChange(type);
    
    // Reset customer selection when billing type changes
    const resetData: CustomerSelectionData = {
      billingType: type,
      customerName: "",
      customerId: undefined,
      customerOrderId: undefined,
      selectedCustomer: undefined,
      selectedOrder: undefined,
      manualCustomerDetails: undefined,
    };
    setLocalCustomerData(resetData);
    onCustomerSelectionChange(resetData);
  };

  const handleCustomerSelectionChange = (data: CustomerSelectionData, invoiceItems?: any[]) => {
    setLocalCustomerData(data);
    onCustomerSelectionChange(data, invoiceItems);
  };

  const getSelectionIcon = (billingType: BillingTypeId) => {
    switch (billingType) {
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

  const getSelectionLabel = (billingType: BillingTypeId) => {
    switch (billingType) {
      case 'customer-order':
        return 'Customer Order';
      case 'direct-customer':
        return 'Direct Customer';
      case 'manual-customer':
        return 'Manual Entry';
      default:
        return '';
    }
  };

  const isSelectionComplete = localCustomerData?.customerName && localCustomerData.customerName.trim().length > 0;

  return (
    <div className="space-y-6">
      {/* Billing Type Selection */}
      {showBillingTypeSelector && (
        <Card className="bg-card border rounded-lg">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg">Step 1: Choose Billing Type</CardTitle>
            <p className="text-sm text-muted-foreground">
              Select how you want to create this billing statement
            </p>
          </CardHeader>
          <CardContent>
            <BillingTypeSelector
              selectedType={localBillingType}
              onTypeSelect={handleBillingTypeSelect}
              disabled={disabled}
            />
            {errors.billingType && (
              <div className="mt-4">
                <FormFieldError error={errors.billingType} />
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Customer Selection */}
      {localBillingType && (
        <Card className="bg-card border rounded-lg">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg">Step 2: Customer Information</CardTitle>
                <p className="text-sm text-muted-foreground">
                  {localBillingType === 'customer-order' && 'Select a customer order to bill from'}
                  {localBillingType === 'direct-customer' && 'Select an existing customer from your database'}
                  {localBillingType === 'manual-customer' && 'Enter customer information manually'}
                </p>
              </div>
              {isSelectionComplete && (
                <Badge variant="secondary" className="flex items-center gap-1">
                  <CheckCircle className="h-3 w-3" />
                  Complete
                </Badge>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <EnhancedCustomerSelection
              customers={customers}
              customerOrders={customerOrders}
              selectedData={localCustomerData}
              onSelectionChange={handleCustomerSelectionChange}
              disabled={disabled}
              loading={loading}
              defaultTab={localBillingType}
            />
            <div className="mt-4 space-y-2">
              {errors.customerName && (
                <FormFieldError error={errors.customerName} field="customerName" />
              )}
              {errors.customerId && (
                <FormFieldError error={errors.customerId} field="customerId" />
              )}
              {errors.customerOrderId && (
                <FormFieldError error={errors.customerOrderId} field="customerOrderId" />
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Selection Summary */}
      {isSelectionComplete && localBillingType && (
        <Card className="bg-muted/50 border-dashed">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                {getSelectionIcon(localBillingType)}
                <div>
                  <div className="font-medium">{localCustomerData?.customerName}</div>
                  <div className="text-sm text-muted-foreground">
                    Selected via {getSelectionLabel(localBillingType)}
                  </div>
                </div>
              </div>
              <Badge variant="outline" className="flex items-center gap-1">
                <CheckCircle className="h-3 w-3" />
                Ready
              </Badge>
            </div>
            
            {/* Additional Details */}
            {localCustomerData?.selectedOrder && (
              <div className="mt-3 pt-3 border-t text-sm text-muted-foreground">
                <div>Order: {localCustomerData.selectedOrder.orderNumber}</div>
                <div>Order Date: {new Date(localCustomerData.selectedOrder.orderDate).toLocaleDateString()}</div>
                {localCustomerData.selectedOrder.totalAmount && (
                  <div>Order Total: {formatCurrencyPHP(localCustomerData.selectedOrder.totalAmount)}</div>
                )}
              </div>
            )}
            
            {localCustomerData?.selectedCustomer && (
              <div className="mt-3 pt-3 border-t text-sm text-muted-foreground">
                {localCustomerData.selectedCustomer.email && (
                  <div>Email: {localCustomerData.selectedCustomer.email}</div>
                )}
                {localCustomerData.selectedCustomer.phone && (
                  <div>Phone: {localCustomerData.selectedCustomer.phone}</div>
                )}
              </div>
            )}
            
            {localCustomerData?.manualCustomerDetails && (
              <div className="mt-3 pt-3 border-t text-sm text-muted-foreground">
                <div>Manual Entry</div>
                {localCustomerData.manualCustomerDetails.email && (
                  <div>Email: {localCustomerData.manualCustomerDetails.email}</div>
                )}
                {localCustomerData.manualCustomerDetails.phone && (
                  <div>Phone: {localCustomerData.manualCustomerDetails.phone}</div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}