// ==============================================
// BILLING FORM STEP TYPES
// ==============================================

export enum BillingFormStep {
  BILLING_TYPE_SELECTION = 'billing-type-selection',
  CUSTOMER_INFORMATION = 'customer-information', 
  BILLING_DETAILS = 'billing-details',
  INVOICE_ITEMS = 'invoice-items',
  REVIEW_SUBMIT = 'review-submit'
}

export interface BillingFormStepConfig {
  id: BillingFormStep;
  title: string;
  description: string;
  isOptional?: boolean;
  canSkip?: boolean;
}

export interface BillingFormUIState {
  currentStep: BillingFormStep;
  completedSteps: BillingFormStep[];
  billingType?: string;
  isLoading: boolean;
  errors: Record<string, string>;
  isDirty: boolean;
  canProceed: boolean;
  showValidation: boolean;
}

export interface BillingFormNavigationProps {
  currentStep: BillingFormStep;
  completedSteps: BillingFormStep[];
  onStepChange: (step: BillingFormStep) => void;
  disabled?: boolean;
}

export interface BillingFormProgressProps {
  currentStep: BillingFormStep;
  completedSteps: BillingFormStep[];
  totalSteps: number;
}