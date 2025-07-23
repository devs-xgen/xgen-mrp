"use client";

import { useState } from "react";
import { 
  CheckCircle2, 
  AlertTriangle, 
  Eye, 
  EyeOff, 
  FileText, 
  User, 
  Calculator,
  Calendar,
  CreditCard,
  Package,
  Edit3
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { formatCurrencyPHP } from "@/lib/constant";
import { BillingCalculations } from "./billing-summary-card";
import { CustomerInfo } from "./customer-summary-card";
import { BillingTypeId } from "@/types/admin/billing-types";
import { SalesInvoiceItemFormData } from "@/types/admin/billing";

// ==============================================
// TYPES & INTERFACES
// ==============================================

export interface BillingReviewData {
  // Customer Information
  customerInfo: CustomerInfo;
  
  // Billing Details
  billingType: BillingTypeId;
  paymentTerms?: string;
  dueDate?: Date;
  poNumber?: string;
  notes?: string;
  terms?: string;
  footerNotes?: string;
  
  // Calculations
  calculations: BillingCalculations;
  
  // Invoice Items
  invoiceItems: SalesInvoiceItemFormData[];
  
  // Metadata
  createdAt?: Date;
  lastModified?: Date;
}

export interface BillingReviewSummaryProps {
  reviewData: BillingReviewData;
  onEdit?: (section: ReviewSection) => void;
  onSubmit?: () => void;
  isSubmitting?: boolean;
  showEditButtons?: boolean;
  showSubmitButton?: boolean;
  className?: string;
  compact?: boolean;
}

export type ReviewSection = 
  | 'customer' 
  | 'billing-details' 
  | 'calculations' 
  | 'invoice-items' 
  | 'notes';

export interface ReviewSectionProps {
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  isValid: boolean;
  warnings?: string[];
  onEdit?: () => void;
  showEditButton?: boolean;
  children: React.ReactNode;
}

export interface ValidationSummary {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  sections: Record<ReviewSection, {
    isValid: boolean;
    errors: string[];
    warnings: string[];
  }>;
}

// ==============================================
// VALIDATION FUNCTIONS
// ==============================================

/**
 * Validate review data for submission
 */
function validateReviewData(reviewData: BillingReviewData): ValidationSummary {
  const sections: ValidationSummary['sections'] = {
    customer: { isValid: true, errors: [], warnings: [] },
    'billing-details': { isValid: true, errors: [], warnings: [] },
    calculations: { isValid: true, errors: [], warnings: [] },
    'invoice-items': { isValid: true, errors: [], warnings: [] },
    notes: { isValid: true, errors: [], warnings: [] },
  };

  // Validate customer information
  if (!reviewData.customerInfo.name || reviewData.customerInfo.name.trim().length === 0) {
    sections.customer.errors.push('Customer name is required');
  }

  if (reviewData.billingType === 'direct-customer' && !reviewData.customerInfo.details) {
    sections.customer.warnings.push('Customer details not loaded from database');
  }

  if (reviewData.billingType === 'customer-order' && !reviewData.customerInfo.details) {
    sections.customer.warnings.push('Customer order details not loaded');
  }

  // Validate billing details
  if (!reviewData.paymentTerms) {
    sections['billing-details'].warnings.push('Payment terms not specified');
  }

  if (!reviewData.dueDate) {
    sections['billing-details'].warnings.push('Due date not specified');
  } else if (reviewData.dueDate < new Date()) {
    sections['billing-details'].warnings.push('Due date is in the past');
  }

  // Validate calculations
  if (reviewData.calculations.subtotal <= 0) {
    sections.calculations.errors.push('Subtotal must be greater than zero');
  }

  if (reviewData.calculations.totalAmount <= 0) {
    sections.calculations.errors.push('Total amount must be greater than zero');
  }

  if (reviewData.calculations.discountAmount > reviewData.calculations.subtotal) {
    sections.calculations.errors.push('Discount cannot exceed subtotal');
  }

  if (reviewData.calculations.taxRate > 50) {
    sections.calculations.warnings.push('Tax rate seems unusually high');
  }

  // Validate invoice items
  if (reviewData.invoiceItems.length === 0) {
    sections['invoice-items'].errors.push('At least one invoice item is required');
  }

  reviewData.invoiceItems.forEach((item, index) => {
    if (!item.description || item.description.trim().length === 0) {
      sections['invoice-items'].errors.push(`Item ${index + 1}: Description is required`);
    }

    if (item.quantity <= 0) {
      sections['invoice-items'].errors.push(`Item ${index + 1}: Quantity must be greater than zero`);
    }

    if (item.unitPrice < 0) {
      sections['invoice-items'].errors.push(`Item ${index + 1}: Unit price cannot be negative`);
    }
  });

  // Calculate totals
  const allErrors = Object.values(sections).flatMap(s => s.errors);
  const allWarnings = Object.values(sections).flatMap(s => s.warnings);

  // Update section validity
  Object.keys(sections).forEach(key => {
    const section = sections[key as ReviewSection];
    section.isValid = section.errors.length === 0;
  });

  return {
    isValid: allErrors.length === 0,
    errors: allErrors,
    warnings: allWarnings,
    sections,
  };
}

// ==============================================
// SUB-COMPONENTS
// ==============================================

/**
 * Review section wrapper component
 */
function ReviewSection({
  title,
  icon: IconComponent,
  isValid,
  warnings = [],
  onEdit,
  showEditButton = true,
  children,
}: ReviewSectionProps) {
  const [isExpanded, setIsExpanded] = useState(true);

  return (
    <Card className="bg-card border rounded-lg">
      <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
        <CollapsibleTrigger asChild>
          <CardHeader className="pb-4 cursor-pointer hover:bg-muted/50 transition-colors">
            <CardTitle className="text-lg flex items-center justify-between">
              <div className="flex items-center gap-2">
                <IconComponent className="h-5 w-5" />
                <span>{title}</span>
                <div className="flex items-center gap-2">
                  {isValid ? (
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                  ) : (
                    <AlertTriangle className="h-4 w-4 text-destructive" />
                  )}
                  {warnings.length > 0 && (
                    <Badge variant="outline" className="text-xs text-yellow-600">
                      {warnings.length} warning{warnings.length > 1 ? 's' : ''}
                    </Badge>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                {showEditButton && onEdit && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      onEdit();
                    }}
                  >
                    <Edit3 className="h-4 w-4" />
                  </Button>
                )}
                {isExpanded ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </div>
            </CardTitle>
          </CardHeader>
        </CollapsibleTrigger>
        
        <CollapsibleContent>
          <CardContent>
            {warnings.length > 0 && (
              <Alert className="mb-4">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  <ul className="list-disc list-inside space-y-1">
                    {warnings.map((warning, index) => (
                      <li key={index} className="text-sm">{warning}</li>
                    ))}
                  </ul>
                </AlertDescription>
              </Alert>
            )}
            {children}
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}

// ==============================================
// MAIN COMPONENT
// ==============================================

export function BillingReviewSummary({
  reviewData,
  onEdit,
  onSubmit,
  isSubmitting = false,
  showEditButtons = true,
  showSubmitButton = true,
  className = "",
  compact = false,
}: BillingReviewSummaryProps) {
  const validation = validateReviewData(reviewData);

  const handleSectionEdit = (section: ReviewSection) => {
    onEdit?.(section);
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Overall Validation Status */}
      <Card className="bg-card border rounded-lg">
        <CardHeader className="pb-4">
          <CardTitle className="text-xl flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileText className="h-6 w-6" />
              Billing Statement Review
            </div>
            <div className="flex items-center gap-2">
              {validation.isValid ? (
                <Badge variant="default" className="text-sm">
                  <CheckCircle2 className="mr-1 h-4 w-4" />
                  Ready to Submit
                </Badge>
              ) : (
                <Badge variant="destructive" className="text-sm">
                  <AlertTriangle className="mr-1 h-4 w-4" />
                  Needs Attention
                </Badge>
              )}
            </div>
          </CardTitle>
        </CardHeader>
        
        <CardContent>
          {/* Validation Summary */}
          {validation.errors.length > 0 && (
            <Alert variant="destructive" className="mb-4">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <div className="font-medium mb-2">Please fix the following errors:</div>
                <ul className="list-disc list-inside space-y-1">
                  {validation.errors.map((error, index) => (
                    <li key={index} className="text-sm">{error}</li>
                  ))}
                </ul>
              </AlertDescription>
            </Alert>
          )}

          {validation.warnings.length > 0 && validation.errors.length === 0 && (
            <Alert className="mb-4">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <div className="font-medium mb-2">Please review the following warnings:</div>
                <ul className="list-disc list-inside space-y-1">
                  {validation.warnings.map((warning, index) => (
                    <li key={index} className="text-sm">{warning}</li>
                  ))}
                </ul>
              </AlertDescription>
            </Alert>
          )}

          {/* Quick Summary */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <div className="text-muted-foreground">Customer</div>
              <div className="font-medium">{reviewData.customerInfo.name}</div>
            </div>
            <div>
              <div className="text-muted-foreground">Billing Type</div>
              <div className="font-medium capitalize">
                {reviewData.billingType.replace('-', ' ')}
              </div>
            </div>
            <div>
              <div className="text-muted-foreground">Total Amount</div>
              <div className="font-medium text-lg">
                {formatCurrencyPHP(reviewData.calculations.totalAmount)}
              </div>
            </div>
            <div>
              <div className="text-muted-foreground">Items</div>
              <div className="font-medium">{reviewData.invoiceItems.length}</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Customer Information Section */}
      <ReviewSection
        title="Customer Information"
        icon={User}
        isValid={validation.sections.customer.isValid}
        warnings={validation.sections.customer.warnings}
        onEdit={() => handleSectionEdit('customer')}
        showEditButton={showEditButtons}
      >
        <div className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <div className="text-sm text-muted-foreground">Customer Name</div>
              <div className="font-medium">{reviewData.customerInfo.name}</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Billing Type</div>
              <div className="font-medium capitalize">
                {reviewData.billingType.replace('-', ' ')}
              </div>
            </div>
          </div>
          
          {reviewData.customerInfo.details && (
            <div className="pt-2 border-t">
              <div className="text-sm text-muted-foreground mb-2">Additional Details</div>
              <div className="text-sm">
                {reviewData.customerInfo.isAutoPopulated ? (
                  <Badge variant="outline" className="text-xs">
                    <CheckCircle2 className="mr-1 h-3 w-3" />
                    Auto-populated from {reviewData.customerInfo.source}
                  </Badge>
                ) : (
                  <Badge variant="secondary" className="text-xs">
                    Manually entered
                  </Badge>
                )}
              </div>
            </div>
          )}
        </div>
      </ReviewSection>

      {/* Billing Details Section */}
      <ReviewSection
        title="Billing Details"
        icon={Calendar}
        isValid={validation.sections['billing-details'].isValid}
        warnings={validation.sections['billing-details'].warnings}
        onEdit={() => handleSectionEdit('billing-details')}
        showEditButton={showEditButtons}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <div className="text-sm text-muted-foreground">Payment Terms</div>
            <div className="font-medium">{reviewData.paymentTerms || 'Not specified'}</div>
          </div>
          <div>
            <div className="text-sm text-muted-foreground">Due Date</div>
            <div className="font-medium">
              {reviewData.dueDate ? reviewData.dueDate.toLocaleDateString() : 'Not specified'}
            </div>
          </div>
          {reviewData.poNumber && (
            <div>
              <div className="text-sm text-muted-foreground">PO Number</div>
              <div className="font-medium">{reviewData.poNumber}</div>
            </div>
          )}
        </div>
      </ReviewSection>

      {/* Calculations Section */}
      <ReviewSection
        title="Financial Summary"
        icon={Calculator}
        isValid={validation.sections.calculations.isValid}
        warnings={validation.sections.calculations.warnings}
        onEdit={() => handleSectionEdit('calculations')}
        showEditButton={showEditButtons}
      >
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-4">
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Subtotal:</span>
              <span className="font-medium">{formatCurrencyPHP(reviewData.calculations.subtotal)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Tax ({reviewData.calculations.taxRate}%):</span>
              <span className="font-medium">{formatCurrencyPHP(reviewData.calculations.taxAmount)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Discount:</span>
              <span className="font-medium">-{formatCurrencyPHP(reviewData.calculations.discountAmount)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Net Amount:</span>
              <span className="font-medium">{formatCurrencyPHP(reviewData.calculations.netAmount)}</span>
            </div>
          </div>
          
          <Separator />
          
          <div className="flex justify-between items-center">
            <span className="font-semibold">Total Amount:</span>
            <span className="font-bold text-xl">{formatCurrencyPHP(reviewData.calculations.totalAmount)}</span>
          </div>
        </div>
      </ReviewSection>

      {/* Invoice Items Section */}
      <ReviewSection
        title="Invoice Items"
        icon={Package}
        isValid={validation.sections['invoice-items'].isValid}
        warnings={validation.sections['invoice-items'].warnings}
        onEdit={() => handleSectionEdit('invoice-items')}
        showEditButton={showEditButtons}
      >
        <div className="space-y-3">
          {reviewData.invoiceItems.map((item, index) => (
            <div key={index} className="p-3 border rounded-lg">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="font-medium">{item.description}</div>
                  {item.productCode && (
                    <div className="text-sm text-muted-foreground">Code: {item.productCode}</div>
                  )}
                </div>
                <div className="text-right">
                  <div className="font-medium">
                    {formatCurrencyPHP(item.quantity * item.unitPrice)}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {item.quantity} × {formatCurrencyPHP(item.unitPrice)}
                  </div>
                </div>
              </div>
            </div>
          ))}
          
          <div className="pt-2 border-t">
            <div className="text-sm text-muted-foreground">
              Total Items: {reviewData.invoiceItems.length}
            </div>
          </div>
        </div>
      </ReviewSection>

      {/* Notes Section */}
      {(reviewData.notes || reviewData.terms || reviewData.footerNotes) && (
        <ReviewSection
          title="Additional Information"
          icon={FileText}
          isValid={validation.sections.notes.isValid}
          warnings={validation.sections.notes.warnings}
          onEdit={() => handleSectionEdit('notes')}
          showEditButton={showEditButtons}
        >
          <div className="space-y-3">
            {reviewData.notes && (
              <div>
                <div className="text-sm text-muted-foreground">Notes</div>
                <div className="text-sm">{reviewData.notes}</div>
              </div>
            )}
            {reviewData.terms && (
              <div>
                <div className="text-sm text-muted-foreground">Terms</div>
                <div className="text-sm">{reviewData.terms}</div>
              </div>
            )}
            {reviewData.footerNotes && (
              <div>
                <div className="text-sm text-muted-foreground">Footer Notes</div>
                <div className="text-sm">{reviewData.footerNotes}</div>
              </div>
            )}
          </div>
        </ReviewSection>
      )}

      {/* Submit Button */}
      {showSubmitButton && onSubmit && (
        <Card className="bg-card border rounded-lg">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium">Ready to submit?</div>
                <div className="text-sm text-muted-foreground">
                  {validation.isValid 
                    ? "All validations passed. You can now create the billing statement."
                    : "Please fix the validation errors before submitting."
                  }
                </div>
              </div>
              <Button
                onClick={onSubmit}
                disabled={!validation.isValid || isSubmitting}
                size="lg"
                className="min-w-32"
              >
                {isSubmitting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                    Creating...
                  </>
                ) : (
                  <>
                    <CreditCard className="mr-2 h-4 w-4" />
                    Create Billing Statement
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}