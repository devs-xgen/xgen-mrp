import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { toast } from '@/hooks/use-toast';
import { toast as sonnerToast } from 'sonner';
import { PDFDownloadButton } from '@/components/module/admin/billing/sales-invoices/pdf-download-button';
import { PDFDownloadStandaloneButton } from '@/components/module/admin/billing/sales-invoices/pdf-download-standalone-button';
import { CSVExportButton } from '@/components/module/admin/billing/sales-invoices/csv-export-button';
import { exportSalesInvoicePDF, exportSalesInvoicesData } from '@/lib/actions/sales-invoices';

// Mock the server actions
vi.mock('@/lib/actions/sales-invoices', () => ({
  exportSalesInvoicePDF: vi.fn(),
  exportSalesInvoicesData: vi.fn(),
}));

// Mock the toast hooks
vi.mock('@/hooks/use-toast', () => ({
  toast: vi.fn(),
}));

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

// Mock URL.createObjectURL and related APIs
Object.defineProperty(window, 'URL', {
  value: {
    createObjectURL: vi.fn(() => 'mock-url'),
    revokeObjectURL: vi.fn(),
  },
});

// Mock document.createElement and appendChild
Object.defineProperty(document, 'createElement', {
  value: vi.fn(() => ({
    href: '',
    download: '',
    click: vi.fn(),
  })),
});

Object.defineProperty(document.body, 'appendChild', {
  value: vi.fn(),
});

Object.defineProperty(document.body, 'removeChild', {
  value: vi.fn(),
});

