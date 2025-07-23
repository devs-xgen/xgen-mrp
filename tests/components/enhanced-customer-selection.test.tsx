import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { EnhancedCustomerSelection } from '@/components/module/admin/billing/enhanced-customer-selection';
import { Customer } from '@/types/admin/billing';
import { CustomerOrder } from '@/types/admin/customer-order';

// Mock the formatCurrencyPHP function
vi.mock('@/lib/constant', () => ({
  formatCurrencyPHP: (amount: number) => `₱${amount.toLocaleString('en-PH', { minimumFractionDigits: 2 })}`,
}));

const mockCustomers: Customer[] = [
  {
    id: '1',
    name: 'John Doe',
    code: 'CUST-001',
    email: 'john@example.com',
    phone: '+63 912 345 6789',
    status: 'ACTIVE',
  },
  {
    id: '2',
    name: 'Jane Smith',
    code: 'CUST-002',
    email: 'jane@example.com',
    phone: '+63 917 123 4567',
    status: 'ACTIVE',
  },
];

const mockCustomerOrders: CustomerOrder[] = [
  {
    id: '1',
    orderNumber: 'ORD-001',
    customerId: 'cust-1',
    orderDate: new Date('2024-01-15'),
    requiredDate: new Date('2024-02-15'),
    status: 'CONFIRMED' as any,
    totalAmount: 15000,
    customer: {
      id: 'cust-1',
      name: 'John Doe',
      email: 'john@example.com',
    },
    orderLines: [],
  },
];

