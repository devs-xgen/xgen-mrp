"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ArrowLeft, ArrowRight, Check, Shield } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";

import { ProductStep } from "./steps/ProductStep";
import { VariantStep } from "./steps/VariantStep";
import { DetailsStep } from "./steps/DetailsStep";
import { OverridesStep } from "./steps/OverridesStep";
import { ReviewStep } from "./steps/ReviewStep";

// SuperAdmin-specific schema with overrides
const superadminProductionCreateSchema = z.object({
  productId: z.string().min(1, "Product is required"),
  productVariantId: z.string().optional(),
  quantity: z.coerce.number().positive("Quantity must be positive"),
  startDate: z.string().min(1, "Start date is required"),
  dueDate: z.string().min(1, "Due date is required"),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT", "CRITICAL"]),
  notes: z.string().optional(),

  // Options
  generateBOM: z.boolean().default(true),
  reserveMaterials: z.boolean().default(false),

  // SuperAdmin Overrides
  skipDateValidation: z.boolean().default(false),
  skipMaterialCheck: z.boolean().default(false),
  forceAllocateMaterials: z.boolean().default(false),
  customPlannedCost: z.coerce.number().nonnegative().optional(),
  customActualCost: z.coerce.number().nonnegative().optional(),
  customVariance: z.coerce.number().optional(),

  // Required audit reason
  reason: z.string().min(15, "Reason must be at least 15 characters for audit trail"),
});

type SuperadminProductionCreateForm = z.infer<typeof superadminProductionCreateSchema>;

interface SuperadminProductionCreateClientProps {
  products: any[];
  prefillData?: {
    productId?: string;
    productVariantId?: string;
    quantity?: number;
  };
}

const STEPS = [
  { id: "product", title: "Product", description: "Select product" },
  { id: "variant", title: "Variant", description: "Select variant (if applicable)" },
  { id: "details", title: "Details", description: "Quantity, dates & priority" },
  { id: "overrides", title: "Overrides", description: "SuperAdmin capabilities" },
  { id: "review", title: "Review", description: "Confirm & submit" },
];

