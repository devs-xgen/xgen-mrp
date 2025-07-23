import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CustomerSummaryCard, CustomerInfo } from '@/components/module/admin/billing/summary/customer-summary-card';
import { Customer } from '@/types/admin/billing';
import { CustomerOrder } from '@/types/admin/customer-order';

// Mock the currency formatting function
vi.mock('@/lib/constant', () => ({
  formatCurrencyPHP: (value: number) => `₱${value.toFixed(2)}`,
}));

describe('CustomerSummaryCard', () => {
  const mockCustomer: Customer = {
    id: '1',
    name: 'Test Customer',
    code: 'CUST001',
    email: 'test@example.com',
    phone: '+1234567890',
    address: '123 Test Street',
    city: 'Test City',
    state: 'Test State',
    country: 'Test Country',
    postalCode: '12345',
    tinNumber: 'TIN123456',
    status: 'ACTIVE',
  };

  const mockCustomerOrder: CustomerOrder = {
    id: '1',
    orderNumber: 'ORD001',
    customerId: '1',
    orderDate: new Date('2024-01-01'),
    requiredDate: new Date('2024-01-15'),
    status: 'CONFIRMED',
    totalAmount: 1500,
    customer: mockCustomer,
  };

  const mockDirectCustomerInfo: CustomerInfo = {
    name: 'Test Customer',
    source: 'customer',
    billingType: 'direct-customer',
    details: mockCustomer,
    isAutoPopulated: true,
    lastModified: new Date('2024-01-01'),
  };

  const mockCustomerOrderInfo: CustomerInfo = {
    name: 'Test Customer',
    source: 'order',
    billingType: 'customer-order',
    details: mockCustomerOrder,
    isAutoPopulated: true,
    lastModified: new Date('2024-01-01'),
  };

  const mockManualCustomerInfo: CustomerInfo = {
    name: 'Manual Customer',
    source: 'manual',
    billingType: 'manual-customer',
    isAutoPopulated: false,
    lastModified: new Date('2024-01-01'),
  };

  const mockOnEdit = vi.fn();
  const mockOnClear = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('renders customer summary card with correct title', () => {
      render(
        <CustomerSummaryCard
          customerInfo={mockDirectCustomerInfo}
          onEdit={mockOnEdit}
          onClear={mockOnClear}
        />
      );

      expect(screen.getByText('Customer Information')).toBeInTheDocument();
    });

    it('displays customer name correctly', () => {
      render(
        <CustomerSummaryCard
          customerInfo={mockDirectCustomerInfo}
          onEdit={mockOnEdit}
          onClear={mockOnClear}
        />
      );

      expect(screen.getByText('Test Customer')).toBeInTheDocument();
    });

    it('shows no customer information message when customerInfo is undefined', () => {
      render(
        <CustomerSummaryCard
          onEdit={mockOnEdit}
          onClear={mockOnClear}
        />
      );

      expect(screen.getByText('No customer information selected. Please select a billing type and customer.')).toBeInTheDocument();
    });

    it('displays validation status icons correctly', () => {
      render(
        <CustomerSummaryCard
          customerInfo={mockDirectCustomerInfo}
          onEdit={mockOnEdit}
          onClear={mockOnClear}
        />
      );

      // Should show success icon for valid customer info
      const successIcon = screen.getByTestId('check-circle-2') || screen.querySelector('[data-testid="check-circle-2"]');
      // Note: The exact test depends on how the icon is rendered
    });
  });

  describe('Direct Customer Display', () => {
    it('displays direct customer details correctly', () => {
      render(
        <CustomerSummaryCard
          customerInfo={mockDirectCustomerInfo}
          onEdit={mockOnEdit}
          onClear={mockOnClear}
        />
      );

      expect(screen.getByText('Direct Customer')).toBeInTheDocument();
      expect(screen.getByText('Customer #CUST001')).toBeInTheDocument();
      expect(screen.getByText('test@example.com')).toBeInTheDocument();
      expect(screen.getByText('+1234567890')).toBeInTheDocument();
      expect(screen.getByText('123 Test Street')).toBeInTheDocument();
      expect(screen.getByText('ACTIVE')).toBeInTheDocument();
    });

    it('shows auto-populated badge for direct customer', () => {
      render(
        <CustomerSummaryCard
          customerInfo={mockDirectCustomerInfo}
          onEdit={mockOnEdit}
          onClear={mockOnClear}
        />
      );

      expect(screen.getByText('Auto-populated')).toBeInTheDocument();
    });

    it('displays billing type description for direct customer', () => {
      render(
        <CustomerSummaryCard
          customerInfo={mockDirectCustomerInfo}
          onEdit={mockOnEdit}
          onClear={mockOnClear}
        />
      );

      expect(screen.getByText('Billing to existing customer')).toBeInTheDocument();
    });
  });

  describe('Customer Order Display', () => {
    it('displays customer order details correctly', () => {
      render(
        <CustomerSummaryCard
          customerInfo={mockCustomerOrderInfo}
          onEdit={mockOnEdit}
          onClear={mockOnClear}
        />
      );

      expect(screen.getByText('Customer Order')).toBeInTheDocument();
      expect(screen.getByText('Order #ORD001')).toBeInTheDocument();
      expect(screen.getByText('Order Date: 1/1/2024')).toBeInTheDocument();
      expect(screen.getByText('Amount: ₱1500.00')).toBeInTheDocument();
    });

    it('displays customer details within order information', () => {
      render(
        <CustomerSummaryCard
          customerInfo={mockCustomerOrderInfo}
          onEdit={mockOnEdit}
          onClear={mockOnClear}
        />
      );

      expect(screen.getByText('Customer Details:')).toBeInTheDocument();
      expect(screen.getByText('test@example.com')).toBeInTheDocument();
      expect(screen.getByText('+1234567890')).toBeInTheDocument();
    });

    it('shows billing type description for customer order', () => {
      render(
        <CustomerSummaryCard
          customerInfo={mockCustomerOrderInfo}
          onEdit={mockOnEdit}
          onClear={mockOnClear}
        />
      );

      expect(screen.getByText('Billing from existing customer order')).toBeInTheDocument();
    });
  });

  describe('Manual Customer Display', () => {
    it('displays manual customer details correctly', () => {
      render(
        <CustomerSummaryCard
          customerInfo={mockManualCustomerInfo}
          onEdit={mockOnEdit}
          onClear={mockOnClear}
        />
      );

      expect(screen.getByText('Manual Customer')).toBeInTheDocument();
      expect(screen.getByText('Manual Entry')).toBeInTheDocument();
      expect(screen.getByText('Customer information entered manually. Consider adding to customer database for future use.')).toBeInTheDocument();
    });

    it('does not show auto-populated badge for manual customer', () => {
      render(
        <CustomerSummaryCard
          customerInfo={mockManualCustomerInfo}
          onEdit={mockOnEdit}
          onClear={mockOnClear}
        />
      );

      expect(screen.queryByText('Auto-populated')).not.toBeInTheDocument();
    });

    it('shows billing type description for manual customer', () => {
      render(
        <CustomerSummaryCard
          customerInfo={mockManualCustomerInfo}
          onEdit={mockOnEdit}
          onClear={mockOnClear}
        />
      );

      expect(screen.getByText('Manually entered customer information')).toBeInTheDocument();
    });
  });

  describe('Validation', () => {
    it('shows error for missing customer name', () => {
      const invalidCustomerInfo: CustomerInfo = {
        name: '',
        source: 'manual',
        billingType: 'manual-customer',
        isAutoPopulated: false,
      };

      render(
        <CustomerSummaryCard
          customerInfo={invalidCustomerInfo}
          onEdit={mockOnEdit}
          onClear={mockOnClear}
        />
      );

      expect(screen.getByText('Customer name is required')).toBeInTheDocument();
    });

    it('shows warning for missing customer details in direct customer billing', () => {
      const warningCustomerInfo: CustomerInfo = {
        name: 'Test Customer',
        source: 'customer',
        billingType: 'direct-customer',
        isAutoPopulated: false,
      };

      render(
        <CustomerSummaryCard
          customerInfo={warningCustomerInfo}
          onEdit={mockOnEdit}
          onClear={mockOnClear}
        />
      );

      expect(screen.getByText('Customer details not loaded from database')).toBeInTheDocument();
    });

    it('shows warning for short customer name in manual entry', () => {
      const warningCustomerInfo: CustomerInfo = {
        name: 'AB',
        source: 'manual',
        billingType: 'manual-customer',
        isAutoPopulated: false,
      };

      render(
        <CustomerSummaryCard
          customerInfo={warningCustomerInfo}
          onEdit={mockOnEdit}
          onClear={mockOnClear}
        />
      );

      expect(screen.getByText('Customer name seems too short')).toBeInTheDocument();
    });
  });

  describe('Compact Mode', () => {
    it('renders in compact mode correctly', () => {
      render(
        <CustomerSummaryCard
          customerInfo={mockDirectCustomerInfo}
          onEdit={mockOnEdit}
          onClear={mockOnClear}
          compact={true}
        />
      );

      expect(screen.getByText('More')).toBeInTheDocument();
    });

    it('toggles expanded state in compact mode', () => {
      render(
        <CustomerSummaryCard
          customerInfo={mockDirectCustomerInfo}
          onEdit={mockOnEdit}
          onClear={mockOnClear}
          compact={true}
        />
      );

      const toggleButton = screen.getByText('More');
      fireEvent.click(toggleButton);

      expect(screen.getByText('Less')).toBeInTheDocument();
    });
  });

  describe('Action Buttons', () => {
    it('calls onEdit when edit button is clicked', () => {
      render(
        <CustomerSummaryCard
          customerInfo={mockDirectCustomerInfo}
          onEdit={mockOnEdit}
          onClear={mockOnClear}
        />
      );

      const editButton = screen.getByText('Edit');
      fireEvent.click(editButton);

      expect(mockOnEdit).toHaveBeenCalledTimes(1);
    });

    it('calls onClear when clear button is clicked', () => {
      render(
        <CustomerSummaryCard
          customerInfo={mockDirectCustomerInfo}
          onEdit={mockOnEdit}
          onClear={mockOnClear}
        />
      );

      const clearButton = screen.getByText('Clear');
      fireEvent.click(clearButton);

      expect(mockOnClear).toHaveBeenCalledTimes(1);
    });

    it('hides edit button when showEditButton is false', () => {
      render(
        <CustomerSummaryCard
          customerInfo={mockDirectCustomerInfo}
          onEdit={mockOnEdit}
          onClear={mockOnClear}
          showEditButton={false}
        />
      );

      expect(screen.queryByText('Edit')).not.toBeInTheDocument();
    });

    it('hides clear button when showClearButton is false', () => {
      render(
        <CustomerSummaryCard
          customerInfo={mockDirectCustomerInfo}
          onEdit={mockOnEdit}
          onClear={mockOnClear}
          showClearButton={false}
        />
      );

      expect(screen.queryByText('Clear')).not.toBeInTheDocument();
    });

    it('hides both buttons when callbacks are not provided', () => {
      render(
        <CustomerSummaryCard
          customerInfo={mockDirectCustomerInfo}
        />
      );

      expect(screen.queryByText('Edit')).not.toBeInTheDocument();
      expect(screen.queryByText('Clear')).not.toBeInTheDocument();
    });
  });

  describe('Last Modified Display', () => {
    it('displays last modified date when provided', () => {
      render(
        <CustomerSummaryCard
          customerInfo={mockDirectCustomerInfo}
          onEdit={mockOnEdit}
          onClear={mockOnClear}
        />
      );

      expect(screen.getByText(/Last updated:/)).toBeInTheDocument();
    });

    it('does not display last modified when not provided', () => {
      const customerInfoWithoutDate: CustomerInfo = {
        ...mockDirectCustomerInfo,
        lastModified: undefined,
      };

      render(
        <CustomerSummaryCard
          customerInfo={customerInfoWithoutDate}
          onEdit={mockOnEdit}
          onClear={mockOnClear}
        />
      );

      expect(screen.queryByText(/Last updated:/)).not.toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('has proper heading structure', () => {
      render(
        <CustomerSummaryCard
          customerInfo={mockDirectCustomerInfo}
          onEdit={mockOnEdit}
          onClear={mockOnClear}
        />
      );

      expect(screen.getByRole('heading', { name: 'Customer Information' })).toBeInTheDocument();
    });

    it('has proper button labels', () => {
      render(
        <CustomerSummaryCard
          customerInfo={mockDirectCustomerInfo}
          onEdit={mockOnEdit}
          onClear={mockOnClear}
        />
      );

      expect(screen.getByRole('button', { name: 'Edit' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Clear' })).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('handles customer without email gracefully', () => {
      const customerWithoutEmail: Customer = {
        ...mockCustomer,
        email: '',
      };

      const customerInfo: CustomerInfo = {
        ...mockDirectCustomerInfo,
        details: customerWithoutEmail,
      };

      render(
        <CustomerSummaryCard
          customerInfo={customerInfo}
          onEdit={mockOnEdit}
          onClear={mockOnClear}
        />
      );

      expect(screen.queryByText('test@example.com')).not.toBeInTheDocument();
    });

    it('handles customer order without customer details gracefully', () => {
      const orderWithoutCustomer: CustomerOrder = {
        ...mockCustomerOrder,
        customer: undefined,
      };

      const customerInfo: CustomerInfo = {
        ...mockCustomerOrderInfo,
        details: orderWithoutCustomer,
      };

      render(
        <CustomerSummaryCard
          customerInfo={customerInfo}
          onEdit={mockOnEdit}
          onClear={mockOnClear}
        />
      );

      expect(screen.queryByText('Customer Details:')).not.toBeInTheDocument();
    });

    it('handles unknown billing type gracefully', () => {
      const unknownBillingTypeInfo: CustomerInfo = {
        ...mockDirectCustomerInfo,
        billingType: 'unknown-type' as any,
      };

      render(
        <CustomerSummaryCard
          customerInfo={unknownBillingTypeInfo}
          onEdit={mockOnEdit}
          onClear={mockOnClear}
        />
      );

      expect(screen.getByText('Unknown billing type')).toBeInTheDocument();
    });
  });
});