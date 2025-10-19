"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, ArrowRight, Check, ShoppingCart } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { createCustomerOrderSuperadmin } from "@/lib/actions/superadmin/customer-order";
import { StepCustomerSelection } from "./steps/StepCustomerSelection";
import { StepOrderLines } from "./steps/StepOrderLines";
import { StepPricingDates } from "./steps/StepPricingDates";
import { StepReview } from "./steps/StepReview";

const formSchema = z.object({
  customerId: z.string().min(1, "Customer is required"),
  tenantId: z.string().min(1, "Tenant is required"),
  orderDate: z.string().optional(),
  deliveryDate: z.string().optional(),
  notes: z.string().optional(),
  orderLines: z.array(
    z.object({
      productId: z.string(),
      productVariantId: z.string().optional(),
      quantity: z.number().min(1, "Quantity must be at least 1"),
      unitPrice: z.number().min(0, "Price must be positive"),
    })
  ).min(1, "At least one order line is required"),
  skipDateValidation: z.boolean().default(false),
  skipStockCheck: z.boolean().default(false),
  customPricing: z.boolean().default(false),
  createProductionOrders: z.boolean().default(false),
  autoApprove: z.boolean().default(false),
  reason: z.string().min(15, "Audit reason must be at least 15 characters"),
});

type FormData = z.infer<typeof formSchema>;

interface CustomerOrderCreateWizardProps {
  customers: Array<{
    id: string;
    name: string;
    email: string;
    tenantId: string;
  }>;
  products: Array<{
    id: string;
    name: string;
    sku: string;
    sellingPrice: number;
    currentStock: number;
    variants: Array<{
      id: string;
      displayName: string;
      sku: string;
      sellingPrice: number;
      currentStock: number;
    }>;
  }>;
  tenants: Array<{
    id: string;
    name: string;
  }>;
}

const STEPS = [
  { id: 1, title: "Customer", description: "Select customer and tenant" },
  { id: 2, title: "Order Lines", description: "Add products and quantities" },
  { id: 3, title: "Pricing & Dates", description: "Set pricing and delivery date" },
  { id: 4, title: "Review", description: "Review and submit" },
];

