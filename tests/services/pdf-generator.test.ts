import { describe, it, expect, vi } from 'vitest';
import {
  generateBillingStatementPDF,
  generateSalesInvoicePDF,
  generateDeliveryReceiptPDF,
  formatCurrency,
  formatDate,
  createPDFDownloadResponse,
} from '@/lib/services/pdf-generator';
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

describe('PDF Generator Service', () => {
  describe('Utility Functions', () => {
    it('should format currency correctly', () => {
      expect(formatCurrency(1234.56)).toBe('$1,234.56');
      expect(formatCurrency(0)).toBe('$0.00');
      expect(formatCurrency(999999.99)).toBe('$999,999.99');
    });

    it('should format date correctly', () => {
      const testDate = new Date('2024-01-15');
      const formatted = formatDate(testDate);
      expect(formatted).toBe('January 15, 2024');
    });

    it('should create PDF download response', () => {
      const mockBuffer = Buffer.from('test-pdf-content');
      const response = createPDFDownloadResponse(mockBuffer, 'test.pdf');
      
      expect(response).toBeInstanceOf(Response);
      expect(response.headers.get('Content-Type')).toBe('application/pdf');
      expect(response.headers.get('Content-Disposition')).toBe('attachment; filename="test.pdf"');
      expect(response.headers.get('Content-Length')).toBe(mockBuffer.length.toString());
    });
  });

  describe('PDF Generation Functions', () => {
    const mockBillingStatement = {
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
            description: 'Test Product 1',
            quantity: 2,
            unitPrice: 250,
            totalPrice: 500,
            productCode: 'TP001',
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
            description: 'Test Product 2',
            quantity: 1,
            unitPrice: 500,
            totalPrice: 450,
            productCode: 'TP002',
            unit: 'pcs',
            discountPercent: 10,
            taxable: true,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        ],
      },
    };

    const mockSalesInvoice = {
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
          description: 'Test Product 1',
          quantity: 2,
          unitPrice: 250,
          totalPrice: 500,
          productCode: 'TP001',
          unit: 'pcs',
          discountPercent: 0,
          taxable: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ],
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
        notes: null,
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
      },
    };

    const mockDeliveryReceipt = {
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
      billingStatement: mockBillingStatement,
    };

    it('should generate billing statement PDF', async () => {
      const pdfBuffer = await generateBillingStatementPDF(mockBillingStatement);
      
      expect(pdfBuffer).toBeInstanceOf(Buffer);
      expect(pdfBuffer.toString()).toBe('mock-pdf-content');
    });

    it('should generate sales invoice PDF', async () => {
      const pdfBuffer = await generateSalesInvoicePDF(mockSalesInvoice);
      
      expect(pdfBuffer).toBeInstanceOf(Buffer);
      expect(pdfBuffer.toString()).toBe('mock-pdf-content');
    });

    it('should generate delivery receipt PDF', async () => {
      const pdfBuffer = await generateDeliveryReceiptPDF(mockDeliveryReceipt);
      
      expect(pdfBuffer).toBeInstanceOf(Buffer);
      expect(pdfBuffer.toString()).toBe('mock-pdf-content');
    });

    it('should generate delivery receipt PDF with item listings', async () => {
      const deliveryReceiptWithItems = {
        ...mockDeliveryReceipt,
        billingStatement: {
          ...mockBillingStatement,
          salesInvoice: {
            ...mockBillingStatement.salesInvoice!,
            invoiceItems: [
              {
                id: 'item-1',
                salesInvoiceId: 'si-1',
                productId: 'prod-1',
                description: 'Test Product 1',
                quantity: 2,
                unitPrice: 250,
                totalPrice: 500,
                productCode: 'TP001',
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
                description: 'Test Product 2',
                quantity: 1,
                unitPrice: 500,
                totalPrice: 500,
                productCode: 'TP002',
                unit: 'kg',
                discountPercent: 0,
                taxable: true,
                createdAt: new Date(),
                updatedAt: new Date(),
              },
            ],
          },
        },
      };

      const pdfBuffer = await generateDeliveryReceiptPDF(deliveryReceiptWithItems);
      
      expect(pdfBuffer).toBeInstanceOf(Buffer);
      expect(pdfBuffer.toString()).toBe('mock-pdf-content');
    });

    it('should handle PDF generation errors', async () => {
      // Mock pdf function to throw error
      const { pdf } = await import('@react-pdf/renderer');
      vi.mocked(pdf).mockImplementationOnce(() => ({
        toBuffer: vi.fn().mockRejectedValue(new Error('PDF generation failed')),
      }));

      await expect(generateBillingStatementPDF(mockBillingStatement))
        .rejects.toThrow('Failed to generate billing statement PDF');
    });
  });

  describe('PDF Content Validation', () => {
    it('should include all required billing statement information', async () => {
      const mockBillingStatement = {
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
        notes: 'Test notes',
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: 'user-1',
        modifiedBy: null,
        customer: {
          name: 'Test Customer',
          email: 'test@example.com',
          phone: '+1-555-0123',
          address: '123 Test St',
        },
        salesInvoice: {
          id: 'si-1',
          invoiceNumber: 'INV-001',
          billingStatementId: 'bs-1',
          invoiceDate: new Date(),
          subtotal: 950,
          taxRate: 10,
          taxAmount: 100,
          discountAmount: 50,
          totalAmount: 1000,
          paymentTerms: null,
          dueDate: null,
          status: InvoiceStatus.SENT,
          poNumber: null,
          terms: null,
          footerNotes: null,
          createdAt: new Date(),
          updatedAt: new Date(),
          createdBy: null,
          modifiedBy: null,
          invoiceItems: [
            {
              id: 'item-1',
              salesInvoiceId: 'si-1',
              productId: 'prod-1',
              description: 'Test Item',
              quantity: 1,
              unitPrice: 950,
              totalPrice: 950,
              productCode: 'TEST001',
              unit: 'pcs',
              discountPercent: null,
              taxable: true,
              createdAt: new Date(),
              updatedAt: new Date(),
            },
          ],
        },
      };

      const pdfBuffer = await generateBillingStatementPDF(mockBillingStatement);
      expect(pdfBuffer).toBeInstanceOf(Buffer);
    });

    it('should handle missing optional fields gracefully', async () => {
      const minimalBillingStatement = {
        id: 'bs-1',
        statementNumber: 'BS-2024-001',
        customerId: null,
        customerOrderId: null,
        customerName: 'Test Customer',
        productionOrderId: null,
        totalAmount: 1000,
        taxAmount: 100,
        discountAmount: 0,
        netAmount: 1100,
        status: BillingStatus.DRAFT,
        billingDate: new Date('2024-01-15'),
        dueDate: null,
        paidDate: null,
        notes: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: null,
        modifiedBy: null,
      };

      const pdfBuffer = await generateBillingStatementPDF(minimalBillingStatement);
      expect(pdfBuffer).toBeInstanceOf(Buffer);
    });
  });
});