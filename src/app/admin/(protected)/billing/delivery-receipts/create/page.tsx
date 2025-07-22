"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, X } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";

// Import simplified components and actions
import { DeliveryReceiptForm } from "@/components/module/admin/billing/delivery-receipt-form";
import { DeliveryReceiptFormData } from "@/types/admin/billing";
import { createDeliveryReceipt } from "@/lib/actions/delivery-receipts";

export default function CreateDeliveryReceiptPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Handle form submission with simplified fields (Requirements 3.1, 3.2, 3.3, 3.4, 3.5)
  const handleSubmit = async (data: DeliveryReceiptFormData) => {
    setIsSubmitting(true);
    
    try {
      const result = await createDeliveryReceipt(data);
      
      if (result.success) {
        toast.success("Delivery receipt created successfully");
        router.push("/admin/billing/delivery-receipts");
      } else {
        toast.error(result.error || "Failed to create delivery receipt");
      }
    } catch (error) {
      console.error("Error creating delivery receipt:", error);
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
          <Link href="/admin/billing/delivery-receipts">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Receipts
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Create Delivery Receipt</h1>
            <p className="text-muted-foreground mt-1">
              Create a new delivery receipt linked to a billing statement
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

      {/* Simplified Form Component */}
      <DeliveryReceiptForm
        onSubmit={handleSubmit}
        isSubmitting={isSubmitting}
        submitLabel="Create Receipt"
      />
    </div>
  );
}