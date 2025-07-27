"use client";

import { useState } from "react";
import { Download } from "lucide-react";
import { DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { toast } from "@/hooks/use-toast";
import { exportSalesInvoicePDF } from "@/lib/actions/sales-invoices";

interface PDFDownloadButtonProps {
  invoiceId: string;
  invoiceNumber: string;
  className?: string;
}

export function PDFDownloadButton({ invoiceId, invoiceNumber, className }: PDFDownloadButtonProps) {
  const [isDownloading, setIsDownloading] = useState(false);

  const handleDownloadPDF = async () => {
    if (isDownloading) return;

    setIsDownloading(true);
    try {
      toast({
        title: "Download started",
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

      toast({
        title: "Download complete",
        description: "Invoice PDF has been downloaded successfully.",
      });
    } catch (error) {
      console.error('Error downloading PDF:', error);
      toast({
        title: "Download failed",
        description: "Failed to download the invoice PDF. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <DropdownMenuItem
      onClick={handleDownloadPDF}
      disabled={isDownloading}
      className={className}
    >
      <Download className="mr-2 h-4 w-4" />
      {isDownloading ? "Downloading..." : "Download PDF"}
    </DropdownMenuItem>
  );
}