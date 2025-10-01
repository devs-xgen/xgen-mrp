"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { DeliveryReceiptForm } from "@/components/module/admin/billing/delivery-receipt-form";
import { DeliveryReceiptFormData } from "@/types/admin/billing";
import { createDeliveryReceipt } from "@/lib/actions/superadmin/delivery-receipts";

export function SuperAdminCreateDeliveryReceiptClient() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (data: DeliveryReceiptFormData) => {
    setIsSubmitting(true);

    try {
      const result = await createDeliveryReceipt(data);

      if (result.success) {
        toast.success("Delivery receipt created successfully");
        router.push("/superadmin/billing/delivery-receipts");
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
    <DeliveryReceiptForm
      onSubmit={handleSubmit}
      isSubmitting={isSubmitting}
      submitLabel="Create Receipt"
    />
  );
}
