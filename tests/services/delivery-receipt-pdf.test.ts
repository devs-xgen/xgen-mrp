import { describe, it, expect, vi } from 'vitest';
import { generateDeliveryReceiptPDF } from '@/lib/services/pdf-generator';
import { BillingStatus, InvoiceStatus, DeliveryStatus } from '@/types/admin/billing';

// Mock @react-pdf/renderer
vi.mock('@react-pdf/renderer', () => ({
  Document: ({ children }: any) => children,
  Page: ({ children }: any) => children,
  Text: ({ children }: any) => children,
  View: ({ children }: any) => children,
  StyleSheet: {
    create: (styles: any) => styles,
  },
  Font: {
    register: vi.fn(),
  },
  Image: ({ children }: any) => children,
  pdf: vi.fn(() => ({
    toBuffer: vi.fn().mockResolvedValue(Buffer.from('mock-pdf-content')),
  })),
}));

describe('Delivery Receipt PDF Generation', () => {
  const mockDeliveryReceiptWithItems = {
    id: 'dr-1',
    receiptNumber: 'DR-2024-001',
    billingStatementId: 'bs-1',
    deliveryDate: new Date('2024-01-20'),
    deliveryAddress: '123 Test St, Test City, TC 12345',
    receivedBy: 'John Doe',
    receivedByTitle: 'Warehouse Manager',
    signatureImage: null,
    photoEvidence: null,
    trackingNumber: 'TRK123456',
    courierService: 'Express Delivery',
    deliveryStatus: DeliveryStatus.DELIVERED,
    deliveryNotes: 'Delivered in good condition',
    createdAt: new Date(),
    updatedAt: new Date(),
    createdBy: 'user-1',
    modifiedBy: null,
    billingStatement: {
      id: 'bs-1',
      statementNumber: 'BS-2024-001',
      customerId: 'cust-1',
      customerOrderId: null,
      customerName: 'Test Customer',
      productionOrderId: null,
      totalAmount: 1000,
      taxAmount: 100,
      discountAmount: 50,
      netAmount: 1050,
      status: BillingStatus.SENT,
      billingDate: new Date('2024-01-15'),
      dueDate: new Date('2024-02-15'),
      paidDate: null,
      notes: 'Test billing statement',
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: 'user-1',
      modifiedBy: null,
      customer: {
        name: 'Test Customer',
        email: 'test@example.com',
        phone: '+1-555-0123',
        address: '123 Test St, Test City, TC 12345',
      },
      salesInvoice: {
        id: 'si-1',
        invoiceNumber: 'INV-2024-001',
        billingStatementId: 'bs-1',
        invoiceDate: new Date('2024-01-15'),
        subtotal: 950,
        taxRate: 10,
        taxAmount: 100,
        discountAmount: 50,
        totalAmount: 1000,
        paymentTerms: 'Net 30',
        dueDate: new Date('2024-02-15'),
        status: InvoiceStatus.SENT,
        poNumber: 'PO-123',
        terms: 'Standard terms and conditions',
        footerNotes: 'Thank you for your business',
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: 'user-1',
        modifiedBy: null,
        invoiceItems: [
          {
            id: 'item-1',
            salesInvoiceId: 'si-1',
            productId: 'prod-1',
            description: 'Manufacturing Component A',
            quantity: 5,
            unitPrice: 100,
            totalPrice: 500,
            productCode: 'MCA-001',
            unit: 'pcs',
            discountPercent: 0,
            taxable: true,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
          {
            id: 'item-2',
            salesInvoiceId: 'si-1',
            productId: 'prod-2',
            description: 'Assembly Kit B',
            quantity: 2,
            unitPrice: 225,
            totalPrice: 450,
            productCode: 'AKB-002',
            unit: 'kits',
            discountPercent: 0,
            taxable: true,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        ],
      },
    },
  };

  it('should generate delivery receipt PDF with complete information', async () => {
    const pdfBuffer = await generateDeliveryReceiptPDF(mockDeliveryReceiptWithItems);
    
    expect(pdfBuffer).toBeInstanceOf(Buffer);
    expect(pdfBuffer.toString()).toBe('mock-pdf-content');
  });

  it('should handle delivery receipt without items gracefully', async () => {
    const deliveryReceiptWithoutItems = {
      ...mockDeliveryReceiptWithItems,
      billingStatement: {
        ...mockDeliveryReceiptWithItems.billingStatement!,
        salesInvoice: {
          ...mockDeliveryReceiptWithItems.billingStatement!.salesInvoice!,
          invoiceItems: [],
        },
      },
    };

    const pdfBuffer = await generateDeliveryReceiptPDF(deliveryReceiptWithoutItems);
    
    expect(pdfBuffer).toBeInstanceOf(Buffer);
    expect(pdfBuffer.toString()).toBe('mock-pdf-content');
  });

  it('should handle delivery receipt without sales invoice', async () => {
    const deliveryReceiptWithoutInvoice = {
      ...mockDeliveryReceiptWithItems,
      billingStatement: {
        ...mockDeliveryReceiptWithItems.billingStatement!,
        salesInvoice: undefined,
      },
    };

    const pdfBuffer = await generateDeliveryReceiptPDF(deliveryReceiptWithoutInvoice);
    
    expect(pdfBuffer).toBeInstanceOf(Buffer);
    expect(pdfBuffer.toString()).toBe('mock-pdf-content');
  });

  it('should handle minimal delivery receipt data', async () => {
    const minimalDeliveryReceipt = {
      id: 'dr-minimal',
      receiptNumber: 'DR-MIN-001',
      billingStatementId: 'bs-minimal',
      deliveryDate: new Date(),
      deliveryAddress: 'Minimal Address',
      receivedBy: 'Minimal Receiver',
      receivedByTitle: null,
      signatureImage: null,
      photoEvidence: null,
      trackingNumber: null,
      courierService: null,
      deliveryStatus: DeliveryStatus.DELIVERED,
      deliveryNotes: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: null,
      modifiedBy: null,
    };

    const pdfBuffer = await generateDeliveryReceiptPDF(minimalDeliveryReceipt);
    
    expect(pdfBuffer).toBeInstanceOf(Buffer);
    expect(pdfBuffer.toString()).toBe('mock-pdf-content');
  });

  it('should handle PDF generation errors', async () => {
    // Mock pdf function to throw error
    const { pdf } = await import('@react-pdf/renderer');
    vi.mocked(pdf).mockImplementationOnce(() => ({
      toBuffer: vi.fn().mockRejectedValue(new Error('PDF generation failed')),
    }));

    await expect(generateDeliveryReceiptPDF(mockDeliveryReceiptWithItems))
      .rejects.toThrow('Failed to generate delivery receipt PDF');
  });
});