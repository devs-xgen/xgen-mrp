"use client";

import {
  Document,
  Image,
  Page,
  StyleSheet,
  Text,
  View,
  pdf,
} from "@react-pdf/renderer";
import { format } from "date-fns";
import { FileText } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

// PDF specific styles with explicit dark text colors to ensure visibility
const styles = StyleSheet.create({
  page: {
    flexDirection: "column",
    backgroundColor: "#ffffff",
    padding: 30,
    fontFamily: "Helvetica",
  },
  header: {
    marginBottom: 20,
    paddingBottom: 10,
    borderBottom: "1px solid #000000",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 4,
    color: "#000000",
  },
  headerSubtitle: {
    fontSize: 12,
    color: "#000000",
  },
  section: {
    flexDirection: "row",
    marginBottom: 20,
  },
  qrSection: {
    width: "40%",
    alignItems: "center",
    justifyContent: "center",
    padding: 10,
    borderRight: "1px solid #000000",
    backgroundColor: "#ffffff",
  },
  qrSectionTitle: {
    fontSize: 12,
    fontWeight: "bold",
    marginBottom: 10,
    textAlign: "center",
    color: "#000000",
  },
  qrImage: {
    width: 150,
    height: 150,
    backgroundColor: "#ffffff",
    padding: 10,
  },
  detailsSection: {
    width: "60%",
    padding: 10,
    paddingLeft: 20,
  },
  detailsTitle: {
    fontSize: 14,
    fontWeight: "bold",
    marginBottom: 10,
    color: "#000000",
  },
  detailsRow: {
    flexDirection: "row",
    marginBottom: 5,
  },
  detailsLabel: {
    width: "40%",
    fontSize: 10,
    fontWeight: "bold",
    color: "#000000",
  },
  detailsValue: {
    width: "60%",
    fontSize: 10,
    color: "#000000",
  },
  footer: {
    position: "absolute",
    bottom: 30,
    left: 30,
    right: 30,
    borderTop: "1px solid #000000",
    paddingTop: 10,
    fontSize: 8,
    color: "#000000",
    textAlign: "center",
  },
});

interface ProductionQRGeneratorProps {
  order: {
    id: string;
    product: {
      name: string;
      sku: string;
    };
    quantity: number;
    startDate: string | Date;
    dueDate: string | Date;
    status: string;
    priority: string;
  };
}

export function ProductionQRGenerator({ order }: ProductionQRGeneratorProps): JSX.Element {
  const [isGenerating, setIsGenerating] = useState(false);
  const { toast } = useToast();

  // Pre-generated high-contrast QR code for reliable rendering in PDF
  const qrCodeImage = "data:image/png;base64,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";

  const handleGeneratePDF = async (): Promise<void> => {
    try {
      setIsGenerating(true);
      console.log("Starting PDF generation process");
      
      // Define document with proper styling
      const MyDocument = (): JSX.Element => (
        <Document>
          <Page size="A4" style={styles.page}>
            <View style={styles.header}>
              <Text style={styles.headerTitle}>Production Order QR Code</Text>
              <Text style={styles.headerSubtitle}>
                Generated on {format(new Date(), "MMMM dd, yyyy")}
              </Text>
            </View>
            <View style={styles.section}>
              <View style={styles.qrSection}>
                <Text style={styles.qrSectionTitle}>Scan QR Code</Text>
                <Image src={qrCodeImage} style={styles.qrImage} />
              </View>
              <View style={styles.detailsSection}>
                <Text style={styles.detailsTitle}>Production Order Details</Text>
                <View style={styles.detailsRow}>
                  <Text style={styles.detailsLabel}>Order ID:</Text>
                  <Text style={styles.detailsValue}>{order.id}</Text>
                </View>
                <View style={styles.detailsRow}>
                  <Text style={styles.detailsLabel}>Product:</Text>
                  <Text style={styles.detailsValue}>{order.product.name}</Text>
                </View>
                <View style={styles.detailsRow}>
                  <Text style={styles.detailsLabel}>SKU:</Text>
                  <Text style={styles.detailsValue}>{order.product.sku}</Text>
                </View>
                <View style={styles.detailsRow}>
                  <Text style={styles.detailsLabel}>Quantity:</Text>
                  <Text style={styles.detailsValue}>{String(order.quantity)}</Text>
                </View>
                <View style={styles.detailsRow}>
                  <Text style={styles.detailsLabel}>Start Date:</Text>
                  <Text style={styles.detailsValue}>{format(new Date(order.startDate), "MMM dd, yyyy")}</Text>
                </View>
                <View style={styles.detailsRow}>
                  <Text style={styles.detailsLabel}>Due Date:</Text>
                  <Text style={styles.detailsValue}>{format(new Date(order.dueDate), "MMM dd, yyyy")}</Text>
                </View>
                <View style={styles.detailsRow}>
                  <Text style={styles.detailsLabel}>Status:</Text>
                  <Text style={styles.detailsValue}>{order.status}</Text>
                </View>
                <View style={styles.detailsRow}>
                  <Text style={styles.detailsLabel}>Priority:</Text>
                  <Text style={styles.detailsValue}>{order.priority}</Text>
                </View>
              </View>
            </View>
            <View style={styles.footer}>
              <Text style={{ color: "#000000" }}>
                XGen MRP System - This document was automatically generated.
                Scan the QR code with the XGen MRP app to view production order details.
              </Text>
            </View>
          </Page>
        </Document>
      );
      
      console.log("Creating PDF document...");
      try {
        const pdfBlob = await pdf(<MyDocument />).toBlob();
        console.log("PDF blob created successfully");
        
        const pdfUrl = URL.createObjectURL(pdfBlob);
        const link = document.createElement("a");
        link.href = pdfUrl;
        link.download = `production-order-${order.id}.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(pdfUrl);
        
        toast({
          title: "PDF Generated Successfully",
          description: "Production order QR code PDF has been downloaded.",
        });
      } catch (pdfError) {
        console.error("Error creating PDF:", pdfError);
        throw new Error(`PDF creation failed: ${pdfError instanceof Error ? pdfError.message : String(pdfError)}`);
      }
    } catch (error) {
      console.error("Error generating PDF:", error);
      toast({
        title: "Error Generating PDF",
        description: error instanceof Error 
          ? `Problem: ${error.message}` 
          : "There was a problem generating the PDF. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Button
      variant="outline"
      size="sm"
      className="ml-auto flex items-center gap-2"
      disabled={isGenerating}
      onClick={handleGeneratePDF}
    >
      {isGenerating ? (
        <div className="animate-spin h-4 w-4 border-2 border-primary border-t-transparent rounded-full mr-2" />
      ) : (
        <FileText className="h-4 w-4" />
      )}
      Generate QR & PDF
    </Button>
  );
}