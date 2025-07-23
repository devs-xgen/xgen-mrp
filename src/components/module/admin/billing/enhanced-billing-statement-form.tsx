"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, Calculator } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form } from "@/components/ui/form";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { FormGlobalError, FormValidationSummary } from "@/components/ui/form-section-error";

import {
  BillingStatementFormData,
  SalesInvoiceItemFormData,
} from "@/types/admin/billing";
import { EnhancedBillingStatementFormData, BillingTypeId } from "@/types/admin/billing-types";
import { BillingFormStep, BillingFormUIState } from "@/types/admin/billing-form-steps";
import { Customer } from "@/types/admin/billing";
import { CustomerOrder } from "@/types/admin/customer-order";

// Enhanced validation
import { 
  enhancedBillingStatementSchema,
  billingTypeSelectionSchema,
  customerInformationSchema,
  billingDetailsSchema,
  invoiceItemsSchema,
  validateBillingTypeStep,
  validateCustomerInformationStep,
  validateInvoiceItemsStep
} from "@/lib/validation/enhanced-billing-validation";
import { useFormValidation, useStepValidation } from "@/hooks/use-form-validation";

// Form components
import { BillingFormProgress } from "./form-steps/billing-form-progress";
import { BillingFormNavigation } from "./form-steps/billing-form-navigation";
import { CustomerInformationCard } from "./form-sections/customer-information-card";
import { CustomerSelectionData } from "./enhanced-customer-selection";
import { billingFormSteps, getNextStep, getPreviousStep } from "./form-steps/billing-form-steps-config";
import { InvoiceItemsManager } from "./invoice-items";

// Actions
import { getAllCustomers } from "@/lib/actions/customers";
import { getCustomerOrdersForBilling } from "@/lib/actions/customer-order";
import { formatCurrencyPHP } from "@/lib/constant";
import { mapOrderItemsToInvoiceItems } from "@/lib/utils/invoice-item-utils";

// Step validation schemas
const stepSchemas = {
  [BillingFormStep.BILLING_TYPE_SELECTION]: billingTypeSelectionSchema,
  [BillingFormStep.CUSTOMER_INFORMATION]: customerInformationSchema,
  [BillingFormStep.BILLING_DETAILS]: billingDetailsSchema,
  [BillingFormStep.INVOICE_ITEMS]: invoiceItemsSchema,
  [BillingFormStep.REVIEW_SUBMIT]: enhancedBillingStatementSchema,
};

interface EnhancedBillingStatementFormProps {
  onSubmit: (data: BillingStatementFormData) => Promise<void>;
  isSubmitting?: boolean;
  initialData?: Partial<EnhancedBillingStatementFormData>;
  onStepChange?: (step: BillingFormStep) => void;
}

