"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, X, Home, FileText, AlertTriangle, Loader2 } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { EnhancedBillingStatementForm } from "@/components/module/admin/billing/enhanced-billing-statement-form";
import { ErrorBoundary } from "@/components/shared/error-boundary";
import { BillingStatementFormData } from "@/types/admin/billing";
import { BillingFormStep } from "@/types/admin/billing-form-steps";
import { createBillingStatement } from "@/lib/actions/billing-statements";

// Breadcrumb component
function BreadcrumbNavigation() {
  return (
    <nav className="flex items-center space-x-2 text-sm text-muted-foreground mb-6">
      <Link 
        href="/admin/dashboard" 
        className="flex items-center hover:text-foreground transition-colors"
      >
        <Home className="h-4 w-4 mr-1" />
        Dashboard
      </Link>
      <span>/</span>
      <Link 
        href="/admin/billing" 
        className="hover:text-foreground transition-colors"
      >
        Billing
      </Link>
      <span>/</span>
      <Link 
        href="/admin/billing/billing-statements" 
        className="hover:text-foreground transition-colors"
      >
        Billing Statements
      </Link>
      <span>/</span>
      <span className="text-foreground font-medium">Create</span>
    </nav>
  );
}

// Page header component
function PageHeader({ isSubmitting, onCancel }: { isSubmitting: boolean; onCancel: () => void }) {
  return (
    <div className="flex items-center justify-between mb-8">
      <div className="flex items-center gap-4">
        <Link href="/admin/billing/billing-statements">
          <Button variant="ghost" size="sm" disabled={isSubmitting}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Statements
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center">
            <FileText className="mr-3 h-8 w-8" />
            Create Billing Statement
          </h1>
          <p className="text-muted-foreground mt-1">
            Create a new billing statement with enhanced form validation and step-by-step guidance
          </p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Button 
          variant="outline" 
          size="sm" 
          onClick={onCancel}
          disabled={isSubmitting}
        >
          <X className="mr-2 h-4 w-4" />
          Cancel
        </Button>
      </div>
    </div>
  );
}

// Loading state component
function LoadingState() {
  return (
    <div className="flex items-center justify-center h-96">
      <div className="text-center">
        <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
        <p className="text-muted-foreground">Loading billing form...</p>
      </div>
    </div>
  );
}

