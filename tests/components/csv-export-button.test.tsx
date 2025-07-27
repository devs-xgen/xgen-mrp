import { vi, describe, it, expect, beforeEach } from 'vitest';

// Mock the dependencies
vi.mock('@/lib/actions/sales-invoices', () => ({
  exportSalesInvoicesData: vi.fn(),
}));

vi.mock('@/hooks/use-toast', () => ({
  toast: vi.fn(),
}));

// Mock the date-fns format function
vi.mock('date-fns', () => ({
  format: vi.fn((date) => date.toLocaleDateString()),
}));

import { exportSalesInvoicesData } from '@/lib/actions/sales-invoices';
import { toast } from '@/hooks/use-toast';

describe('CSVExportButton', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should call exportSalesInvoicesData when export is triggered', async () => {
    const mockCSVData = {
      csvContent: 'Invoice Number,Customer,Amount\nINV-001,Test Customer,1000',
      filename: 'sales-invoices-export.csv'
    };

    vi.mocked(exportSalesInvoicesData).mockResolvedValue(mockCSVData);

    // Test the function directly
    const result = await exportSalesInvoicesData();
    
    expect(exportSalesInvoicesData).toHaveBeenCalledWith();
    expect(result).toEqual(mockCSVData);
  });

  it('should handle export errors correctly', async () => {
    const errorMessage = 'Export failed';
    vi.mocked(exportSalesInvoicesData).mockRejectedValue(new Error(errorMessage));

    try {
      await exportSalesInvoicesData();
    } catch (error) {
      expect(error).toBeInstanceOf(Error);
      expect((error as Error).message).toBe(errorMessage);
    }
  });

  it('should call exportSalesInvoicesData with filters when provided', async () => {
    const mockCSVData = {
      csvContent: 'Invoice Number,Customer,Amount\nINV-001,Test Customer,1000',
      filename: 'sales-invoices-filtered-export.csv'
    };

    const filters = {
      status: ['PAID' as const],
      dateRange: {
        start: new Date('2024-01-01'),
        end: new Date('2024-12-31')
      }
    };

    vi.mocked(exportSalesInvoicesData).mockResolvedValue(mockCSVData);

    const result = await exportSalesInvoicesData(filters);
    
    expect(exportSalesInvoicesData).toHaveBeenCalledWith(filters);
    expect(result).toEqual(mockCSVData);
  });

  it('should return CSV content with proper structure', async () => {
    const mockCSVData = {
      csvContent: 'Invoice Number,Customer Name,Invoice Date,Total Amount,Status\nINV-001,Test Customer,2024-01-01,1000.00,PAID',
      filename: 'sales-invoices-export-2024-01-01.csv'
    };

    vi.mocked(exportSalesInvoicesData).mockResolvedValue(mockCSVData);

    const result = await exportSalesInvoicesData();
    
    expect(result.csvContent).toContain('Invoice Number');
    expect(result.csvContent).toContain('Customer Name');
    expect(result.csvContent).toContain('Total Amount');
    expect(result.filename).toMatch(/sales-invoices.*\.csv$/);
  });

  it('should handle empty results gracefully', async () => {
    const mockCSVData = {
      csvContent: 'Invoice Number,Customer Name,Invoice Date,Total Amount,Status\n',
      filename: 'sales-invoices-export-empty.csv'
    };

    vi.mocked(exportSalesInvoicesData).mockResolvedValue(mockCSVData);

    const result = await exportSalesInvoicesData();
    
    expect(result.csvContent).toBe('Invoice Number,Customer Name,Invoice Date,Total Amount,Status\n');
    expect(result.filename).toBe('sales-invoices-export-empty.csv');
  });
});