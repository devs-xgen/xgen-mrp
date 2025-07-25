import React from 'react';
import { pdf, Document, Page, Text, View, StyleSheet, renderToBuffer } from '@react-pdf/renderer';
import { BillingStatement, SalesInvoice, DeliveryReceipt, SalesInvoiceItem } from '@/types/admin/billing';

// Company branding configuration
export const COMPANY_INFO = {
  name: 'XGen Manufacturing',
  address: '123 Industrial Avenue',
  city: 'Manufacturing City, MC 12345',
  phone: '+1 (555) 123-4567',
  email: 'billing@xgenmanufacturing.com',
  website: 'www.xgenmanufacturing.com',
  logo: '/xgenLogo.png',
};

// PDF Styles
const styles = StyleSheet.create({
  page: {
    flexDirection: 'column',
    backgroundColor: '#FFFFFF',
    padding: 30,
    fontFamily: 'Helvetica',
    fontSize: 10,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 30,
    paddingBottom: 20,
    borderBottomWidth: 2,
    borderBottomColor: '#2563eb',
  },
  companyName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 5,
  },
  companyDetails: {
    fontSize: 9,
    color: '#6b7280',
    lineHeight: 1.4,
  },
  documentTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 20,
    textAlign: 'center',
  },
  documentInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 30,
  },
  infoSection: {
    flex: 1,
    marginRight: 20,
  },
  infoTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#374151',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 10,
    color: '#6b7280',
    lineHeight: 1.4,
    marginBottom: 3,
  },
  table: {
    width: 'auto',
    borderStyle: 'solid',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    marginBottom: 20,
  },
  tableRow: {
    margin: 'auto',
    flexDirection: 'row',
  },
  tableHeader: {
    backgroundColor: '#f3f4f6',
    borderBottomWidth: 1,
    borderBottomColor: '#d1d5db',
  },
  tableCol: {
    width: '20%',
    borderStyle: 'solid',
    borderWidth: 0,
    borderRightWidth: 1,
    borderRightColor: '#e5e7eb',
    padding: 8,
  },
  tableColDescription: {
    width: '40%',
    borderStyle: 'solid',
    borderWidth: 0,
    borderRightWidth: 1,
    borderRightColor: '#e5e7eb',
    padding: 8,
  },
  tableColQty: {
    width: '15%',
    borderStyle: 'solid',
    borderWidth: 0,
    borderRightWidth: 1,
    borderRightColor: '#e5e7eb',
    padding: 8,
  },
  tableColPrice: {
    width: '20%',
    borderStyle: 'solid',
    borderWidth: 0,
    borderRightWidth: 1,
    borderRightColor: '#e5e7eb',
    padding: 8,
  },
  tableColTotal: {
    width: '25%',
    borderStyle: 'solid',
    borderWidth: 0,
    padding: 8,
  },
  tableCellHeader: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#374151',
  },
  tableCell: {
    fontSize: 9,
    color: '#6b7280',
    lineHeight: 1.3,
  },
  tableCellRight: {
    fontSize: 9,
    color: '#6b7280',
    lineHeight: 1.3,
    textAlign: 'right',
  },
  tableCellCenter: {
    fontSize: 9,
    color: '#6b7280',
    lineHeight: 1.3,
    textAlign: 'center',
  },
  totalsSection: {
    alignItems: 'flex-end',
    marginTop: 20,
    marginBottom: 30,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: 200,
    marginBottom: 5,
    paddingHorizontal: 10,
  },
  totalLabel: {
    fontSize: 10,
    color: '#6b7280',
  },
  totalValue: {
    fontSize: 10,
    fontWeight: 'normal',
    color: '#374151',
  },
  grandTotalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: 200,
    marginTop: 10,
    paddingTop: 10,
    paddingHorizontal: 10,
    borderTopWidth: 2,
    borderTopColor: '#2563eb',
  },
  grandTotalLabel: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  grandTotalValue: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#2563eb',
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 30,
    right: 30,
    textAlign: 'center',
    color: '#9ca3af',
    fontSize: 8,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    paddingTop: 10,
  },
  notes: {
    marginTop: 20,
    padding: 15,
    backgroundColor: '#f9fafb',
    borderRadius: 5,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  notesTitle: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#374151',
    marginBottom: 8,
  },
  notesText: {
    fontSize: 9,
    color: '#6b7280',
    lineHeight: 1.4,
  },
  statusBadge: {
    backgroundColor: '#dbeafe',
    color: '#1e40af',
    padding: 4,
    borderRadius: 4,
    fontSize: 8,
    fontWeight: 'normal',
  },
});

