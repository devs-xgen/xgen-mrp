import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BillingSummaryCard, BillingCalculations } from '@/components/module/admin/billing/summary/billing-summary-card';

// Mock the currency formatting function
vi.mock('@/lib/constant', () => ({
  formatCurrencyPHP: (value: number) => `₱${value.toFixed(2)}`,
}));

// Mock the decimal conversion function
vi.mock('@/lib/convertDecimals', () => ({
  convertDecimals: (obj: any) => obj,
}));

// Mock lucide-react icons
vi.mock('lucide-react', () => ({
  Calculator: ({ className }: { className?: string }) => <div data-testid="calculator-icon" className={className} />,
  TrendingUp: ({ className }: { className?: string }) => <div data-testid="trending-up-icon" className={className} />,
  AlertCircle: ({ className }: { className?: string }) => <div data-testid="alert-circle-icon" className={className} />,
  CheckCircle2: ({ className }: { className?: string }) => <div data-testid="check-circle-2-icon" className={className} />,
}));

describe('BillingSummaryCard', () => {
  const mockCalculations: BillingCalculations = {
    subtotal: 1000,
    taxRate: 12,
    taxAmount: 120,
    discountAmount: 50,
    totalAmount: 1070,
    netAmount: 1070,
  };

  const mockOnCalculationChange = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('renders billing summary card with correct title', () => {
      render(
        <BillingSummaryCard
          calculations={mockCalculations}
          onCalculationChange={mockOnCalculationChange}
        />
      );

      expect(screen.getByText('Billing Summary')).toBeInTheDocument();
      expect(screen.getByText('Summary')).toBeInTheDocument();
    });

    it('displays all calculation fields correctly', () => {
      render(
        <BillingSummaryCard
          calculations={mockCalculations}
          onCalculationChange={mockOnCalculationChange}
        />
      );

      expect(screen.getByDisplayValue('1000')).toBeInTheDocument(); // Subtotal
      expect(screen.getByDisplayValue('12')).toBeInTheDocument(); // Tax rate
      expect(screen.getByText('₱120.00')).toBeInTheDocument(); // Tax amount
      expect(screen.getByDisplayValue('50')).toBeInTheDocument(); // Discount
      expect(screen.getByText('₱1070.00')).toBeInTheDocument(); // Total amount
      expect(screen.getByText('₱1070.00')).toBeInTheDocument(); // Net amount
    });

    it('shows auto-calculation badges when autoCalculate is enabled', () => {
      render(
        <BillingSummaryCard
          calculations={mockCalculations}
          onCalculationChange={mockOnCalculationChange}
          autoCalculate={true}
        />
      );

      const autoBadges = screen.getAllByText('Auto');
      expect(autoBadges).toHaveLength(2); // Tax amount and total amount
    });

    it('renders in read-only mode when isEditable is false', () => {
      render(
        <BillingSummaryCard
          calculations={mockCalculations}
          onCalculationChange={mockOnCalculationChange}
          isEditable={false}
        />
      );

      // Should show formatted currency values instead of input fields
      expect(screen.getByText('₱1000.00')).toBeInTheDocument(); // Subtotal
      expect(screen.getByText('12%')).toBeInTheDocument(); // Tax rate
      expect(screen.getByText('-₱50.00')).toBeInTheDocument(); // Discount
    });
  });

  describe('Calculation Changes', () => {
    it('calls onCalculationChange when subtotal is modified', async () => {
      render(
        <BillingSummaryCard
          calculations={mockCalculations}
          onCalculationChange={mockOnCalculationChange}
        />
      );

      const subtotalInput = screen.getByDisplayValue('1000');
      fireEvent.change(subtotalInput, { target: { value: '1200' } });

      await waitFor(() => {
        expect(mockOnCalculationChange).toHaveBeenCalledWith('subtotal', 1200);
      });
    });

    it('calls onCalculationChange when tax rate is modified', async () => {
      render(
        <BillingSummaryCard
          calculations={mockCalculations}
          onCalculationChange={mockOnCalculationChange}
        />
      );

      const taxRateInput = screen.getByDisplayValue('12');
      fireEvent.change(taxRateInput, { target: { value: '15' } });

      await waitFor(() => {
        expect(mockOnCalculationChange).toHaveBeenCalledWith('taxRate', 15);
      });
    });

    it('calls onCalculationChange when discount amount is modified', async () => {
      render(
        <BillingSummaryCard
          calculations={mockCalculations}
          onCalculationChange={mockOnCalculationChange}
        />
      );

      const discountInput = screen.getByDisplayValue('50');
      fireEvent.change(discountInput, { target: { value: '100' } });

      await waitFor(() => {
        expect(mockOnCalculationChange).toHaveBeenCalledWith('discountAmount', 100);
      });
    });

    it('handles recalculate button click', async () => {
      render(
        <BillingSummaryCard
          calculations={mockCalculations}
          onCalculationChange={mockOnCalculationChange}
          autoCalculate={true}
        />
      );

      const recalculateButton = screen.getByText('Recalculate');
      fireEvent.click(recalculateButton);

      await waitFor(() => {
        expect(mockOnCalculationChange).toHaveBeenCalled();
      });
    });
  });

  describe('Validation', () => {
    it('shows validation errors when showValidation is true', () => {
      const invalidCalculations: BillingCalculations = {
        subtotal: -100, // Invalid negative subtotal
        taxRate: 150, // Invalid tax rate > 100%
        taxAmount: 0,
        discountAmount: 0,
        totalAmount: 0,
        netAmount: 0,
      };

      render(
        <BillingSummaryCard
          calculations={invalidCalculations}
          onCalculationChange={mockOnCalculationChange}
          showValidation={true}
        />
      );

      expect(screen.getByText('Please fix calculation errors before proceeding.')).toBeInTheDocument();
    });

    it('shows warning messages for unusual values', () => {
      const warningCalculations: BillingCalculations = {
        subtotal: 1000,
        taxRate: 75, // High tax rate should trigger warning
        taxAmount: 750,
        discountAmount: 600, // Large discount should trigger warning
        totalAmount: 1150,
        netAmount: 1150,
      };

      render(
        <BillingSummaryCard
          calculations={warningCalculations}
          onCalculationChange={mockOnCalculationChange}
          showValidation={true}
        />
      );

      expect(screen.getByText('Please review the highlighted calculations.')).toBeInTheDocument();
    });

    it('calls onValidationChange when validation state changes', () => {
      const mockOnValidationChange = vi.fn();

      render(
        <BillingSummaryCard
          calculations={mockCalculations}
          onCalculationChange={mockOnCalculationChange}
          onValidationChange={mockOnValidationChange}
        />
      );

      expect(mockOnValidationChange).toHaveBeenCalledWith(true);
    });
  });

  describe('Auto-calculation', () => {
    it('auto-calculates tax amount when subtotal changes', async () => {
      const { rerender } = render(
        <BillingSummaryCard
          calculations={mockCalculations}
          onCalculationChange={mockOnCalculationChange}
          autoCalculate={true}
        />
      );

      const subtotalInput = screen.getByDisplayValue('1000');
      fireEvent.change(subtotalInput, { target: { value: '2000' } });

      // Simulate the parent component updating the calculations
      const updatedCalculations: BillingCalculations = {
        ...mockCalculations,
        subtotal: 2000,
        taxAmount: 240, // 2000 * 12% = 240
        totalAmount: 2190, // 2000 + 240 - 50 = 2190
        netAmount: 2190,
      };

      rerender(
        <BillingSummaryCard
          calculations={updatedCalculations}
          onCalculationChange={mockOnCalculationChange}
          autoCalculate={true}
        />
      );

      expect(screen.getByText('₱240.00')).toBeInTheDocument(); // Updated tax amount
      expect(screen.getByText('₱2190.00')).toBeInTheDocument(); // Updated total amount
    });

    it('auto-calculates total amount when tax rate changes', async () => {
      const { rerender } = render(
        <BillingSummaryCard
          calculations={mockCalculations}
          onCalculationChange={mockOnCalculationChange}
          autoCalculate={true}
        />
      );

      const taxRateInput = screen.getByDisplayValue('12');
      fireEvent.change(taxRateInput, { target: { value: '15' } });

      // Simulate the parent component updating the calculations
      const updatedCalculations: BillingCalculations = {
        ...mockCalculations,
        taxRate: 15,
        taxAmount: 150, // 1000 * 15% = 150
        totalAmount: 1100, // 1000 + 150 - 50 = 1100
        netAmount: 1100,
      };

      rerender(
        <BillingSummaryCard
          calculations={updatedCalculations}
          onCalculationChange={mockOnCalculationChange}
          autoCalculate={true}
        />
      );

      expect(screen.getByText('₱150.00')).toBeInTheDocument(); // Updated tax amount
      expect(screen.getByText('₱1100.00')).toBeInTheDocument(); // Updated total amount
    });
  });

  describe('Calculation Summary', () => {
    it('displays effective tax rate correctly', () => {
      render(
        <BillingSummaryCard
          calculations={mockCalculations}
          onCalculationChange={mockOnCalculationChange}
        />
      );

      // Effective tax rate should be (120 / 1000) * 100 = 12.00%
      expect(screen.getByText(/Effective Tax Rate: 12\.00%/)).toBeInTheDocument();
    });

    it('displays discount rate correctly', () => {
      render(
        <BillingSummaryCard
          calculations={mockCalculations}
          onCalculationChange={mockOnCalculationChange}
        />
      );

      // Discount rate should be (50 / 1000) * 100 = 5.00%
      expect(screen.getByText(/Discount Rate: 5\.00%/)).toBeInTheDocument();
    });

    it('shows auto-calculation enabled indicator', () => {
      render(
        <BillingSummaryCard
          calculations={mockCalculations}
          onCalculationChange={mockOnCalculationChange}
          autoCalculate={true}
        />
      );

      expect(screen.getByText('Auto-calculation enabled')).toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    it('handles invalid input gracefully', async () => {
      render(
        <BillingSummaryCard
          calculations={mockCalculations}
          onCalculationChange={mockOnCalculationChange}
        />
      );

      const subtotalInput = screen.getByDisplayValue('1000');
      fireEvent.change(subtotalInput, { target: { value: 'invalid' } });

      await waitFor(() => {
        expect(mockOnCalculationChange).toHaveBeenCalledWith('subtotal', 0);
      });
    });

    it('handles empty input gracefully', async () => {
      render(
        <BillingSummaryCard
          calculations={mockCalculations}
          onCalculationChange={mockOnCalculationChange}
        />
      );

      const subtotalInput = screen.getByDisplayValue('1000');
      fireEvent.change(subtotalInput, { target: { value: '' } });

      await waitFor(() => {
        expect(mockOnCalculationChange).toHaveBeenCalledWith('subtotal', 0);
      });
    });
  });

  describe('Accessibility', () => {
    it('has proper labels for all input fields', () => {
      render(
        <BillingSummaryCard
          calculations={mockCalculations}
          onCalculationChange={mockOnCalculationChange}
        />
      );

      expect(screen.getByLabelText(/Subtotal/)).toBeInTheDocument();
      expect(screen.getByLabelText(/Tax Rate/)).toBeInTheDocument();
      expect(screen.getByLabelText(/Discount/)).toBeInTheDocument();
    });

    it('has proper ARIA attributes for validation states', () => {
      const invalidCalculations: BillingCalculations = {
        subtotal: -100,
        taxRate: 12,
        taxAmount: 0,
        discountAmount: 0,
        totalAmount: 0,
        netAmount: 0,
      };

      render(
        <BillingSummaryCard
          calculations={invalidCalculations}
          onCalculationChange={mockOnCalculationChange}
          showValidation={true}
        />
      );

      const subtotalInput = screen.getByDisplayValue('-100');
      expect(subtotalInput).toHaveClass('border-destructive');
    });
  });

  describe('Performance', () => {
    it('does not cause unnecessary re-renders', () => {
      const { rerender } = render(
        <BillingSummaryCard
          calculations={mockCalculations}
          onCalculationChange={mockOnCalculationChange}
        />
      );

      // Re-render with same props should not cause issues
      rerender(
        <BillingSummaryCard
          calculations={mockCalculations}
          onCalculationChange={mockOnCalculationChange}
        />
      );

      expect(screen.getByText('Billing Summary')).toBeInTheDocument();
    });

    it('handles rapid input changes gracefully', async () => {
      render(
        <BillingSummaryCard
          calculations={mockCalculations}
          onCalculationChange={mockOnCalculationChange}
        />
      );

      const subtotalInput = screen.getByDisplayValue('1000');
      
      // Simulate rapid changes
      fireEvent.change(subtotalInput, { target: { value: '1100' } });
      fireEvent.change(subtotalInput, { target: { value: '1200' } });
      fireEvent.change(subtotalInput, { target: { value: '1300' } });

      await waitFor(() => {
        expect(mockOnCalculationChange).toHaveBeenCalledWith('subtotal', 1300);
      });
    });
  });
});