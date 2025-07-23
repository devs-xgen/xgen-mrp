"use client";

import { useState } from "react";
import { 
  User, 
  Building2, 
  Mail, 
  Phone, 
  MapPin, 
  Edit3, 
  CheckCircle2, 
  AlertTriangle,
  ShoppingCart,
  FileText,
  Calendar
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { formatCurrencyPHP } from "@/lib/constant";
import { BillingTypeId } from "@/types/admin/billing-types";
import { Customer } from "@/types/admin/billing";
import { CustomerOrder } from "@/types/admin/customer-order";

// ==============================================
// TYPES & INTERFACES
// ==============================================

export interface CustomerInfo {
  name: string;
  source: 'customer' | 'order' | 'manual';
  billingType: BillingTypeId;
  details?: Customer | CustomerOrder;
  isAutoPopulated: boolean;
  lastModified?: Date;
}

export interface CustomerSummaryCardProps {
  customerInfo?: CustomerInfo;
  onEdit?: () => void;
  onClear?: () => void;
  showEditButton?: boolean;
  showClearButton?: boolean;
  className?: string;
  compact?: boolean;
}

export interface DataSourceIndicatorProps {
  source: CustomerInfo['source'];
  isAutoPopulated: boolean;
  billingType: BillingTypeId;
}

export interface CustomerDetailsProps {
  customerInfo: CustomerInfo;
  compact?: boolean;
}

// ==============================================
// UTILITY FUNCTIONS
// ==============================================

/**
 * Get display information for billing type
 */
function getBillingTypeDisplay(billingType: BillingTypeId): {
  label: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
} {
  switch (billingType) {
    case 'customer-order':
      return {
        label: 'Customer Order',
        description: 'Billing from existing customer order',
        icon: ShoppingCart,
        color: 'text-blue-600',
      };
    case 'direct-customer':
      return {
        label: 'Direct Customer',
        description: 'Billing to existing customer',
        icon: Building2,
        color: 'text-green-600',
      };
    case 'manual-customer':
      return {
        label: 'Manual Entry',
        description: 'Manually entered customer information',
        icon: Edit3,
        color: 'text-orange-600',
      };
    default:
      return {
        label: 'Unknown',
        description: 'Unknown billing type',
        icon: FileText,
        color: 'text-gray-600',
      };
  }
}

/**
 * Check if customer info is complete
 */
function validateCustomerInfo(customerInfo: CustomerInfo): {
  isValid: boolean;
  warnings: string[];
  errors: string[];
} {
  const warnings: string[] = [];
  const errors: string[] = [];

  // Check required fields
  if (!customerInfo.name || customerInfo.name.trim().length === 0) {
    errors.push('Customer name is required');
  }

  // Check for missing details based on billing type
  if (customerInfo.billingType === 'direct-customer' && !customerInfo.details) {
    warnings.push('Customer details not loaded from database');
  }

  if (customerInfo.billingType === 'customer-order' && !customerInfo.details) {
    warnings.push('Customer order details not loaded');
  }

  // Check for manual entry completeness
  if (customerInfo.billingType === 'manual-customer') {
    if (customerInfo.name.length < 3) {
      warnings.push('Customer name seems too short');
    }
  }

  return {
    isValid: errors.length === 0,
    warnings,
    errors,
  };
}

// ==============================================
// SUB-COMPONENTS
// ==============================================

/**
 * Data source indicator component
 */
function DataSourceIndicator({ source, isAutoPopulated, billingType }: DataSourceIndicatorProps) {
  const billingTypeDisplay = getBillingTypeDisplay(billingType);
  const IconComponent = billingTypeDisplay.icon;

  return (
    <div className="flex items-center gap-2">
      <IconComponent className={`h-4 w-4 ${billingTypeDisplay.color}`} />
      <div className="flex items-center gap-2">
        <Badge 
          variant={isAutoPopulated ? "default" : "secondary"}
          className="text-xs"
        >
          {billingTypeDisplay.label}
        </Badge>
        {isAutoPopulated && (
          <Badge variant="outline" className="text-xs text-green-600">
            <CheckCircle2 className="mr-1 h-3 w-3" />
            Auto-populated
          </Badge>
        )}
      </div>
    </div>
  );
}

/**
 * Customer details display component
 */
function CustomerDetails({ customerInfo, compact = false }: CustomerDetailsProps) {
  const { details, source, billingType } = customerInfo;

  // Render customer order details
  if (source === 'order' && details && 'orderNumber' in details) {
    const order = details as CustomerOrder;
    return (
      <div className={`space-y-2 ${compact ? 'text-sm' : ''}`}>
        <div className="flex items-center gap-2">
          <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          <span className="font-medium">Order #{order.orderNumber}</span>
        </div>
        
        {!compact && (
          <>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Calendar className="h-3 w-3" />
              <span>Order Date: {new Date(order.orderDate).toLocaleDateString()}</span>
            </div>
            
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <FileText className="h-3 w-3" />
              <span>Amount: {formatCurrencyPHP(order.totalAmount)}</span>
            </div>
            
            {order.customer && (
              <div className="pt-2 border-t">
                <div className="text-sm font-medium">Customer Details:</div>
                <div className="text-sm text-muted-foreground">
                  {order.customer.email && (
                    <div className="flex items-center gap-2">
                      <Mail className="h-3 w-3" />
                      <span>{order.customer.email}</span>
                    </div>
                  )}
                  {order.customer.phone && (
                    <div className="flex items-center gap-2">
                      <Phone className="h-3 w-3" />
                      <span>{order.customer.phone}</span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    );
  }

  // Render direct customer details
  if (source === 'customer' && details && 'email' in details) {
    const customer = details as Customer;
    return (
      <div className={`space-y-2 ${compact ? 'text-sm' : ''}`}>
        <div className="flex items-center gap-2">
          <Building2 className="h-4 w-4 text-muted-foreground" />
          <span className="font-medium">Customer #{customer.code}</span>
        </div>
        
        {!compact && (
          <>
            {customer.email && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Mail className="h-3 w-3" />
                <span>{customer.email}</span>
              </div>
            )}
            
            {customer.phone && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Phone className="h-3 w-3" />
                <span>{customer.phone}</span>
              </div>
            )}
            
            {customer.address && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <MapPin className="h-3 w-3" />
                <span>{customer.address}</span>
              </div>
            )}
            
            {customer.status && (
              <div className="pt-2">
                <Badge 
                  variant={customer.status === 'ACTIVE' ? 'default' : 'secondary'}
                  className="text-xs"
                >
                  {customer.status}
                </Badge>
              </div>
            )}
          </>
        )}
      </div>
    );
  }

  // Render manual entry details
  if (source === 'manual') {
    return (
      <div className={`space-y-2 ${compact ? 'text-sm' : ''}`}>
        <div className="flex items-center gap-2">
          <Edit3 className="h-4 w-4 text-muted-foreground" />
          <span className="font-medium">Manual Entry</span>
        </div>
        
        {!compact && (
          <div className="text-sm text-muted-foreground">
            Customer information entered manually. Consider adding to customer database for future use.
          </div>
        )}
      </div>
    );
  }

  return null;
}

// ==============================================
// MAIN COMPONENT
// ==============================================

export function CustomerSummaryCard({
  customerInfo,
  onEdit,
  onClear,
  showEditButton = true,
  showClearButton = true,
  className = "",
  compact = false,
}: CustomerSummaryCardProps) {
  const [isExpanded, setIsExpanded] = useState(!compact);

  if (!customerInfo) {
    return (
      <Card className={`bg-card border rounded-lg ${className}`}>
        <CardHeader className="pb-4">
          <CardTitle className="text-lg flex items-center">
            <User className="mr-2 h-5 w-5" />
            Customer Information
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              No customer information selected. Please select a billing type and customer.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  const validation = validateCustomerInfo(customerInfo);
  const billingTypeDisplay = getBillingTypeDisplay(customerInfo.billingType);

  return (
    <Card className={`bg-card border rounded-lg ${className}`}>
      <CardHeader className="pb-4">
        <CardTitle className="text-lg flex items-center justify-between">
          <div className="flex items-center">
            <User className="mr-2 h-5 w-5" />
            Customer Information
          </div>
          <div className="flex items-center gap-2">
            {!validation.isValid && (
              <AlertTriangle className="h-4 w-4 text-destructive" />
            )}
            {validation.isValid && validation.warnings.length === 0 && (
              <CheckCircle2 className="h-4 w-4 text-green-600" />
            )}
            {validation.warnings.length > 0 && (
              <AlertTriangle className="h-4 w-4 text-yellow-600" />
            )}
          </div>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Validation Messages */}
        {validation.errors.length > 0 && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              {validation.errors.join(', ')}
            </AlertDescription>
          </Alert>
        )}

        {validation.warnings.length > 0 && validation.errors.length === 0 && (
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              {validation.warnings.join(', ')}
            </AlertDescription>
          </Alert>
        )}

        {/* Customer Name */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-lg">{customerInfo.name}</h3>
            {compact && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsExpanded(!isExpanded)}
                className="text-xs"
              >
                {isExpanded ? 'Less' : 'More'}
              </Button>
            )}
          </div>
          
          {/* Data Source Indicator */}
          <DataSourceIndicator
            source={customerInfo.source}
            isAutoPopulated={customerInfo.isAutoPopulated}
            billingType={customerInfo.billingType}
          />
        </div>

        {/* Customer Details */}
        {isExpanded && (
          <>
            <Separator />
            <CustomerDetails customerInfo={customerInfo} compact={compact} />
          </>
        )}

        {/* Billing Type Description */}
        {isExpanded && (
          <div className="pt-2">
            <div className="text-sm text-muted-foreground">
              {billingTypeDisplay.description}
            </div>
          </div>
        )}

        {/* Last Modified */}
        {isExpanded && customerInfo.lastModified && (
          <div className="text-xs text-muted-foreground">
            Last updated: {customerInfo.lastModified.toLocaleString()}
          </div>
        )}

        {/* Action Buttons */}
        {(showEditButton || showClearButton) && (
          <div className="flex gap-2 pt-2">
            {showEditButton && onEdit && (
              <Button
                variant="outline"
                size="sm"
                onClick={onEdit}
                className="flex-1"
              >
                <Edit3 className="mr-2 h-4 w-4" />
                Edit
              </Button>
            )}
            {showClearButton && onClear && (
              <Button
                variant="outline"
                size="sm"
                onClick={onClear}
                className="flex-1"
              >
                Clear
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}