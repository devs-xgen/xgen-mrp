"use client";

import { useState } from "react";
import { generateMaterialRequestPdf } from "@/lib/actions/inspector/inventory";
import RequestPdfTrigger from "@/components/common/RequestPdfTrigger";
import { Button } from "@/components/ui/button";
import { MaterialRequestItem, RequestPriority } from "@/types/inspector/inventory";
import { Loader2 } from "lucide-react";

interface MaterialRequestPdfProps {
  workCenterId: string;
  requiredDate: Date;
  priority: RequestPriority;
  notes?: string;
  productionOrderId?: string;
  items: MaterialRequestItem[];
}

export default function MaterialRequestPdf({
  workCenterId,
  requiredDate,
  priority,
  notes,
  productionOrderId,
  items,
}: MaterialRequestPdfProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [pdfData, setPdfData] = useState<{
    htmlContent: string;
    filename: string;
  } | null>(null);

  const handleGeneratePdf = async () => {
    try {
      setIsLoading(true);
      const result = await generateMaterialRequestPdf({
        workCenterId,
        requiredDate,
        priority,
        notes,
        productionOrderId,
        items,
      });

      setPdfData(result);
    } catch (error) {
      console.error("Error generating PDF:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownloadComplete = () => {
    setPdfData(null);
  };

  return (
    <>
      <Button
        onClick={handleGeneratePdf}
        disabled={isLoading || items.length === 0}
        variant="outline"
        size="sm"
      >
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Generating PDF...
          </>
        ) : (
          "Download PDF"
        )}
      </Button>

      {pdfData && (
        <RequestPdfTrigger
          htmlContent={pdfData.htmlContent}
          filename={pdfData.filename}
          onDownloadComplete={handleDownloadComplete}
        />
      )}
    </>
  );
}
