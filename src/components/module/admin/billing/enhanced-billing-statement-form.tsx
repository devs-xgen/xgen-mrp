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

import {
  BillingStatementFormData,
  SalesInvoiceItemFormData,
  billingStatementSchema,
} from "@/types/admin/billing";
import { EnhancedBillingStatementFormData, BillingTypeId } from "@/types/admin/billing-types";
import { BillingFormStep, BillingFormUIState } from "@/types/admin/billing-form-steps";
import { Customer } from "@/types/admin/billing";
import { CustomerOrder } from "@/types/admin/customer-order";

// Form components
import { BillingFormProgress } from "./form-steps/billing-form-progress";
import { BillingFormNavigation } from "./form-steps/billing-form-navigation";
import { CustomerInformationCard } from "./form-sections/customer-information-card";
import { CustomerSelectionData } from "./enhanced-customer-selection";
import { billingFormSteps, getNextStep, getPreviousStep } from "./form-steps/billing-form-steps-config";

// Actions
import { getAllCustomers } from "@/lib/actions/customers";
import { getCustomerOrders } from "@/lib/actions/customer-order";
import { formatCurrencyPHP } from "@/lib/constant";

// Enhanced schema with billing type
const enhancedBillingStatementSchema = z.object({
  billingType: z.enum(['direct-customer', 'customer-order', 'manual-customer']),
  customerName: z.string().min(1, 'Customer name is required'),
  customerId: z.string().optional(),
  customerOrderId: z.string().optional(),
  productionOrderId: z.string().optional(),
  subtotal: z.number().min(0),
  taxRate: z.number().min(0).max(100),
  discountAmount: z.number().min(0),
  paymentTerms: z.string().optional(),
  dueDate: z.date().optional(),
  invoiceItems: z.array(z.any()),
  notes: z.string().optional(),
  poNumber: z.string().optional(),
  terms: z.string().optional(),
  footerNotes: z.string().optional(),
});

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

  // Form setup
  const form = useForm<EnhancedBillingStatementFormData>({
    resolver: zodResolver(enhancedBillingStatementSchema),
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

  // Load initial data
  useEffect(() => {
    const loadData = async () => {
      setUIState(prev => ({ ...prev, isLoading: true }));
      try {
        const [customersResult, customerOrdersResult] = await Promise.all([
          getAllCustomers(),
          getCustomerOrders(),
        ]);

        setCustomers(customersResult || []);
        setCustomerOrders(customerOrdersResult || []);
      } catch (error) {
        console.error("Error loading data:", error);
        toast.error("Failed to load required data");
      } finally {
        setUIState(prev => ({ ...prev, isLoading: false }));
      }
    };

    loadData();
  }, []);

  // Step navigation handlers
  const handleStepChange = (step: BillingFormStep) => {
    setUIState(prev => ({ ...prev, currentStep: step }));
    onStepChange?.(step);
  };

  const handleNext = () => {
    const nextStep = getNextStep(uiState.currentStep);
    if (nextStep) {
      // Mark current step as completed
      setUIState(prev => ({
        ...prev,
        currentStep: nextStep,
        completedSteps: [...prev.completedSteps.filter(s => s !== uiState.currentStep), uiState.currentStep],
      }));
      onStepChange?.(nextStep);
    }
  };

  const handlePrevious = () => {
    const previousStep = getPreviousStep(uiState.currentStep);
    if (previousStep) {
      setUIState(prev => ({ ...prev, currentStep: previousStep }));
      onStepChange?.(previousStep);
    }
  };

  // Billing type handlers
  const handleBillingTypeChange = (type: BillingTypeId) => {
    setSelectedBillingType(type);
    form.setValue("billingType", type);
    
    // Clear customer data when billing type changes
    form.setValue("customerName", "");
    form.setValue("customerId", "");
    form.setValue("customerOrderId", "");
    setSelectedCustomerData(undefined);
    
    setUIState(prev => ({ ...prev, billingType: type, isDirty: true }));
  };

  const handleCustomerSelectionChange = (data: CustomerSelectionData) => {
    setSelectedCustomerData(data);
    
    // Update form values based on selection
    form.setValue("customerName", data.customerName);
    form.setValue("customerId", data.customerId || "");
    form.setValue("customerOrderId", data.customerOrderId || "");
    
    // Auto-populate from customer order
    if (data.selectedOrder) {
      form.setValue("subtotal", data.selectedOrder.totalAmount);
      calculateTotals(data.selectedOrder.totalAmount, form.getValues("taxRate"), form.getValues("discountAmount"));
      
      // Auto-populate invoice items from order lines if available
      if (data.selectedOrder.orderLines && data.selectedOrder.orderLines.length > 0) {
        const orderItems: SalesInvoiceItemFormData[] = data.selectedOrder.orderLines.map(line => ({
          productId: line.productId,
          description: line.product?.name || "",
          quantity: line.quantity,
          unitPrice: line.unitPrice,
          productCode: line.product?.sku || "",
          unit: "PCS",
          discountPercent: 0,
          taxable: true,
        }));
        
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

  // Form submission
  const handleSubmit = async (data: EnhancedBillingStatementFormData) => {
    try {
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
      toast.error("An unexpected error occurred");
    }
  };

  // Validation for step progression
  const canProceedFromCurrentStep = () => {
    switch (uiState.currentStep) {
      case BillingFormStep.BILLING_TYPE_SELECTION:
        return !!selectedBillingType;
      case BillingFormStep.CUSTOMER_INFORMATION:
        return !!selectedCustomerData?.customerName && selectedCustomerData.customerName.trim().length > 0;
      case BillingFormStep.BILLING_DETAILS:
        return true; // Basic validation can be added here
      case BillingFormStep.INVOICE_ITEMS:
        return invoiceItems.some(item => item.description && item.quantity > 0 && item.unitPrice > 0);
      case BillingFormStep.REVIEW_SUBMIT:
        return true;
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
                onCustomerSelectionChange={handleCustomerSelectionChange}
                disabled={isSubmitting}
                loading={uiState.isLoading}
                showBillingTypeSelector={true}
                errors={uiState.errors}
              />
            )}

            {uiState.currentStep === BillingFormStep.CUSTOMER_INFORMATION && (
              <CustomerInformationCard
                customers={customers}
                customerOrders={customerOrders}
                selectedBillingType={selectedBillingType}
                selectedCustomerData={selectedCustomerData}
                onBillingTypeChange={handleBillingTypeChange}
                onCustomerSelectionChange={handleCustomerSelectionChange}
                disabled={isSubmitting}
                loading={uiState.isLoading}
                showBillingTypeSelector={false}
                errors={uiState.errors}
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
              <Card className="bg-card border rounded-lg">
                <CardHeader className="pb-4">
                  <CardTitle className="text-lg">Invoice Items</CardTitle>
                  <p className="text-sm text-muted-foreground">
                    Add items to be included in the billing statement
                  </p>
                </CardHeader>
                <CardContent>
                  <Alert>
                    <AlertDescription>
                      Invoice items form will be implemented in the next task.
                    </AlertDescription>
                  </Alert>
                </CardContent>
              </Card>
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