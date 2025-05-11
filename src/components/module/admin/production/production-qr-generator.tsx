"use client";

import {
  Document,
  Image,
  Page,
  StyleSheet,
  Text,
  View,
  pdf,
  Svg,
  Rect
} from "@react-pdf/renderer";
import { format } from "date-fns";
import { FileText } from "lucide-react";
import { useState, useMemo } from "react";
import { getMatrix } from "qr-code-generator-lib";

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
  const { toast } = useToast();

  // Create a JSON string with all the data we want to encode in the QR code
  const qrData = useMemo(() => {
    // Format the dates for better readability when scanned
    const formattedStartDate = format(new Date(order.startDate), "MMM dd, yyyy");
    const formattedDueDate = format(new Date(order.dueDate), "MMM dd, yyyy");
    
    // Create a structured data object with the correct interface
    interface QRDataType {
      id: string;
      product: {
        name: string;
        sku: string;
      };
      quantity: number;
      dates: {
        start: string;
        due: string;
      };
      status: string;
      priority: string;
      delivery?: {
        address?: string;
        contactName?: string;
        contactPhone?: string;
        estimatedDelivery?: string;
        instructions?: string;
      };
      assignments?: {
        qualityInspector?: string;
        logisticsCoordinator?: string;
      };
    }
    
    const data: QRDataType = {
      id: order.id,
      product: {
        name: order.product.name,
        sku: order.product.sku
      },
      quantity: order.quantity,
      dates: {
        start: formattedStartDate,
        due: formattedDueDate
      },
      status: order.status,
      priority: order.priority
    };
    
    // Add delivery information if available
    if (order.delivery) {
      data.delivery = {
        address: order.delivery.address,
        contactName: order.delivery.contactName,
        contactPhone: order.delivery.contactPhone,
        estimatedDelivery: order.delivery.estimatedDelivery 
          ? format(new Date(order.delivery.estimatedDelivery), "MMM dd, yyyy") 
          : "Not Scheduled",
        instructions: order.delivery.instructions
      };
    }
    
    // Add assignments information if available
    if (order.assignments) {
      data.assignments = {
        qualityInspector: order.assignments.qualityInspector,
        logisticsCoordinator: order.assignments.logisticsCoordinator
      };
    }
    
    // Return JSON string of the data
    return JSON.stringify(data);
  }, [order]);

  // Use qr-code-generator-lib to create a proper QR code matrix
  // The library returns a 2D array of booleans where true represents a black pixel
  const qrMatrix = useMemo(() => {
    // Generate QR code with the expanded data
    // Second parameter is error correction level: 0=L, 1=M, 2=Q, 3=H (H is highest)
    // Using level H (3) since we're storing more data and want maximum error correction
    return getMatrix(qrData, 3);
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
                {/* Render QR code with correct row/column orientation */}
                <Svg width={150} height={150} viewBox={`0 0 ${qrMatrix.length} ${qrMatrix.length}`}>
                  {qrMatrix.map((row, y) =>
                    row.map((cell, x) => (
                      <Rect
                        key={`${x}-${y}`}
                        x={x}
                        y={y}
                        width={1}
                        height={1}
                        fill={cell ? "#000000" : "#ffffff"}
                      />
                    ))
                  )}
                </Svg>
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