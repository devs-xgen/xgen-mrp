import { BillingFormStep, BillingFormStepConfig } from "@/types/admin/billing-form-steps";

export const billingFormSteps: BillingFormStepConfig[] = [
  {
    id: BillingFormStep.BILLING_TYPE_SELECTION,
    title: "Billing Type",
    description: "Choose how you want to create the billing statement",
  },
  {
    id: BillingFormStep.CUSTOMER_INFORMATION,
    title: "Customer Information", 
    description: "Select or enter customer details",
  },
  {
    id: BillingFormStep.BILLING_DETAILS,
    title: "Billing Details",
    description: "Set dates, terms, and basic information",
  },
  {
    id: BillingFormStep.INVOICE_ITEMS,
    title: "Invoice Items",
    description: "Add items and calculate totals",
  },
  {
    id: BillingFormStep.REVIEW_SUBMIT,
    title: "Review & Submit",
    description: "Review all information and submit",
  },
];

export const getStepIndex = (step: BillingFormStep): number => {
  return billingFormSteps.findIndex(s => s.id === step);
};

export const getStepConfig = (step: BillingFormStep): BillingFormStepConfig | undefined => {
  return billingFormSteps.find(s => s.id === step);
};

export const getNextStep = (currentStep: BillingFormStep): BillingFormStep | null => {
  const currentIndex = getStepIndex(currentStep);
  if (currentIndex >= 0 && currentIndex < billingFormSteps.length - 1) {
    return billingFormSteps[currentIndex + 1].id;
  }
  return null;
};

export const getPreviousStep = (currentStep: BillingFormStep): BillingFormStep | null => {
  const currentIndex = getStepIndex(currentStep);
  if (currentIndex > 0) {
    return billingFormSteps[currentIndex - 1].id;
  }
  return null;
};

export const isStepCompleted = (step: BillingFormStep, completedSteps: BillingFormStep[]): boolean => {
  return completedSteps.includes(step);
};

export const canNavigateToStep = (
  targetStep: BillingFormStep, 
  currentStep: BillingFormStep, 
  completedSteps: BillingFormStep[]
): boolean => {
  const targetIndex = getStepIndex(targetStep);
  const currentIndex = getStepIndex(currentStep);
  
  // Can always go back to previous steps
  if (targetIndex < currentIndex) {
    return true;
  }
  
  // Can go to next step if current step is completed
  if (targetIndex === currentIndex + 1) {
    return isStepCompleted(currentStep, completedSteps);
  }
  
  // Can go to any completed step
  return isStepCompleted(targetStep, completedSteps);
};