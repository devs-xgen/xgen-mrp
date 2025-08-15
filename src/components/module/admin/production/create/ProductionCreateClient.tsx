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
import { useFormPersistence } from "@/hooks/use-form-persistence";

import { SourceStep } from "./steps/SourceStep";
import { CustomerOrderStep } from "./steps/CustomerOrderStep";
import { ProductStep } from "./steps/ProductStep";
import { VariantStep } from "./steps/VariantStep";
import { DetailsStep } from "./steps/DetailsStep";
import { OptionsStep } from "./steps/OptionsStep";
import { ReviewStep } from "./steps/ReviewStep";

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
}

const STEPS = [
  { id: "source", title: "Source", description: "Choose creation type" },
  {
    id: "customer_order",
    title: "Customer Order",
    description: "Select order",
  },
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
  useFormPersistence("production-create", form);

  // Pre-fill from query params
  useEffect(() => {
    if (prefillData?.productId) {
      form.setValue("productId", prefillData.productId);
      if (prefillData.productVariantId) {
        form.setValue("productVariantId", prefillData.productVariantId);
      }
    }
    if (prefillData?.customerOrderId) {
      form.setValue("source", "customer_order");
      form.setValue("customerOrderId", prefillData.customerOrderId);
      // Find customer from the order
      const order = customerOrders.find(
        (o) => o.id === prefillData.customerOrderId
      );
      if (order) {
        form.setValue("customerId", order.customerId);
      }
    }
  }, [prefillData, form, customerOrders]);

  const watchedValues = form.watch();
  const selectedProduct = products.find(
    (p) => p.id === watchedValues.productId
  );

  // Determine which steps to show based on form state
  const getVisibleSteps = () => {
    const steps = ["source"];

    if (watchedValues.source === "customer_order") {
      steps.push("customer_order");
    } else {
      steps.push("product");
    }

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
        return !!watchedValues.source;
      case "customer_order":
        return !!(watchedValues.customerId && watchedValues.customerOrderId);
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

        router.push(`/admin/production/${result.orderId}`);
      } else {
        toast.error(result.error);
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
      case "customer_order":
        return (
          <CustomerOrderStep
            form={form}
            customers={customers}
            customerOrders={customerOrders}
          />
        );
      case "product":
        return <ProductStep form={form} products={products} />;
      case "variant":
        return <VariantStep form={form} selectedProduct={selectedProduct} />;
      case "details":
        return <DetailsStep form={form} />;
      case "options":
        return <OptionsStep form={form} />;
      case "review":
        return (
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
    <div className="container mx-auto px-4 py-6 max-w-4xl">
      {/* Header */}
      <div className="mb-6">
        <Button
          variant="ghost"
          onClick={() => router.push("/admin/production")}
          className="mb-4"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Production
        </Button>

        <h1 className="text-3xl font-bold tracking-tight">
          Create Production Order
        </h1>
        <p className="text-muted-foreground mt-1">
          Follow the steps to create a new production order
        </p>
      </div>

      {/* Progress */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">
                Step {currentStep + 1} of {visibleSteps.length}
              </span>
              <span className="text-sm text-muted-foreground">
                {Math.round(progress)}% complete
              </span>
            </div>
            <Progress value={progress} className="w-full" />

            {/* Step indicators */}
            <div className="flex justify-between items-center">
              {visibleSteps.map((stepId, index) => {
                const step = STEPS.find((s) => s.id === stepId);
                const isActive = index === currentStep;
                const isCompleted = index < currentStep;

                return (
                  <div
                    key={stepId}
                    className="flex flex-col items-center space-y-2"
                  >
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                        isCompleted
                          ? "bg-green-600 text-white"
                          : isActive
                            ? "bg-blue-600 text-white"
                            : "bg-gray-200 text-gray-600"
                      }`}
                    >
                      {isCompleted ? <Check className="w-4 h-4" /> : index + 1}
                    </div>
                    <div className="text-center">
                      <div className="text-xs font-medium">{step?.title}</div>
                      <div className="text-xs text-muted-foreground hidden sm:block">
                        {step?.description}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Current Step */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>
            {STEPS.find((s) => s.id === currentStepId)?.title}
          </CardTitle>
        </CardHeader>
        <CardContent>{renderCurrentStep()}</CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex justify-between">
        <Button
          variant="outline"
          onClick={prevStep}
          disabled={currentStep === 0}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Previous
        </Button>

        {currentStep === visibleSteps.length - 1 ? (
          <Button
            onClick={form.handleSubmit(onSubmit)}
            disabled={!canGoNext() || isSubmitting}
          >
            {isSubmitting ? "Creating..." : "Create Production Order"}
          </Button>
        ) : (
          <Button onClick={nextStep} disabled={!canGoNext()}>
            Next
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
}
