// src/app/admin/(protected)/production/[id]/production-order-header-actions.tsx
"use client";

import dynamic from "next/dynamic";
import { useState } from "react";
import { Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";

const ProductionWorkflowProgressButton = dynamic(
  () =>
    import("@/components/module/admin/production/production-workflow-progress-button").then(
      (mod) => mod.ProductionWorkflowProgressButton
    ),
  {
    loading: () => <Button variant="outline" size="sm" disabled>Loading status...</Button>,
  }
);

const ProductionQRGenerator = dynamic(
  () =>
    import("@/components/module/admin/production/production-qr-generator").then(
      (mod) => mod.ProductionQRGenerator
    ),
  {
    ssr: false,
    loading: () => <Button variant="outline" size="sm" disabled>Loading QR...</Button>,
  }
);

const ProductionOrderShareDialog = dynamic(
  () =>
    import("@/components/module/admin/production/production-order-share-dialog").then(
      (mod) => mod.ProductionOrderShareDialog
    )
);

interface ProductionOrderHeaderActionsProps {
  productionOrderId: string;
  currentStatus: string;
  qrOrderData: any;
  productLabel: string;
}

export function ProductionOrderHeaderActions({
  productionOrderId,
  currentStatus,
  qrOrderData,
  productLabel,
}: ProductionOrderHeaderActionsProps) {
  const [showShareDialog, setShowShareDialog] = useState(false);

  return (
    <>
      <div className="flex flex-col sm:flex-row gap-3">
        <ProductionWorkflowProgressButton
          productionOrderId={productionOrderId}
          currentStatus={currentStatus}
          className="sm:w-auto"
        />

        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowShareDialog(true)}
          className="sm:w-auto"
        >
          <Share2 className="h-4 w-4 mr-2" />
          Share
        </Button>

        <ProductionQRGenerator order={qrOrderData} />
      </div>

      <ProductionOrderShareDialog
        open={showShareDialog}
        onOpenChange={setShowShareDialog}
        productionOrderId={productionOrderId}
        productionOrderLabel={productLabel}
      />
    </>
  );
}