export function CustomerOrderCreateWizard({
  customers,
  products,
  tenants,
}: CustomerOrderCreateWizardProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const router = useRouter();

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      customerId: "",
      tenantId: "",
      orderDate: new Date().toISOString().split("T")[0],
      deliveryDate: "",
      notes: "",
      orderLines: [],
      skipDateValidation: false,
      skipStockCheck: false,
      customPricing: false,
      createProductionOrders: false,
      autoApprove: false,
      reason: "",
    },
  });

  const progress = (currentStep / STEPS.length) * 100;

  const canProceedToNextStep = () => {
    const values = form.getValues();
    switch (currentStep) {
      case 1:
        return values.customerId && values.tenantId;
      case 2:
        return values.orderLines.length > 0;
      case 3:
        return true; // Pricing/dates are optional
      case 4:
        return values.reason.length >= 15;
      default:
        return false;
    }
  };

  const handleNext = async () => {
    let isValid = false;

    switch (currentStep) {
      case 1:
        isValid = await form.trigger(["customerId", "tenantId"]);
        break;
      case 2:
        isValid = await form.trigger(["orderLines"]);
        break;
      case 3:
        isValid = await form.trigger(["orderDate", "deliveryDate"]);
        break;
      case 4:
        isValid = await form.trigger(["reason"]);
        break;
      default:
        isValid = true;
    }

    if (isValid && canProceedToNextStep()) {
      setCurrentStep((prev) => Math.min(prev + 1, STEPS.length));
    }
  };

  const handlePrevious = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 1));
  };

  const onSubmit = async (values: FormData) => {
    try {
      setIsSubmitting(true);

      const result = await createCustomerOrderSuperadmin({
        customerId: values.customerId,
        tenantId: values.tenantId,
        orderDate: values.orderDate,
        deliveryDate: values.deliveryDate,
        notes: values.notes,
        orderLines: values.orderLines,
        overrides: {
          skipDateValidation: values.skipDateValidation,
          skipStockCheck: values.skipStockCheck,
          customPricing: values.customPricing,
        },
        options: {
          createProductionOrders: values.createProductionOrders,
          autoApprove: values.autoApprove,
        },
        reason: values.reason,
      });

      if (!result.success) {
        toast({
          title: "Failed to Create Order",
          description: result.error,
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Order Created Successfully",
        description: (
          <div className="space-y-1">
            <div>Order #{result.orderNumber}</div>
            {result.productionOrderIds && result.productionOrderIds.length > 0 && (
              <div className="text-xs">
                Created {result.productionOrderIds.length} production order{result.productionOrderIds.length > 1 ? "s" : ""}
              </div>
            )}
            {result.warnings && result.warnings.length > 0 && (
              <div className="text-amber-600 text-xs">
                {result.warnings.length} warning{result.warnings.length > 1 ? "s" : ""} (check console)
              </div>
            )}
          </div>
        ),
      });

      if (result.warnings) {
        console.warn("Order creation warnings:", result.warnings);
      }

      router.push(`/superadmin/customer-orders/${result.orderId}`);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to create order",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="max-w-5xl mx-auto">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <ShoppingCart className="h-5 w-5" />
              Create Customer Order
            </CardTitle>
            <CardDescription>
              Step {currentStep} of {STEPS.length}: {STEPS[currentStep - 1].description}
            </CardDescription>
          </div>
          <Badge variant="secondary">
            {Math.round(progress)}% Complete
          </Badge>
        </div>

        {/* Progress Bar */}
        <div className="mt-4">
          <Progress value={progress} className="h-2" />
        </div>

        {/* Steps */}
        <div className="mt-4 grid grid-cols-4 gap-2">
          {STEPS.map((step) => (
            <div
              key={step.id}
              className={`flex items-center gap-2 p-2 rounded-md transition-colors ${
                step.id === currentStep
                  ? "bg-primary text-primary-foreground"
                  : step.id < currentStep
                  ? "bg-secondary text-secondary-foreground"
                  : "bg-muted text-muted-foreground"
              }`}
            >
              <div className="flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center border-2">
                {step.id < currentStep ? (
                  <Check className="h-4 w-4" />
                ) : (
                  <span className="text-xs font-bold">{step.id}</span>
                )}
              </div>
              <div className="hidden sm:block">
                <div className="text-xs font-medium">{step.title}</div>
              </div>
            </div>
          ))}
        </div>
      </CardHeader>

      <CardContent className="min-h-[400px]">
        {currentStep === 1 && (
          <StepCustomerSelection
            form={form}
            customers={customers}
            tenants={tenants}
          />
        )}

        {currentStep === 2 && (
          <StepOrderLines
            form={form}
            products={products}
          />
        )}

        {currentStep === 3 && (
          <StepPricingDates
            form={form}
          />
        )}

        {currentStep === 4 && (
          <StepReview
            form={form}
            customers={customers}
            products={products}
            tenants={tenants}
          />
        )}

        {/* Navigation Buttons */}
        <div className="flex items-center justify-between mt-8 pt-6 border-t">
          <Button
            type="button"
            variant="outline"
            onClick={handlePrevious}
            disabled={currentStep === 1 || isSubmitting}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Previous
          </Button>

          <div className="flex items-center gap-2">
            {currentStep < STEPS.length ? (
              <Button
                type="button"
                onClick={handleNext}
                disabled={!canProceedToNextStep() || isSubmitting}
              >
                Next
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            ) : (
              <Button
                type="button"
                onClick={form.handleSubmit(onSubmit)}
                disabled={!canProceedToNextStep() || isSubmitting}
              >
                {isSubmitting ? "Creating Order..." : "Create Order"}
                <Check className="h-4 w-4 ml-2" />
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
