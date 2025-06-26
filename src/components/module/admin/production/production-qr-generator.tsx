"use client";

import {
  Document,
  Page,
  StyleSheet,
  Text,
  View,
  pdf,
  Image
} from "@react-pdf/renderer";
import { format } from "date-fns";
import { FileText } from "lucide-react";
import { useState, useMemo, useRef, useEffect } from "react";
import { QRCodeCanvas } from "qrcode.react";

import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

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
    backgroundColor: "#f0f0f0",
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
  deliverySection: {
    marginTop: 10,
    borderTop: "1px solid #cccccc",
    paddingTop: 10,
  },
  assignmentSection: {
    marginTop: 10,
    borderTop: "1px solid #cccccc",
    paddingTop: 10,
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
    productVariant?: { // 🆕 ADD: Optional variant information
      displayName: string;
      sku: string;
    };
    quantity: number;
    startDate: string | Date;
    dueDate: string | Date;
    status: string;
    priority: string;
    delivery?: {
      address?: string;
      contactName?: string;
      contactPhone?: string;
      estimatedDelivery?: string | Date;
      instructions?: string;
    };
    assignments?: {
      qualityInspector?: string;
      logisticsCoordinator?: string;
    };
  };
}

export function ProductionQRGenerator({ order }: ProductionQRGeneratorProps): JSX.Element {
  const [isGenerating, setIsGenerating] = useState(false);
  const [qrCodeUrl, setQrCodeUrl] = useState<string | null>(null);
  const { toast } = useToast();
  const qrRef = useRef<HTMLCanvasElement>(null);

  // Create a simple string with just the order ID for the QR code
  const qrData = useMemo(() => {
    return order.id;
  }, [order.id]);

  // Generate QR code when component mounts
  useEffect(() => {
    if (qrRef.current) {
      // Get data URL from the rendered canvas
      const dataUrl = qrRef.current.toDataURL('image/png');
      setQrCodeUrl(dataUrl);
    }
  }, [qrData]);

  // Add a helper function to visually indicate missing information
  const renderDetailValue = (value: string | null | undefined): JSX.Element => {
    if (!value || value === "Not Assigned") {
      return (
        <Text style={{ ...styles.detailsValue, fontStyle: 'italic', color: '#888888' }}>
          {value || "Not Assigned"}
        </Text>
      );
    }
    return <Text style={styles.detailsValue}>{value}</Text>;
  };

  const handleGeneratePDF = async (): Promise<void> => {
    try {
      setIsGenerating(true);
      console.log("Starting PDF generation process");
      
      // Make sure we have a QR code
      if (!qrCodeUrl && qrRef.current) {
        const dataUrl = qrRef.current.toDataURL('image/png');
        setQrCodeUrl(dataUrl);
      }
      
      if (!qrCodeUrl) {
        throw new Error('QR code not generated');
      }
      
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
                {/* Render QR code as an image */}
                <Image src={qrCodeUrl} style={styles.qrImage} />
              </View>
              <View style={styles.detailsSection}>
                <Text style={styles.detailsTitle}>Production Order Details</Text>
                <View style={styles.detailsRow}>
                  <Text style={styles.detailsLabel}>Order ID:</Text>
                  <Text style={styles.detailsValue}>{order.id}</Text>
                </View>
                <View style={styles.detailsRow}>
                  <Text style={styles.detailsLabel}>Product:</Text>
                  <Text style={styles.detailsValue}>
                    {order.product.name}
                    {order.productVariant && ` - ${order.productVariant.displayName}`}
                  </Text>
                </View>
                <View style={styles.detailsRow}>
                  <Text style={styles.detailsLabel}>SKU:</Text>
                  <Text style={styles.detailsValue}>{order.product.sku}</Text>
                </View>
                {order.productVariant && (
                  <View style={styles.detailsRow}>
                    <Text style={styles.detailsLabel}>Variant SKU:</Text>
                    <Text style={styles.detailsValue}>{order.productVariant.sku}</Text>
                  </View>
                )}
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

                {/* Delivery Details Section - always shown, but values may be "Not Assigned" */}
                <View style={styles.deliverySection}>
                  <Text style={styles.detailsTitle}>Delivery Details</Text>
                  
                  <View style={styles.detailsRow}>
                    <Text style={styles.detailsLabel}>Delivery Address:</Text>
                    {renderDetailValue(order.delivery?.address)}
                  </View>
                  
                  <View style={styles.detailsRow}>
                    <Text style={styles.detailsLabel}>Contact Person:</Text>
                    {renderDetailValue(order.delivery?.contactName)}
                  </View>
                  
                  <View style={styles.detailsRow}>
                    <Text style={styles.detailsLabel}>Contact Phone:</Text>
                    {renderDetailValue(order.delivery?.contactPhone)}
                  </View>
                  
                  <View style={styles.detailsRow}>
                    <Text style={styles.detailsLabel}>Estimated Delivery:</Text>
                    {order.delivery?.estimatedDelivery ? (
                      <Text style={styles.detailsValue}>
                        {format(new Date(order.delivery.estimatedDelivery), "MMM dd, yyyy")}
                      </Text>
                    ) : (
                      <Text style={{ ...styles.detailsValue, fontStyle: 'italic', color: '#888888' }}>
                        Not Scheduled
                      </Text>
                    )}
                  </View>
                  
                  <View style={styles.detailsRow}>
                    <Text style={styles.detailsLabel}>Special Instructions:</Text>
                    {renderDetailValue(order.delivery?.instructions)}
                  </View>
                </View>

                {/* Assignment Section - always shown */}
                <View style={styles.assignmentSection}>
                  <Text style={styles.detailsTitle}>Assigned Personnel</Text>
                  
                  <View style={styles.detailsRow}>
                    <Text style={styles.detailsLabel}>Quality Inspector:</Text>
                    {renderDetailValue(order.assignments?.qualityInspector)}
                  </View>
                  
                  <View style={styles.detailsRow}>
                    <Text style={styles.detailsLabel}>Logistics Coordinator:</Text>
                    {renderDetailValue(order.assignments?.logisticsCoordinator)}
                  </View>
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
    <div className="flex flex-row items-center justify-center">
      {/* QR code that's rendered but visually hidden */}
      <div className="mb-4" style={{ display: 'none', justifyContent: 'flex-end' }}>
        <QRCodeCanvas
          ref={qrRef}
          value={qrData}
          size={150}
          level="H"
          bgColor="#FFFFFF"
          fgColor="#000000"
          includeMargin={true}
        />
      </div>
      
      <Button
        variant="outline"
        size="sm"
        className="flex items-center gap-2"
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
    </div>
  );
}