// Utility functions
export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount);
};

export const formatDate = (date: Date): string => {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(new Date(date));
};

// Sales Invoice PDF Document Component
const SalesInvoicePDFDocument: React.FC<{
  salesInvoice: SalesInvoice & {
    invoiceItems: SalesInvoiceItem[];
    billingStatement?: BillingStatement & {
      customer?: { name: string; email?: string; phone?: string; address?: string };
    };
  };
}> = ({ salesInvoice }) => (
  <Document>
    <Page size="A4" style={styles.page}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.companyName}>{COMPANY_INFO.name}</Text>
          <Text style={styles.companyDetails}>
            {`${COMPANY_INFO.address}\n${COMPANY_INFO.city}\nPhone: ${COMPANY_INFO.phone}\nEmail: ${COMPANY_INFO.email}`}
          </Text>
        </View>
        <View>
          <View style={styles.statusBadge}>
            <Text>{salesInvoice.status}</Text>
          </View>
        </View>
      </View>

      {/* Document Title */}
      <Text style={styles.documentTitle}>SALES INVOICE</Text>

      {/* Document Information */}
      <View style={styles.documentInfo}>
        <View style={styles.infoSection}>
          <Text style={styles.infoTitle}>Invoice Details</Text>
          <Text style={styles.infoText}>Invoice #: {salesInvoice.invoiceNumber}</Text>
          <Text style={styles.infoText}>Date: {formatDate(salesInvoice.invoiceDate)}</Text>
          {salesInvoice.dueDate ? (
            <Text style={styles.infoText}>Due Date: {formatDate(salesInvoice.dueDate)}</Text>
          ) : null}
          {salesInvoice.poNumber ? (
            <Text style={styles.infoText}>PO #: {salesInvoice.poNumber}</Text>
          ) : null}
        </View>
        <View style={styles.infoSection}>
          <Text style={styles.infoTitle}>Bill To</Text>
          <Text style={styles.infoText}>
            {salesInvoice.billingStatement?.customerName || 'Customer'}
          </Text>
          {salesInvoice.billingStatement?.customer?.email ? (
            <Text style={styles.infoText}>{salesInvoice.billingStatement.customer.email}</Text>
          ) : null}
          {salesInvoice.billingStatement?.customer?.phone ? (
            <Text style={styles.infoText}>{salesInvoice.billingStatement.customer.phone}</Text>
          ) : null}
          {salesInvoice.billingStatement?.customer?.address ? (
            <Text style={styles.infoText}>{salesInvoice.billingStatement.customer.address}</Text>
          ) : null}
        </View>
      </View>

      {/* Invoice Items Table */}
      {salesInvoice.invoiceItems && salesInvoice.invoiceItems.length > 0 ? (
        <View style={styles.table}>
          {/* Table Header */}
          <View style={[styles.tableRow, styles.tableHeader]}>
            <View style={styles.tableColDescription}>
              <Text style={styles.tableCellHeader}>Description</Text>
            </View>
            <View style={styles.tableColQty}>
              <Text style={styles.tableCellHeader}>Qty</Text>
            </View>
            <View style={styles.tableColPrice}>
              <Text style={styles.tableCellHeader}>Unit Price</Text>
            </View>
            <View style={styles.tableColTotal}>
              <Text style={styles.tableCellHeader}>Total</Text>
            </View>
          </View>
          
          {/* Table Rows */}
          {salesInvoice.invoiceItems.map((item, index) => (
            <View key={index} style={styles.tableRow}>
              <View style={styles.tableColDescription}>
                <Text style={styles.tableCell}>{item.description}</Text>
                {item.productCode ? (
                  <Text style={[styles.tableCell, { fontSize: 8, color: '#9ca3af' }]}>
                    Code: {item.productCode}
                  </Text>
                ) : null}
              </View>
              <View style={styles.tableColQty}>
                <Text style={styles.tableCellCenter}>{item.quantity}</Text>
              </View>
              <View style={styles.tableColPrice}>
                <Text style={styles.tableCellRight}>{formatCurrency(item.unitPrice)}</Text>
              </View>
              <View style={styles.tableColTotal}>
                <Text style={styles.tableCellRight}>{formatCurrency(item.totalPrice)}</Text>
              </View>
            </View>
          ))}
        </View>
      ) : null}

      {/* Totals Section */}
      <View style={styles.totalsSection}>
        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>Subtotal:</Text>
          <Text style={styles.totalValue}>{formatCurrency(salesInvoice.subtotal)}</Text>
        </View>
        {salesInvoice.discountAmount > 0 ? (
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Discount:</Text>
            <Text style={styles.totalValue}>-{formatCurrency(salesInvoice.discountAmount)}</Text>
          </View>
        ) : null}
        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>Tax ({salesInvoice.taxRate}%):</Text>
          <Text style={styles.totalValue}>{formatCurrency(salesInvoice.taxAmount)}</Text>
        </View>
        <View style={styles.grandTotalRow}>
          <Text style={styles.grandTotalLabel}>Total Amount:</Text>
          <Text style={styles.grandTotalValue}>{formatCurrency(salesInvoice.totalAmount)}</Text>
        </View>
      </View>

      {/* Payment Terms */}
      {salesInvoice.paymentTerms ? (
        <View style={styles.notes}>
          <Text style={styles.notesTitle}>Payment Terms</Text>
          <Text style={styles.notesText}>{salesInvoice.paymentTerms}</Text>
        </View>
      ) : null}

      {/* Terms & Conditions */}
      {salesInvoice.terms ? (
        <View style={styles.notes}>
          <Text style={styles.notesTitle}>Terms & Conditions</Text>
          <Text style={styles.notesText}>{salesInvoice.terms}</Text>
        </View>
      ) : null}

      {/* Footer Notes */}
      {salesInvoice.footerNotes ? (
        <View style={styles.notes}>
          <Text style={styles.notesTitle}>Notes</Text>
          <Text style={styles.notesText}>{salesInvoice.footerNotes}</Text>
        </View>
      ) : null}

      {/* Footer */}
      <Text style={styles.footer}>
        {`Thank you for your business! • ${COMPANY_INFO.website} • Generated on ${formatDate(new Date())}`}
      </Text>
    </Page>
  </Document>
);