describe('EnhancedCustomerSelection', () => {
  const mockOnSelectionChange = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders correctly with default state', () => {
    render(
      <EnhancedCustomerSelection
        customers={mockCustomers}
        customerOrders={mockCustomerOrders}
        onSelectionChange={mockOnSelectionChange}
      />
    );

    expect(screen.getByText('Customer Information')).toBeInTheDocument();
    expect(screen.getByText('Choose how you want to specify the customer for this billing statement')).toBeInTheDocument();
  });

  it('shows all three tabs', () => {
    render(
      <EnhancedCustomerSelection
        customers={mockCustomers}
        customerOrders={mockCustomerOrders}
        onSelectionChange={mockOnSelectionChange}
      />
    );

    expect(screen.getByText('Customer Order')).toBeInTheDocument();
    expect(screen.getByText('Direct Customer')).toBeInTheDocument();
    expect(screen.getByText('Manual Entry')).toBeInTheDocument();
  });

  it('defaults to customer-order tab', () => {
    render(
      <EnhancedCustomerSelection
        customers={mockCustomers}
        customerOrders={mockCustomerOrders}
        onSelectionChange={mockOnSelectionChange}
      />
    );

    expect(screen.getByText('Customer Order Billing:')).toBeInTheDocument();
    expect(screen.getByText('Create billing from an existing customer order with pre-filled details')).toBeInTheDocument();
  });

  it('allows changing tabs', async () => {
    render(
      <EnhancedCustomerSelection
        customers={mockCustomers}
        customerOrders={mockCustomerOrders}
        onSelectionChange={mockOnSelectionChange}
      />
    );

    const directCustomerTab = screen.getByText('Direct Customer');
    fireEvent.click(directCustomerTab);

    await waitFor(() => {
      expect(screen.getByText('Direct Customer Billing:')).toBeInTheDocument();
      expect(screen.getByText('Create billing for an existing customer from your database')).toBeInTheDocument();
    });
  });

  it('calls onSelectionChange when tab changes', async () => {
    render(
      <EnhancedCustomerSelection
        customers={mockCustomers}
        customerOrders={mockCustomerOrders}
        onSelectionChange={mockOnSelectionChange}
      />
    );

    const manualEntryTab = screen.getByText('Manual Entry');
    fireEvent.click(manualEntryTab);

    await waitFor(() => {
      expect(mockOnSelectionChange).toHaveBeenCalledWith(
        expect.objectContaining({
          billingType: 'manual-customer',
          customerName: '',
        })
      );
    });
  });

  it('calls onSelectionChange when customer order is selected', async () => {
    render(
      <EnhancedCustomerSelection
        customers={mockCustomers}
        customerOrders={mockCustomerOrders}
        onSelectionChange={mockOnSelectionChange}
      />
    );

    const selector = screen.getByRole('combobox');
    fireEvent.click(selector);

    await waitFor(() => {
      const orderOption = screen.getByText('ORD-001');
      fireEvent.click(orderOption);
    });

    expect(mockOnSelectionChange).toHaveBeenCalledWith(
      expect.objectContaining({
        billingType: 'customer-order',
        customerName: 'John Doe',
        customerOrderId: '1',
        selectedOrder: mockCustomerOrders[0],
      })
    );
  });

  it('calls onSelectionChange when direct customer is selected', async () => {
    render(
      <EnhancedCustomerSelection
        customers={mockCustomers}
        customerOrders={mockCustomerOrders}
        onSelectionChange={mockOnSelectionChange}
      />
    );

    const directCustomerTab = screen.getByText('Direct Customer');
    fireEvent.click(directCustomerTab);

    await waitFor(() => {
      const selector = screen.getByRole('combobox');
      fireEvent.click(selector);
    });

    await waitFor(() => {
      const customerOption = screen.getByText('John Doe');
      fireEvent.click(customerOption);
    });

    expect(mockOnSelectionChange).toHaveBeenCalledWith(
      expect.objectContaining({
        billingType: 'direct-customer',
        customerName: 'John Doe',
        customerId: '1',
        selectedCustomer: mockCustomers[0],
      })
    );
  });

  it('calls onSelectionChange when manual customer name is entered', async () => {
    render(
      <EnhancedCustomerSelection
        customers={mockCustomers}
        customerOrders={mockCustomerOrders}
        onSelectionChange={mockOnSelectionChange}
      />
    );

    const manualEntryTab = screen.getByText('Manual Entry');
    fireEvent.click(manualEntryTab);

    // Wait for tab to be active and content to be visible
    await waitFor(() => {
      expect(screen.getByText('Manual Customer Entry:')).toBeInTheDocument();
    });

    const nameInput = screen.getByPlaceholderText('Enter customer name...');
    fireEvent.change(nameInput, { target: { value: 'Custom Customer' } });

    expect(mockOnSelectionChange).toHaveBeenCalledWith(
      expect.objectContaining({
        billingType: 'manual-customer',
        customerName: 'Custom Customer',
        manualCustomerDetails: expect.objectContaining({
          name: 'Custom Customer',
        }),
      })
    );
  });

  it('shows selection summary when customer is selected', () => {
    const selectedData = {
      billingType: 'customer-order' as const,
      customerName: 'John Doe',
      customerOrderId: '1',
      selectedOrder: mockCustomerOrders[0],
    };

    render(
      <EnhancedCustomerSelection
        customers={mockCustomers}
        customerOrders={mockCustomerOrders}
        selectedData={selectedData}
        onSelectionChange={mockOnSelectionChange}
      />
    );

    expect(screen.getByText('Selected Customer:')).toBeInTheDocument();
    expect(screen.getAllByText('John Doe')).toHaveLength(2); // One in summary, one in order preview
    expect(screen.getByText('via Customer Order')).toBeInTheDocument();
  });

  it('shows reset button when customer is selected', () => {
    const selectedData = {
      billingType: 'customer-order' as const,
      customerName: 'John Doe',
      customerOrderId: '1',
      selectedOrder: mockCustomerOrders[0],
    };

    render(
      <EnhancedCustomerSelection
        customers={mockCustomers}
        customerOrders={mockCustomerOrders}
        selectedData={selectedData}
        onSelectionChange={mockOnSelectionChange}
      />
    );

    expect(screen.getByText('Reset')).toBeInTheDocument();
  });

  it('resets selection when reset button is clicked', () => {
    const selectedData = {
      billingType: 'customer-order' as const,
      customerName: 'John Doe',
      customerOrderId: '1',
      selectedOrder: mockCustomerOrders[0],
    };

    render(
      <EnhancedCustomerSelection
        customers={mockCustomers}
        customerOrders={mockCustomerOrders}
        selectedData={selectedData}
        onSelectionChange={mockOnSelectionChange}
      />
    );

    const resetButton = screen.getByText('Reset');
    fireEvent.click(resetButton);

    expect(mockOnSelectionChange).toHaveBeenCalledWith(
      expect.objectContaining({
        billingType: 'customer-order',
        customerName: '',
        customerId: undefined,
        customerOrderId: undefined,
        selectedCustomer: undefined,
        selectedOrder: undefined,
      })
    );
  });

  it('uses provided defaultTab', () => {
    render(
      <EnhancedCustomerSelection
        customers={mockCustomers}
        customerOrders={mockCustomerOrders}
        onSelectionChange={mockOnSelectionChange}
        defaultTab="direct-customer"
      />
    );

    expect(screen.getByText('Direct Customer Billing:')).toBeInTheDocument();
  });

  it('uses selectedData when provided', () => {
    const selectedData = {
      billingType: 'manual-customer' as const,
      customerName: 'Existing Customer',
      manualCustomerDetails: {
        name: 'Existing Customer',
        email: 'existing@example.com',
      },
    };

    render(
      <EnhancedCustomerSelection
        customers={mockCustomers}
        customerOrders={mockCustomerOrders}
        selectedData={selectedData}
        onSelectionChange={mockOnSelectionChange}
      />
    );

    expect(screen.getByText('Manual Customer Entry:')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Existing Customer')).toBeInTheDocument();
  });

  it('handles disabled state correctly', () => {
    render(
      <EnhancedCustomerSelection
        customers={mockCustomers}
        customerOrders={mockCustomerOrders}
        onSelectionChange={mockOnSelectionChange}
        disabled={true}
      />
    );

    const selector = screen.getByRole('combobox');
    expect(selector).toBeDisabled();
  });

  it('handles loading state correctly', () => {
    render(
      <EnhancedCustomerSelection
        customers={mockCustomers}
        customerOrders={mockCustomerOrders}
        onSelectionChange={mockOnSelectionChange}
        loading={true}
      />
    );

    const selector = screen.getByRole('combobox');
    expect(selector).toBeDisabled();
  });

  it('shows correct tab descriptions', () => {
    render(
      <EnhancedCustomerSelection
        customers={mockCustomers}
        customerOrders={mockCustomerOrders}
        onSelectionChange={mockOnSelectionChange}
      />
    );

    // Customer Order tab (default)
    expect(screen.getByText('Create billing from an existing customer order with pre-filled details')).toBeInTheDocument();
    expect(screen.getByText('Customer Order Billing:')).toBeInTheDocument();
  });

  it('clears previous selection when switching tabs', () => {
    render(
      <EnhancedCustomerSelection
        customers={mockCustomers}
        customerOrders={mockCustomerOrders}
        onSelectionChange={mockOnSelectionChange}
      />
    );

    // Switch to direct customer tab
    const directCustomerTab = screen.getByText('Direct Customer');
    fireEvent.click(directCustomerTab);

    // Should call onSelectionChange when tab changes
    expect(mockOnSelectionChange).toHaveBeenCalledWith(
      expect.objectContaining({
        billingType: 'direct-customer',
        customerName: '',
      })
    );
  });
});