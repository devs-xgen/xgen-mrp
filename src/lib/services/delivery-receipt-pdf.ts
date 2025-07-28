import jsPDF from "jspdf";
import { DeliveryReceipt, BillingStatement } from "@/types/admin/billing";

// Company branding configuration
const COMPANY_INFO = {
  name: "XGen Manufacturing",
  address: "123 Industrial Avenue",
  city: "Manufacturing City, MC 12345",
  phone: "+1 (555) 123-4567",
  email: "billing@xgenmanufacturing.com",
  website: "www.xgenmanufacturing.com",
};

// Format currency
const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(amount);
};

// Format date - handles both Date objects and date strings
const formatDate = (date: Date | string): string => {
  if (!date) return "N/A";
  
  const dateObj = date instanceof Date ? date : new Date(date);
  
  // Check if the date is valid
  if (isNaN(dateObj.getTime())) {
    return "Invalid Date";
  }
  
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(dateObj);
};

// Generate delivery receipt PDF using jsPDF (client-side)
export function generateDeliveryReceiptPDFClient(
  deliveryReceipt: DeliveryReceipt & {
    billingStatement?: BillingStatement & {
      customer?: {
        name: string;
        email?: string;
        phone?: string;
        address?: string;
      };
      customerOrder?: { orderNumber: string; totalAmount: number };
    };
  }
): Uint8Array {
  const doc = new jsPDF();
  let yPosition = 20;

  // Set font
  doc.setFont("helvetica");

  // Header
  doc.setFontSize(20);
  doc.setTextColor(31, 41, 55); // gray-800
  doc.text(COMPANY_INFO.name, 20, yPosition);

  // Company details
  yPosition += 10;
  doc.setFontSize(10);
  doc.setTextColor(107, 114, 128); // gray-500
  doc.text(COMPANY_INFO.address, 20, yPosition);
  yPosition += 5;
  doc.text(COMPANY_INFO.city, 20, yPosition);
  yPosition += 5;
  doc.text(`Phone: ${COMPANY_INFO.phone}`, 20, yPosition);
  yPosition += 5;
  doc.text(`Email: ${COMPANY_INFO.email}`, 20, yPosition);

  // Status badge (right side)
  const statusColors: { [key: string]: [number, number, number] } = {
    DELIVERED: [16, 185, 129], // green-500
    FAILED: [239, 68, 68], // red-500
    PENDING: [245, 158, 11], // amber-500
    IN_TRANSIT: [59, 130, 246], // blue-500
    CANCELLED: [156, 163, 175], // gray-400
  };

  const statusColor =
    statusColors[deliveryReceipt.deliveryStatus] || statusColors.PENDING;
  doc.setFillColor(statusColor[0], statusColor[1], statusColor[2]);
  doc.rect(150, 15, 40, 8, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(8);
  doc.text(deliveryReceipt.deliveryStatus, 170, 20, { align: "center" });

  // Title
  yPosition = 50;
  doc.setFontSize(24);
  doc.setTextColor(31, 41, 55);
  doc.text("DELIVERY RECEIPT", 105, yPosition, { align: "center" });

  // Receipt details section
  yPosition += 20;
  doc.setFontSize(12);
  doc.setTextColor(55, 65, 81);
  doc.text("Receipt Details", 20, yPosition);

  yPosition += 8;
  doc.setFontSize(10);
  doc.setTextColor(107, 114, 128);
  doc.text(`Receipt #: ${deliveryReceipt.receiptNumber}`, 20, yPosition);
  yPosition += 5;
  doc.text(
    `Delivery Date: ${formatDate(deliveryReceipt.deliveryDate)}`,
    20,
    yPosition
  );
  yPosition += 5;
  doc.text(`Status: ${deliveryReceipt.deliveryStatus}`, 20, yPosition);

  if (deliveryReceipt.billingStatement?.customerOrder?.orderNumber) {
    yPosition += 5;
    doc.text(
      `Order #: ${deliveryReceipt.billingStatement.customerOrder.orderNumber}`,
      20,
      yPosition
    );
  }

  // Customer information section (right side)
  let rightYPosition = yPosition - 18;
  doc.setFontSize(12);
  doc.setTextColor(55, 65, 81);
  doc.text("Customer Information", 110, rightYPosition);

  rightYPosition += 8;
  doc.setFontSize(10);
  doc.setTextColor(107, 114, 128);
  const customerName =
    deliveryReceipt.billingStatement?.customer?.name || "Customer";
  doc.text(`Customer: ${customerName}`, 110, rightYPosition);

  if (deliveryReceipt.billingStatement?.customer?.email) {
    rightYPosition += 5;
    doc.text(
      `Email: ${deliveryReceipt.billingStatement.customer.email}`,
      110,
      rightYPosition
    );
  }

  if (deliveryReceipt.billingStatement?.customer?.phone) {
    rightYPosition += 5;
    doc.text(
      `Phone: ${deliveryReceipt.billingStatement.customer.phone}`,
      110,
      rightYPosition
    );
  }

  // Delivery details table
  yPosition = Math.max(yPosition + 15, rightYPosition + 15);

  // Table header
  doc.setFillColor(243, 244, 246); // gray-100
  doc.rect(20, yPosition, 170, 8, "F");
  doc.setFontSize(10);
  doc.setTextColor(55, 65, 81);
  doc.text("Field", 25, yPosition + 5);
  doc.text("Details", 70, yPosition + 5);

  yPosition += 12;

  // Table rows
  const tableData = [
    [
      "Delivery Address",
      deliveryReceipt.deliveryAddress ||
        deliveryReceipt.billingStatement?.customer?.address ||
        "Not specified",
    ],
    ...(deliveryReceipt.courierService
      ? [["Courier Service", deliveryReceipt.courierService]]
      : []),
    ...(deliveryReceipt.trackingNumber
      ? [["Tracking Number", deliveryReceipt.trackingNumber]]
      : []),
    [
      "Proof of Delivery",
      `${deliveryReceipt.signatureImage ? "Signature Captured" : "No Signature"} | ${deliveryReceipt.photoEvidence ? "Photo Evidence Available" : "No Photo Evidence"}`,
    ],
    ...(deliveryReceipt.billingStatement?.customerOrder?.totalAmount
      ? [
          [
            "Order Value",
            formatCurrency(
              deliveryReceipt.billingStatement.customerOrder.totalAmount
            ),
          ],
        ]
      : []),
  ];

  doc.setFontSize(9);
  doc.setTextColor(107, 114, 128);

  tableData.forEach(([field, value]) => {
    doc.setFont("helvetica", "bold");
    doc.text(field, 25, yPosition);
    doc.setFont("helvetica", "normal");

    // Handle long text wrapping
    const lines = doc.splitTextToSize(value, 100);
    doc.text(lines, 70, yPosition);
    yPosition += lines.length * 5;
  });

  // Notes section
  if (deliveryReceipt.deliveryNotes) {
    yPosition += 10;
    doc.setFontSize(12);
    doc.setTextColor(55, 65, 81);
    doc.text("Delivery Notes", 20, yPosition);

    yPosition += 8;
    doc.setFontSize(10);
    doc.setTextColor(107, 114, 128);
    const notesLines = doc.splitTextToSize(deliveryReceipt.deliveryNotes, 170);
    doc.text(notesLines, 20, yPosition);
    yPosition += notesLines.length * 5;
  }

  // Recipient information
  if (deliveryReceipt.receivedBy || deliveryReceipt.receivedByTitle) {
    yPosition += 10;
    doc.setFontSize(12);
    doc.setTextColor(55, 65, 81);
    doc.text("Recipient Information", 20, yPosition);

    yPosition += 8;
    doc.setFontSize(10);
    doc.setTextColor(107, 114, 128);

    if (deliveryReceipt.receivedBy) {
      doc.text(`Received By: ${deliveryReceipt.receivedBy}`, 20, yPosition);
      yPosition += 5;
    }

    if (deliveryReceipt.receivedByTitle) {
      doc.text(`Title: ${deliveryReceipt.receivedByTitle}`, 20, yPosition);
      yPosition += 5;
    }
  }

  // Footer
  yPosition = Math.max(yPosition + 20, 270);
  doc.setFontSize(8);
  doc.setTextColor(156, 163, 175);
  doc.text(
    `Delivery Receipt • ${COMPANY_INFO.website} • Generated on ${formatDate(new Date())}`,
    105,
    yPosition,
    { align: "center" }
  );

  return new Uint8Array(doc.output("arraybuffer"));
}
