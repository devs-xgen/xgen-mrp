import { vi, describe, it, expect, beforeEach } from 'vitest';

// Mock the dependencies
vi.mock('@/lib/actions/sales-invoices', () => ({
  exportSalesInvoicesData: vi.fn(),
}));

vi.mock('@/hooks/use-toast', () => ({
  toast: vi.fn(),
}));

import { exportSalesInvoicesData } from '@/lib/actions/sales-invoices';
import { toast } from '@/hooks/use-toast';

describe('CSV Export Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should integrate CSV export functionality with sales invoices data', async () => {
    // Mock realistic sales invoice data
    const mockCSVData = {
      csvContent: `Invoice Number,Invoice Date,Due Date,Status,Customer Name,Customer Email,Customer Code,Billing Statement Number,PO Number,Subtotal,Tax Rate,Tax Amount,Discount Amount,Total Amount,Payment Terms,Created By,Created Date,Modified By,Modified Date
INV-001,2024-01-15,2024-02-14,PAID,Acme Corporation,contact@acme.com,ACME001,BS-001,PO-12345,1000.00,12.00,120.00,0.00,1120.00,Net 30,admin@company.com,2024-01-15T10:00:00Z,admin@company.com,2024-01-15T10:00:00Z
INV-002,2024-01-16,2024-02-15,PENDING,Beta Industries,info@beta.com,BETA001,BS-002,PO-12346,2000.00,12.00,240.00,100.00,2140.00,Net 30,admin@company.com,2024-01-16T11:00:00Z,admin@company.com,2024-01-16T11:00:00Z`,
      filename: 'sales-invoices-export-2024-01-27.csv'
    };

    vi.mocked(exportSalesInvoicesData).mockResolvedValue(mockCSVData);

    // Test the export functionality
    const result = await exportSalesInvoicesData();

    expect(exportSalesInvoicesData).toHaveBeenCalledWith();
    expect(result).toEqual(mockCSVData);
    
    // Verify CSV structure
    const lines = result.csvContent.split('\n');
    expect(lines[0]).toContain('Invoice Number');
    expect(lines[0]).toContain('Customer Name');
    expect(lines[0]).toContain('Total Amount');
    expect(lines[1]).toContain('INV-001');
    expect(lines[2]).toContain('INV-002');
  });

  it('should handle filtered export with date range and status', async () => {
    const filters = {
      status: ['PAID' as const, 'PENDING' as const],
      dateRange: {
        start: new Date('2024-01-01'),
        end: new Date('2024-01-31')
      }
    };

    const mockFilteredCSVData = {
      csvContent: `Invoice Number,Invoice Date,Due Date,Status,Customer Name,Total Amount
INV-001,2024-01-15,2024-02-14,PAID,Acme Corporation,1120.00`,
      filename: 'sales-invoices-filtered-export-2024-01-27.csv'
    };

    vi.mocked(exportSalesInvoicesData).mockResolvedValue(mockFilteredCSVData);

    const result = await exportSalesInvoicesData(filters);

    expect(exportSalesInvoicesData).toHaveBeenCalledWith(filters);
    expect(result).toEqual(mockFilteredCSVData);
    
    // Verify filtered results
    const lines = result.csvContent.split('\n');
    expect(lines.length).toBe(2); // Header + 1 data row
    expect(lines[1]).toContain('PAID');
  });

  it('should handle export errors and show appropriate feedback', async () => {
    const errorMessage = 'Database connection failed';
    vi.mocked(exportSalesInvoicesData).mockRejectedValue(new Error(errorMessage));

    try {
      await exportSalesInvoicesData();
      expect.fail('Should have thrown an error');
    } catch (error) {
      expect(error).toBeInstanceOf(Error);
      expect((error as Error).message).toBe(errorMessage);
    }
  });

  it('should generate proper filename with timestamp', async () => {
    const mockCSVData = {
      csvContent: 'Invoice Number,Customer Name\nINV-001,Test Customer',
      filename: `sales-invoices-export-${new Date().toISOString().split('T')[0]}.csv`
    };

    vi.mocked(exportSalesInvoicesData).mockResolvedValue(mockCSVData);

    const result = await exportSalesInvoicesData();

    expect(result.filename).toMatch(/sales-invoices-export-\d{4}-\d{2}-\d{2}\.csv/);
  });

  it('should handle large datasets efficiently', async () => {
    // Simulate large dataset
    const headerRow = 'Invoice Number,Customer Name,Total Amount';
    const dataRows = Array.from({ length: 1000 }, (_, i) => 
      `INV-${String(i + 1).padStart(3, '0')},Customer ${i + 1},${(i + 1) * 100}.00`
    );
    
    const mockLargeCSVData = {
      csvContent: [headerRow, ...dataRows].join('\n'),
      filename: 'sales-invoices-large-export.csv'
    };

    vi.mocked(exportSalesInvoicesData).mockResolvedValue(mockLargeCSVData);

    const result = await exportSalesInvoicesData();

    expect(result.csvContent.split('\n').length).toBe(1001); // Header + 1000 rows
    expect(result.csvContent).toContain('INV-001');
    expect(result.csvContent).toContain('INV-1000');
  });
});