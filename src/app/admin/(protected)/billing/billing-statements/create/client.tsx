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

// Enhanced loading state component
function LoadingState() {
  return (
    <div className="flex items-center justify-center h-96">
      <div className="text-center space-y-4">
        <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
        <div className="space-y-2">
          <p className="text-muted-foreground">Loading billing form...</p>
          <div className="flex items-center justify-center space-x-2">
            <div className="w-2 h-2 bg-primary rounded-full animate-pulse"></div>
            <div className="w-2 h-2 bg-primary rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
            <div className="w-2 h-2 bg-primary rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Enhanced error fallback component
function ErrorFallback({ error, onRetry }: { error?: Error; onRetry: () => void }) {
  const isNetworkError = error?.message.includes('network') || error?.message.includes('fetch');
  const isValidationError = error?.message.includes('validation') || error?.message.includes('required');
  
  return (
    <Card className="border-destructive bg-destructive/5">
      <CardHeader>
        <CardTitle className="flex items-center text-destructive">
          <AlertTriangle className="mr-2 h-5 w-5" />
          {isNetworkError ? 'Connection Error' : isValidationError ? 'Validation Error' : 'Something went wrong'}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription className="ml-2">
            {error?.message || "An unexpected error occurred while loading the billing form."}
          </AlertDescription>
        </Alert>
        
        {isNetworkError && (
          <div className="text-sm text-muted-foreground bg-muted p-3 rounded-md">
            <p className="font-medium mb-1">Troubleshooting tips:</p>
            <ul className="list-disc list-inside space-y-1">
              <li>Check your internet connection</li>
              <li>Refresh the page</li>
              <li>Try again in a few moments</li>
            </ul>
          </div>
        )}
        
        <div className="flex gap-2">
          <Button onClick={onRetry} variant="outline" className="flex items-center">
            <Loader2 className="mr-2 h-4 w-4" />
            Try Again
          </Button>
          <Button asChild variant="ghost">
            <Link href="/admin/billing/billing-statements">
              <ArrowLeft className="mr-2 h-4 w-4" />
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

  // Enhanced form submission handler with comprehensive validation and error handling
  const handleSubmit = async (data: BillingStatementFormData) => {
    setIsSubmitting(true);
    setError(null);
    
    try {
      // Pre-submission validation
      const validationErrors: string[] = [];
      
      if (!data.customerName?.trim()) {
        validationErrors.push("Customer name is required");
      }

      if (!data.invoiceItems?.length || data.invoiceItems.every(item => !item.description?.trim())) {
        validationErrors.push("At least one invoice item with description is required");
      }

      if (data.invoiceItems?.some(item => item.quantity <= 0)) {
        validationErrors.push("All invoice items must have quantity greater than 0");
      }

      if (data.invoiceItems?.some(item => item.unitPrice < 0)) {
        validationErrors.push("All invoice items must have non-negative unit price");
      }

      if (data.subtotal < 0) {
        validationErrors.push("Subtotal cannot be negative");
      }

      if (data.taxRate < 0 || data.taxRate > 100) {
        validationErrors.push("Tax rate must be between 0% and 100%");
      }

      if (data.discountAmount < 0) {
        validationErrors.push("Discount amount cannot be negative");
      }

      if (validationErrors.length > 0) {
        throw new Error(`Validation failed: ${validationErrors.join(', ')}`);
      }

      // Submit the form
      const result = await createBillingStatement(data);
      
      if (result.success) {
        toast.success("Billing statement created successfully", {
          description: `Statement ${result.data?.statementNumber || ''} has been created and is ready for review`,
          duration: 5000,
          action: {
            label: "View Statement",
            onClick: () => {
              if (result.data?.id) {
                router.push(`/admin/billing/billing-statements/${result.data.id}`);
              }
            },
          },
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
      
      let errorMessage = "An unexpected error occurred";
      let errorType = "general";
      
      if (error instanceof Error) {
        errorMessage = error.message;
        
        if (error.message.includes('network') || error.message.includes('fetch')) {
          errorType = "network";
          errorMessage = "Network error occurred. Please check your connection and try again.";
        } else if (error.message.includes('validation') || error.message.includes('required')) {
          errorType = "validation";
        } else if (error.message.includes('permission') || error.message.includes('unauthorized')) {
          errorType = "permission";
          errorMessage = "You don't have permission to create billing statements.";
        }
      }
      
      setError(error instanceof Error ? error : new Error(errorMessage));
      
      toast.error("Failed to create billing statement", {
        description: errorMessage,
        duration: errorType === "network" ? 10000 : 7000,
        action: errorType === "network" ? {
          label: "Retry",
          onClick: () => handleSubmit(data),
        } : undefined,
      });
      
      // Reset submitting state with delay to prevent double submission
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

  // Enhanced cancel handler with unsaved changes detection
  const handleCancel = () => {
    if (isSubmitting) {
      toast.warning("Please wait for the current operation to complete", {
        description: "The billing statement is being processed. Please wait a moment.",
      });
      return;
    }

    // Check if form has unsaved changes
    const hasUnsavedChanges = currentStep !== BillingFormStep.BILLING_TYPE_SELECTION || 
                             customerId || 
                             customerOrderId || 
                             billingType;
    
    if (hasUnsavedChanges) {
      const confirmMessage = "You have unsaved changes in your billing form. Are you sure you want to leave? All progress will be lost.";
      
      if (window.confirm(confirmMessage)) {
        // Clear any persisted form data
        try {
          localStorage.removeItem('billing-form-state');
          localStorage.removeItem('billing-form-auto-save');
        } catch (error) {
          console.warn('Failed to clear form data from localStorage:', error);
        }
        
        toast.info("Form data cleared", {
          description: "Your billing form progress has been discarded.",
        });
        
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
            <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
              <CardContent className="pt-6">
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0">
                    <FileText className="h-5 w-5 text-blue-600 mt-0.5" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-medium text-blue-900 mb-2">Enhanced Billing Creation</h3>
                    <p className="text-sm text-blue-700 mb-3">
                      This enhanced form provides step-by-step guidance, real-time validation, 
                      and automatic form persistence to ensure accurate billing statement creation.
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                      <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        <span className="text-blue-600">Auto-save enabled</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                        <span className="text-blue-600">Real-time validation</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                        <span className="text-blue-600">Form recovery</span>
                      </div>
                    </div>
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

            {/* Enhanced Help Information */}
            <Card className="bg-gradient-to-r from-slate-50 to-gray-50 border-slate-200">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg flex items-center">
                  <AlertTriangle className="mr-2 h-5 w-5 text-amber-600" />
                  Need Help?
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  Quick reference guide for creating billing statements
                </p>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm">
                  <div className="space-y-3">
                    <h4 className="font-medium text-slate-900 flex items-center">
                      <div className="w-2 h-2 bg-blue-500 rounded-full mr-2"></div>
                      Billing Types
                    </h4>
                    <ul className="space-y-2 text-muted-foreground">
                      <li className="flex items-start">
                        <span className="font-medium text-blue-600 mr-2">•</span>
                        <div>
                          <strong className="text-slate-700">Customer Order:</strong>
                          <br />Bill from existing orders with pre-filled details
                        </div>
                      </li>
                      <li className="flex items-start">
                        <span className="font-medium text-green-600 mr-2">•</span>
                        <div>
                          <strong className="text-slate-700">Direct Customer:</strong>
                          <br />Bill registered customers from database
                        </div>
                      </li>
                      <li className="flex items-start">
                        <span className="font-medium text-purple-600 mr-2">•</span>
                        <div>
                          <strong className="text-slate-700">Manual Entry:</strong>
                          <br />Enter customer details manually
                        </div>
                      </li>
                    </ul>
                  </div>
                  
                  <div className="space-y-3">
                    <h4 className="font-medium text-slate-900 flex items-center">
                      <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                      Form Features
                    </h4>
                    <ul className="space-y-2 text-muted-foreground">
                      <li>• Auto-save every 30 seconds</li>
                      <li>• Real-time validation feedback</li>
                      <li>• Step-by-step guidance</li>
                      <li>• Form recovery on page reload</li>
                      <li>• Calculation auto-updates</li>
                      <li>• Keyboard navigation support</li>
                    </ul>
                  </div>
                  
                  <div className="space-y-3">
                    <h4 className="font-medium text-slate-900 flex items-center">
                      <div className="w-2 h-2 bg-amber-500 rounded-full mr-2"></div>
                      Tips & Shortcuts
                    </h4>
                    <ul className="space-y-2 text-muted-foreground">
                      <li>• Use Tab to navigate between fields</li>
                      <li>• Press Ctrl+S to manually save</li>
                      <li>• Click "Save" to store progress locally</li>
                      <li>• Form data persists across sessions</li>
                      <li>• Validation errors show in real-time</li>
                      <li>• Use ESC to cancel current action</li>
                    </ul>
                  </div>
                </div>
                
                <Separator />
                
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>Need more help? Contact your system administrator.</span>
                  <span>Form version: Enhanced v2.0</span>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </ErrorBoundary>
    </div>
  );
}