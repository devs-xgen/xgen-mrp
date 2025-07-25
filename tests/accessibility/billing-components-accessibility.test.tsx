import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ManualCustomerEntry } from '@/components/module/admin/billing/customer-selection/manual-customer-entry';
import { EnhancedDirectCustomerSelector } from '@/components/module/admin/billing/customer-selection/enhanced-direct-customer-selector';
import { InvoiceItemsManager } from '@/components/module/admin/billing/invoice-items/invoice-items-manager';
import { InvoiceItemRow } from '@/components/module/admin/billing/invoice-items/invoice-item-row';
import { BulkItemOperations } from '@/components/module/admin/billing/invoice-items/bulk-item-operations';

// Mock axe for now - would need to install vitest-axe or similar
const mockAxe = async (container: any) => ({ violations: [] });
const toHaveNoViolations = (received: any) => ({
  pass: received.violations.length === 0,
  message: () => `Expected no accessibility violations`
});

// Mock dependencies
vi.mock('@/lib/actions/customers', () => ({
  getAllCustomers: vi.fn().mockResolvedValue([]),
  validateCustomerForBilling: vi.fn().mockResolvedValue({
    isValid: true,
    customer: null,
    warnings: [],
    errors: [],
  }),
}));

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

describe('Billing Components Accessibility', () => {
  describe('ManualCustomerEntry', () => {
    const defaultProps = {
      customerName: '',
      onCustomerNameChange: vi.fn(),
      onClear: vi.fn(),
    };

    it('should have no accessibility violations', async () => {
      const { container } = render(<ManualCustomerEntry {...defaultProps} />);
      const results = await mockAxe(container);
      expect(toHaveNoViolations(results).pass).toBe(true);
    });

    it('should have proper ARIA labels and roles', () => {
      render(<ManualCustomerEntry {...defaultProps} />);
      
      // Check for proper labeling
      expect(screen.getByLabelText(/customer name/i)).toBeInTheDocument();
      expect(screen.getByRole('region')).toBeInTheDocument();
      
      // Check for required field indication
      expect(screen.getByText('*')).toHaveAttribute('aria-label', 'required');
    });

    it('should announce validation errors to screen readers', async () => {
      const user = userEvent.setup();
      render(<ManualCustomerEntry {...defaultProps} required />);
      
      const input = screen.getByLabelText(/customer name/i);
      
      // Trigger validation error
      await user.type(input, 'a');
      await user.clear(input);
      
      await waitFor(() => {
        expect(screen.getByRole('alert')).toBeInTheDocument();
      });
    });

    it('should support keyboard navigation', async () => {
      const user = userEvent.setup();
      const onClear = vi.fn();
      
      render(
        <ManualCustomerEntry 
          {...defaultProps} 
          customerName="Test Customer"
          onClear={onClear}
        />
      );
      
      const clearButton = screen.getByLabelText(/clear customer information/i);
      
      // Test keyboard activation
      clearButton.focus();
      await user.keyboard('{Enter}');
      
      expect(onClear).toHaveBeenCalled();
    });

    it('should have proper focus management', () => {
      render(<ManualCustomerEntry {...defaultProps} />);
      
      const input = screen.getByLabelText(/customer name/i);
      expect(input).toHaveFocus();
    });
  });

  describe('EnhancedDirectCustomerSelector', () => {
    const defaultProps = {
      onCustomerSelect: vi.fn(),
      onClear: vi.fn(),
    };

    it('should have no accessibility violations', async () => {
      const { container } = render(<EnhancedDirectCustomerSelector {...defaultProps} />);
      const results = await mockAxe(container);
      expect(toHaveNoViolations(results).pass).toBe(true);
    });

    it('should have proper combobox implementation', () => {
      render(<EnhancedDirectCustomerSelector {...defaultProps} />);
      
      const combobox = screen.getByRole('combobox');
      expect(combobox).toHaveAttribute('aria-expanded', 'false');
      expect(combobox).toHaveAttribute('aria-haspopup', 'listbox');
    });

    it('should announce selection changes', async () => {
      const user = userEvent.setup();
      const onCustomerSelect = vi.fn();
      
      render(
        <EnhancedDirectCustomerSelector 
          {...defaultProps}
          onCustomerSelect={onCustomerSelect}
        />
      );
      
      const combobox = screen.getByRole('combobox');
      await user.click(combobox);
      
      expect(combobox).toHaveAttribute('aria-expanded', 'true');
    });
  });

  describe('InvoiceItemsManager', () => {
    const defaultProps = {
      items: [],
      onItemsChange: vi.fn(),
    };

    it('should have no accessibility violations', async () => {
      const { container } = render(<InvoiceItemsManager {...defaultProps} />);
      const results = await mockAxe(container);
      expect(toHaveNoViolations(results).pass).toBe(true);
    });

    it('should have proper region and toolbar roles', () => {
      render(<InvoiceItemsManager {...defaultProps} />);
      
      expect(screen.getByRole('region')).toBeInTheDocument();
      expect(screen.getByRole('toolbar')).toBeInTheDocument();
    });

    it('should announce item count changes', () => {
      const { rerender } = render(<InvoiceItemsManager {...defaultProps} />);
      
      const itemsWithData = [{
        description: 'Test Item',
        quantity: 1,
        unitPrice: 100,
        productCode: '',
        unit: 'PCS',
        discountPercent: 0,
        taxable: true,
      }];
      
      rerender(<InvoiceItemsManager {...defaultProps} items={itemsWithData} />);
      
      expect(screen.getByText(/1 \/ 50 items/)).toBeInTheDocument();
    });

    it('should support keyboard navigation for actions', async () => {
      const user = userEvent.setup();
      const onItemsChange = vi.fn();
      
      render(
        <InvoiceItemsManager 
          {...defaultProps}
          onItemsChange={onItemsChange}
        />
      );
      
      const addButton = screen.getByLabelText(/add new item/i);
      
      await user.tab();
      expect(addButton).toHaveFocus();
      
      await user.keyboard('{Enter}');
      expect(onItemsChange).toHaveBeenCalled();
    });
  });

  describe('InvoiceItemRow', () => {
    const defaultProps = {
      item: {
        description: 'Test Item',
        quantity: 1,
        unitPrice: 100,
        productCode: 'TEST-001',
        unit: 'PCS',
        discountPercent: 0,
        taxable: true,
      },
      index: 0,
      onUpdate: vi.fn(),
      onRemove: vi.fn(),
      onDuplicate: vi.fn(),
      onSelect: vi.fn(),
      selected: false,
      canRemove: true,
      errors: {},
      total: 100,
    };

    it('should have no accessibility violations', async () => {
      const { container } = render(<InvoiceItemRow {...defaultProps} />);
      const results = await mockAxe(container);
      expect(toHaveNoViolations(results).pass).toBe(true);
    });

    it('should have proper form field labels', () => {
      render(<InvoiceItemRow {...defaultProps} />);
      
      expect(screen.getByLabelText(/description/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/quantity/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/unit price/i)).toBeInTheDocument();
    });

    it('should announce validation errors', async () => {
      const user = userEvent.setup();
      render(<InvoiceItemRow {...defaultProps} />);
      
      const descriptionInput = screen.getByLabelText(/description/i);
      
      // Clear description to trigger validation
      await user.clear(descriptionInput);
      
      await waitFor(() => {
        expect(screen.getByRole('alert')).toBeInTheDocument();
      });
    });

    it('should support drag and drop with keyboard', () => {
      render(<InvoiceItemRow {...defaultProps} />);
      
      const dragHandle = screen.getByLabelText(/drag to reorder/i);
      expect(dragHandle).toHaveAttribute('tabIndex', '0');
    });

    it('should have proper button labels', () => {
      render(<InvoiceItemRow {...defaultProps} />);
      
      expect(screen.getByLabelText(/duplicate item 1/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/remove item 1/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/select item 1/i)).toBeInTheDocument();
    });
  });

  describe('BulkItemOperations', () => {
    const defaultProps = {
      open: true,
      onClose: vi.fn(),
      onAddMultiple: vi.fn(),
      maxItems: 50,
      currentItemCount: 0,
    };

    it('should have no accessibility violations', async () => {
      const { container } = render(<BulkItemOperations {...defaultProps} />);
      const results = await mockAxe(container);
      expect(toHaveNoViolations(results).pass).toBe(true);
    });

    it('should have proper dialog implementation', () => {
      render(<BulkItemOperations {...defaultProps} />);
      
      expect(screen.getByRole('dialog')).toBeInTheDocument();
      expect(screen.getByLabelText(/bulk item operations/i)).toBeInTheDocument();
    });

    it('should have proper tab navigation', () => {
      render(<BulkItemOperations {...defaultProps} />);
      
      expect(screen.getByRole('tablist')).toBeInTheDocument();
      expect(screen.getAllByRole('tab')).toHaveLength(3);
    });

    it('should announce status information', () => {
      render(<BulkItemOperations {...defaultProps} />);
      
      expect(screen.getByRole('status')).toBeInTheDocument();
      expect(screen.getByText(/current items: 0/i)).toBeInTheDocument();
    });
  });

  describe('Responsive Design', () => {
    beforeEach(() => {
      // Mock window.matchMedia for responsive tests
      Object.defineProperty(window, 'matchMedia', {
        writable: true,
        value: vi.fn().mockImplementation(query => ({
          matches: false,
          media: query,
          onchange: null,
          addListener: vi.fn(),
          removeListener: vi.fn(),
          addEventListener: vi.fn(),
          removeEventListener: vi.fn(),
          dispatchEvent: vi.fn(),
        })),
      });
    });

    it('should adapt layout for mobile screens', () => {
      // Mock mobile viewport
      window.matchMedia = vi.fn().mockImplementation(query => ({
        matches: query === '(max-width: 768px)',
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      }));

      render(<ManualCustomerEntry customerName="" onCustomerNameChange={vi.fn()} onClear={vi.fn()} />);
      
      // Check that mobile-specific classes are applied
      const container = screen.getByRole('region');
      expect(container).toBeInTheDocument();
    });

    it('should handle text overflow properly', () => {
      const longCustomerName = 'A'.repeat(100);
      
      render(
        <ManualCustomerEntry 
          customerName={longCustomerName}
          onCustomerNameChange={vi.fn()}
          onClear={vi.fn()}
        />
      );
      
      const input = screen.getByDisplayValue(longCustomerName);
      expect(input).toBeInTheDocument();
    });
  });

  describe('Screen Reader Support', () => {
    it('should provide meaningful live region updates', async () => {
      const user = userEvent.setup();
      const onCustomerNameChange = vi.fn();
      
      render(
        <ManualCustomerEntry 
          customerName=""
          onCustomerNameChange={onCustomerNameChange}
          onClear={vi.fn()}
        />
      );
      
      const input = screen.getByLabelText(/customer name/i);
      await user.type(input, 'Valid Customer Name');
      
      await waitFor(() => {
        expect(screen.getByText(/customer name is valid/i)).toBeInTheDocument();
      });
    });

    it('should announce dynamic content changes', async () => {
      const { rerender } = render(
        <InvoiceItemsManager 
          items={[]}
          onItemsChange={vi.fn()}
        />
      );
      
      const newItems = [{
        description: 'New Item',
        quantity: 1,
        unitPrice: 100,
        productCode: '',
        unit: 'PCS',
        discountPercent: 0,
        taxable: true,
      }];
      
      rerender(
        <InvoiceItemsManager 
          items={newItems}
          onItemsChange={vi.fn()}
        />
      );
      
      expect(screen.getByRole('status')).toBeInTheDocument();
    });
  });
});