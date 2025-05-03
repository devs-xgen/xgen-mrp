"use client";

import {
  Document,
  Font,
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
import QRCode from "react-qr-code";

import { Button } from "@/components/ui/button";

// Fallback toast if useToast is not found
const useToast = () => ({
  toast: ({ title, description }: { title: string; description: string }) => {
    // eslint-disable-next-line no-alert
    alert(`${title}\n${description}`);
  },
});

// Register fonts for PDF
Font.register({
  family: "Inter",
  fonts: [
    { src: "https://fonts.gstatic.com/s/inter/v12/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuLyfAZ9hiA.woff2" },
    { src: "https://fonts.gstatic.com/s/inter/v12/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuGKYAZ9hiA.woff2", fontWeight: 700 },
  ],
});

const styles = StyleSheet.create({
  page: {
    flexDirection: "column",
    backgroundColor: "#fff",
    padding: 30,
    fontFamily: "Inter",
  },
  header: {
    marginBottom: 20,
    paddingBottom: 10,
    borderBottom: "1px solid #e5e7eb",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 700,
    marginBottom: 4,
    color: "#000",
  },
  headerSubtitle: {
    fontSize: 12,
    color: "#000",
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
    borderRight: "1px solid #e5e7eb",
  },
  qrSectionTitle: {
    fontSize: 12,
    fontWeight: 700,
    marginBottom: 10,
    textAlign: "center",
    color: "#000",
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
    fontWeight: 700,
    marginBottom: 10,
    color: "#000",
  },
  detailsRow: {
    flexDirection: "row",
    marginBottom: 5,
  },
  detailsLabel: {
    width: "40%",
    fontSize: 10,
    fontWeight: 700,
    color: "#000",
  },
  detailsValue: {
    width: "60%",
    fontSize: 10,
    color: "#000",
  },
  footer: {
    position: "absolute",
    bottom: 30,
    left: 30,
    right: 30,
    borderTop: "1px solid #e5e7eb",
    paddingTop: 10,
    fontSize: 8,
    color: "#000",
    textAlign: "center",
  },
});

interface ProductionOrderQRData {
  id: string;
  productName: string;
  quantity: number;
  startDate: Date | string;
  dueDate: Date | string;
  status: string;
  sku: string;
  priority: string;
}

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

  const orderData: ProductionOrderQRData = {
    id: order.id,
    productName: order.product.name,
    quantity: order.quantity,
    startDate: order.startDate,
    dueDate: order.dueDate,
    status: order.status,
    sku: order.product.sku,
    priority: order.priority,
  };

  // Function to generate QR code as image
  const generateQRCodeAsImage = async (): Promise<string> => {
    const qrData = JSON.stringify({
      id: order.id,
      product: order.product.name,
      quantity: order.quantity,
      status: order.status,
    });

    const svgElement = document.createElement("div");
    svgElement.style.position = "absolute";
    svgElement.style.top = "-9999px";
    svgElement.style.left = "-9999px";
    document.body.appendChild(svgElement);

    // Use React 18+ createRoot if available, else fallback to render
    const ReactDOM = await import("react-dom/client").catch(() => null);
    const React = await import("react");
    if (ReactDOM && ReactDOM.createRoot) {
      const root = ReactDOM.createRoot(svgElement);
      root.render(React.createElement(QRCode, { value: qrData, size: 150 }));
      await new Promise((resolve) => setTimeout(resolve, 100));
    } else {
      // fallback to legacy react-dom for QR rendering
      const legacyReactDOM = await import("react-dom");
      legacyReactDOM.render(React.createElement(QRCode, { value: qrData, size: 150 }), svgElement);
      await new Promise((resolve) => setTimeout(resolve, 100));
    }

    const svg = svgElement.querySelector("svg");
    if (!svg) throw new Error("QR SVG not found");
    const xml = new XMLSerializer().serializeToString(svg);
    const img = new window.Image(150, 150);
    const canvas = document.createElement("canvas");
    canvas.width = 150;
    canvas.height = 150;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Could not get canvas context");
    return new Promise((resolve, reject) => {
      img.onload = () => {
        ctx.drawImage(img, 0, 0);
        resolve(canvas.toDataURL("image/png"));
        document.body.removeChild(svgElement);
      };
      img.onerror = reject;
      img.src = `data:image/svg+xml;base64,${window.btoa(unescape(encodeURIComponent(xml)))}`;
    });
  };

  const handleGeneratePDF = async (): Promise<void> => {
    try {
      setIsGenerating(true);
      const qrImage = await generateQRCodeAsImage();
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
                <Image src={qrImage} style={styles.qrImage} />
              </View>
              <View style={styles.detailsSection}>
                <Text style={styles.detailsTitle}>Production Order Details</Text>
                <View style={styles.detailsRow}>
                  <Text style={styles.detailsLabel}>Order ID:</Text>
                  <Text style={styles.detailsValue}>{orderData.id}</Text>
                </View>
                <View style={styles.detailsRow}>
                  <Text style={styles.detailsLabel}>Product:</Text>
                  <Text style={styles.detailsValue}>{orderData.productName}</Text>
                </View>
                <View style={styles.detailsRow}>
                  <Text style={styles.detailsLabel}>SKU:</Text>
                  <Text style={styles.detailsValue}>{orderData.sku}</Text>
                </View>
                <View style={styles.detailsRow}>
                  <Text style={styles.detailsLabel}>Quantity:</Text>
                  <Text style={styles.detailsValue}>{orderData.quantity}</Text>
                </View>
                <View style={styles.detailsRow}>
                  <Text style={styles.detailsLabel}>Start Date:</Text>
                  <Text style={styles.detailsValue}>{format(new Date(orderData.startDate), "MMM dd, yyyy")}</Text>
                </View>
                <View style={styles.detailsRow}>
                  <Text style={styles.detailsLabel}>Due Date:</Text>
                  <Text style={styles.detailsValue}>{format(new Date(orderData.dueDate), "MMM dd, yyyy")}</Text>
                </View>
                <View style={styles.detailsRow}>
                  <Text style={styles.detailsLabel}>Status:</Text>
                  <Text style={styles.detailsValue}>{orderData.status}</Text>
                </View>
                <View style={styles.detailsRow}>
                  <Text style={styles.detailsLabel}>Priority:</Text>
                  <Text style={styles.detailsValue}>{orderData.priority}</Text>
                </View>
              </View>
            </View>
            <View style={styles.footer}>
              <Text>
                XGen MRP System - This document was automatically generated.
              </Text>
            </View>
          </Page>
        </Document>
      );
      const pdfBlob = await pdf(<MyDocument />).toBlob();
      const pdfUrl = URL.createObjectURL(pdfBlob);
      const link = document.createElement("a");
      link.href = pdfUrl;
      link.download = `production-order-${orderData.id}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast({
        title: "PDF Generated Successfully",
        description: "Production order QR code PDF has been downloaded.",
      });
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error("Error generating PDF:", error);
      toast({
        title: "Error Generating PDF",
        description: "There was a problem generating the PDF. Please try again.",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div>
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
    </div>
  );
} 