// Error fallback component
function ErrorFallback({ error, onRetry }: { error?: Error; onRetry: () => void }) {
  return (
    <Card className="border-destructive">
      <CardHeader>
        <CardTitle className="flex items-center text-destructive">
          <AlertTriangle className="mr-2 h-5 w-5" />
          Something went wrong
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert variant="destructive">
          <AlertDescription>
            {error?.message || "An unexpected error occurred while loading the billing form."}
          </AlertDescription>
        </Alert>
        <div className="flex gap-2">
          <Button onClick={onRetry} variant="outline">
            Try Again
          </Button>
          <Button asChild variant="ghost">
            <Link href="/admin/billing/billing-statements">
              Back to Statements
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export default function CreateBillingStatementClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // State management
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [currentStep, setCurrentStep] = useState<BillingFormStep>(BillingFormStep.BILLING_TYPE_SELECTION);
  const [hasError, setHasError] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // URL parameters for pre-filling form
  const customerId = searchParams.get('customerId');
  const customerOrderId = searchParams.get('customerOrderId');
  const billingType = searchParams.get('type') as 'direct-customer' | 'customer-order' | 'manual-customer' | null;

  // Initialize page
  useEffect(() => {
    const initializePage = async () => {
      try {
        setIsLoading(true);
        setHasError(false);
        setError(null);

        // Simulate loading time for better UX
        await new Promise(resolve => setTimeout(resolve, 500));

        // Set initial step based on URL parameters
        if (billingType && (customerId || customerOrderId)) {
          setCurrentStep(BillingFormStep.CUSTOMER_INFORMATION);
        }

        setIsLoading(false);
      } catch (err) {
        console.error("Error initializing page:", err);
        setError(err instanceof Error ? err : new Error("Failed to initialize page"));
        setHasError(true);
        setIsLoading(false);
      }
    };

    initializePage();
  }, [billingType, customerId, customerOrderId]);

  // Form submission handler with enhanced error handling
  const handleSubmit = async (data: BillingStatementFormData) => {
    setIsSubmitting(true);
    
    try {
      // Validate required fields
      if (!data.customerName?.trim()) {
        throw new Error("Customer name is required");
      }

      if (!data.invoiceItems?.length || data.invoiceItems.every(item => !item.description?.trim())) {
        throw new Error("At least one invoice item is required");
      }

      const result = await createBillingStatement(data);
      
      if (result.success) {
        toast.success("Billing statement created successfully", {
          description: `Statement ${result.data?.statementNumber || ''} has been created`,
          duration: 5000,
        });
        
        // Navigate to the created statement or back to list
        if (result.data?.id) {
          router.push(`/admin/billing/billing-statements/${result.data.id}`);
        } else {
          router.push("/admin/billing/billing-statements");
        }
      } else {
        throw new Error(result.error || "Failed to create billing statement");
      }
    } catch (error) {
      console.error("Error creating billing statement:", error);
      
      const errorMessage = error instanceof Error ? error.message : "An unexpected error occurred";
      
      toast.error("Failed to create billing statement", {
        description: errorMessage,
        duration: 7000,
      });
      
      // Don't reset submitting state immediately to prevent double submission
      setTimeout(() => setIsSubmitting(false), 1000);
    }
  };

  // Step change handler
  const handleStepChange = (step: BillingFormStep) => {
    setCurrentStep(step);
    
    // Update URL to reflect current step (optional)
    const url = new URL(window.location.href);
    url.searchParams.set('step', step);
    window.history.replaceState({}, '', url.toString());
  };

  // Cancel handler with confirmation
  const handleCancel = () => {
    if (isSubmitting) {
      toast.warning("Please wait for the current operation to complete");
      return;
    }

    // Check if form has unsaved changes (this would be handled by the form component)
    const hasUnsavedChanges = false; // This would come from form state
    
    if (hasUnsavedChanges) {
      if (confirm("You have unsaved changes. Are you sure you want to leave?")) {
        router.back();
      }
    } else {
      router.back();
    }
  };

  // Retry handler for error state
  const handleRetry = () => {
    setHasError(false);
    setError(null);
    window.location.reload();
  };

  // Prepare initial data from URL parameters
  const initialData = {
    billingType: billingType || 'customer-order',
    customerId: customerId || '',
    customerOrderId: customerOrderId || '',
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Breadcrumb Navigation */}
      <BreadcrumbNavigation />

      {/* Page Header */}
      <PageHeader isSubmitting={isSubmitting} onCancel={handleCancel} />

      <Separator />

      {/* Main Content */}
      <ErrorBoundary fallback={<ErrorFallback error={error} onRetry={handleRetry} />}>
        {isLoading ? (
          <LoadingState />
        ) : hasError ? (
          <ErrorFallback error={error} onRetry={handleRetry} />
        ) : (
          <div className="space-y-6">
            {/* Context Information */}
            <Card className="bg-blue-50 border-blue-200">
              <CardContent className="pt-6">
                <div className="flex items-start space-x-3">
                  <FileText className="h-5 w-5 text-blue-600 mt-0.5" />
                  <div>
                    <h3 className="font-medium text-blue-900">Enhanced Billing Creation</h3>
                    <p className="text-sm text-blue-700 mt-1">
                      This enhanced form provides step-by-step guidance, real-time validation, 
                      and automatic form persistence to ensure accurate billing statement creation.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Enhanced Billing Form */}
            <EnhancedBillingStatementForm
              onSubmit={handleSubmit}
              isSubmitting={isSubmitting}
              initialData={initialData}
              onStepChange={handleStepChange}
              enablePersistence={true}
              enableAutoSave={true}
            />

            {/* Help Information */}
            <Card className="bg-muted/50">
              <CardHeader>
                <CardTitle className="text-lg">Need Help?</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <h4 className="font-medium mb-2">Billing Types</h4>
                    <ul className="space-y-1 text-muted-foreground">
                      <li>• <strong>Customer Order:</strong> Bill from existing orders</li>
                      <li>• <strong>Direct Customer:</strong> Bill registered customers</li>
                      <li>• <strong>Manual Entry:</strong> Enter customer details manually</li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-medium mb-2">Form Features</h4>
                    <ul className="space-y-1 text-muted-foreground">
                      <li>• Auto-save every 30 seconds</li>
                      <li>• Real-time validation</li>
                      <li>• Step-by-step guidance</li>
                      <li>• Form recovery on page reload</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </ErrorBoundary>
    </div>
  );
}