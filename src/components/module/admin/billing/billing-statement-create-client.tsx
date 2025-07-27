"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ArrowRight, Loader2 } from "lucide-react";
import {
  Stepper,
  StepperDescription,
  StepperIndicator,
  StepperItem,
  StepperSeparator,
  StepperTitle,
  StepperTrigger,
} from "@/components/ui/stepper";

// Import step components
import { CustomerSelectionStep } from "./billing-statement-create-client/steps/customer-selection-step";
import { BillingDetailsStep } from "./billing-statement-create-client/steps/billing-details-step";
import { ReviewStep } from "./billing-statement-create-client/steps/review-step";

// Import actions and types
import { createBillingStatement } from "@/lib/actions/billing-statements";
import { getAllCustomers } from "@/lib/actions/customers";
import { getCustomerOrdersForBilling } from "@/lib/actions/customer-order";
import { BillingStatementFormData, SalesInvoiceItemFormData, Customer } from "@/types/admin/billing";
import { CustomerOrder } from "@/types/admin/customer-order";

export type CustomerSourceType = "manual" | "customer_order" | "manual_input";

export interface CustomerSelectionData {
  sourceType: CustomerSourceType;
  selectedCustomer?: Customer;
  selectedCustomerOrder?: CustomerOrder;
  manualCustomerName?: string;
}

export interface BillingDetailsData {
  subtotal: number;
  taxRate: number;
  discountAmount: number;
  paymentTerms?: string;
  dueDate?: Date;
  notes?: string;
}

const STEPS = [
  {
    step: 1,
    title: "Customer Selection",
    description: "Choose customer source",
  },
  {
    step: 2,
    title: "Billing Details",
    description: "Enter billing information",
  },
  {
    step: 3,
    title: "Review & Submit",
    description: "Review and submit",
  },
];

