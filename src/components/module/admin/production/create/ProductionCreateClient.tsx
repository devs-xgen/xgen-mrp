"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, ArrowRight, Check } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";

import {
  productionCreateSchema,
  type ProductionCreateForm,
} from "@/lib/validation/production-create";
import { useFormPersistence } from "@/hooks/use-simple-form-persistence";

import { SourceStep } from "./steps/SourceStep";
import { ProductStep } from "./steps/ProductStep";
import { VariantStep } from "./steps/VariantStep";
import { DetailsStep } from "./steps/DetailsStep";
import { OptionsStep } from "./steps/OptionsStep";
import { ReviewStep } from "./steps/ReviewStep";
import { BatchReviewStep } from "./steps/BatchReviewStep";

import type { ProductCategory, Customer, CustomerOrder } from "@prisma/client";

interface ProductionCreateClientProps {
  products: any[]; // From getProductsWithVariantsForOrders
  customers: Customer[];
  customerOrders: CustomerOrder[];
  prefillData?: {
    productId?: string;
    productVariantId?: string;
    customerOrderId?: string;
    quantity?: number;
  };
  // New batch mode support
  batchMode?: boolean;
  batchItems?: Array<{
    productId: string;
    productVariantId?: string;
    quantity: number;
    customerOrderId?: string;
    priority?: "LOW" | "MEDIUM" | "HIGH" | "URGENT" | "CRITICAL";
    notes?: string;
  }>;
}

const STEPS = [
  { id: "source", title: "Source", description: "Production order type" },
  { id: "product", title: "Product", description: "Select product" },
  { id: "variant", title: "Variant", description: "Select variant" },
  { id: "details", title: "Details", description: "Quantity & dates" },
  { id: "options", title: "Options", description: "BOM & materials" },
  { id: "review", title: "Review", description: "Confirm & submit" },
];

