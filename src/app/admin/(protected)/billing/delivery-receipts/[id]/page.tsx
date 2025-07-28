"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { ArrowLeft, Edit, Loader2, Download, Trash2 } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

// Import components and actions
import { DeliveryReceiptCard } from "@/components/module/admin/billing/delivery-receipt-card";
import { DeliveryReceiptWithBilling } from "@/types/admin/billing";
import { getDeliveryReceiptById, deleteDeliveryReceipt, downloadDeliveryReceiptPDF } from "@/lib/actions/delivery-receipts";
import { ShareLinkButton } from "@/components/shared/ShareLinkButton";
import { ShareLinkManager } from "@/components/shared/ShareLinkManager";

export default function ViewDeliveryReceiptPage() {
  const router = useRouter();
  const params = useParams();
  const receiptId = params.id as string;
  
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  const [receipt, setReceipt] = useState<DeliveryReceiptWithBilling | null>(null);

  // Load receipt data
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

  // Handle export
  const handleExport = async () => {
    if (!receipt) return;

    try {
      setIsLoading(true);
      
      // Use the server action to get the PDF data
      const result = await downloadDeliveryReceiptPDF(receipt.id);
      
      if (!result.success || !result.pdfData || !result.filename) {
        throw new Error(result.error || "Failed to export PDF");
      }
      
      // Convert base64 to blob and download
      const byteCharacters = atob(result.pdfData);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: 'application/pdf' });
      
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = result.filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      toast.success("PDF exported successfully!");
    } catch (error) {
      console.error("Export error:", error);
      toast.error(error instanceof Error ? error.message : "Failed to export PDF");
    } finally {
      setIsLoading(false);
    }
  };

  // Handle delete
  const handleDelete = async () => {
    setIsDeleting(true);
    
    try {
      const result = await deleteDeliveryReceipt(receiptId);
      
      if (result.success) {
        toast.success("Delivery receipt deleted successfully");
        router.push("/admin/billing/delivery-receipts");
      } else {
        toast.error(result.error || "Failed to delete delivery receipt");
      }
    } catch (error) {
      console.error("Error deleting delivery receipt:", error);
      toast.error("An unexpected error occurred");
    } finally {
      setIsDeleting(false);
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
              The delivery receipt you're looking for doesn't exist.
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
          <Link href="/admin/billing/delivery-receipts">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Receipts
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Delivery Receipt</h1>
            <p className="text-muted-foreground mt-1">
              {receipt.receiptNumber}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <ShareLinkButton
            documentType="delivery-receipt"
            documentId={receiptId}
            variant="outline"
            size="sm"
          />
          <Button variant="outline" size="sm" onClick={handleExport} disabled={isLoading}>
             <Download className="mr-2 h-4 w-4" />
             {isLoading ? "Exporting..." : "Export"}
          </Button>
          {receipt.deliveryStatus === 'PENDING' && (
            <>
              <Button variant="outline" size="sm" asChild>
                <Link href={`/admin/billing/delivery-receipts/${receiptId}/edit`}>
                  <Edit className="mr-2 h-4 w-4" />
                  Edit
                </Link>
              </Button>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="outline" size="sm" disabled={isDeleting}>
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete Delivery Receipt</AlertDialogTitle>
                    <AlertDialogDescription>
                      Are you sure you want to delete this delivery receipt? This action cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDelete} disabled={isDeleting}>
                      {isDeleting ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : null}
                      Delete
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </>
          )}
        </div>
      </div>

      {/* Receipt Details */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <DeliveryReceiptCard receipt={receipt} showActions={false} />
        </div>
        
        {/* Additional Information Sidebar */}
        <div className="space-y-6">
          {/* Share Links Management */}
          <ShareLinkManager
            documentType="delivery-receipt"
            documentId={receiptId}
          />

          {/* Proof Images */}
          {(receipt.signatureImage || receipt.photoEvidence) && (
            <Card className="bg-card border rounded-lg">
              <CardContent className="p-6 space-y-4">
                <h3 className="text-lg font-semibold">Proof of Delivery</h3>
                
                {receipt.signatureImage && (
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium text-muted-foreground">Signature</h4>
                    <div className="border rounded-lg p-2">
                      <img
                        src={receipt.signatureImage}
                        alt="Delivery signature"
                        className="max-w-full h-32 object-contain mx-auto"
                      />
                    </div>
                  </div>
                )}
                
                {receipt.photoEvidence && (
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium text-muted-foreground">Photo Evidence</h4>
                    <div className="border rounded-lg p-2">
                      <img
                        src={receipt.photoEvidence}
                        alt="Delivery photo"
                        className="max-w-full h-48 object-contain mx-auto"
                      />
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Related Links */}
          <Card className="bg-card border rounded-lg">
            <CardContent className="p-6 space-y-4">
              <h3 className="text-lg font-semibold">Related</h3>
              
              {receipt.billingStatement && (
                <div className="space-y-2">
                  <h4 className="text-sm font-medium text-muted-foreground">Billing Statement</h4>
                  <Button variant="outline" size="sm" asChild className="w-full">
                    <Link href={`/admin/billing/statements/${receipt.billingStatement.id}`}>
                      View {receipt.billingStatement.statementNumber}
                    </Link>
                  </Button>
                </div>
              )}

              {receipt.billingStatement?.salesInvoice && (
                <div className="space-y-2">
                  <h4 className="text-sm font-medium text-muted-foreground">Sales Invoice</h4>
                  <Button variant="outline" size="sm" asChild className="w-full">
                    <Link href={`/admin/billing/sales-invoices/${receipt.billingStatement.salesInvoice.id}`}>
                      View Invoice
                    </Link>
                  </Button>
                </div>
              )}

              {receipt.billingStatement?.customer && (
                <div className="space-y-2">
                  <h4 className="text-sm font-medium text-muted-foreground">Customer</h4>
                  <Button variant="outline" size="sm" asChild className="w-full">
                    <Link href={`/admin/customers/${receipt.billingStatement.customer.id}`}>
                      View Customer
                    </Link>
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}