"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { ArrowLeft, X, Loader2 } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";

// Import simplified components and actions
import { DeliveryReceiptForm } from "@/components/module/admin/billing/delivery-receipt-form";
import { DeliveryReceiptFormData, DeliveryReceiptWithBilling } from "@/types/admin/billing";
import { getDeliveryReceiptById, updateDeliveryReceipt } from "@/lib/actions/delivery-receipts";

export default function EditDeliveryReceiptPage() {
  const router = useRouter();
  const params = useParams();
  const receiptId = params.id as string;
  
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [receipt, setReceipt] = useState<DeliveryReceiptWithBilling | null>(null);

  // Load existing receipt data
  useEffect(() => {
    const loadReceipt = async () => {
      try {
        const result = await getDeliveryReceiptById(receiptId);
        if (result) {
          setReceipt(result);
        } else {
          toast.error("Delivery receipt not found");
          router.push("/admin/billing/delivery-receipts");
        }
      } catch (error) {
        console.error("Error loading delivery receipt:", error);
        toast.error("Failed to load delivery receipt");
        router.push("/admin/billing/delivery-receipts");
      } finally {
        setIsLoading(false);
      }
    };

    if (receiptId) {
      loadReceipt();
    }
  }, [receiptId, router]);

  // Handle form submission with simplified fields (Requirements 3.1, 3.2, 3.3, 3.4, 3.5)
  const handleSubmit = async (data: DeliveryReceiptFormData) => {
    setIsSubmitting(true);
    
    try {
      const result = await updateDeliveryReceipt(receiptId, data);
      
      if (result.success) {
        toast.success("Delivery receipt updated successfully");
        router.push(`/admin/billing/delivery-receipts/${receiptId}`);
      } else {
        toast.error(result.error || "Failed to update delivery receipt");
      }
    } catch (error) {
      console.error("Error updating delivery receipt:", error);
      toast.error("An unexpected error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col gap-6 p-8 bg-background min-h-screen">
        <div className="flex items-center justify-center h-96">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </div>
    );
  }

  if (!receipt) {
    return (
      <div className="flex flex-col gap-6 p-8 bg-background min-h-screen">
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <h2 className="text-xl font-semibold mb-2">Receipt Not Found</h2>
            <p className="text-muted-foreground mb-4">
              The delivery receipt you&apos;re looking for doesn&apos;t exist.
            </p>
            <Button asChild>
              <Link href="/admin/billing/delivery-receipts">
                Back to Receipts
              </Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 p-8 bg-background min-h-screen">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href={`/admin/billing/delivery-receipts/${receiptId}`}>
            <Button variant="ghost" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Receipt
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Edit Delivery Receipt</h1>
            <p className="text-muted-foreground mt-1">
              Update delivery receipt {receipt.receiptNumber}
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

      {/* Simplified Form Component with initial data */}
      <DeliveryReceiptForm
        initialData={{
          billingStatementId: receipt.billingStatementId,
          deliveryDate: receipt.deliveryDate,
          receivedBy: receipt.receivedBy,
          receivedByTitle: receipt.receivedByTitle || "",
          deliveryAddress: receipt.deliveryAddress,
          deliveryNotes: receipt.deliveryNotes || "",
          deliveryStatus: receipt.deliveryStatus,
          signatureImage: receipt.signatureImage || "",
          photoEvidence: receipt.photoEvidence || "",
          trackingNumber: receipt.trackingNumber || "",
          courierService: receipt.courierService || "",
        }}
        onSubmit={handleSubmit}
        isSubmitting={isSubmitting}
        submitLabel="Update Receipt"
      />
    </div>
  );
}