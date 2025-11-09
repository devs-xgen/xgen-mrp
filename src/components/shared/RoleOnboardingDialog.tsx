"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  onboardingContent,
  OnboardingStep,
  UserRoleKey,
} from "@/data/onboarding-content";

interface RoleOnboardingDialogProps {
  role: UserRoleKey | string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const defaultStep: OnboardingStep = {
  title: "Welcome to XGen MRP",
  description:
    "Explore the portal to track your tasks, collaborate with teammates, and keep production on schedule.",
  imageUrl: "/images/onboarding/default.png",
  highlights: [
    "Use the sidebar to navigate between key modules",
    "Review the dashboard for daily priorities",
    "Reach out via Support if you need help",
  ],
};

export function RoleOnboardingDialog({
  role,
  open,
  onOpenChange,
}: RoleOnboardingDialogProps) {
  const normalizedRole = useMemo<UserRoleKey>(() => {
    if (!role) return "ADMIN";
    const upper = role.toUpperCase();
    return [
      "ADMIN",
      "SUPER_ADMIN",
      "WORKER",
      "INSPECTOR",
      "DELIVERY",
      "DEVELOPER",
    ].includes(upper as UserRoleKey)
      ? (upper as UserRoleKey)
      : "ADMIN";
  }, [role]);

  const steps = onboardingContent[normalizedRole] ?? [defaultStep];
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    if (!open) {
      setCurrentStep(0);
    }
  }, [open, normalizedRole]);

  const handleClose = () => onOpenChange(false);

  const goToNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep((prev) => prev + 1);
      return;
    }
    handleClose();
  };

  const goToPrevious = () => {
    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  const step = steps[currentStep] ?? defaultStep;
  const isLastStep = currentStep === steps.length - 1;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex h-[620px] w-[520px] flex-col overflow-hidden border-none p-0">
        <div className="relative h-72 w-full bg-slate-900">
          <Image
            src={step.imageUrl}
            alt={step.title}
            fill
            className="object-contain"
            priority
          />
        </div>

        <div className="flex flex-1 flex-col overflow-hidden px-6 pb-6 pt-4">
          <div className="flex-1 min-h-0 space-y-3 overflow-y-auto pr-2 text-center">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Step {currentStep + 1} of {steps.length}
            </p>
            <h2 className="text-xl font-semibold text-foreground">
              {step.title}
            </h2>
            <p className="text-sm text-muted-foreground">{step.description}</p>

            {step.highlights && step.highlights.length > 0 && (
              <ul className="list-disc space-y-1 pl-5 text-left text-xs text-muted-foreground">
                {step.highlights.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            )}
          </div>

          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <Button
              variant="outline"
              onClick={goToPrevious}
              disabled={currentStep === 0}
              className="sm:w-auto"
            >
              Previous
            </Button>
            <Button onClick={goToNext} className="sm:w-auto">
              {isLastStep ? "Done" : "Next"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