describe('Enhanced Error Handling and Retry Mechanisms', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('PDFDownloadButton', () => {
    const defaultProps = {
      invoiceId: 'test-invoice-id',
      invoiceNumber: 'INV-001',
    };

    it('should show specific error message for authentication failure', async () => {
      vi.mocked(exportSalesInvoicePDF).mockResolvedValue({
        success: false,
        error: 'Authentication required. Please log in to continue.',
        errorCode: 'UNAUTHORIZED',
      });

      render(<PDFDownloadButton {...defaultProps} />);
      
      const button = screen.getByRole('menuitem');
      fireEvent.click(button);

      await waitFor(() => {
        expect(toast).toHaveBeenCalledWith({
          title: 'Download failed',
          description: 'Your session has expired. Please refresh the page and log in again.',
          variant: 'destructive',
        });
      });
    });

    it('should show specific error message for permission failure', async () => {
      vi.mocked(exportSalesInvoicePDF).mockResolvedValue({
        success: false,
        error: 'Admin access required to export invoices.',
        errorCode: 'INSUFFICIENT_PERMISSIONS',
      });

      render(<PDFDownloadButton {...defaultProps} />);
      
      const button = screen.getByRole('menuitem');
      fireEvent.click(button);

      await waitFor(() => {
        expect(toast).toHaveBeenCalledWith({
          title: 'Download failed',
          description: 'You don\'t have permission to download invoices. Please contact your administrator.',
          variant: 'destructive',
        });
      });
    });

    it('should show specific error message for not found', async () => {
      vi.mocked(exportSalesInvoicePDF).mockResolvedValue({
        success: false,
        error: 'Invoice not found. It may have been deleted or you don\'t have access to it.',
        errorCode: 'NOT_FOUND',
      });

      render(<PDFDownloadButton {...defaultProps} />);
      
      const button = screen.getByRole('menuitem');
      fireEvent.click(button);

      await waitFor(() => {
        expect(toast).toHaveBeenCalledWith({
          title: 'Download failed',
          description: 'This invoice no longer exists. Please refresh the page.',
          variant: 'destructive',
        });
      });
    });

    it('should retry on timeout errors with exponential backoff', async () => {
      vi.mocked(exportSalesInvoicePDF)
        .mockResolvedValueOnce({
          success: false,
          error: 'Database connection error. Please try again in a moment.',
        })
        .mockResolvedValueOnce({
          success: false,
          error: 'Database connection error. Please try again in a moment.',
        })
        .mockResolvedValueOnce({
          success: true,
          pdfBuffer: Buffer.from('mock-pdf'),
          filename: 'test.pdf',
        });

      render(<PDFDownloadButton {...defaultProps} />);
      
      const button = screen.getByRole('menuitem');
      fireEvent.click(button);

      // First attempt fails, shows retry message
      await waitFor(() => {
        expect(toast).toHaveBeenCalledWith({
          title: 'Download failed (Attempt 1/3)',
          description: 'Retrying in 1 seconds...',
          variant: 'destructive',
        });
      });

      // Fast-forward first retry delay
      vi.advanceTimersByTime(1000);

      // Second attempt fails, shows retry message with longer delay
      await waitFor(() => {
        expect(toast).toHaveBeenCalledWith({
          title: 'Download failed (Attempt 2/3)',
          description: 'Retrying in 2 seconds...',
          variant: 'destructive',
        });
      });

      // Fast-forward second retry delay
      vi.advanceTimersByTime(2000);

      // Third attempt succeeds
      await waitFor(() => {
        expect(toast).toHaveBeenCalledWith({
          title: 'Download complete',
          description: 'Invoice PDF has been downloaded successfully.',
        });
      });

      expect(exportSalesInvoicePDF).toHaveBeenCalledTimes(3);
    });

    it('should show final error after max retries', async () => {
      vi.mocked(exportSalesInvoicePDF).mockResolvedValue({
        success: false,
        error: 'Database connection error. Please try again in a moment.',
      });

      render(<PDFDownloadButton {...defaultProps} />);
      
      const button = screen.getByRole('menuitem');
      fireEvent.click(button);

      // Wait for all retries to complete
      vi.advanceTimersByTime(10000); // Advance enough time for all retries

      await waitFor(() => {
        expect(toast).toHaveBeenLastCalledWith({
          title: 'Download failed',
          description: 'Failed to download after 3 attempts. Please try again later or contact support.',
          variant: 'destructive',
        });
      });

      expect(exportSalesInvoicePDF).toHaveBeenCalledTimes(3);
    });

    it('should not retry on non-retryable errors', async () => {
      vi.mocked(exportSalesInvoicePDF).mockResolvedValue({
        success: false,
        error: 'Admin access required to export invoices.',
        errorCode: 'INSUFFICIENT_PERMISSIONS',
      });

      render(<PDFDownloadButton {...defaultProps} />);
      
      const button = screen.getByRole('menuitem');
      fireEvent.click(button);

      await waitFor(() => {
        expect(toast).toHaveBeenCalledWith({
          title: 'Download failed',
          description: 'You don\'t have permission to download invoices. Please contact your administrator.',
          variant: 'destructive',
        });
      });

      // Should not retry
      expect(exportSalesInvoicePDF).toHaveBeenCalledTimes(1);
    });

    it('should show retry count in button text', async () => {
      vi.mocked(exportSalesInvoicePDF)
        .mockResolvedValueOnce({
          success: false,
          error: 'Database connection error. Please try again in a moment.',
        })
        .mockResolvedValueOnce({
          success: true,
          pdfBuffer: Buffer.from('mock-pdf'),
          filename: 'test.pdf',
        });

      render(<PDFDownloadButton {...defaultProps} />);
      
      const button = screen.getByRole('menuitem');
      fireEvent.click(button);

      // Initial state shows "Downloading..."
      expect(button).toHaveTextContent('Downloading...');

      // After first failure, advance timer to trigger retry
      vi.advanceTimersByTime(1000);

      // During retry, should show retry count
      await waitFor(() => {
        expect(button).toHaveTextContent('Retrying... (1/3)');
      });
    });
  });

  describe('PDFDownloadStandaloneButton', () => {
    const defaultProps = {
      invoiceId: 'test-invoice-id',
      invoiceNumber: 'INV-001',
    };

    it('should use sonner toast for notifications', async () => {
      vi.mocked(exportSalesInvoicePDF).mockResolvedValue({
        success: true,
        pdfBuffer: Buffer.from('mock-pdf'),
        filename: 'test.pdf',
      });

      render(<PDFDownloadStandaloneButton {...defaultProps} />);
      
      const button = screen.getByRole('button');
      fireEvent.click(button);

      await waitFor(() => {
        expect(sonnerToast.success).toHaveBeenCalledWith('Download started', {
          description: 'Your invoice PDF is being generated...',
        });
      });

      await waitFor(() => {
        expect(sonnerToast.success).toHaveBeenCalledWith('Download complete', {
          description: 'Invoice PDF has been downloaded successfully.',
        });
      });
    });

    it('should show spinning refresh icon during retry', async () => {
      vi.mocked(exportSalesInvoicePDF)
        .mockResolvedValueOnce({
          success: false,
          error: 'timeout error',
        })
        .mockResolvedValueOnce({
          success: true,
          pdfBuffer: Buffer.from('mock-pdf'),
          filename: 'test.pdf',
        });

      render(<PDFDownloadStandaloneButton {...defaultProps} />);
      
      const button = screen.getByRole('button');
      fireEvent.click(button);

      // Advance timer to trigger retry
      vi.advanceTimersByTime(1000);

      await waitFor(() => {
        const refreshIcon = button.querySelector('.animate-spin');
        expect(refreshIcon).toBeInTheDocument();
      });
    });
  });

  describe('CSVExportButton', () => {
    it('should handle CSV export errors with retry mechanism', async () => {
      vi.mocked(exportSalesInvoicesData)
        .mockRejectedValueOnce(new Error('Database connection error. Please try again in a moment.'))
        .mockResolvedValueOnce({
          csvContent: 'test,csv,content',
          filename: 'test.csv',
        });

      render(<CSVExportButton />);
      
      const quickExportButton = screen.getByText('Export CSV');
      fireEvent.click(quickExportButton);

      // First attempt fails, shows retry message
      await waitFor(() => {
        expect(toast).toHaveBeenCalledWith({
          title: 'Export failed (Attempt 1/3)',
          description: 'Retrying in 1 seconds...',
          variant: 'destructive',
        });
      });

      // Fast-forward retry delay
      vi.advanceTimersByTime(1000);

      // Second attempt succeeds
      await waitFor(() => {
        expect(toast).toHaveBeenCalledWith({
          title: 'Export complete',
          description: 'Sales invoices CSV has been downloaded successfully.',
        });
      });

      expect(exportSalesInvoicesData).toHaveBeenCalledTimes(2);
    });

    it('should show specific error messages for CSV export failures', async () => {
      vi.mocked(exportSalesInvoicesData).mockRejectedValue(
        new Error('Export too large. Please apply filters to reduce the data size.')
      );

      render(<CSVExportButton />);
      
      const quickExportButton = screen.getByText('Export CSV');
      fireEvent.click(quickExportButton);

      await waitFor(() => {
        expect(toast).toHaveBeenCalledWith({
          title: 'Export failed',
          description: 'The export is too large. Please apply filters to reduce the data size.',
          variant: 'destructive',
        });
      });
    });

    it('should handle authentication errors in CSV export', async () => {
      vi.mocked(exportSalesInvoicesData).mockRejectedValue(
        new Error('Authentication required. Please log in to continue.')
      );

      render(<CSVExportButton />);
      
      const quickExportButton = screen.getByText('Export CSV');
      fireEvent.click(quickExportButton);

      await waitFor(() => {
        expect(toast).toHaveBeenCalledWith({
          title: 'Export failed',
          description: 'Your session has expired. Please refresh the page and log in again.',
          variant: 'destructive',
        });
      });
    });

    it('should handle validation errors in filtered export', async () => {
      vi.mocked(exportSalesInvoicesData).mockRejectedValue(
        new Error('Invalid filter parameters. Please check your selections and try again.')
      );

      render(<CSVExportButton />);
      
      const filteredExportButton = screen.getByText('Export with Filters');
      fireEvent.click(filteredExportButton);

      // Wait for dialog to open and click export
      await waitFor(() => {
        const exportButton = screen.getByRole('button', { name: /Export CSV/i });
        fireEvent.click(exportButton);
      });

      await waitFor(() => {
        expect(toast).toHaveBeenCalledWith({
          title: 'Export failed',
          description: 'Invalid filter settings. Please check your selections and try again.',
          variant: 'destructive',
        });
      });
    });
  });

  describe('Error Recovery and User Experience', () => {
    it('should reset retry count on successful operation', async () => {
      vi.mocked(exportSalesInvoicePDF)
        .mockResolvedValueOnce({
          success: false,
          error: 'timeout error',
        })
        .mockResolvedValueOnce({
          success: true,
          pdfBuffer: Buffer.from('mock-pdf'),
          filename: 'test.pdf',
        });

      const { rerender } = render(
        <PDFDownloadButton invoiceId="test-1" invoiceNumber="INV-001" />
      );
      
      let button = screen.getByRole('menuitem');
      fireEvent.click(button);

      // Wait for retry to complete successfully
      vi.advanceTimersByTime(1000);
      await waitFor(() => {
        expect(toast).toHaveBeenCalledWith({
          title: 'Download complete',
          description: 'Invoice PDF has been downloaded successfully.',
        });
      });

      // Re-render with new props to simulate new download
      rerender(<PDFDownloadButton invoiceId="test-2" invoiceNumber="INV-002" />);
      
      // Mock another failure followed by success
      vi.mocked(exportSalesInvoicePDF)
        .mockResolvedValueOnce({
          success: false,
          error: 'timeout error',
        })
        .mockResolvedValueOnce({
          success: true,
          pdfBuffer: Buffer.from('mock-pdf-2'),
          filename: 'test2.pdf',
        });

      button = screen.getByRole('menuitem');
      fireEvent.click(button);

      // Should start from attempt 1 again, not continue from previous retry count
      await waitFor(() => {
        expect(toast).toHaveBeenCalledWith({
          title: 'Export failed (Attempt 1/3)',
          description: 'Retrying in 1 seconds...',
          variant: 'destructive',
        });
      });
    });

    it('should prevent multiple simultaneous downloads', async () => {
      vi.mocked(exportSalesInvoicePDF).mockImplementation(
        () => new Promise(resolve => setTimeout(() => resolve({
          success: true,
          pdfBuffer: Buffer.from('mock-pdf'),
          filename: 'test.pdf',
        }), 1000))
      );

      render(<PDFDownloadButton invoiceId="test-1" invoiceNumber="INV-001" />);
      
      const button = screen.getByRole('menuitem');
      
      // Click multiple times rapidly
      fireEvent.click(button);
      fireEvent.click(button);
      fireEvent.click(button);

      // Should only call the export function once
      expect(exportSalesInvoicePDF).toHaveBeenCalledTimes(1);
      
      // Button should be disabled
      expect(button).toHaveAttribute('aria-disabled', 'true');
    });

    it('should provide appropriate loading states during retry', async () => {
      vi.mocked(exportSalesInvoicePDF)
        .mockResolvedValueOnce({
          success: false,
          error: 'connection error',
        })
        .mockResolvedValueOnce({
          success: false,
          error: 'connection error',
        })
        .mockResolvedValueOnce({
          success: true,
          pdfBuffer: Buffer.from('mock-pdf'),
          filename: 'test.pdf',
        });

      render(<PDFDownloadStandaloneButton invoiceId="test-1" invoiceNumber="INV-001" />);
      
      const button = screen.getByRole('button');
      fireEvent.click(button);

      // Initial loading state
      expect(button).toHaveTextContent('Downloading...');

      // After first failure, advance to retry
      vi.advanceTimersByTime(1000);
      await waitFor(() => {
        expect(button).toHaveTextContent('Retrying... (1/3)');
      });

      // After second failure, advance to second retry
      vi.advanceTimersByTime(2000);
      await waitFor(() => {
        expect(button).toHaveTextContent('Retrying... (2/3)');
      });

      // Final success
      await waitFor(() => {
        expect(button).toHaveTextContent('Download PDF');
        expect(button).not.toBeDisabled();
      });
    });
  });
});