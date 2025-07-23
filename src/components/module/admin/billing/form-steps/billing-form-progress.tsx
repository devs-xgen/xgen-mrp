"use client";

import { Check, Circle } from "lucide-react";
import { cn } from "@/lib/utils";
import { BillingFormProgressProps } from "@/types/admin/billing-form-steps";
import { billingFormSteps, getStepIndex, isStepCompleted } from "./billing-form-steps-config";

export function BillingFormProgress({
  currentStep,
  completedSteps,
  totalSteps,
}: BillingFormProgressProps) {
  const currentStepIndex = getStepIndex(currentStep);
  const progressPercentage = ((currentStepIndex + 1) / totalSteps) * 100;

  return (
    <div className="w-full">
      {/* Progress Bar */}
      <div className="relative mb-8">
        <div className="overflow-hidden h-2 text-xs flex rounded bg-muted">
          <div
            style={{ width: `${progressPercentage}%` }}
            className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-primary transition-all duration-300"
          />
        </div>
        <div className="text-right mt-2">
          <span className="text-sm text-muted-foreground">
            Step {currentStepIndex + 1} of {totalSteps}
          </span>
        </div>
      </div>

      {/* Step Indicators */}
      <div className="flex items-center justify-between">
        {billingFormSteps.map((step, index) => {
          const isCompleted = isStepCompleted(step.id, completedSteps);
          const isCurrent = step.id === currentStep;
          const isPast = index < currentStepIndex;

          return (
            <div key={step.id} className="flex flex-col items-center flex-1">
              {/* Step Circle */}
              <div
                className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all duration-200",
                  {
                    "bg-primary border-primary text-primary-foreground": isCurrent || isCompleted,
                    "bg-muted border-muted-foreground/30 text-muted-foreground": !isCurrent && !isCompleted && !isPast,
                    "bg-primary/10 border-primary text-primary": isPast && !isCompleted,
                  }
                )}
              >
                {isCompleted ? (
                  <Check className="w-4 h-4" />
                ) : (
                  <Circle className={cn("w-3 h-3", {
                    "fill-current": isCurrent || isPast
                  })} />
                )}
              </div>

              {/* Step Label */}
              <div className="mt-2 text-center">
                <div
                  className={cn(
                    "text-xs font-medium transition-colors duration-200",
                    {
                      "text-primary": isCurrent,
                      "text-foreground": isCompleted,
                      "text-muted-foreground": !isCurrent && !isCompleted,
                    }
                  )}
                >
                  {step.title}
                </div>
              </div>

              {/* Connector Line */}
              {index < billingFormSteps.length - 1 && (
                <div
                  className={cn(
                    "absolute top-4 h-0.5 transition-colors duration-200",
                    {
                      "bg-primary": index < currentStepIndex,
                      "bg-muted-foreground/30": index >= currentStepIndex,
                    }
                  )}
                  style={{
                    left: `${((index + 1) / billingFormSteps.length) * 100}%`,
                    right: `${(1 - (index + 1) / billingFormSteps.length) * 100}%`,
                  }}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}