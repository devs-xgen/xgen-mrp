import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { prismaMock } from '../setup/prisma-mock';
import { getServerSession } from 'next-auth';
import { Decimal } from '@prisma/client/runtime/library';

// Mock dependencies
vi.mock('next-auth', () => ({
  getServerSession: vi.fn(),
}));

vi.mock('@/lib/auth', () => ({
  authOptions: {},
}));

vi.mock('@/lib/db', () => ({
  prisma: prismaMock,
}));

// Import server actions after mocking
import { exportSalesInvoicesData } from '@/lib/actions/sales-invoices';

describe('CSV Export Integration', () => {
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

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Complete CSV Export Flow', () => {
    it('should complete full CSV export flow from server action to file generation', async () => {
      // Mock authentication
      vi.mocked(getServerSession).mockResolvedValue({
        user: { id: 'user-1', role: 'ADMIN' },
      } as any);

      // Mock database query
      prismaMock.salesInvoice.findMany.mockResolvedValue(mockInvoices);

      // Execute the server action
      const result = await exportSalesInvoicesData();

      // Verify successful response
      expect(result.csvContent).toBeDefined();
      expect(result.filename).toMatch(/sales-invoices-export-\d{4}-\d{2}-\d{2}\.csv/);

      // Verify database query was called
      expect(prismaMock.salesInvoice.findMany).toHaveBeenCalledWith({
        where: {},
        orderBy: { invoiceDate: 'desc' },
        include: expect.objectContaining({
          billingStatement: expect.any(Object),
          createdByUser: expect.any(Object),
          modifiedByUser: expect.any(Object),
        }),
      });

      // Verify CSV structure
      const lines = result.csvContent.split('\n');
      expect(lines[0]).toContain('Invoice Number');
      expect(lines[0]).toContain('Customer Name');
      expect(lines[0]).toContain('Total Amount');
      expect(lines[1]).toContain('INV-2024-001');
      expect(lines[2]).toContain('INV-2024-002');
    });

    it('should handle filtered export with various filter combinations', async () => {
      vi.mocked(getServerSession).mockResolvedValue({
        user: { id: 'user-1', role: 'ADMIN' },
      } as any);

      // Mock filtered results
      prismaMock.salesInvoice.findMany.mockResolvedValue([mockInvoices[0]]);

      const filters = {
        status: ['PAID' as const],
      };

      const result = await exportSalesInvoicesData(filters);

      // Verify filtered query was called
      expect(prismaMock.salesInvoice.findMany).toHaveBeenCalledWith({
        where: {
          status: { in: ['PAID'] },
        },
        orderBy: { invoiceDate: 'desc' },
        include: expect.any(Object),
      });

      // Verify filtered results
      expect(result.csvContent).toBeDefined();
      const lines = result.csvContent.split('\n');
      expect(lines.length).toBe(2); // Header + 1 data row
      expect(lines[1]).toContain('SENT'); // The mock data has SENT status
    });

    it('should generate CSV with correct structure and data formatting', async () => {
      vi.mocked(getServerSession).mockResolvedValue({
        user: { id: 'user-1', role: 'ADMIN' },
      } as any);

      prismaMock.salesInvoice.findMany.mockResolvedValue([mockInvoices[0]]);

      const result = await exportSalesInvoicesData();

      // Verify CSV content structure
      const lines = result.csvContent.split('\n');
      
      expect(lines[0]).toContain('Invoice Number');
      expect(lines[0]).toContain('Customer Name');
      expect(lines[0]).toContain('Total Amount');
      expect(lines[1]).toContain('INV-2024-001');
      expect(lines[1]).toContain('Test Customer');
      expect(lines[1]).toContain('1050.00');
    });

    it('should handle date range filters correctly', async () => {
      vi.mocked(getServerSession).mockResolvedValue({
        user: { id: 'user-1', role: 'ADMIN' },
      } as any);

      prismaMock.salesInvoice.findMany.mockResolvedValue(mockInvoices);

      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-01-31');
      
      const filters = {
        dateRange: { start: startDate, end: endDate },
      };

      const result = await exportSalesInvoicesData(filters);

      expect(prismaMock.salesInvoice.findMany).toHaveBeenCalledWith({
        where: {
          invoiceDate: { gte: startDate, lte: endDate },
        },
        orderBy: { invoiceDate: 'desc' },
        include: expect.any(Object),
      });

      expect(result.csvContent).toBeDefined();
      expect(result.filename).toMatch(/sales-invoices-export-\d{4}-\d{2}-\d{2}\.csv/);
    });

    it('should handle multiple status filters correctly', async () => {
      vi.mocked(getServerSession).mockResolvedValue({
        user: { id: 'user-1', role: 'ADMIN' },
      } as any);

      prismaMock.salesInvoice.findMany.mockResolvedValue(mockInvoices);

      const filters = {
        status: ['SENT', 'PAID'] as const,
      };

      const result = await exportSalesInvoicesData(filters);

      expect(prismaMock.salesInvoice.findMany).toHaveBeenCalledWith({
        where: {
          status: { in: ['SENT', 'PAID'] },
        },
        orderBy: { invoiceDate: 'desc' },
        include: expect.any(Object),
      });

      expect(result.csvContent).toBeDefined();
    });

    it('should handle search filters correctly', async () => {
      vi.mocked(getServerSession).mockResolvedValue({
        user: { id: 'user-1', role: 'ADMIN' },
      } as any);

      prismaMock.salesInvoice.findMany.mockResolvedValue(mockInvoices);

      const filters = {
        search: 'test customer',
      };

      const result = await exportSalesInvoicesData(filters);

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

      expect(result.csvContent).toBeDefined();
    });

    it('should handle combined filters correctly', async () => {
      vi.mocked(getServerSession).mockResolvedValue({
        user: { id: 'user-1', role: 'ADMIN' },
      } as any);

      prismaMock.salesInvoice.findMany.mockResolvedValue(mockInvoices);

      const filters = {
        status: ['SENT', 'PAID'] as const,
        dateRange: { 
          start: new Date('2024-01-01'), 
          end: new Date('2024-01-31') 
        },
        search: 'INV-2024',
        sortBy: 'invoiceDate' as const,
        sortOrder: 'asc' as const,
      };

      const result = await exportSalesInvoicesData(filters);

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

      expect(result.csvContent).toBeDefined();
    });
  });

  describe('Error Scenarios and User Feedback', () => {
    it('should handle authentication errors gracefully', async () => {
      // Mock unauthenticated user
      vi.mocked(getServerSession).mockResolvedValue(null);

      try {
        await exportSalesInvoicesData();
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
        expect((error as Error).message).toBe('Failed to export sales invoices data');
      }

      expect(prismaMock.salesInvoice.findMany).not.toHaveBeenCalled();
    });

    it('should handle authorization errors for non-admin users', async () => {
      // Mock non-admin user
      vi.mocked(getServerSession).mockResolvedValue({
        user: { id: 'user-1', role: 'WORKER' },
      } as any);

      try {
        await exportSalesInvoicesData();
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
        expect((error as Error).message).toBe('Failed to export sales invoices data');
      }

      expect(prismaMock.salesInvoice.findMany).not.toHaveBeenCalled();
    });

    it('should handle database connection errors', async () => {
      vi.mocked(getServerSession).mockResolvedValue({
        user: { id: 'user-1', role: 'ADMIN' },
      } as any);

      // Mock database error
      prismaMock.salesInvoice.findMany.mockRejectedValue(new Error('Database connection failed'));

      try {
        await exportSalesInvoicesData();
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
        expect((error as Error).message).toBe('Failed to export sales invoices data');
      }
    });

    it('should handle concurrent export requests', async () => {
      vi.mocked(getServerSession).mockResolvedValue({
        user: { id: 'user-1', role: 'ADMIN' },
      } as any);

      prismaMock.salesInvoice.findMany.mockResolvedValue(mockInvoices);

      // Execute concurrent requests
      const promises = [
        exportSalesInvoicesData(),
        exportSalesInvoicesData(),
        exportSalesInvoicesData(),
      ];

      const results = await Promise.all(promises);

      // All should succeed
      results.forEach(result => {
        expect(result.csvContent).toBeDefined();
        expect(result.filename).toMatch(/sales-invoices-export-\d{4}-\d{2}-\d{2}\.csv/);
      });

      expect(prismaMock.salesInvoice.findMany).toHaveBeenCalledTimes(3);
    });

    it('should handle empty results gracefully', async () => {
      vi.mocked(getServerSession).mockResolvedValue({
        user: { id: 'user-1', role: 'ADMIN' },
      } as any);

      // Mock empty results
      prismaMock.salesInvoice.findMany.mockResolvedValue([]);

      const result = await exportSalesInvoicesData();

      expect(result.csvContent).toBeDefined();
      expect(result.filename).toMatch(/sales-invoices-export-\d{4}-\d{2}-\d{2}\.csv/);
      
      // Should have header line only
      const lines = result.csvContent.split('\n');
      expect(lines[0]).toContain('Invoice Number');
      expect(lines.length).toBe(1); // Only header line
    });

    it('should handle invalid filter validation', async () => {
      vi.mocked(getServerSession).mockResolvedValue({
        user: { id: 'user-1', role: 'ADMIN' },
      } as any);

      const invalidFilters = {
        status: ['INVALID_STATUS'],
      };

      try {
        await exportSalesInvoicesData(invalidFilters as any);
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
      }
    });
  });

  describe('CSV Content Generation', () => {
    it('should generate filename with timestamp', async () => {
      vi.mocked(getServerSession).mockResolvedValue({
        user: { id: 'user-1', role: 'ADMIN' },
      } as any);

      prismaMock.salesInvoice.findMany.mockResolvedValue(mockInvoices);

      const result = await exportSalesInvoicesData();

      expect(result.filename).toMatch(/sales-invoices-export-\d{4}-\d{2}-\d{2}\.csv/);
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

  describe('Performance and Edge Cases', () => {
    it('should handle large datasets efficiently', async () => {
      vi.mocked(getServerSession).mockResolvedValue({
        user: { id: 'user-1', role: 'ADMIN' },
      } as any);

      // Create large dataset
      const largeInvoiceList = Array.from({ length: 1000 }, (_, index) => ({
        ...mockInvoices[0],
        id: `invoice-${index}`,
        invoiceNumber: `INV-2024-${String(index + 1).padStart(4, '0')}`,
        totalAmount: new Decimal(1000 + index),
      }));

      prismaMock.salesInvoice.findMany.mockResolvedValue(largeInvoiceList);

      const startTime = Date.now();
      const result = await exportSalesInvoicesData();
      const endTime = Date.now();

      expect(result.csvContent).toBeDefined();
      expect(result.filename).toMatch(/sales-invoices-export-\d{4}-\d{2}-\d{2}\.csv/);
      
      const lines = result.csvContent.split('\n');
      expect(lines).toHaveLength(1001); // Header + 1000 data rows
      
      // Should complete within reasonable time (10 seconds for large dataset)
      expect(endTime - startTime).toBeLessThan(10000);
    });

    it('should handle decimal precision correctly in CSV formatting', async () => {
      vi.mocked(getServerSession).mockResolvedValue({
        user: { id: 'user-1', role: 'ADMIN' },
      } as any);

      const invoiceWithDecimals = {
        ...mockInvoices[0],
        subtotal: new Decimal('1234.56'),
        taxRate: new Decimal('12.5'),
        taxAmount: new Decimal('154.32'),
        discountAmount: new Decimal('100.00'),
        totalAmount: new Decimal('1288.88'),
      };

      prismaMock.salesInvoice.findMany.mockResolvedValue([invoiceWithDecimals]);

      const result = await exportSalesInvoicesData();

      const lines = result.csvContent.split('\n');
      const dataRow = lines[1];
      
      expect(dataRow).toContain('"1234.56"');
      expect(dataRow).toContain('"12.50"');
      expect(dataRow).toContain('"154.32"');
      expect(dataRow).toContain('"100.00"');
      expect(dataRow).toContain('"1288.88"');
    });

    it('should maintain data consistency across multiple exports', async () => {
      vi.mocked(getServerSession).mockResolvedValue({
        user: { id: 'user-1', role: 'ADMIN' },
      } as any);

      prismaMock.salesInvoice.findMany.mockResolvedValue(mockInvoices);

      // Execute multiple exports
      const results = await Promise.all([
        exportSalesInvoicesData(),
        exportSalesInvoicesData(),
        exportSalesInvoicesData(),
      ]);

      // All results should be identical
      const firstResult = results[0];
      results.forEach(result => {
        expect(result.csvContent).toBe(firstResult.csvContent);
        expect(result.filename).toMatch(/sales-invoices-export-\d{4}-\d{2}-\d{2}\.csv/);
      });
    });
  });
});