export function ProductionCreateClient({
  products,
  customers,
  customerOrders,
  prefillData,
  batchMode = false,
  batchItems = [],
}: ProductionCreateClientProps) {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<ProductionCreateForm>({
    resolver: zodResolver(productionCreateSchema),
    defaultValues: {
      source: "standalone",
      quantity: prefillData?.quantity || 1,
      startDate: new Date().toISOString().split("T")[0],
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
        .toISOString()
        .split("T")[0], // 7 days from now
      priority: "MEDIUM",
      generateBOM: true,
      reserveMaterials: false,
      productId: prefillData?.productId || "",
      productVariantId: prefillData?.productVariantId || "",
      customerOrderId: prefillData?.customerOrderId || "",
    },
  });

  // Form persistence
  const { clearSavedData } = useFormPersistence("production-create", form);

  // Pre-fill from query params
  useEffect(() => {
    if (prefillData?.productId) {
      form.setValue("productId", prefillData.productId);
      if (prefillData.productVariantId) {
        form.setValue("productVariantId", prefillData.productVariantId);
      }
    }
    // Note: Customer order prefill removed - production orders are now standalone only
  }, [prefillData, form]);

  const watchedValues = form.watch();
  const selectedProduct = products.find(
    (p) => p.id === watchedValues.productId
  );

  // Determine which steps to show based on form state
  const getVisibleSteps = () => {
    if (batchMode) {
      // In batch mode, skip to the common steps
      return ["details", "options", "review"];
    }

    const steps = ["source", "product"];

    // Show variant step only if product has variants
    if (selectedProduct?.hasVariants) {
      steps.push("variant");
    }

    steps.push("details", "options", "review");
    return steps;
  };

  const visibleSteps = getVisibleSteps();
  const currentStepId = visibleSteps[currentStep];

  const canGoNext = () => {
    const currentStepData = getCurrentStepData();

    switch (currentStepId) {
      case "source":
        return true; // Always can proceed from source step
      case "product":
        return !!watchedValues.productId;
      case "variant":
        return (
          !selectedProduct?.hasVariants || !!watchedValues.productVariantId
        );
      case "details":
        return !!(
          watchedValues.quantity &&
          watchedValues.startDate &&
          watchedValues.dueDate &&
          watchedValues.priority
        );
      case "options":
        return true; // Options are optional
      case "review":
        return true;
      default:
        return false;
    }
  };

  const getCurrentStepData = () => {
    return {
      source: watchedValues.source,
      customerId: watchedValues.customerId,
      customerOrderId: watchedValues.customerOrderId,
      productId: watchedValues.productId,
      productVariantId: watchedValues.productVariantId,
      quantity: watchedValues.quantity,
      startDate: watchedValues.startDate,
      dueDate: watchedValues.dueDate,
      priority: watchedValues.priority,
      notes: watchedValues.notes,
      generateBOM: watchedValues.generateBOM,
      reserveMaterials: watchedValues.reserveMaterials,
    };
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

  const onSubmit = async (data: ProductionCreateForm) => {
    setIsSubmitting(true);
    try {
      // Import the server action dynamically
      const { createProductionOrderUnified } = await import(
        "@/lib/actions/production-order"
      );

      if (batchMode && batchItems.length > 0) {
        // Batch mode: create multiple production orders
        const results = [];
        const errors = [];
        const warnings = [];

        for (const item of batchItems) {
          const result = await createProductionOrderUnified({
            productId: item.productId,
            productVariantId: item.productVariantId || undefined,
            quantity: item.quantity,
            startDate: data.startDate,
            dueDate: data.dueDate,
            priority: item.priority || data.priority,
            notes: item.notes || data.notes || undefined,
            customerOrderId: item.customerOrderId || undefined,
            options: {
              generateBOM: data.generateBOM,
              reserveMaterials: data.reserveMaterials,
            },
          });

          if (result.success) {
            results.push(result);
            if (result.warnings && result.warnings.length > 0) {
              warnings.push(...result.warnings);
            }
          } else {
            errors.push(`Failed to create production order: ${result.error}`);
          }
        }

        // Show results
        if (results.length > 0) {
          toast.success(`Successfully created ${results.length} production orders!`);
        }
        if (warnings.length > 0) {
          warnings.forEach((warning) => toast.warning(warning));
        }
        if (errors.length > 0) {
          errors.forEach((error) => toast.error(error));
        }

        if (results.length > 0) {
          clearSavedData();
          router.push("/admin/production");
        }
      } else {
        // Single mode: create one production order
        const result = await createProductionOrderUnified({
          productId: data.productId,
          productVariantId: data.productVariantId || undefined,
          quantity: data.quantity,
          startDate: data.startDate,
          dueDate: data.dueDate,
          priority: data.priority,
          notes: data.notes || undefined,
          customerOrderId: data.customerOrderId || undefined,
          options: {
            generateBOM: data.generateBOM,
            reserveMaterials: data.reserveMaterials,
          },
        });

        if (result.success) {
          toast.success("Production order created successfully!");

          // Show warnings if any
          if (result.warnings && result.warnings.length > 0) {
            result.warnings.forEach((warning) => {
              toast.warning(warning);
            });
          }

          // Clear saved form data on success
          clearSavedData();

          router.push(`/admin/production/${result.orderId}`);
        } else {
          toast.error(result.error);
        }
      }
    } catch (error) {
      console.error("Error creating production order:", error);
      toast.error("Failed to create production order");
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderCurrentStep = () => {
    switch (currentStepId) {
      case "source":
        return <SourceStep form={form} />;
      case "product":
        return <ProductStep form={form} products={products} />;
      case "variant":
        return <VariantStep form={form} selectedProduct={selectedProduct} />;
      case "details":
        return <DetailsStep form={form} />;
      case "options":
        return <OptionsStep form={form} />;
      case "review":
        return batchMode ? (
          <BatchReviewStep
            form={form}
            products={products}
            customers={customers}
            customerOrders={customerOrders}
            batchItems={batchItems}
          />
        ) : (
          <ReviewStep
            form={form}
            products={products}
            customers={customers}
            customerOrders={customerOrders}
          />
        );
      default:
        return null;
    }
  };

  const progress = ((currentStep + 1) / visibleSteps.length) * 100;

  return (
    <div className="flex flex-col lg:flex-row h-screen bg-background">
      {/* Mobile Header - Only on small screens */}
      <div className="lg:hidden bg-card border-b border-border p-4">
        <div className="flex items-center justify-between mb-4">
          <Button
            variant="ghost"
            onClick={() => router.push("/admin/production")}
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
          <h1 className="text-xl font-bold tracking-tight">
            {batchMode ? `Create ${batchItems.length} Production Orders` : "Create Production Order"}
          </h1>
          <Progress value={progress} className="w-full" />
        </div>
      </div>

      {/* Left Sidebar - Desktop & Tablet */}
      <div className="hidden lg:flex lg:w-80 xl:w-96 border-r border-border bg-card flex-col">
        {/* Header */}
        <div className="p-6 border-b border-border">
          <Button
            variant="ghost"
            onClick={() => router.push("/admin/production")}
            className="mb-4 w-full justify-start"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Production
          </Button>

          <h1 className="text-2xl font-bold tracking-tight">
            {batchMode ? `Create ${batchItems.length} Production Orders` : "Create Production Order"}
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            {batchMode 
              ? `Creating ${batchItems.length} production orders from customer order analysis`
              : "Follow the steps to create a new production order"
            }
          </p>
        </div>

        {/* Progress Section */}
        <div className="p-6 border-b border-border">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">
                Step {currentStep + 1} of {visibleSteps.length}
              </span>
              <span className="text-sm text-muted-foreground">
                {Math.round(progress)}%
              </span>
            </div>
            <Progress value={progress} className="w-full" />
          </div>
        </div>

        {/* Steps List */}
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

        {/* Navigation - Fixed at bottom */}
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
                {isSubmitting 
                  ? (batchMode ? `Creating ${batchItems.length} Orders...` : "Creating...") 
                  : (batchMode ? `Create ${batchItems.length} Orders` : "Create")
                }
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

      {/* Right Content Area - Scrollable */}
      <div className="flex-1 flex flex-col min-h-0">
        {/* Form Content */}
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
              <CardContent>
                {renderCurrentStep()}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Mobile Navigation - Fixed at bottom on small screens */}
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
                {isSubmitting 
                  ? (batchMode ? `Creating ${batchItems.length} Orders...` : "Creating...") 
                  : (batchMode ? `Create ${batchItems.length} Orders` : "Create")
                }
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