export function EnhancedBillingStatementForm({
  onSubmit,
  isSubmitting = false,
  initialData,
  onStepChange,
}: EnhancedBillingStatementFormProps) {
  // UI State
  const [uiState, setUIState] = useState<BillingFormUIState>({
    currentStep: BillingFormStep.BILLING_TYPE_SELECTION,
    completedSteps: [],
    billingType: initialData?.billingType,
    isLoading: false,
    errors: {},
    isDirty: false,
    canProceed: false,
    showValidation: false,
  });

  // Global error state
  const [globalError, setGlobalError] = useState<string | null>(null);
  const [networkError, setNetworkError] = useState<string | null>(null);

  // Data State
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [customerOrders, setCustomerOrders] = useState<CustomerOrder[]>([]);
  const [selectedBillingType, setSelectedBillingType] = useState<BillingTypeId | undefined>(initialData?.billingType);
  const [selectedCustomerData, setSelectedCustomerData] = useState<CustomerSelectionData | undefined>();
  const [invoiceItems, setInvoiceItems] = useState<SalesInvoiceItemFormData[]>([
    {
      description: "",
      quantity: 0,
      unitPrice: 0,
      productCode: "",
      unit: "PCS",
      discountPercent: 0,
      taxable: true,
    },
  ]);

  // Form setup with enhanced validation
  const form = useForm<EnhancedBillingStatementFormData>({
    resolver: zodResolver(enhancedBillingStatementSchema),
    mode: 'onBlur',
    reValidateMode: 'onChange',
    defaultValues: {
      billingType: 'customer-order',
      customerName: "",
      customerId: "",
      customerOrderId: "",
      productionOrderId: "",
      subtotal: 0,
      taxRate: 12,
      discountAmount: 0,
      paymentTerms: "Net 30",
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      invoiceItems: invoiceItems,
      notes: "",
      poNumber: "",
      terms: "",
      footerNotes: "",
      ...initialData,
    },
  });

  // Step-based validation
  const stepValidation = useStepValidation<EnhancedBillingStatementFormData>(
    stepSchemas,
    uiState.currentStep
  );

  // Load initial data
  useEffect(() => {
    const loadData = async () => {
      setUIState(prev => ({ ...prev, isLoading: true }));
      setNetworkError(null);
      
      try {
        const [customersResult, customerOrdersResult] = await Promise.all([
          getAllCustomers(),
          getCustomerOrdersForBilling({ limit: 200 }), // Get recent orders for billing
        ]);

        setCustomers(customersResult || []);
        setCustomerOrders(customerOrdersResult || []);
      } catch (error) {
        console.error("Error loading data:", error);
        const errorMessage = error instanceof Error ? error.message : "Failed to load required data";
        setNetworkError(errorMessage);
        toast.error("Failed to load required data");
      } finally {
        setUIState(prev => ({ ...prev, isLoading: false }));
      }
    };

    loadData();
  }, []);

  // Step navigation handlers with validation
  const handleStepChange = (step: BillingFormStep) => {
    setUIState(prev => ({ ...prev, currentStep: step }));
    setGlobalError(null);
    stepValidation.clearAllErrors();
    onStepChange?.(step);
  };

  const handleNext = async () => {
    const formData = form.getValues();
    
    // Validate current step before proceeding
    const canProceed = await validateCurrentStep(formData);
    
    if (!canProceed) {
      setUIState(prev => ({ ...prev, showValidation: true }));
      return;
    }

    const nextStep = getNextStep(uiState.currentStep);
    if (nextStep) {
      // Mark current step as completed
      setUIState(prev => ({
        ...prev,
        currentStep: nextStep,
        completedSteps: [...prev.completedSteps.filter(s => s !== uiState.currentStep), uiState.currentStep],
        showValidation: false,
      }));
      stepValidation.clearAllErrors();
      onStepChange?.(nextStep);
    }
  };

  const handlePrevious = () => {
    const previousStep = getPreviousStep(uiState.currentStep);
    if (previousStep) {
      setUIState(prev => ({ 
        ...prev, 
        currentStep: previousStep,
        showValidation: false 
      }));
      stepValidation.clearAllErrors();
      onStepChange?.(previousStep);
    }
  };

  // Billing type handlers with validation
  const handleBillingTypeChange = (type: BillingTypeId) => {
    setSelectedBillingType(type);
    form.setValue("billingType", type);
    
    // Clear customer data when billing type changes
    form.setValue("customerName", "");
    form.setValue("customerId", "");
    form.setValue("customerOrderId", "");
    setSelectedCustomerData(undefined);
    
    // Clear validation errors for customer fields
    stepValidation.clearFieldError('customerId');
    stepValidation.clearFieldError('customerOrderId');
    stepValidation.clearFieldError('customerName');
    
    setUIState(prev => ({ ...prev, billingType: type, isDirty: true }));
  };

  const handleCustomerSelectionChange = (data: CustomerSelectionData, invoiceItems?: SalesInvoiceItemFormData[]) => {
    setSelectedCustomerData(data);
    
    // Update form values based on selection
    form.setValue("customerName", data.customerName);
    form.setValue("customerId", data.customerId || "");
    form.setValue("customerOrderId", data.customerOrderId || "");
    
    // Clear validation errors for customer fields
    stepValidation.clearFieldError('customerId');
    stepValidation.clearFieldError('customerOrderId');
    stepValidation.clearFieldError('customerName');
    
    // Auto-populate from customer order
    if (data.selectedOrder) {
      form.setValue("subtotal", data.selectedOrder.totalAmount);
      calculateTotals(data.selectedOrder.totalAmount, form.getValues("taxRate"), form.getValues("discountAmount"));
      
      // Use provided invoice items or map from order lines
      let orderItems: SalesInvoiceItemFormData[] = [];
      
      if (invoiceItems && invoiceItems.length > 0) {
        orderItems = invoiceItems;
      } else if (data.selectedOrder.orderLines && data.selectedOrder.orderLines.length > 0) {
        orderItems = data.selectedOrder.orderLines.map(line => ({
          productId: line.productId,
          productVariantId: line.productVariantId,
          description: line.productVariant 
            ? `${line.product?.name || 'Unknown Product'} (${line.productVariant.displayName})`
            : line.product?.name || 'Unknown Product',
          quantity: line.quantity,
          unitPrice: line.productVariant?.unitPrice || line.unitPrice,
          productCode: line.productVariant?.sku || line.product?.sku || "",
          unit: line.product?.unitOfMeasure || "PCS",
          discountPercent: 0,
          taxable: true,
        }));
      }
      
      if (orderItems.length > 0) {
        setInvoiceItems(orderItems);
        form.setValue("invoiceItems", orderItems);
      }
    }
    
    setUIState(prev => ({ ...prev, isDirty: true }));
  };

  // Calculate totals
  const calculateTotals = (subtotal: number, taxRate: number, discountAmount: number) => {
    const taxAmount = (subtotal * taxRate) / 100;
    const totalAmount = subtotal + taxAmount - discountAmount;
    
    form.setValue("subtotal", subtotal);
    form.setValue("taxRate", taxRate);
    form.setValue("discountAmount", discountAmount);
  };

  // Form submission with enhanced error handling
  const handleSubmit = async (data: EnhancedBillingStatementFormData) => {
    setGlobalError(null);
    setNetworkError(null);
    
    try {
      // Final validation before submission
      const validationResult = await stepValidation.validateForm(data);
      
      if (!validationResult.isValid) {
        setUIState(prev => ({ ...prev, showValidation: true }));
        toast.error("Please fix the validation errors before submitting");
        return;
      }

      // Convert enhanced form data to standard form data
      const standardFormData: BillingStatementFormData = {
        customerName: data.customerName,
        customerId: data.customerId,
        customerOrderId: data.customerOrderId,
        productionOrderId: data.productionOrderId,
        subtotal: data.subtotal,
        taxRate: data.taxRate,
        discountAmount: data.discountAmount,
        paymentTerms: data.paymentTerms,
        dueDate: data.dueDate,
        invoiceItems: data.invoiceItems,
        notes: data.notes,
        poNumber: data.poNumber,
        terms: data.terms,
        footerNotes: data.footerNotes,
      };
      
      await onSubmit(standardFormData);
    } catch (error) {
      console.error("Error submitting form:", error);
      
      if (error instanceof Error) {
        if (error.message.includes('network') || error.message.includes('fetch')) {
          setNetworkError("Network error occurred. Please check your connection and try again.");
        } else {
          setGlobalError(error.message);
        }
      } else {
        setGlobalError("An unexpected error occurred while submitting the form");
      }
      
      toast.error("Failed to submit billing statement");
    }
  };

  // Enhanced validation for step progression
  const validateCurrentStep = async (formData: EnhancedBillingStatementFormData): Promise<boolean> => {
    switch (uiState.currentStep) {
      case BillingFormStep.BILLING_TYPE_SELECTION:
        const billingTypeValidation = validateBillingTypeStep(formData.billingType);
        if (!billingTypeValidation.isValid) {
          stepValidation.setServerErrors(
            billingTypeValidation.errors.reduce((acc, error) => ({ ...acc, billingType: error }), {})
          );
        }
        return billingTypeValidation.isValid;

      case BillingFormStep.CUSTOMER_INFORMATION:
        const customerValidation = validateCustomerInformationStep(
          formData.billingType,
          formData.customerName,
          formData.customerId,
          formData.customerOrderId
        );
        if (!customerValidation.isValid) {
          const errors: Record<string, string> = {};
          customerValidation.errors.forEach(error => {
            if (error.includes('customer from the database')) {
              errors.customerId = error;
            } else if (error.includes('customer order')) {
              errors.customerOrderId = error;
            } else {
              errors.customerName = error;
            }
          });
          stepValidation.setServerErrors(errors);
        }
        return customerValidation.isValid;

      case BillingFormStep.BILLING_DETAILS:
        try {
          await billingDetailsSchema.parseAsync({
            subtotal: formData.subtotal,
            taxRate: formData.taxRate,
            discountAmount: formData.discountAmount,
            paymentTerms: formData.paymentTerms,
            dueDate: formData.dueDate,
            notes: formData.notes,
            poNumber: formData.poNumber,
            terms: formData.terms,
            footerNotes: formData.footerNotes,
          });
          return true;
        } catch (error) {
          if (error instanceof z.ZodError) {
            const errors: Record<string, string> = {};
            error.errors.forEach(err => {
              const fieldPath = err.path.join('.');
              errors[fieldPath] = err.message;
            });
            stepValidation.setServerErrors(errors);
          }
          return false;
        }

      case BillingFormStep.INVOICE_ITEMS:
        const itemsValidation = validateInvoiceItemsStep(formData.invoiceItems);
        if (!itemsValidation.isValid) {
          stepValidation.setServerErrors(
            itemsValidation.errors.reduce((acc, error) => ({ ...acc, invoiceItems: error }), {})
          );
        }
        return itemsValidation.isValid;

      case BillingFormStep.REVIEW_SUBMIT:
        const finalValidation = await stepValidation.validateForm(formData);
        return finalValidation.isValid;

      default:
        return false;
    }
  };

  const canProceedFromCurrentStep = () => {
    const formData = form.getValues();
    
    switch (uiState.currentStep) {
      case BillingFormStep.BILLING_TYPE_SELECTION:
        return !!selectedBillingType;
      case BillingFormStep.CUSTOMER_INFORMATION:
        return !!selectedCustomerData?.customerName && selectedCustomerData.customerName.trim().length > 0;
      case BillingFormStep.BILLING_DETAILS:
        return formData.subtotal >= 0 && formData.taxRate >= 0 && formData.discountAmount >= 0;
      case BillingFormStep.INVOICE_ITEMS:
        return invoiceItems.some(item => item.description && item.quantity > 0 && item.unitPrice >= 0);
      case BillingFormStep.REVIEW_SUBMIT:
        return !stepValidation.hasErrors;
      default:
        return false;
    }
  };

  // Loading state
  if (uiState.isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  const formValues = form.watch();
  const subtotal = formValues.subtotal || 0;
  const taxRate = formValues.taxRate || 0;
  const discountAmount = formValues.discountAmount || 0;
  const taxAmount = (subtotal * taxRate) / 100;
  const totalAmount = subtotal + taxAmount - discountAmount;
  const netAmount = totalAmount;

  const isLastStep = uiState.currentStep === BillingFormStep.REVIEW_SUBMIT;

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        {/* Progress Indicator */}
        <Card className="bg-card border rounded-lg">
          <CardContent className="pt-6">
            <BillingFormProgress
              currentStep={uiState.currentStep}
              completedSteps={uiState.completedSteps}
              totalSteps={billingFormSteps.length}
            />
          </CardContent>
        </Card>

        {/* Global Error Display */}
        {globalError && (
          <FormGlobalError
            error={globalError}
            type="server"
            onDismiss={() => setGlobalError(null)}
          />
        )}

        {/* Network Error Display */}
        {networkError && (
          <FormGlobalError
            error={networkError}
            type="network"
            onDismiss={() => setNetworkError(null)}
          />
        )}

        {/* Validation Summary */}
        {uiState.showValidation && stepValidation.hasErrors && (
          <FormValidationSummary
            errors={stepValidation.errors}
            title={`Please fix the following errors in ${billingFormSteps.find(s => s.id === uiState.currentStep)?.title}:`}
          />
        )}

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Main Form Area - 3 columns */}
          <div className="lg:col-span-3 space-y-6">
            {/* Step Content */}
            {uiState.currentStep === BillingFormStep.BILLING_TYPE_SELECTION && (
              <CustomerInformationCard
                customers={customers}
                customerOrders={customerOrders}
                selectedBillingType={selectedBillingType}
                selectedCustomerData={selectedCustomerData}
                onBillingTypeChange={handleBillingTypeChange}
                onCustomerSelectionChange={(data, invoiceItems) => handleCustomerSelectionChange(data, invoiceItems)}
                disabled={isSubmitting}
                loading={uiState.isLoading}
                showBillingTypeSelector={true}
                errors={stepValidation.errors}
              />
            )}

            {uiState.currentStep === BillingFormStep.CUSTOMER_INFORMATION && (
              <CustomerInformationCard
                customers={customers}
                customerOrders={customerOrders}
                selectedBillingType={selectedBillingType}
                selectedCustomerData={selectedCustomerData}
                onBillingTypeChange={handleBillingTypeChange}
                onCustomerSelectionChange={(data, invoiceItems) => handleCustomerSelectionChange(data, invoiceItems)}
                disabled={isSubmitting}
                loading={uiState.isLoading}
                showBillingTypeSelector={false}
                errors={stepValidation.errors}
              />
            )}

            {uiState.currentStep === BillingFormStep.BILLING_DETAILS && (
              <Card className="bg-card border rounded-lg">
                <CardHeader className="pb-4">
                  <CardTitle className="text-lg">Billing Details</CardTitle>
                  <p className="text-sm text-muted-foreground">
                    Set payment terms, dates, and additional information
                  </p>
                </CardHeader>
                <CardContent>
                  <Alert>
                    <AlertDescription>
                      Billing details form will be implemented in the next task.
                    </AlertDescription>
                  </Alert>
                </CardContent>
              </Card>
            )}

            {uiState.currentStep === BillingFormStep.INVOICE_ITEMS && (
              <InvoiceItemsManager
                items={invoiceItems}
                onItemsChange={(items) => {
                  setInvoiceItems(items);
                  form.setValue("invoiceItems", items);
                  
                  // Recalculate totals based on items
                  const newSubtotal = items.reduce((sum, item) => {
                    const itemTotal = item.quantity * item.unitPrice;
                    const discountAmount = item.discountPercent ? (itemTotal * item.discountPercent) / 100 : 0;
                    return sum + (itemTotal - discountAmount);
                  }, 0);
                  
                  calculateTotals(newSubtotal, form.getValues("taxRate"), form.getValues("discountAmount"));
                }}
                disabled={disabled || isSubmitting}
                showTemplates={true}
                showBulkOperations={true}
                maxItems={50}
                errors={stepValidation.errors}
                onValidationChange={(isValid, errors) => {
                  if (!isValid) {
                    stepValidation.setServerErrors(
                      errors.reduce((acc, error) => ({ ...acc, invoiceItems: error }), {})
                    );
                  } else {
                    stepValidation.clearFieldError('invoiceItems');
                  }
                }}
              />
            )}

            {uiState.currentStep === BillingFormStep.REVIEW_SUBMIT && (
              <Card className="bg-card border rounded-lg">
                <CardHeader className="pb-4">
                  <CardTitle className="text-lg">Review & Submit</CardTitle>
                  <p className="text-sm text-muted-foreground">
                    Review all information before submitting
                  </p>
                </CardHeader>
                <CardContent>
                  <Alert>
                    <AlertDescription>
                      Review form will be implemented in the next task.
                    </AlertDescription>
                  </Alert>
                </CardContent>
              </Card>
            )}

            {/* Form Navigation */}
            <Card className="bg-card border rounded-lg">
              <CardContent className="pt-6">
                <BillingFormNavigation
                  currentStep={uiState.currentStep}
                  completedSteps={uiState.completedSteps}
                  onStepChange={handleStepChange}
                  onNext={handleNext}
                  onPrevious={handlePrevious}
                  onSubmit={() => form.handleSubmit(handleSubmit)()}
                  disabled={isSubmitting}
                  isSubmitting={isSubmitting}
                  canProceedToNext={canProceedFromCurrentStep()}
                  isLastStep={isLastStep}
                />
              </CardContent>
            </Card>
          </div>

          {/* Summary Sidebar - 1 column */}
          <div className="space-y-6">
            <Card className="bg-card border rounded-lg sticky top-6">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg flex items-center">
                  <Calculator className="mr-2 h-5 w-5" />
                  Summary
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Subtotal:</span>
                    <span className="font-medium">{formatCurrencyPHP(subtotal)}</span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Tax ({taxRate}%):</span>
                    <span className="font-medium">{formatCurrencyPHP(taxAmount)}</span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Discount:</span>
                    <span className="font-medium">-{formatCurrencyPHP(discountAmount)}</span>
                  </div>
                  
                  <div className="border-t pt-3">
                    <div className="flex justify-between">
                      <span className="font-semibold">Total Amount:</span>
                      <span className="font-bold text-lg">{formatCurrencyPHP(totalAmount)}</span>
                    </div>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="font-semibold">Net Amount:</span>
                    <span className="font-bold text-lg text-green-600">{formatCurrencyPHP(netAmount)}</span>
                  </div>
                </div>

                {/* Customer Summary */}
                {selectedCustomerData?.customerName && (
                  <div className="pt-4 border-t">
                    <div className="text-sm font-medium text-muted-foreground mb-2">Customer</div>
                    <div className="font-medium">{selectedCustomerData.customerName}</div>
                    <div className="text-xs text-muted-foreground">
                      via {selectedBillingType?.replace('-', ' ')}
                    </div>
                  </div>
                )}

                {/* Step Summary */}
                <div className="pt-4 border-t">
                  <div className="text-sm font-medium text-muted-foreground mb-2">Progress</div>
                  <div className="text-sm">
                    Step {billingFormSteps.findIndex(s => s.id === uiState.currentStep) + 1} of {billingFormSteps.length}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {billingFormSteps.find(s => s.id === uiState.currentStep)?.title}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </form>
    </Form>
  );
}