import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { prismaMock } from '../setup/prisma-mock';
import { getServerSession } from 'next-auth';
import { generateSalesInvoicePDF } from '@/lib/services/pdf-generator';
import { Decimal } from '@prisma/client/runtime/library';

// Mock dependencies
vi.mock('next-auth', () => ({
  getServerSession: vi.fn(),
}));

vi.mock('@/lib/services/pdf-generator', () => ({
  generateSalesInvoicePDF: vi.fn(),
}));

vi.mock('@/lib/auth', () => ({
  authOptions: {},
}));

vi.mock('@/lib/db', () => ({
  prisma: prismaMock,
}));

// Import server actions after mocking
import { exportSalesInvoicePDF } from '@/lib/actions/sales-invoices';

describe('Sales Invoice PDF Export Integration', () => {
  const mockSalesInvoice = {
    id: 'invoice-1',
    invoiceNumber: 'INV-2024-001',
    billingStatementId: 'bs-1',
    invoiceDate: new Date('2024-01-15'),
    subtotal: new Decimal(1000),
    taxRate: new Decimal(10),
    taxAmount: new Decimal(100),
    discountAmount: new Decimal(50),
    totalAmount: new Decimal(1050),
    paymentTerms: 'Net 30',
    dueDate: new Date('2024-02-15'),
    status: 'SENT' as const,
    poNumber: 'PO-123',
    terms: 'Standard terms',
    footerNotes: 'Thank you',
    createdAt: new Date(),
    updatedAt: new Date(),
    createdBy: 'user-1',
    modifiedBy: null,
    invoiceItems: [
      {
        id: 'item-1',
        salesInvoiceId: 'invoice-1',
        productId: 'prod-1',
        materialId: null,
        inventoryItemId: null,
        description: 'Test Product',
        quantity: new Decimal(2),
        unitPrice: new Decimal(500),
        totalPrice: new Decimal(1000),
        productCode: 'TP001',
        unit: 'pcs',
        discountPercent: null,
        taxable: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        product: {
          id: 'prod-1',
          name: 'Test Product',
          sku: 'TP001',
        },
        Material: null,
        InventoryItem: null,
      },
    ],
    billingStatement: {
      id: 'bs-1',
      statementNumber: 'BS-2024-001',
      customerName: 'Test Customer',
      billingDate: new Date('2024-01-15'),
      status: 'SENT' as const,
      customer: {
        id: 'cust-1',
        name: 'Test Customer',
        email: 'test@example.com',
        phone: '+1-555-0123',
        address: '123 Test St',
        city: 'Test City',
        state: 'TC',
        country: 'Test Country',
      },
      customerOrder: {
        id: 'order-1',
        orderNumber: 'ORD-001',
        orderDate: new Date('2024-01-10'),
        shippingAddress: '123 Test St',
      },
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Complete PDF Export Flow', () => {
    it('should complete full PDF export flow from server action to file generation', async () => {
      // Mock authentication
      vi.mocked(getServerSession).mockResolvedValue({
        user: { id: 'user-1', role: 'ADMIN' },
      } as any);

      // Mock database query
      prismaMock.salesInvoice.findUnique.mockResolvedValue(mockSalesInvoice);

      // Mock PDF generation
      const mockPdfBuffer = Buffer.from('mock-pdf-content');
      vi.mocked(generateSalesInvoicePDF).mockResolvedValue(mockPdfBuffer);

      // Execute the server action
      const result = await exportSalesInvoicePDF('invoice-1');

      // Verify successful response
      expect(result.success).toBe(true);
      expect(result.pdfBuffer).toEqual(mockPdfBuffer);
      expect(result.filename).toMatch(/sales-invoice-INV-2024-001-\d{4}-\d{2}-\d{2}\.pdf/);
      expect(result.error).toBeUndefined();

      // Verify database query was called with correct parameters
      expect(prismaMock.salesInvoice.findUnique).toHaveBeenCalledWith({
        where: { id: 'invoice-1' },
        include: expect.objectContaining({
          invoiceItems: expect.any(Object),
          billingStatement: expect.any(Object),
        }),
      });

      // Verify PDF generation was called with converted decimal values
      expect(generateSalesInvoicePDF).toHaveBeenCalledWith(
        expect.objectContaining({
          subtotal: 1000,
          taxRate: 10,
          taxAmount: 100,
          discountAmount: 50,
          totalAmount: 1050,
          invoiceItems: expect.arrayContaining([
            expect.objectContaining({
              quantity: 2,
              unitPrice: 500,
              totalPrice: 1000,
            }),
          ]),
        })
      );
    });

    it('should handle PDF export with minimal invoice data', async () => {
      const minimalInvoice = {
        ...mockSalesInvoice,
        invoiceItems: [],
        dueDate: null,
        poNumber: null,
        terms: null,
        footerNotes: null,
        billingStatement: {
          ...mockSalesInvoice.billingStatement,
          customer: null,
          customerOrder: null,
        },
      };

      vi.mocked(getServerSession).mockResolvedValue({
        user: { id: 'user-1', role: 'ADMIN' },
      } as any);

      prismaMock.salesInvoice.findUnique.mockResolvedValue(minimalInvoice);
      vi.mocked(generateSalesInvoicePDF).mockResolvedValue(Buffer.from('minimal-pdf'));

      const result = await exportSalesInvoicePDF('invoice-minimal');

      expect(result.success).toBe(true);
      expect(result.pdfBuffer).toEqual(Buffer.from('minimal-pdf'));
      
      expect(generateSalesInvoicePDF).toHaveBeenCalledWith(
        expect.objectContaining({
          invoiceItems: [],
          subtotal: 1000,
          totalAmount: 1050,
        })
      );
    });

    it('should generate correct filename with invoice number and timestamp', async () => {
      vi.mocked(getServerSession).mockResolvedValue({
        user: { id: 'user-1', role: 'ADMIN' },
      } as any);

      prismaMock.salesInvoice.findUnique.mockResolvedValue(mockSalesInvoice);
      vi.mocked(generateSalesInvoicePDF).mockResolvedValue(Buffer.from('pdf'));

      const result = await exportSalesInvoicePDF('invoice-1');

      expect(result.success).toBe(true);
      expect(result.filename).toMatch(/sales-invoice-INV-2024-001-\d{4}-\d{2}-\d{2}\.pdf/);
    });

    it('should handle decimal precision correctly in PDF generation', async () => {
      const invoiceWithDecimals = {
        ...mockSalesInvoice,
        subtotal: new Decimal('1234.56'),
        taxRate: new Decimal('12.5'),
        taxAmount: new Decimal('154.32'),
        discountAmount: new Decimal('100.00'),
        totalAmount: new Decimal('1288.88'),
        invoiceItems: [
          {
            ...mockSalesInvoice.invoiceItems[0],
            quantity: new Decimal('3.5'),
            unitPrice: new Decimal('352.73'),
            totalPrice: new Decimal('1234.56'),
            discountPercent: new Decimal('5.25'),
          },
        ],
      };

      vi.mocked(getServerSession).mockResolvedValue({
        user: { id: 'user-1', role: 'ADMIN' },
      } as any);

      prismaMock.salesInvoice.findUnique.mockResolvedValue(invoiceWithDecimals);
      vi.mocked(generateSalesInvoicePDF).mockResolvedValue(Buffer.from('pdf'));

      const result = await exportSalesInvoicePDF('invoice-1');

      expect(result.success).toBe(true);
      expect(generateSalesInvoicePDF).toHaveBeenCalledWith(
        expect.objectContaining({
          subtotal: 1234.56,
          taxRate: 12.5,
          taxAmount: 154.32,
          discountAmount: 100.00,
          totalAmount: 1288.88,
          invoiceItems: expect.arrayContaining([
            expect.objectContaining({
              quantity: 3.5,
              unitPrice: 352.73,
              totalPrice: 1234.56,
              discountPercent: 5.25,
            }),
          ]),
        })
      );
    });
  });

  describe('Error Scenarios and User Feedback', () => {
    it('should handle authentication errors gracefully', async () => {
      // Mock unauthenticated user
      vi.mocked(getServerSession).mockResolvedValue(null);

      const result = await exportSalesInvoicePDF('invoice-1');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Unauthorized');
      expect(result.pdfBuffer).toBeUndefined();
      expect(prismaMock.salesInvoice.findUnique).not.toHaveBeenCalled();
    });

    it('should handle authorization errors for non-admin users', async () => {
      // Mock non-admin user
      vi.mocked(getServerSession).mockResolvedValue({
        user: { id: 'user-1', role: 'WORKER' },
      } as any);

      const result = await exportSalesInvoicePDF('invoice-1');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Insufficient permissions');
      expect(result.pdfBuffer).toBeUndefined();
      expect(prismaMock.salesInvoice.findUnique).not.toHaveBeenCalled();
    });

    it('should handle invoice not found errors', async () => {
      vi.mocked(getServerSession).mockResolvedValue({
        user: { id: 'user-1', role: 'ADMIN' },
      } as any);

      // Mock invoice not found
      prismaMock.salesInvoice.findUnique.mockResolvedValue(null);

      const result = await exportSalesInvoicePDF('non-existent-id');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Sales invoice not found');
      expect(result.pdfBuffer).toBeUndefined();
    });

    it('should handle PDF generation service errors', async () => {
      vi.mocked(getServerSession).mockResolvedValue({
        user: { id: 'user-1', role: 'ADMIN' },
      } as any);

      prismaMock.salesInvoice.findUnique.mockResolvedValue(mockSalesInvoice);
      
      // Mock PDF generation failure
      vi.mocked(generateSalesInvoicePDF).mockRejectedValue(new Error('PDF service unavailable'));

      const result = await exportSalesInvoicePDF('invoice-1');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Failed to generate PDF. Please try again.');
      expect(result.pdfBuffer).toBeUndefined();
    });

    it('should handle database connection errors', async () => {
      vi.mocked(getServerSession).mockResolvedValue({
        user: { id: 'user-1', role: 'ADMIN' },
      } as any);

      // Mock database error
      prismaMock.salesInvoice.findUnique.mockRejectedValue(new Error('Database connection failed'));

      const result = await exportSalesInvoicePDF('invoice-1');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Failed to generate PDF. Please try again.');
      expect(result.pdfBuffer).toBeUndefined();
    });

    it('should handle session with missing user properties', async () => {
      vi.mocked(getServerSession).mockResolvedValue({
        user: { id: 'user-1' }, // Missing role property
      } as any);

      const result = await exportSalesInvoicePDF('invoice-1');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Insufficient permissions');
    });
  });

  describe('Performance and Edge Cases', () => {
    it('should handle large PDF files efficiently', async () => {
      vi.mocked(getServerSession).mockResolvedValue({
        user: { id: 'user-1', role: 'ADMIN' },
      } as any);

      // Create invoice with many items
      const largeInvoice = {
        ...mockSalesInvoice,
        invoiceItems: Array.from({ length: 100 }, (_, i) => ({
          ...mockSalesInvoice.invoiceItems[0],
          id: `item-${i}`,
          description: `Product ${i}`,
        })),
      };

      prismaMock.salesInvoice.findUnique.mockResolvedValue(largeInvoice);
      
      // Mock large PDF buffer (1MB)
      const largePdfBuffer = Buffer.alloc(1024 * 1024, 'pdf-data');
      vi.mocked(generateSalesInvoicePDF).mockResolvedValue(largePdfBuffer);

      const startTime = Date.now();
      const result = await exportSalesInvoicePDF('invoice-1');
      const endTime = Date.now();

      expect(result.success).toBe(true);
      expect(result.pdfBuffer).toEqual(largePdfBuffer);
      
      // Should complete within reasonable time (5 seconds)
      expect(endTime - startTime).toBeLessThan(5000);
    });

    it('should handle concurrent PDF generation requests', async () => {
      vi.mocked(getServerSession).mockResolvedValue({
        user: { id: 'user-1', role: 'ADMIN' },
      } as any);

      // Mock different invoices
      prismaMock.salesInvoice.findUnique
        .mockResolvedValueOnce({ ...mockSalesInvoice, id: 'invoice-1' })
        .mockResolvedValueOnce({ ...mockSalesInvoice, id: 'invoice-2' })
        .mockResolvedValueOnce({ ...mockSalesInvoice, id: 'invoice-3' });

      vi.mocked(generateSalesInvoicePDF)
        .mockResolvedValueOnce(Buffer.from('pdf-1'))
        .mockResolvedValueOnce(Buffer.from('pdf-2'))
        .mockResolvedValueOnce(Buffer.from('pdf-3'));

      // Execute concurrent requests
      const promises = [
        exportSalesInvoicePDF('invoice-1'),
        exportSalesInvoicePDF('invoice-2'),
        exportSalesInvoicePDF('invoice-3'),
      ];

      const results = await Promise.all(promises);

      // All should succeed
      results.forEach((result, index) => {
        expect(result.success).toBe(true);
        expect(result.pdfBuffer).toEqual(Buffer.from(`pdf-${index + 1}`));
      });

      expect(prismaMock.salesInvoice.findUnique).toHaveBeenCalledTimes(3);
      expect(generateSalesInvoicePDF).toHaveBeenCalledTimes(3);
    });

    it('should handle PDF generation with complex invoice structures', async () => {
      vi.mocked(getServerSession).mockResolvedValue({
        user: { id: 'user-1', role: 'ADMIN' },
      } as any);

      const complexInvoice = {
        ...mockSalesInvoice,
        invoiceItems: [
          {
            ...mockSalesInvoice.invoiceItems[0],
            productId: 'prod-1',
            materialId: null,
            inventoryItemId: null,
            product: { id: 'prod-1', name: 'Product 1', sku: 'P001' },
            Material: null,
            InventoryItem: null,
          },
          {
            ...mockSalesInvoice.invoiceItems[0],
            id: 'item-2',
            productId: null,
            materialId: 'mat-1',
            inventoryItemId: null,
            description: 'Material Item',
            product: null,
            Material: { id: 'mat-1', name: 'Material 1', sku: 'M001' },
            InventoryItem: null,
          },
          {
            ...mockSalesInvoice.invoiceItems[0],
            id: 'item-3',
            productId: null,
            materialId: null,
            inventoryItemId: 'inv-1',
            description: 'Inventory Item',
            product: null,
            Material: null,
            InventoryItem: { id: 'inv-1', name: 'Inventory 1', sku: 'I001' },
          },
        ],
      };

      prismaMock.salesInvoice.findUnique.mockResolvedValue(complexInvoice);
      vi.mocked(generateSalesInvoicePDF).mockResolvedValue(Buffer.from('complex-pdf'));

      const result = await exportSalesInvoicePDF('invoice-1');

      expect(result.success).toBe(true);
      expect(generateSalesInvoicePDF).toHaveBeenCalledWith(
        expect.objectContaining({
          invoiceItems: expect.arrayContaining([
            expect.objectContaining({
              product: { id: 'prod-1', name: 'Product 1', sku: 'P001' },
              Material: null,
              InventoryItem: null,
            }),
            expect.objectContaining({
              product: null,
              Material: { id: 'mat-1', name: 'Material 1', sku: 'M001' },
              InventoryItem: null,
            }),
            expect.objectContaining({
              product: null,
              Material: null,
              InventoryItem: { id: 'inv-1', name: 'Inventory 1', sku: 'I001' },
            }),
          ]),
        })
      );
    });
  });

  describe('Data Integrity and Validation', () => {
    it('should ensure data consistency in PDF generation', async () => {
      vi.mocked(getServerSession).mockResolvedValue({
        user: { id: 'user-1', role: 'ADMIN' },
      } as any);

      prismaMock.salesInvoice.findUnique.mockResolvedValue(mockSalesInvoice);
      vi.mocked(generateSalesInvoicePDF).mockResolvedValue(Buffer.from('pdf'));

      const result = await exportSalesInvoicePDF('invoice-1');

      expect(result.success).toBe(true);

      // Verify that the data passed to PDF generation matches the database data
      const pdfData = vi.mocked(generateSalesInvoicePDF).mock.calls[0][0];
      
      expect(pdfData.invoiceNumber).toBe('INV-2024-001');
      expect(pdfData.subtotal).toBe(1000);
      expect(pdfData.taxRate).toBe(10);
      expect(pdfData.taxAmount).toBe(100);
      expect(pdfData.discountAmount).toBe(50);
      expect(pdfData.totalAmount).toBe(1050);
      expect(pdfData.billingStatement.customerName).toBe('Test Customer');
      expect(pdfData.invoiceItems).toHaveLength(1);
      expect(pdfData.invoiceItems[0].description).toBe('Test Product');
    });

    it('should handle null and undefined values in invoice data gracefully', async () => {
      vi.mocked(getServerSession).mockResolvedValue({
        user: { id: 'user-1', role: 'ADMIN' },
      } as any);

      const invoiceWithNulls = {
        ...mockSalesInvoice,
        dueDate: null,
        poNumber: null,
        terms: null,
        footerNotes: null,
        billingStatement: {
          ...mockSalesInvoice.billingStatement,
          customer: null,
          customerOrder: null,
        },
      };

      prismaMock.salesInvoice.findUnique.mockResolvedValue(invoiceWithNulls);
      vi.mocked(generateSalesInvoicePDF).mockResolvedValue(Buffer.from('pdf'));

      const result = await exportSalesInvoicePDF('invoice-1');

      expect(result.success).toBe(true);

      // Verify that null values are handled properly
      const pdfData = vi.mocked(generateSalesInvoicePDF).mock.calls[0][0];
      expect(pdfData.dueDate).toBeNull();
      expect(pdfData.poNumber).toBeNull();
      expect(pdfData.terms).toBeNull();
      expect(pdfData.footerNotes).toBeNull();
      expect(pdfData.billingStatement.customer).toBeNull();
      expect(pdfData.billingStatement.customerOrder).toBeNull();
    });

    it('should validate invoice data structure before PDF generation', async () => {
      vi.mocked(getServerSession).mockResolvedValue({
        user: { id: 'user-1', role: 'ADMIN' },
      } as any);

      prismaMock.salesInvoice.findUnique.mockResolvedValue(mockSalesInvoice);
      vi.mocked(generateSalesInvoicePDF).mockResolvedValue(Buffer.from('pdf'));

      const result = await exportSalesInvoicePDF('invoice-1');

      expect(result.success).toBe(true);

      // Verify that the data structure passed to PDF generation is complete
      const pdfData = vi.mocked(generateSalesInvoicePDF).mock.calls[0][0];
      
      // Required fields should be present
      expect(pdfData).toHaveProperty('id');
      expect(pdfData).toHaveProperty('invoiceNumber');
      expect(pdfData).toHaveProperty('invoiceDate');
      expect(pdfData).toHaveProperty('subtotal');
      expect(pdfData).toHaveProperty('taxRate');
      expect(pdfData).toHaveProperty('taxAmount');
      expect(pdfData).toHaveProperty('discountAmount');
      expect(pdfData).toHaveProperty('totalAmount');
      expect(pdfData).toHaveProperty('billingStatement');
      expect(pdfData).toHaveProperty('invoiceItems');
      
      // Billing statement should have required structure
      expect(pdfData.billingStatement).toHaveProperty('id');
      expect(pdfData.billingStatement).toHaveProperty('statementNumber');
      expect(pdfData.billingStatement).toHaveProperty('customerName');
      
      // Invoice items should have required structure
      expect(Array.isArray(pdfData.invoiceItems)).toBe(true);
      if (pdfData.invoiceItems.length > 0) {
        const item = pdfData.invoiceItems[0];
        expect(item).toHaveProperty('id');
        expect(item).toHaveProperty('description');
        expect(item).toHaveProperty('quantity');
        expect(item).toHaveProperty('unitPrice');
        expect(item).toHaveProperty('totalPrice');
      }
    });
  });
});