export function BillingStatementCreateClient() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Data states
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [customerOrders, setCustomerOrders] = useState<CustomerOrder[]>([]);
  const [customerSelectionData, setCustomerSelectionData] = useState<CustomerSelectionData>({
    sourceType: "manual",
  });
  const [billingDetailsData, setBillingDetailsData] = useState<BillingDetailsData>({
    subtotal: 0,
    taxRate: 12,
    discountAmount: 0,
  });

  // Load initial data
  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);
        const [customersData, customerOrdersData] = await Promise.all([
          getAllCustomers({ status: "ACTIVE", limit: 100 }),
          getCustomerOrdersForBilling({ limit: 100 }),
        ]);
        setCustomers(customersData);
        setCustomerOrders(customerOrdersData);
      } catch (error) {
        console.error("Error loading data:", error);
        toast.error("Failed to load data. Please refresh the page.");
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, []);

  const handleNext = () => {
    if (currentStep < STEPS.length) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = async () => {
    try {
      setIsSubmitting(true);

      // Prepare form data
      const formData: BillingStatementFormData = {
        customerName: getCustomerName(),
        customerId: getCustomerId(),
        customerOrderId: customerSelectionData.selectedCustomerOrder?.id,
        subtotal: billingDetailsData.subtotal,
        taxRate: billingDetailsData.taxRate,
        discountAmount: billingDetailsData.discountAmount,
        paymentTerms: billingDetailsData.paymentTerms,
        dueDate: billingDetailsData.dueDate,
        notes: billingDetailsData.notes,
        invoiceItems: [], // Initialize with empty array for now
      };

      const result = await createBillingStatement(formData);

      if (result.success && result.data) {
        toast.success("Billing statement created successfully!");
        router.push(`/admin/billing/billing-statements/${result.data.id}`);
      } else {
        toast.error(result.error || "Failed to create billing statement");
      }
    } catch (error) {
      console.error("Error creating billing statement:", error);
      toast.error("An unexpected error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  const getCustomerName = (): string => {
    switch (customerSelectionData.sourceType) {
      case "manual":
        return customerSelectionData.selectedCustomer?.name || "";
      case "customer_order":
        return customerSelectionData.selectedCustomerOrder?.customer.name || "";
      case "manual_input":
        return customerSelectionData.manualCustomerName || "";
      default:
        return "";
    }
  };

  const getCustomerId = (): string | undefined => {
    switch (customerSelectionData.sourceType) {
      case "manual":
        return customerSelectionData.selectedCustomer?.id;
      case "customer_order":
        return customerSelectionData.selectedCustomerOrder?.customerId;
      case "manual_input":
        return undefined;
      default:
        return undefined;
    }
  };

  const isStepValid = (step: number): boolean => {
    switch (step) {
      case 1:
        return (
          (customerSelectionData.sourceType === "manual" && !!customerSelectionData.selectedCustomer) ||
          (customerSelectionData.sourceType === "customer_order" && !!customerSelectionData.selectedCustomerOrder) ||
          (customerSelectionData.sourceType === "manual_input" && !!customerSelectionData.manualCustomerName?.trim())
        );
      case 2:
        return billingDetailsData.subtotal > 0;
      case 3:
        return true;
      default:
        return false;
    }
  };

  const progress = (currentStep / STEPS.length) * 100;

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Loading Stepper */}
        <Card>
          <CardHeader>
            <CardTitle className="text-center mb-6">Create Billing Statement</CardTitle>
            <div className="px-4">
              <Stepper value={0} className="w-full">
                {STEPS.map(({ step, title, description }, index) => (
                  <StepperItem
                    key={step}
                    step={index}
                    loading={index === 0}
                    className="flex-1"
                  >
                    <StepperTrigger className="w-full">
                      <StepperIndicator />
                      <div className="ml-4 text-left">
                        <StepperTitle>{title}</StepperTitle>
                        <StepperDescription className="hidden sm:block">
                          {description}
                        </StepperDescription>
                      </div>
                    </StepperTrigger>
                    {step < STEPS.length && <StepperSeparator />}
                  </StepperItem>
                ))}
              </Stepper>
            </div>
          </CardHeader>
        </Card>

        {/* Loading Content */}
        <Card className="min-h-[500px]">
          <CardHeader className="pb-4">
            <div className="animate-pulse">
              <div className="h-6 bg-gray-200 rounded w-1/3 mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="animate-pulse space-y-4">
              <div className="h-4 bg-gray-200 rounded w-full"></div>
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              <div className="h-32 bg-gray-200 rounded"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            </div>
          </CardContent>
        </Card>

        {/* Loading Navigation */}
        <Card>
          <CardContent className="p-6">
            <div className="flex justify-between items-center">
              <div className="animate-pulse">
                <div className="h-10 bg-gray-200 rounded w-[120px]"></div>
              </div>
              <div className="animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-20"></div>
              </div>
              <div className="animate-pulse">
                <div className="h-10 bg-gray-200 rounded w-[120px]"></div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Modern Stepper Header */}
      <Card>
        <CardHeader>
          <CardTitle className="text-center mb-6">Create Billing Statement</CardTitle>
          <div className="px-4">
            <Stepper value={currentStep - 1} className="w-full">
              {STEPS.map(({ step, title, description }, index) => (
                <StepperItem
                  key={step}
                  step={index}
                  completed={step < currentStep}
                  className="flex-1"
                >
                  <StepperTrigger className="w-full">
                    <StepperIndicator />
                    <div className="ml-4 text-left">
                      <StepperTitle>{title}</StepperTitle>
                      <StepperDescription className="hidden sm:block">
                        {description}
                      </StepperDescription>
                    </div>
                  </StepperTrigger>
                  {step < STEPS.length && <StepperSeparator />}
                </StepperItem>
              ))}
            </Stepper>
          </div>
        </CardHeader>
      </Card>

      {/* Step Content */}
      <Card className="min-h-[500px]">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg">
            {STEPS[currentStep - 1].title}
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            {STEPS[currentStep - 1].description}
          </p>
        </CardHeader>
        <CardContent className="pt-0">
          {currentStep === 1 && (
            <CustomerSelectionStep
              customers={customers}
              customerOrders={customerOrders}
              data={customerSelectionData}
              onChange={setCustomerSelectionData}
            />
          )}
          {currentStep === 2 && (
            <BillingDetailsStep
              data={billingDetailsData}
              onChange={setBillingDetailsData}
              customerSelectionData={customerSelectionData}
            />
          )}
          {currentStep === 3 && (
            <ReviewStep
              customerSelectionData={customerSelectionData}
              billingDetailsData={billingDetailsData}
            />
          )}
        </CardContent>
      </Card>

      {/* Navigation */}
      <Card>
        <CardContent className="p-6">
          <div className="flex justify-between items-center">
            <Button
              variant="outline"
              onClick={handlePrevious}
              disabled={currentStep === 1}
              className="min-w-[120px]"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Previous
            </Button>

            <div className="text-center">
              <p className="text-sm text-muted-foreground">
                Step {currentStep} of {STEPS.length}
              </p>
            </div>

            {currentStep < STEPS.length ? (
              <Button
                onClick={handleNext}
                disabled={!isStepValid(currentStep)}
                className="min-w-[120px]"
              >
                Next
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            ) : (
              <Button
                onClick={handleSubmit}
                disabled={!isStepValid(currentStep) || isSubmitting}
                className="min-w-[160px]"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Creating...
                  </>
                ) : (
                  "Create Billing Statement"
                )}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}