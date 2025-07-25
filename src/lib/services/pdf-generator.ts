import { pdf, Document, Page, Text, View, StyleSheet, Font } from '@react-pdf/renderer';
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
    display: 'table',
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

// PDF Generation Functions
export async function generateBillingStatementPDF(
  billingStatement: BillingStatement & {
    customer?: { name: string; email?: string; phone?: string; address?: string };
    salesInvoice?: SalesInvoice & { invoiceItems: SalesInvoiceItem[] };
  }
): Promise<Buffer> {
  try {
    const MyDocument = () => (
      Document({},
        Page({ size: 'A4', style: styles.page },
          // Header
          View({ style: styles.header },
            View({},
              Text({ style: styles.companyName }, COMPANY_INFO.name),
              Text({ style: styles.companyDetails }, 
                `${COMPANY_INFO.address}\n${COMPANY_INFO.city}\nPhone: ${COMPANY_INFO.phone}\nEmail: ${COMPANY_INFO.email}`
              )
            ),
            View({ style: styles.companyInfo },
              View({ style: styles.statusBadge },
                Text({}, billingStatement.status)
              )
            )
          ),
          
          // Document Title
          Text({ style: styles.documentTitle }, 'BILLING STATEMENT'),
          
          // Document Information
          View({ style: styles.documentInfo },
            View({ style: styles.infoSection },
              Text({ style: styles.infoTitle }, 'Statement Details'),
              Text({ style: styles.infoText }, `Statement #: ${billingStatement.statementNumber}`),
              Text({ style: styles.infoText }, `Date: ${formatDate(billingStatement.billingDate)}`),
              billingStatement.dueDate && Text({ style: styles.infoText }, `Due Date: ${formatDate(billingStatement.dueDate)}`)
            ),
            View({ style: styles.infoSection },
              Text({ style: styles.infoTitle }, 'Bill To'),
              Text({ style: styles.infoText }, billingStatement.customerName),
              billingStatement.customer?.email && Text({ style: styles.infoText }, billingStatement.customer.email),
              billingStatement.customer?.phone && Text({ style: styles.infoText }, billingStatement.customer.phone),
              billingStatement.customer?.address && Text({ style: styles.infoText }, billingStatement.customer.address)
            )
          ),
          
          // Totals Section
          View({ style: styles.totalsSection },
            View({ style: styles.totalRow },
              Text({ style: styles.totalLabel }, 'Subtotal:'),
              Text({ style: styles.totalValue }, 
                formatCurrency(billingStatement.totalAmount - billingStatement.taxAmount + billingStatement.discountAmount)
              )
            ),
            billingStatement.discountAmount > 0 && View({ style: styles.totalRow },
              Text({ style: styles.totalLabel }, 'Discount:'),
              Text({ style: styles.totalValue }, `-${formatCurrency(billingStatement.discountAmount)}`)
            ),
            View({ style: styles.totalRow },
              Text({ style: styles.totalLabel }, 'Tax:'),
              Text({ style: styles.totalValue }, formatCurrency(billingStatement.taxAmount))
            ),
            View({ style: styles.grandTotalRow },
              Text({ style: styles.grandTotalLabel }, 'Total Amount:'),
              Text({ style: styles.grandTotalValue }, formatCurrency(billingStatement.totalAmount))
            )
          ),
          
          // Notes
          billingStatement.notes && View({ style: styles.notes },
            Text({ style: styles.notesTitle }, 'Notes'),
            Text({ style: styles.notesText }, billingStatement.notes)
          ),
          
          // Footer
          Text({ style: styles.footer }, 
            `Thank you for your business! • ${COMPANY_INFO.website} • Generated on ${formatDate(new Date())}`
          )
        )
      )
    );

    const pdfBuffer = await pdf(MyDocument()).toBuffer();
    return pdfBuffer;
  } catch (error) {
    console.error('Error generating billing statement PDF:', error);
    throw new Error('Failed to generate billing statement PDF');
  }
}

