"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, X } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { BillingStatementForm } from "@/components/module/admin/billing/billing-statement-form";
import { BillingStatementFormData } from "@/types/admin/billing";
import { createBillingStatement } from "@/lib/actions/billing-statements";

export default function CreateBillingStatementPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form submission handler
  const handleSubmit = async (data: BillingStatementFormData) => {
    setIsSubmitting(true);
    
    try {
      const result = await createBillingStatement(data);
      
      if (result.success) {
        toast.success("Billing statement created successfully");
        router.push("/admin/billing/billing-statements");
      } else {
        toast.error(result.error || "Failed to create billing statement");
      }
    } catch (error) {
      console.error("Error creating billing statement:", error);
      toast.error("An unexpected error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col gap-6 p-8 bg-background min-h-screen">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/admin/billing/billing-statements">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Statements
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Create Billing Statement</h1>
            <p className="text-muted-foreground mt-1">
              Create a new billing statement for a customer or customer order
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => router.back()}
            disabled={isSubmitting}
          >
            <X className="mr-2 h-4 w-4" />
            Cancel
          </Button>
        </div>
      </div>

      {/* Form */}
      <BillingStatementForm 
        onSubmit={handleSubmit}
        isSubmitting={isSubmitting}
      />
    </div>
  );
}