// Delivery Receipt PDF Document Component
const DeliveryReceiptPDFDocument: React.FC<{
  deliveryReceipt: DeliveryReceipt & {
    billingStatement?: BillingStatement & {
      customer?: { name: string; email?: string; phone?: string; address?: string };
      customerOrder?: { orderNumber: string; totalAmount: number };
    };
    user?: { name: string; email?: string; phone?: string };
  };
}> = ({ deliveryReceipt }) => (
  <Document>
    <Page size="A4" style={styles.page}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.companyName}>{COMPANY_INFO.name}</Text>
          <Text style={styles.companyDetails}>
            {`${COMPANY_INFO.address}\n${COMPANY_INFO.city}\nPhone: ${COMPANY_INFO.phone}\nEmail: ${COMPANY_INFO.email}`}
          </Text>
        </View>
        <View>
          <View style={[styles.statusBadge, {
            backgroundColor: deliveryReceipt.deliveryStatus === 'DELIVERED' ? '#dcfce7' : 
                           deliveryReceipt.deliveryStatus === 'FAILED' ? '#fef2f2' : '#fef3c7',
            color: deliveryReceipt.deliveryStatus === 'DELIVERED' ? '#166534' : 
                   deliveryReceipt.deliveryStatus === 'FAILED' ? '#dc2626' : '#d97706'
          }]}>
            <Text>{deliveryReceipt.deliveryStatus}</Text>
          </View>
        </View>
      </View>

      {/* Document Title */}
      <Text style={styles.documentTitle}>DELIVERY RECEIPT</Text>

      {/* Document Information */}
      <View style={styles.documentInfo}>
        <View style={styles.infoSection}>
          <Text style={styles.infoTitle}>Receipt Details</Text>
          <Text style={styles.infoText}>Receipt #: {deliveryReceipt.receiptNumber}</Text>
          <Text style={styles.infoText}>Delivery Date: {formatDate(deliveryReceipt.deliveryDate)}</Text>
          <Text style={styles.infoText}>Status: {deliveryReceipt.deliveryStatus}</Text>
          {deliveryReceipt.billingStatement?.customerOrder?.orderNumber ? (
            <Text style={styles.infoText}>Order #: {deliveryReceipt.billingStatement.customerOrder.orderNumber}</Text>
          ) : null}
        </View>
        <View style={styles.infoSection}>
          <Text style={styles.infoTitle}>Customer Information</Text>
          <Text style={styles.infoText}>
            {deliveryReceipt.billingStatement?.customer?.name || 'Customer'}
          </Text>
          {deliveryReceipt.billingStatement?.customer?.email ? (
            <Text style={styles.infoText}>{deliveryReceipt.billingStatement.customer.email}</Text>
          ) : null}
          {deliveryReceipt.billingStatement?.customer?.phone ? (
            <Text style={styles.infoText}>{deliveryReceipt.billingStatement.customer.phone}</Text>
          ) : null}
        </View>
      </View>

      {/* Delivery Information */}
      <View style={styles.table}>
        <View style={[styles.tableRow, styles.tableHeader]}>
          <View style={[styles.tableCol, { width: '30%' }]}>
            <Text style={styles.tableCellHeader}>Field</Text>
          </View>
          <View style={[styles.tableCol, { width: '70%' }]}>
            <Text style={styles.tableCellHeader}>Details</Text>
          </View>
        </View>
        
        <View style={styles.tableRow}>
          <View style={[styles.tableCol, { width: '30%' }]}>
            <Text style={styles.tableCell}>Delivery Address</Text>
          </View>
          <View style={[styles.tableCol, { width: '70%' }]}>
            <Text style={styles.tableCell}>
              {deliveryReceipt.deliveryAddress || deliveryReceipt.billingStatement?.customer?.address || 'Not specified'}
            </Text>
          </View>
        </View>

        {deliveryReceipt.courierService ? (
          <View style={styles.tableRow}>
            <View style={[styles.tableCol, { width: '30%' }]}>
              <Text style={styles.tableCell}>Courier Service</Text>
            </View>
            <View style={[styles.tableCol, { width: '70%' }]}>
              <Text style={styles.tableCell}>{deliveryReceipt.courierService}</Text>
            </View>
          </View>
        ) : null}

        {deliveryReceipt.trackingNumber ? (
          <View style={styles.tableRow}>
            <View style={[styles.tableCol, { width: '30%' }]}>
              <Text style={styles.tableCell}>Tracking Number</Text>
            </View>
            <View style={[styles.tableCol, { width: '70%' }]}>
              <Text style={styles.tableCell}>{deliveryReceipt.trackingNumber}</Text>
            </View>
          </View>
        ) : null}

        <View style={styles.tableRow}>
          <View style={[styles.tableCol, { width: '30%' }]}>
            <Text style={styles.tableCell}>Proof of Delivery</Text>
          </View>
          <View style={[styles.tableCol, { width: '70%' }]}>
            <Text style={styles.tableCell}>
              {deliveryReceipt.signatureImage ? 'Signature Captured' : 'No Signature'} | {' '}
              {deliveryReceipt.photoEvidence ? 'Photo Evidence Available' : 'No Photo Evidence'}
            </Text>
          </View>
        </View>

        {deliveryReceipt.billingStatement?.customerOrder?.totalAmount ? (
          <View style={styles.tableRow}>
            <View style={[styles.tableCol, { width: '30%' }]}>
              <Text style={styles.tableCell}>Order Value</Text>
            </View>
            <View style={[styles.tableCol, { width: '70%' }]}>
              <Text style={styles.tableCell}>
                {formatCurrency(deliveryReceipt.billingStatement.customerOrder.totalAmount)}
              </Text>
            </View>
          </View>
        ) : null}
      </View>

      {/* Delivery Notes */}
      {deliveryReceipt.deliveryNotes ? (
        <View style={styles.notes}>
          <Text style={styles.notesTitle}>Delivery Notes</Text>
          <Text style={styles.notesText}>{deliveryReceipt.deliveryNotes}</Text>
        </View>
      ) : null}

      {/* Recipient Information */}
      {(deliveryReceipt.receivedBy || deliveryReceipt.receivedByTitle) ? (
        <View style={styles.notes}>
          <Text style={styles.notesTitle}>Recipient Information</Text>
          {deliveryReceipt.receivedBy ? (
            <Text style={styles.notesText}>Received By: {deliveryReceipt.receivedBy}</Text>
          ) : null}
          {deliveryReceipt.receivedByTitle ? (
            <Text style={styles.notesText}>Title: {deliveryReceipt.receivedByTitle}</Text>
          ) : null}
        </View>
      ) : null}

      {/* Footer */}
      <Text style={styles.footer}>
        {`Delivery Receipt • ${COMPANY_INFO.website} • Generated on ${formatDate(new Date())}`}
      </Text>
    </Page>
  </Document>
);

