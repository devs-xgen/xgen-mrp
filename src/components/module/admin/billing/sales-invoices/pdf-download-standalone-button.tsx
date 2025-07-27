"use client";

import { useState } from "react";
import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { exportSalesInvoicePDF } from "@/lib/actions/sales-invoices";

interface PDFDownloadStandaloneButtonProps {
  invoiceId: string;
  invoiceNumber: string;
  variant?: "default" | "outline" | "ghost" | "destructive" | "secondary" | "link";
  size?: "default" | "sm" | "lg" | "icon";
  className?: string;
}

export function PDFDownloadStandaloneButton({ 
  invoiceId, 
  invoiceNumber, 
  variant = "outline",
  size = "sm",
  className 
}: PDFDownloadStandaloneButtonProps) {
  const [isDownloading, setIsDownloading] = useState(false);

  const handleDownloadPDF = async () => {
    if (isDownloading) return;

    setIsDownloading(true);
    try {
      toast.success("Download started", {
        description: "Your invoice PDF is being generated...",
      });

      // Use server action instead of API route
      const result = await exportSalesInvoicePDF(invoiceId);
      
      if (!result.success || !result.pdfBuffer) {
        throw new Error(result.error || 'Failed to generate PDF');
      }

      // Create blob from buffer
      const blob = new Blob([result.pdfBuffer], { type: 'application/pdf' });
      
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = result.filename || `sales-invoice-${invoiceNumber}.pdf`;
      
      // Trigger download
      document.body.appendChild(link);
      link.click();
      
      // Cleanup
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast.success("Download complete", {
        description: "Invoice PDF has been downloaded successfully.",
      });
    } catch (error) {
      console.error('Error downloading PDF:', error);
      toast.error("Download failed", {
        description: "Failed to download the invoice PDF. Please try again.",
      });
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <Button 
      variant={variant} 
      size={size}
      onClick={handleDownloadPDF}
      disabled={isDownloading}
      className={className}
    >
      <Download className="mr-2 h-4 w-4" />
      {isDownloading ? "Downloading..." : "Download PDF"}
    </Button>
  );
}