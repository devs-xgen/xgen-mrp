"use client";

import { useState } from "react";
import { Download, RefreshCw } from "lucide-react";
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
  const [retryCount, setRetryCount] = useState(0);
  const maxRetries = 3;

  const downloadPDF = async (attempt: number = 1): Promise<void> => {
    try {
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

      // Reset retry count on success
      setRetryCount(0);

      toast({
        title: "Download complete",
        description: "Invoice PDF has been downloaded successfully.",
      });
    } catch (error) {
      console.error(`PDF download attempt ${attempt} failed:`, error);
      
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      
      // Check if we should retry based on error type
      const shouldRetry = attempt < maxRetries && (
        errorMessage.includes('timeout') ||
        errorMessage.includes('connection') ||
        errorMessage.includes('network') ||
        errorMessage.includes('Database connection error')
      );

      if (shouldRetry) {
        const delay = Math.min(1000 * Math.pow(2, attempt - 1), 5000); // Exponential backoff, max 5s
        
        toast({
          title: `Download failed (Attempt ${attempt}/${maxRetries})`,
          description: `Retrying in ${delay / 1000} seconds...`,
          variant: "destructive",
        });

        setTimeout(() => {
          setRetryCount(attempt);
          downloadPDF(attempt + 1);
        }, delay);
      } else {
        // Final failure or non-retryable error
        setRetryCount(0);
        
        let userFriendlyMessage = "Failed to download the invoice PDF.";
        let actionMessage = "Please try again.";

        if (errorMessage.includes('Authentication required')) {
          userFriendlyMessage = "Your session has expired.";
          actionMessage = "Please refresh the page and log in again.";
        } else if (errorMessage.includes('Admin access required')) {
          userFriendlyMessage = "You don't have permission to download invoices.";
          actionMessage = "Please contact your administrator.";
        } else if (errorMessage.includes('Invoice not found')) {
          userFriendlyMessage = "This invoice no longer exists.";
          actionMessage = "Please refresh the page.";
        } else if (errorMessage.includes('PDF generation failed')) {
          userFriendlyMessage = "There was an issue generating the PDF.";
          actionMessage = "Please try again or contact support.";
        } else if (attempt >= maxRetries) {
          userFriendlyMessage = `Failed to download after ${maxRetries} attempts.`;
          actionMessage = "Please try again later or contact support.";
        }

        toast({
          title: "Download failed",
          description: `${userFriendlyMessage} ${actionMessage}`,
          variant: "destructive",
        });
      }
    }
  };

  const handleDownloadPDF = async () => {
    if (isDownloading) return;

    setIsDownloading(true);
    setRetryCount(0);
    
    try {
      toast({
        title: "Download started",
        description: "Your invoice PDF is being generated...",
      });

      await downloadPDF(1);
    } finally {
      setIsDownloading(false);
    }
  };

  const getButtonText = () => {
    if (isDownloading) {
      if (retryCount > 0) {
        return `Retrying... (${retryCount}/${maxRetries})`;
      }
      return "Downloading...";
    }
    return "Download PDF";
  };

  const getIcon = () => {
    if (isDownloading && retryCount > 0) {
      return <RefreshCw className="mr-2 h-4 w-4 animate-spin" />;
    }
    return <Download className="mr-2 h-4 w-4" />;
  };

  return (
    <DropdownMenuItem
      onClick={handleDownloadPDF}
      disabled={isDownloading}
      className={className}
    >
      {getIcon()}
      {getButtonText()}
    </DropdownMenuItem>
  );
}