export function SuperadminProductionCreateClient({
  products,
  prefillData,
}: SuperadminProductionCreateClientProps) {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<SuperadminProductionCreateForm>({
    resolver: zodResolver(superadminProductionCreateSchema),
    defaultValues: {
      quantity: prefillData?.quantity || 1,
      startDate: new Date().toISOString().split("T")[0],
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
        .toISOString()
        .split("T")[0],
      priority: "MEDIUM",
      generateBOM: true,
      reserveMaterials: false,
      productId: prefillData?.productId || "",
      productVariantId: prefillData?.productVariantId || "",
      skipDateValidation: false,
      skipMaterialCheck: false,
      forceAllocateMaterials: false,
      reason: "",
    },
  });

  const productId = form.watch("productId");
  const productVariantId = form.watch("productVariantId");
  const quantity = form.watch("quantity");
  const startDate = form.watch("startDate");
  const dueDate = form.watch("dueDate");
  const priority = form.watch("priority");
  const skipDateValidation = form.watch("skipDateValidation");
  const skipMaterialCheck = form.watch("skipMaterialCheck");
  const forceAllocateMaterials = form.watch("forceAllocateMaterials");

  const selectedProduct = useMemo(
    () => products.find((p) => p.id === productId),
    [products, productId]
  );

  const visibleSteps = useMemo(() => {
    const steps = ["product"];

    if (selectedProduct?.hasVariants) {
      steps.push("variant");
    }

    steps.push("details", "overrides", "review");
    return steps;
  }, [selectedProduct?.hasVariants]);

  const currentStepId = visibleSteps[currentStep];

  const canGoNext = () => {
    switch (currentStepId) {
      case "product":
        return !!productId;
      case "variant":
        return !selectedProduct?.hasVariants || !!productVariantId;
      case "details":
        return !!(quantity && startDate && dueDate && priority);
      case "overrides":
        return true; // Overrides are all optional
      case "review":
        return true;
      default:
        return false;
    }
  };

  const nextStep = () => {
    if (currentStep < visibleSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const hasOverrides = skipDateValidation || skipMaterialCheck || forceAllocateMaterials;

  const onSubmit = async (data: SuperadminProductionCreateForm) => {
    setIsSubmitting(true);
    try {
      const { createProductionOrderSuperadmin } = await import(
        "@/lib/actions/superadmin/production-order"
      );

      const result = await createProductionOrderSuperadmin({
        productId: data.productId,
        productVariantId: data.productVariantId || undefined,
        quantity: data.quantity,
        startDate: data.startDate,
        dueDate: data.dueDate,
        priority: data.priority,
        notes: data.notes || undefined,
        overrides: {
          skipDateValidation: data.skipDateValidation,
          skipMaterialCheck: data.skipMaterialCheck,
          forceAllocateMaterials: data.forceAllocateMaterials,
          customCosts:
            data.customPlannedCost !== undefined ||
            data.customActualCost !== undefined ||
            data.customVariance !== undefined
              ? {
                  plannedMaterialCost: data.customPlannedCost,
                  actualMaterialCost: data.customActualCost,
                  materialVariance: data.customVariance,
                }
              : undefined,
        },
        options: {
          generateBOM: data.generateBOM,
          reserveMaterials: data.reserveMaterials,
        },
        reason: data.reason,
      });

      if (result.success) {
        toast.success("Production order created successfully!");

        // Show warnings if any
        if (result.warnings && result.warnings.length > 0) {
          result.warnings.forEach((warning) => {
            toast.warning(warning);
          });
        }

        // Show overrides applied
        if (result.overridesApplied && result.overridesApplied.length > 0) {
          toast.info("Overrides Applied", {
            description: result.overridesApplied.join("; "),
          });
        }

        router.push(`/superadmin/production/${result.orderId}`);
      } else {
        // Type narrowed: result is { success: false; error: string }
        toast.error("Failed to create production order", {
          description: result.error,
        });
      }
    } catch (error) {
      console.error("Error creating production order:", error);
      toast.error("An error occurred", {
        description: error instanceof Error ? error.message : "Failed to create production order",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderCurrentStep = () => {
    switch (currentStepId) {
      case "product":
        return <ProductStep form={form} products={products} />;
      case "variant":
        return <VariantStep form={form} selectedProduct={selectedProduct} />;
      case "details":
        return <DetailsStep form={form} />;
      case "overrides":
        return <OverridesStep form={form} />;
      case "review":
        return <ReviewStep form={form} products={products} />;
      default:
        return null;
    }
  };

  const progress = ((currentStep + 1) / visibleSteps.length) * 100;

  return (
    <div className="flex flex-col lg:flex-row h-screen bg-background">
      {/* Mobile Header */}
      <div className="lg:hidden bg-card border-b border-border p-4">
        <div className="flex items-center justify-between mb-4">
          <Button
            variant="ghost"
            onClick={() => router.push("/superadmin/production")}
            size="sm"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          <div className="text-right">
            <div className="text-sm font-medium">
              Step {currentStep + 1} of {visibleSteps.length}
            </div>
            <div className="text-xs text-muted-foreground">
              {Math.round(progress)}% complete
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-amber-600" />
            <h1 className="text-xl font-bold tracking-tight">SuperAdmin Production Order</h1>
          </div>
          {hasOverrides && (
            <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
              Overrides Active
            </Badge>
          )}
          <Progress value={progress} className="w-full" />
        </div>
      </div>

      {/* Left Sidebar - Desktop */}
      <div className="hidden lg:flex lg:w-80 xl:w-96 border-r border-border bg-card flex-col">
        <div className="p-6 border-b border-border">
          <Button
            variant="ghost"
            onClick={() => router.push("/superadmin/production")}
            className="mb-4 w-full justify-start"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Production
          </Button>

          <div className="flex items-center gap-2 mb-2">
            <Shield className="h-6 w-6 text-amber-600" />
            <h1 className="text-2xl font-bold tracking-tight">SuperAdmin</h1>
          </div>
          <p className="text-muted-foreground text-sm">
            Create production orders with override capabilities
          </p>
          {hasOverrides && (
            <Badge
              variant="outline"
              className="mt-3 bg-amber-50 text-amber-700 border-amber-200"
            >
              Overrides Active
            </Badge>
          )}
        </div>

        <div className="p-6 border-b border-border">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">
                Step {currentStep + 1} of {visibleSteps.length}
              </span>
              <span className="text-sm text-muted-foreground">{Math.round(progress)}%</span>
            </div>
            <Progress value={progress} className="w-full" />
          </div>
        </div>

        <div className="flex-1 p-6 space-y-3 overflow-y-auto">
          {visibleSteps.map((stepId, index) => {
            const step = STEPS.find((s) => s.id === stepId);
            const isActive = index === currentStep;
            const isCompleted = index < currentStep;

            return (
              <div
                key={stepId}
                className={`flex items-start space-x-3 p-3 rounded-lg transition-colors ${
                  isActive
                    ? "bg-primary/10 border-2 border-primary/20"
                    : isCompleted
                    ? "bg-green-50 border border-green-200"
                    : "bg-muted/30 border border-border"
                }`}
              >
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium flex-shrink-0 ${
                    isCompleted
                      ? "bg-green-600 text-white"
                      : isActive
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground"
                  }`}
                >
                  {isCompleted ? <Check className="w-4 h-4" /> : index + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm">{step?.title}</div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {step?.description}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="p-6 border-t border-border bg-background">
          <div className="flex justify-between space-x-3">
            <Button
              variant="outline"
              onClick={prevStep}
              disabled={currentStep === 0}
              className="flex-1"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Previous
            </Button>

            {currentStep === visibleSteps.length - 1 ? (
              <Button
                onClick={form.handleSubmit(onSubmit)}
                disabled={!canGoNext() || isSubmitting}
                className="flex-1"
              >
                {isSubmitting ? "Creating..." : "Create Order"}
              </Button>
            ) : (
              <Button onClick={nextStep} disabled={!canGoNext()} className="flex-1">
                Next
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Right Content Area */}
      <div className="flex-1 flex flex-col min-h-0">
        <div className="flex-1 overflow-y-auto">
          <div className="p-4 md:p-6 lg:p-8">
            <Card className="max-w-2xl mx-auto">
              <CardHeader className="pb-4">
                <CardTitle className="text-xl">
                  {STEPS.find((s) => s.id === currentStepId)?.title}
                </CardTitle>
                <p className="text-muted-foreground text-sm">
                  {STEPS.find((s) => s.id === currentStepId)?.description}
                </p>
              </CardHeader>
              <CardContent>{renderCurrentStep()}</CardContent>
            </Card>
          </div>
        </div>

        {/* Mobile Navigation */}
        <div className="lg:hidden bg-card border-t border-border p-4">
          <div className="flex justify-between space-x-3">
            <Button
              variant="outline"
              onClick={prevStep}
              disabled={currentStep === 0}
              className="flex-1"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Previous
            </Button>

            {currentStep === visibleSteps.length - 1 ? (
              <Button
                onClick={form.handleSubmit(onSubmit)}
                disabled={!canGoNext() || isSubmitting}
                className="flex-1"
              >
                {isSubmitting ? "Creating..." : "Create Order"}
              </Button>
            ) : (
              <Button onClick={nextStep} disabled={!canGoNext()} className="flex-1">
                Next
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