// PDF Generation Functions
export async function generateSalesInvoicePDF(
  salesInvoice: SalesInvoice & {
    invoiceItems: SalesInvoiceItem[];
    billingStatement?: BillingStatement & {
      customer?: { name: string; email?: string; phone?: string; address?: string };
    };
  }
): Promise<Buffer> {
  try {
    const pdfBuffer = await renderToBuffer(<SalesInvoicePDFDocument salesInvoice={salesInvoice} />);
    return pdfBuffer;
  } catch (error) {
    console.error('Error generating sales invoice PDF:', error);
    throw new Error('Failed to generate sales invoice PDF');
  }
}

export async function generateDeliveryReceiptPDF(
  deliveryReceipt: DeliveryReceipt & {
    billingStatement?: BillingStatement & {
      customer?: { name: string; email?: string; phone?: string; address?: string };
      customerOrder?: { orderNumber: string; totalAmount: number };
    };
    user?: { name: string; email?: string; phone?: string };
  }
): Promise<Buffer> {
  try {
    const pdfBuffer = await renderToBuffer(<DeliveryReceiptPDFDocument deliveryReceipt={deliveryReceipt} />);
    return pdfBuffer;
  } catch (error) {
    console.error('Error generating delivery receipt PDF:', error);
    throw new Error('Failed to generate delivery receipt PDF');
  }
}

// Utility function to create download response
export function createPDFDownloadResponse(
  pdfBuffer: Buffer,
  filename: string
): Response {
  return new Response(pdfBuffer, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Content-Length': pdfBuffer.length.toString(),
    },
  });
}