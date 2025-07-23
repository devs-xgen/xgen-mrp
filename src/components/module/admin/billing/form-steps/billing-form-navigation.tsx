"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BillingFormNavigationProps } from "@/types/admin/billing-form-steps";
import { 
  getNextStep, 
  getPreviousStep, 
  getStepConfig,
  canNavigateToStep 
} from "./billing-form-steps-config";

interface BillingFormNavigationExtendedProps extends BillingFormNavigationProps {
  onNext?: () => void;
  onPrevious?: () => void;
  onSubmit?: () => void;
  isSubmitting?: boolean;
  canProceedToNext?: boolean;
  isLastStep?: boolean;
}

export function BillingFormNavigation({
  currentStep,
  completedSteps,
  onStepChange,
  onNext,
  onPrevious,
  onSubmit,
  disabled = false,
  isSubmitting = false,
  canProceedToNext = true,
  isLastStep = false,
}: BillingFormNavigationExtendedProps) {
  const currentStepConfig = getStepConfig(currentStep);
  const nextStep = getNextStep(currentStep);
  const previousStep = getPreviousStep(currentStep);

  const handleNext = () => {
    if (isLastStep && onSubmit) {
      onSubmit();
    } else if (nextStep && onNext) {
      onNext();
    } else if (nextStep) {
      onStepChange(nextStep);
    }
  };

  const handlePrevious = () => {
    if (previousStep && onPrevious) {
      onPrevious();
    } else if (previousStep) {
      onStepChange(previousStep);
    }
  };

  const canGoNext = nextStep ? canNavigateToStep(nextStep, currentStep, completedSteps) : false;
  const canGoPrevious = previousStep ? canNavigateToStep(previousStep, currentStep, completedSteps) : false;

  return (
    <div className="flex items-center justify-between pt-6 border-t">
      <div className="flex items-center space-x-2">
        {previousStep && (
          <Button
            type="button"
            variant="outline"
            onClick={handlePrevious}
            disabled={disabled || !canGoPrevious}
            className="flex items-center"
          >
            <ChevronLeft className="w-4 h-4 mr-1" />
            Previous
          </Button>
        )}
      </div>

      <div className="flex items-center space-x-4">
        {/* Step Info */}
        <div className="text-center">
          <div className="text-sm font-medium">{currentStepConfig?.title}</div>
          <div className="text-xs text-muted-foreground">{currentStepConfig?.description}</div>
        </div>
      </div>

      <div className="flex items-center space-x-2">
        {isLastStep ? (
          <Button
            type="button"
            onClick={handleNext}
            disabled={disabled || !canProceedToNext || isSubmitting}
            className="flex items-center"
          >
            {isSubmitting ? "Submitting..." : "Submit"}
          </Button>
        ) : (
          <Button
            type="button"
            onClick={handleNext}
            disabled={disabled || !canProceedToNext || !canGoNext}
            className="flex items-center"
          >
            Next
            <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
        )}
      </div>
    </div>
  );
}