export async function generateSalesInvoicePDF(
  salesInvoice: SalesInvoice & {
    invoiceItems: SalesInvoiceItem[];
    billingStatement?: BillingStatement & {
      customer?: { name: string; email?: string; phone?: string; address?: string };
    };
  }
): Promise<Buffer> {
  try {
    const MyDocument = () => (
      Document({},
        Page({ size: 'A4', style: styles.page },
          // Header
          View({ style: styles.header },
            View({},
              Text({ style: styles.companyName }, COMPANY_INFO.name),
              Text({ style: styles.companyDetails }, 
                `${COMPANY_INFO.address}\n${COMPANY_INFO.city}\nPhone: ${COMPANY_INFO.phone}\nEmail: ${COMPANY_INFO.email}`
              )
            ),
            View({ style: styles.companyInfo },
              View({ style: styles.statusBadge },
                Text({}, salesInvoice.status)
              )
            )
          ),
          
          // Document Title
          Text({ style: styles.documentTitle }, 'SALES INVOICE'),
          
          // Document Information
          View({ style: styles.documentInfo },
            View({ style: styles.infoSection },
              Text({ style: styles.infoTitle }, 'Invoice Details'),
              Text({ style: styles.infoText }, `Invoice #: ${salesInvoice.invoiceNumber}`),
              Text({ style: styles.infoText }, `Date: ${formatDate(salesInvoice.invoiceDate)}`),
              salesInvoice.dueDate && Text({ style: styles.infoText }, `Due Date: ${formatDate(salesInvoice.dueDate)}`),
              salesInvoice.poNumber && Text({ style: styles.infoText }, `PO #: ${salesInvoice.poNumber}`)
            ),
            View({ style: styles.infoSection },
              Text({ style: styles.infoTitle }, 'Bill To'),
              Text({ style: styles.infoText }, salesInvoice.billingStatement?.customerName || 'Customer'),
              salesInvoice.billingStatement?.customer?.email && Text({ style: styles.infoText }, salesInvoice.billingStatement.customer.email),
              salesInvoice.billingStatement?.customer?.phone && Text({ style: styles.infoText }, salesInvoice.billingStatement.customer.phone),
              salesInvoice.billingStatement?.customer?.address && Text({ style: styles.infoText }, salesInvoice.billingStatement.customer.address)
            )
          ),
          
          // Totals Section
          View({ style: styles.totalsSection },
            View({ style: styles.totalRow },
              Text({ style: styles.totalLabel }, 'Subtotal:'),
              Text({ style: styles.totalValue }, formatCurrency(salesInvoice.subtotal))
            ),
            salesInvoice.discountAmount > 0 && View({ style: styles.totalRow },
              Text({ style: styles.totalLabel }, 'Discount:'),
              Text({ style: styles.totalValue }, `-${formatCurrency(salesInvoice.discountAmount)}`)
            ),
            View({ style: styles.totalRow },
              Text({ style: styles.totalLabel }, `Tax (${salesInvoice.taxRate}%):`),
              Text({ style: styles.totalValue }, formatCurrency(salesInvoice.taxAmount))
            ),
            View({ style: styles.grandTotalRow },
              Text({ style: styles.grandTotalLabel }, 'Total Amount:'),
              Text({ style: styles.grandTotalValue }, formatCurrency(salesInvoice.totalAmount))
            )
          ),
          
          // Payment Terms
          salesInvoice.paymentTerms && View({ style: styles.notes },
            Text({ style: styles.notesTitle }, 'Payment Terms'),
            Text({ style: styles.notesText }, salesInvoice.paymentTerms)
          ),
          
          // Footer
          Text({ style: styles.footer }, 
            `Thank you for your business! • ${COMPANY_INFO.website} • Generated on ${formatDate(new Date())}`
          )
        )
      )
    );

    const pdfBuffer = await pdf(MyDocument()).toBuffer();
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
      salesInvoice?: SalesInvoice & { invoiceItems: SalesInvoiceItem[] };
    };
  }
): Promise<Buffer> {
  try {
    const MyDocument = () => (
      Document({},
        Page({ size: 'A4', style: styles.page },
          // Header
          View({ style: styles.header },
            View({},
              Text({ style: styles.companyName }, COMPANY_INFO.name),
              Text({ style: styles.companyDetails }, 
                `${COMPANY_INFO.address}\n${COMPANY_INFO.city}\nPhone: ${COMPANY_INFO.phone}\nEmail: ${COMPANY_INFO.email}`
              )
            ),
            View({ style: styles.companyInfo },
              View({ style: styles.statusBadge },
                Text({}, deliveryReceipt.deliveryStatus)
              )
            )
          ),
          
          // Document Title
          Text({ style: styles.documentTitle }, 'DELIVERY RECEIPT'),
          
          // Document Information
          View({ style: styles.documentInfo },
            View({ style: styles.infoSection },
              Text({ style: styles.infoTitle }, 'Delivery Details'),
              Text({ style: styles.infoText }, `Receipt #: ${deliveryReceipt.receiptNumber}`),
              Text({ style: styles.infoText }, `Delivery Date: ${formatDate(deliveryReceipt.deliveryDate)}`),
              deliveryReceipt.trackingNumber && Text({ style: styles.infoText }, `Tracking #: ${deliveryReceipt.trackingNumber}`),
              deliveryReceipt.courierService && Text({ style: styles.infoText }, `Courier: ${deliveryReceipt.courierService}`),
              deliveryReceipt.billingStatement?.statementNumber && Text({ style: styles.infoText }, `Statement #: ${deliveryReceipt.billingStatement.statementNumber}`)
            ),
            View({ style: styles.infoSection },
              Text({ style: styles.infoTitle }, 'Delivered To'),
              Text({ style: styles.infoText }, deliveryReceipt.billingStatement?.customerName || 'Customer'),
              Text({ style: styles.infoText }, `Received by: ${deliveryReceipt.receivedBy}`),
              deliveryReceipt.receivedByTitle && Text({ style: styles.infoText }, `Title: ${deliveryReceipt.receivedByTitle}`),
              Text({ style: styles.infoText }, `Address: ${deliveryReceipt.deliveryAddress}`),
              deliveryReceipt.billingStatement?.customer?.email && Text({ style: styles.infoText }, deliveryReceipt.billingStatement.customer.email),
              deliveryReceipt.billingStatement?.customer?.phone && Text({ style: styles.infoText }, deliveryReceipt.billingStatement.customer.phone)
            )
          ),
          
          // Items Table - Show delivered items from the related sales invoice
          deliveryReceipt.billingStatement?.salesInvoice?.invoiceItems && deliveryReceipt.billingStatement.salesInvoice.invoiceItems.length > 0 && View({ style: styles.table },
            // Table Header
            View({ style: [styles.tableRow, styles.tableHeader] },
              View({ style: styles.tableCol },
                Text({ style: styles.tableCellHeader }, 'Item Code')
              ),
              View({ style: styles.tableColDescription },
                Text({ style: styles.tableCellHeader }, 'Description')
              ),
              View({ style: styles.tableCol },
                Text({ style: styles.tableCellHeader }, 'Quantity')
              ),
              View({ style: styles.tableCol },
                Text({ style: styles.tableCellHeader }, 'Unit')
              ),
              View({ style: styles.tableCol },
                Text({ style: styles.tableCellHeader }, 'Status')
              )
            ),
            // Table Rows
            ...deliveryReceipt.billingStatement.salesInvoice.invoiceItems.map((item) =>
              View({ style: styles.tableRow },
                View({ style: styles.tableCol },
                  Text({ style: styles.tableCell }, item.productCode || 'N/A')
                ),
                View({ style: styles.tableColDescription },
                  Text({ style: styles.tableCell }, item.description)
                ),
                View({ style: styles.tableCol },
                  Text({ style: styles.tableCell }, item.quantity.toString())
                ),
                View({ style: styles.tableCol },
                  Text({ style: styles.tableCell }, item.unit || 'pcs')
                ),
                View({ style: styles.tableCol },
                  Text({ style: styles.tableCell }, 'Delivered')
                )
              )
            )
          ),
          
          // Delivery Notes
          deliveryReceipt.deliveryNotes && View({ style: styles.notes },
            Text({ style: styles.notesTitle }, 'Delivery Notes'),
            Text({ style: styles.notesText }, deliveryReceipt.deliveryNotes)
          ),
          
          // Legal Information and Terms
          View({ style: styles.notes },
            Text({ style: styles.notesTitle }, 'Delivery Terms & Conditions'),
            Text({ style: styles.notesText }, 
              'This delivery receipt confirms that the items listed above have been delivered to the specified address. ' +
              'By signing below, the recipient acknowledges receipt of the items in good condition and accepts responsibility for the delivered goods. ' +
              'Any damages or discrepancies must be reported within 24 hours of delivery.'
            )
          ),
          
          // Signature Section
          View({ style: [styles.notes, { marginTop: 20 }] },
            Text({ style: styles.notesTitle }, 'Acknowledgment of Receipt'),
            Text({ style: styles.notesText }, 'I acknowledge receipt of the above items in good condition and confirm delivery completion.'),
            View({ style: { marginTop: 30, flexDirection: 'row', justifyContent: 'space-between' } },
              View({ style: { width: '45%' } },
                Text({ style: styles.infoText }, 'Recipient Signature: _________________________'),
                Text({ style: [styles.infoText, { marginTop: 10 }] }, `Name: ${deliveryReceipt.receivedBy}`),
                deliveryReceipt.receivedByTitle && Text({ style: styles.infoText }, `Title: ${deliveryReceipt.receivedByTitle}`)
              ),
              View({ style: { width: '45%' } },
                Text({ style: styles.infoText }, `Date: ${formatDate(deliveryReceipt.deliveryDate)}`),
                Text({ style: [styles.infoText, { marginTop: 10 }] }, `Time: ${new Date(deliveryReceipt.deliveryDate).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}`)
              )
            )
          ),
          
          // Footer
          Text({ style: styles.footer }, 
            `Delivery completed by ${COMPANY_INFO.name} • ${COMPANY_INFO.website}\n` +
            `Generated on ${formatDate(new Date())} • This document serves as proof of delivery\n` +
            `For inquiries, contact: ${COMPANY_INFO.phone} or ${COMPANY_INFO.email}`
          )
        )
      )
    );

    const pdfBuffer = await pdf(MyDocument()).toBuffer();
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