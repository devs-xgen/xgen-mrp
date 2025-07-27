import { describe, it, expect, vi, beforeEach } from 'vitest';
import { prismaMock } from '../setup/prisma-mock';
import { getServerSession } from 'next-auth';
import { generateSalesInvoicePDF } from '@/lib/services/pdf-generator';
import { Decimal } from '@prisma/client/runtime/library';

// Mock dependencies first, before importing the functions
vi.mock('next-auth', () => ({
  getServerSession: vi.fn(),
}));

vi.mock('@/lib/services/pdf-generator', () => ({
  generateSalesInvoicePDF: vi.fn(),
}));

vi.mock('@/lib/auth', () => ({
  authOptions: {},
}));

// Mock the database module to prevent browser environment error
vi.mock('@/lib/db', () => ({
  prisma: prismaMock,
}));

// Import the functions after mocking dependencies
import { exportSalesInvoicePDF, exportSalesInvoicesData } from '@/lib/actions/sales-invoices';

describe('Sales Invoice Export Actions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('exportSalesInvoicePDF', () => {
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

    it('should successfully export PDF for valid invoice', async () => {
      // Mock authentication
      vi.mocked(getServerSession).mockResolvedValue({
        user: { id: 'user-1', role: 'ADMIN' },
      } as any);

      // Mock database query
      prismaMock.salesInvoice.findUnique.mockResolvedValue(mockSalesInvoice);

      // Mock PDF generation
      const mockPdfBuffer = Buffer.from('mock-pdf-content');
      vi.mocked(generateSalesInvoicePDF).mockResolvedValue(mockPdfBuffer);

      const result = await exportSalesInvoicePDF('invoice-1');

      expect(result.success).toBe(true);
      expect(result.pdfBuffer).toEqual(mockPdfBuffer);
      expect(result.filename).toMatch(/sales-invoice-INV-2024-001-\d{4}-\d{2}-\d{2}\.pdf/);
      expect(result.error).toBeUndefined();

      // Verify database query
      expect(prismaMock.salesInvoice.findUnique).toHaveBeenCalledWith({
        where: { id: 'invoice-1' },
        include: expect.objectContaining({
          invoiceItems: expect.any(Object),
          billingStatement: expect.any(Object),
        }),
      });

      // Verify PDF generation with converted decimal values
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

    it('should return error for unauthenticated user', async () => {
      vi.mocked(getServerSession).mockResolvedValue(null);

      const result = await exportSalesInvoicePDF('invoice-1');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Authentication required. Please log in to continue.');
      expect(result.errorCode).toBe('UNAUTHORIZED');
      expect(result.pdfBuffer).toBeUndefined();
      expect(prismaMock.salesInvoice.findUnique).not.toHaveBeenCalled();
    });

    it('should return error for non-admin user', async () => {
      vi.mocked(getServerSession).mockResolvedValue({
        user: { id: 'user-1', role: 'WORKER' },
      } as any);

      const result = await exportSalesInvoicePDF('invoice-1');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Admin access required to export invoices.');
      expect(result.errorCode).toBe('INSUFFICIENT_PERMISSIONS');
      expect(result.pdfBuffer).toBeUndefined();
      expect(prismaMock.salesInvoice.findUnique).not.toHaveBeenCalled();
    });

    it('should return error for non-existent invoice', async () => {
      vi.mocked(getServerSession).mockResolvedValue({
        user: { id: 'user-1', role: 'ADMIN' },
      } as any);

      prismaMock.salesInvoice.findUnique.mockResolvedValue(null);

      const result = await exportSalesInvoicePDF('non-existent-id');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Invoice not found. It may have been deleted or you don\'t have access to it.');
      expect(result.errorCode).toBe('NOT_FOUND');
      expect(result.pdfBuffer).toBeUndefined();
    });

    it('should handle PDF generation errors with specific error codes', async () => {
      vi.mocked(getServerSession).mockResolvedValue({
        user: { id: 'user-1', role: 'ADMIN' },
      } as any);

      prismaMock.salesInvoice.findUnique.mockResolvedValue(mockSalesInvoice);
      vi.mocked(generateSalesInvoicePDF).mockRejectedValue(new Error('PDF generation failed'));

      const result = await exportSalesInvoicePDF('invoice-1');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Failed to generate PDF. Please try again or contact support if the problem persists.');
      expect(result.errorCode).toBe('UNKNOWN_ERROR');
      expect(result.pdfBuffer).toBeUndefined();
    });

    it('should handle database errors', async () => {
      vi.mocked(getServerSession).mockResolvedValue({
        user: { id: 'user-1', role: 'ADMIN' },
      } as any);

      prismaMock.salesInvoice.findUnique.mockRejectedValue(new Error('Database connection error'));

      const result = await exportSalesInvoicePDF('invoice-1');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Database connection error. Please try again in a moment.');
      expect(result.errorCode).toBe('DATABASE_ERROR');
      expect(result.pdfBuffer).toBeUndefined();
    });

    it('should handle timeout errors', async () => {
      vi.mocked(getServerSession).mockResolvedValue({
        user: { id: 'user-1', role: 'ADMIN' },
      } as any);

      prismaMock.salesInvoice.findUnique.mockResolvedValue(mockSalesInvoice);
      vi.mocked(generateSalesInvoicePDF).mockRejectedValue(new Error('Request timeout'));

      const result = await exportSalesInvoicePDF('invoice-1');

      expect(result.success).toBe(false);
      expect(result.error).toBe('PDF generation timed out. Please try again with a smaller invoice.');
      expect(result.errorCode).toBe('TIMEOUT');
      expect(result.pdfBuffer).toBeUndefined();
    });

    it('should handle memory errors', async () => {
      vi.mocked(getServerSession).mockResolvedValue({
        user: { id: 'user-1', role: 'ADMIN' },
      } as any);

      prismaMock.salesInvoice.findUnique.mockResolvedValue(mockSalesInvoice);
      vi.mocked(generateSalesInvoicePDF).mockRejectedValue(new Error('Out of memory'));

      const result = await exportSalesInvoicePDF('invoice-1');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Insufficient memory to generate PDF. Please try again later.');
      expect(result.errorCode).toBe('MEMORY_ERROR');
      expect(result.pdfBuffer).toBeUndefined();
    });

    it('should handle invalid input', async () => {
      vi.mocked(getServerSession).mockResolvedValue({
        user: { id: 'user-1', role: 'ADMIN' },
      } as any);

      const result = await exportSalesInvoicePDF('');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Invalid invoice ID provided.');
      expect(result.errorCode).toBe('INVALID_INPUT');
      expect(result.pdfBuffer).toBeUndefined();
      expect(prismaMock.salesInvoice.findUnique).not.toHaveBeenCalled();
    });

    it('should handle empty PDF buffer', async () => {
      vi.mocked(getServerSession).mockResolvedValue({
        user: { id: 'user-1', role: 'ADMIN' },
      } as any);

      prismaMock.salesInvoice.findUnique.mockResolvedValue(mockSalesInvoice);
      vi.mocked(generateSalesInvoicePDF).mockResolvedValue(Buffer.alloc(0)); // Empty buffer

      const result = await exportSalesInvoicePDF('invoice-1');

      expect(result.success).toBe(false);
      expect(result.error).toBe('PDF generation failed. The generated file is empty.');
      expect(result.errorCode).toBe('PDF_GENERATION_FAILED');
      expect(result.pdfBuffer).toBeUndefined();
    });

    it('should properly convert decimal fields for PDF generation', async () => {
      vi.mocked(getServerSession).mockResolvedValue({
        user: { id: 'user-1', role: 'ADMIN' },
      } as any);

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

      prismaMock.salesInvoice.findUnique.mockResolvedValue(invoiceWithDecimals);
      vi.mocked(generateSalesInvoicePDF).mockResolvedValue(Buffer.from('pdf'));

      await exportSalesInvoicePDF('invoice-1');

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

  // Mock data for CSV export tests
  const mockInvoices = [
      {
        id: 'invoice-1',
        invoiceNumber: 'INV-2024-001',
        invoiceDate: new Date('2024-01-15'),
        dueDate: new Date('2024-02-15'),
        status: 'SENT' as const,
        poNumber: 'PO-123',
        subtotal: new Decimal(1000),
        taxRate: new Decimal(10),
        taxAmount: new Decimal(100),
        discountAmount: new Decimal(50),
        totalAmount: new Decimal(1050),
        paymentTerms: 'Net 30',
        createdAt: new Date('2024-01-15T10:00:00Z'),
        updatedAt: new Date('2024-01-16T10:00:00Z'),
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
            code: 'CUST001',
          },
          customerOrder: {
            id: 'order-1',
            orderNumber: 'ORD-001',
            orderDate: new Date('2024-01-10'),
          },
        },
        createdByUser: {
          id: 'user-1',
          email: 'admin@example.com',
          profile: {
            firstName: 'John',
            lastName: 'Admin',
          },
        },
        modifiedByUser: {
          id: 'user-2',
          email: 'editor@example.com',
          profile: {
            firstName: 'Jane',
            lastName: 'Editor',
          },
        },
      },
      {
        id: 'invoice-2',
        invoiceNumber: 'INV-2024-002',
        invoiceDate: new Date('2024-01-20'),
        dueDate: null,
        status: 'DRAFT' as const,
        poNumber: null,
        subtotal: new Decimal(500),
        taxRate: new Decimal(12),
        taxAmount: new Decimal(60),
        discountAmount: new Decimal(0),
        totalAmount: new Decimal(560),
        paymentTerms: null,
        createdAt: new Date('2024-01-20T10:00:00Z'),
        updatedAt: new Date('2024-01-20T10:00:00Z'),
        billingStatement: {
          id: 'bs-2',
          statementNumber: 'BS-2024-002',
          customerName: 'Another Customer',
          billingDate: new Date('2024-01-20'),
          status: 'DRAFT' as const,
          customer: {
            id: 'cust-2',
            name: 'Another Customer',
            email: 'another@example.com',
            code: 'CUST002',
          },
          customerOrder: null,
        },
        createdByUser: {
          id: 'user-1',
          email: 'admin@example.com',
          profile: null,
        },
        modifiedByUser: null,
      },
    ];

  describe('exportSalesInvoicesData', () => {
    it('should successfully export CSV data without filters', async () => {
      vi.mocked(getServerSession).mockResolvedValue({
        user: { id: 'user-1', role: 'ADMIN' },
      } as any);

      prismaMock.salesInvoice.findMany.mockResolvedValue(mockInvoices);

      const result = await exportSalesInvoicesData();

      expect(result.csvContent).toContain('Invoice Number,Invoice Date,Due Date,Status');
      expect(result.csvContent).toContain('INV-2024-001');
      expect(result.csvContent).toContain('INV-2024-002');
      expect(result.filename).toMatch(/sales-invoices-export-\d{4}-\d{2}-\d{2}\.csv/);

      // Verify database query without filters
      expect(prismaMock.salesInvoice.findMany).toHaveBeenCalledWith({
        where: {},
        orderBy: { invoiceDate: 'desc' },
        include: expect.objectContaining({
          billingStatement: expect.any(Object),
          createdByUser: expect.any(Object),
          modifiedByUser: expect.any(Object),
        }),
      });
    });

    it('should apply status filters correctly', async () => {
      vi.mocked(getServerSession).mockResolvedValue({
        user: { id: 'user-1', role: 'ADMIN' },
      } as any);

      prismaMock.salesInvoice.findMany.mockResolvedValue([mockInvoices[0]]);

      const filters = {
        status: ['SENT'],
      };

      await exportSalesInvoicesData(filters);

      expect(prismaMock.salesInvoice.findMany).toHaveBeenCalledWith({
        where: {
          status: { in: ['SENT'] },
        },
        orderBy: { invoiceDate: 'desc' },
        include: expect.any(Object),
      });
    });

    it('should apply date range filters correctly', async () => {
      vi.mocked(getServerSession).mockResolvedValue({
        user: { id: 'user-1', role: 'ADMIN' },
      } as any);

      prismaMock.salesInvoice.findMany.mockResolvedValue(mockInvoices);

      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-01-31');
      const filters = {
        dateRange: { start: startDate, end: endDate },
      };

      await exportSalesInvoicesData(filters);

      expect(prismaMock.salesInvoice.findMany).toHaveBeenCalledWith({
        where: {
          invoiceDate: { gte: startDate, lte: endDate },
        },
        orderBy: { invoiceDate: 'desc' },
        include: expect.any(Object),
      });
    });

    it('should apply amount range filters correctly', async () => {
      vi.mocked(getServerSession).mockResolvedValue({
        user: { id: 'user-1', role: 'ADMIN' },
      } as any);

      prismaMock.salesInvoice.findMany.mockResolvedValue(mockInvoices);

      const filters = {
        amountRange: { min: 100, max: 2000 },
      };

      await exportSalesInvoicesData(filters);

      expect(prismaMock.salesInvoice.findMany).toHaveBeenCalledWith({
        where: {
          totalAmount: {
            gte: new Decimal(100),
            lte: new Decimal(2000),
          },
        },
        orderBy: { invoiceDate: 'desc' },
        include: expect.any(Object),
      });
    });

    it('should apply search filters correctly', async () => {
      vi.mocked(getServerSession).mockResolvedValue({
        user: { id: 'user-1', role: 'ADMIN' },
      } as any);

      prismaMock.salesInvoice.findMany.mockResolvedValue(mockInvoices);

      const filters = {
        search: 'test customer',
      };

      await exportSalesInvoicesData(filters);

      expect(prismaMock.salesInvoice.findMany).toHaveBeenCalledWith({
        where: {
          OR: [
            { invoiceNumber: { contains: 'test customer', mode: 'insensitive' } },
            { poNumber: { contains: 'test customer', mode: 'insensitive' } },
            { billingStatement: { customerName: { contains: 'test customer', mode: 'insensitive' } } },
            { billingStatement: { statementNumber: { contains: 'test customer', mode: 'insensitive' } } },
          ],
        },
        orderBy: { invoiceDate: 'desc' },
        include: expect.any(Object),
      });
    });

    it('should apply custom sorting correctly', async () => {
      vi.mocked(getServerSession).mockResolvedValue({
        user: { id: 'user-1', role: 'ADMIN' },
      } as any);

      prismaMock.salesInvoice.findMany.mockResolvedValue(mockInvoices);

      const filters = {
        sortBy: 'totalAmount',
        sortOrder: 'asc' as const,
      };

      await exportSalesInvoicesData(filters);

      expect(prismaMock.salesInvoice.findMany).toHaveBeenCalledWith({
        where: {},
        orderBy: { totalAmount: 'asc' },
        include: expect.any(Object),
      });
    });

    it('should combine multiple filters correctly', async () => {
      vi.mocked(getServerSession).mockResolvedValue({
        user: { id: 'user-1', role: 'ADMIN' },
      } as any);

      prismaMock.salesInvoice.findMany.mockResolvedValue(mockInvoices);

      const filters = {
        status: ['SENT', 'PAID'],
        dateRange: { start: new Date('2024-01-01'), end: new Date('2024-01-31') },
        search: 'INV-2024',
        sortBy: 'invoiceDate',
        sortOrder: 'asc' as const,
      };

      await exportSalesInvoicesData(filters);

      expect(prismaMock.salesInvoice.findMany).toHaveBeenCalledWith({
        where: {
          status: { in: ['SENT', 'PAID'] },
          invoiceDate: {
            gte: new Date('2024-01-01'),
            lte: new Date('2024-01-31'),
          },
          OR: [
            { invoiceNumber: { contains: 'INV-2024', mode: 'insensitive' } },
            { poNumber: { contains: 'INV-2024', mode: 'insensitive' } },
            { billingStatement: { customerName: { contains: 'INV-2024', mode: 'insensitive' } } },
            { billingStatement: { statementNumber: { contains: 'INV-2024', mode: 'insensitive' } } },
          ],
        },
        orderBy: { invoiceDate: 'asc' },
        include: expect.any(Object),
      });
    });

    it('should format CSV content correctly', async () => {
      vi.mocked(getServerSession).mockResolvedValue({
        user: { id: 'user-1', role: 'ADMIN' },
      } as any);

      prismaMock.salesInvoice.findMany.mockResolvedValue([mockInvoices[0]]);

      const result = await exportSalesInvoicesData();

      const lines = result.csvContent.split('\n');
      expect(lines[0]).toBe('Invoice Number,Invoice Date,Due Date,Status,Customer Name,Customer Email,Customer Code,Billing Statement Number,PO Number,Subtotal,Tax Rate,Tax Amount,Discount Amount,Total Amount,Payment Terms,Created By,Created Date,Modified By,Modified Date');
      
      // Check data row
      const dataRow = lines[1];
      expect(dataRow).toContain('"INV-2024-001"');
      expect(dataRow).toContain('"2024-01-15"');
      expect(dataRow).toContain('"2024-02-15"');
      expect(dataRow).toContain('"SENT"');
      expect(dataRow).toContain('"Test Customer"');
      expect(dataRow).toContain('"test@example.com"');
      expect(dataRow).toContain('"CUST001"');
      expect(dataRow).toContain('"BS-2024-001"');
      expect(dataRow).toContain('"PO-123"');
      expect(dataRow).toContain('"1000.00"');
      expect(dataRow).toContain('"10.00"');
      expect(dataRow).toContain('"100.00"');
      expect(dataRow).toContain('"50.00"');
      expect(dataRow).toContain('"1050.00"');
      expect(dataRow).toContain('"Net 30"');
      expect(dataRow).toContain('"John Admin"');
      expect(dataRow).toContain('"Jane Editor"');
    });

    it('should handle missing optional data gracefully', async () => {
      vi.mocked(getServerSession).mockResolvedValue({
        user: { id: 'user-1', role: 'ADMIN' },
      } as any);

      prismaMock.salesInvoice.findMany.mockResolvedValue([mockInvoices[1]]);

      const result = await exportSalesInvoicesData();

      const lines = result.csvContent.split('\n');
      const dataRow = lines[1];
      
      // Check that empty fields are handled correctly
      expect(dataRow).toContain('""'); // Empty due date
      expect(dataRow).toContain('"admin@example.com"'); // Falls back to email when no profile
    });

    it('should escape CSV special characters correctly', async () => {
      vi.mocked(getServerSession).mockResolvedValue({
        user: { id: 'user-1', role: 'ADMIN' },
      } as any);

      const invoiceWithSpecialChars = {
        ...mockInvoices[0],
        billingStatement: {
          ...mockInvoices[0].billingStatement,
          customerName: 'Customer, "Special" & Co.',
          customer: {
            ...mockInvoices[0].billingStatement.customer,
            name: 'Customer, "Special" & Co.',
          },
        },
      };

      prismaMock.salesInvoice.findMany.mockResolvedValue([invoiceWithSpecialChars]);

      const result = await exportSalesInvoicesData();

      expect(result.csvContent).toContain('"Customer, ""Special"" & Co."');
    });

    it('should throw error for unauthenticated user', async () => {
      vi.mocked(getServerSession).mockResolvedValue(null);

      await expect(exportSalesInvoicesData()).rejects.toThrow('Authentication required. Please log in to continue.');
      expect(prismaMock.salesInvoice.findMany).not.toHaveBeenCalled();
    });

    it('should throw error for non-admin user', async () => {
      vi.mocked(getServerSession).mockResolvedValue({
        user: { id: 'user-1', role: 'WORKER' },
      } as any);

      await expect(exportSalesInvoicesData()).rejects.toThrow('Admin access required to export invoices.');
      expect(prismaMock.salesInvoice.findMany).not.toHaveBeenCalled();
    });

    it('should handle database errors', async () => {
      vi.mocked(getServerSession).mockResolvedValue({
        user: { id: 'user-1', role: 'ADMIN' },
      } as any);

      prismaMock.salesInvoice.findMany.mockRejectedValue(new Error('Database connection error'));

      await expect(exportSalesInvoicesData()).rejects.toThrow('Database connection error. Please try again in a moment.');
    });

    it('should handle timeout errors', async () => {
      vi.mocked(getServerSession).mockResolvedValue({
        user: { id: 'user-1', role: 'ADMIN' },
      } as any);

      prismaMock.salesInvoice.findMany.mockRejectedValue(new Error('Query timeout'));

      await expect(exportSalesInvoicesData()).rejects.toThrow('Export timed out. Please try with fewer filters or contact support.');
    });

    it('should handle memory errors', async () => {
      vi.mocked(getServerSession).mockResolvedValue({
        user: { id: 'user-1', role: 'ADMIN' },
      } as any);

      prismaMock.salesInvoice.findMany.mockRejectedValue(new Error('Out of memory'));

      await expect(exportSalesInvoicesData()).rejects.toThrow('Export too large. Please apply filters to reduce the data size.');
    });

    it('should handle validation errors', async () => {
      vi.mocked(getServerSession).mockResolvedValue({
        user: { id: 'user-1', role: 'ADMIN' },
      } as any);

      prismaMock.salesInvoice.findMany.mockRejectedValue(new Error('Validation failed'));

      await expect(exportSalesInvoicesData()).rejects.toThrow('Failed to export sales invoices. Please try again or contact support if the problem persists.');
    });

    it('should handle invalid filter validation', async () => {
      vi.mocked(getServerSession).mockResolvedValue({
        user: { id: 'user-1', role: 'ADMIN' },
      } as any);

      const invalidFilters = {
        status: ['INVALID_STATUS'],
      };

      await expect(exportSalesInvoicesData(invalidFilters as any)).rejects.toThrow();
    });

    it('should handle empty invoice list', async () => {
      vi.mocked(getServerSession).mockResolvedValue({
        user: { id: 'user-1', role: 'ADMIN' },
      } as any);

      prismaMock.salesInvoice.findMany.mockResolvedValue([]);

      const result = await exportSalesInvoicesData();

      expect(result.csvContent).toContain('Invoice Number,Invoice Date,Due Date,Status');
      expect(result.csvContent.split('\n')).toHaveLength(1); // Only header line
      expect(result.filename).toMatch(/sales-invoices-export-\d{4}-\d{2}-\d{2}\.csv/);
    });

    it('should handle null values in invoice data gracefully', async () => {
      vi.mocked(getServerSession).mockResolvedValue({
        user: { id: 'user-1', role: 'ADMIN' },
      } as any);

      const invoiceWithNulls = {
        ...mockInvoices[0],
        dueDate: null,
        poNumber: null,
        paymentTerms: null,
        billingStatement: {
          ...mockInvoices[0].billingStatement,
          customer: null,
          customerOrder: null,
        },
        createdByUser: null,
        modifiedByUser: null,
      };

      prismaMock.salesInvoice.findMany.mockResolvedValue([invoiceWithNulls]);

      const result = await exportSalesInvoicesData();

      const lines = result.csvContent.split('\n');
      const dataRow = lines[1];
      
      // Should handle null values gracefully
      expect(dataRow).toContain('""'); // Empty due date
      expect(dataRow).toContain('"Unknown"'); // Unknown created by
    });
  });

  describe('Edge Cases and Error Scenarios', () => {
    it('should handle PDF export with minimal invoice data', async () => {
      vi.mocked(getServerSession).mockResolvedValue({
        user: { id: 'user-1', role: 'ADMIN' },
      } as any);

      const minimalInvoice = {
        id: 'invoice-minimal',
        invoiceNumber: 'INV-MIN-001',
        billingStatementId: 'bs-minimal',
        invoiceDate: new Date('2024-01-15'),
        subtotal: new Decimal(100),
        taxRate: new Decimal(0),
        taxAmount: new Decimal(0),
        discountAmount: new Decimal(0),
        totalAmount: new Decimal(100),
        paymentTerms: null,
        dueDate: null,
        status: 'DRAFT' as const,
        poNumber: null,
        terms: null,
        footerNotes: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: 'user-1',
        modifiedBy: null,
        invoiceItems: [],
        billingStatement: {
          id: 'bs-minimal',
          statementNumber: 'BS-MIN-001',
          customerName: 'Minimal Customer',
          billingDate: new Date('2024-01-15'),
          status: 'DRAFT' as const,
          customer: null,
          customerOrder: null,
        },
      };

      prismaMock.salesInvoice.findUnique.mockResolvedValue(minimalInvoice);
      vi.mocked(generateSalesInvoicePDF).mockResolvedValue(Buffer.from('minimal-pdf'));

      const result = await exportSalesInvoicePDF('invoice-minimal');

      expect(result.success).toBe(true);
      expect(result.pdfBuffer).toEqual(Buffer.from('minimal-pdf'));
      expect(generateSalesInvoicePDF).toHaveBeenCalledWith(
        expect.objectContaining({
          invoiceItems: [],
          subtotal: 100,
          taxRate: 0,
          taxAmount: 0,
          discountAmount: 0,
          totalAmount: 100,
        })
      );
    });

    it('should handle CSV export with large dataset efficiently', async () => {
      vi.mocked(getServerSession).mockResolvedValue({
        user: { id: 'user-1', role: 'ADMIN' },
      } as any);

      // Create a large dataset based on the first mock invoice
      const baseInvoice = mockInvoices[0];
      const largeInvoiceList = Array.from({ length: 1000 }, (_, index) => ({
        ...baseInvoice,
        id: `invoice-${index}`,
        invoiceNumber: `INV-2024-${String(index + 1).padStart(4, '0')}`,
        totalAmount: new Decimal(1000 + index),
      }));

      prismaMock.salesInvoice.findMany.mockResolvedValue(largeInvoiceList);

      const result = await exportSalesInvoicesData();

      expect(result.csvContent).toBeDefined();
      expect(result.filename).toMatch(/sales-invoices-export-\d{4}-\d{2}-\d{2}\.csv/);
      
      const lines = result.csvContent.split('\n');
      expect(lines).toHaveLength(1001); // Header + 1000 data rows
    });

    it('should handle session with missing user properties', async () => {
      vi.mocked(getServerSession).mockResolvedValue({
        user: { id: 'user-1' }, // Missing role property
      } as any);

      const result = await exportSalesInvoicePDF('invoice-1');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Admin access required to export invoices.');
    });

    it('should handle concurrent export requests', async () => {
      vi.mocked(getServerSession).mockResolvedValue({
        user: { id: 'user-1', role: 'ADMIN' },
      } as any);

      const baseInvoice = mockInvoices[0];
      const mockInvoiceForPDF = {
        ...baseInvoice,
        invoiceItems: baseInvoice.invoiceItems || [],
        billingStatement: baseInvoice.billingStatement,
      };

      prismaMock.salesInvoice.findUnique.mockResolvedValue(mockInvoiceForPDF as any);
      vi.mocked(generateSalesInvoicePDF).mockResolvedValue(Buffer.from('concurrent-pdf'));

      // Simulate concurrent requests
      const promises = Array.from({ length: 5 }, () => 
        exportSalesInvoicePDF('invoice-1')
      );

      const results = await Promise.all(promises);

      results.forEach(result => {
        expect(result.success).toBe(true);
        expect(result.pdfBuffer).toEqual(Buffer.from('concurrent-pdf'));
      });

      expect(prismaMock.salesInvoice.findUnique).toHaveBeenCalledTimes(5);
      expect(generateSalesInvoicePDF).toHaveBeenCalledTimes(5);
    });
  });
});