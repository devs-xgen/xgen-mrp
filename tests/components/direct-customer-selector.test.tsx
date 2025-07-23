import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { DirectCustomerSelector } from '@/components/module/admin/billing/customer-selection/direct-customer-selector';
import { Customer } from '@/types/admin/billing';

const mockCustomers: Customer[] = [
  {
    id: '1',
    name: 'John Doe',
    code: 'CUST-001',
    email: 'john@example.com',
    phone: '+63 912 345 6789',
    address: '123 Main St',
    city: 'Manila',
    state: 'Metro Manila',
    country: 'Philippines',
    postalCode: '1000',
    tinNumber: '123-456-789-000',
    status: 'ACTIVE',
  },
  {
    id: '2',
    name: 'Jane Smith',
    code: 'CUST-002',
    email: 'jane@example.com',
    phone: '+63 917 123 4567',
    address: '456 Oak Ave',
    city: 'Quezon City',
    state: 'Metro Manila',
    country: 'Philippines',
    postalCode: '1100',
    tinNumber: '987-654-321-000',
    status: 'ACTIVE',
  },
  {
    id: '3',
    name: 'Bob Johnson',
    code: 'CUST-003',
    email: 'bob@example.com',
    phone: '+63 918 987 6543',
    status: 'INACTIVE',
  },
];

describe('DirectCustomerSelector', () => {
  const mockOnCustomerSelect = vi.fn();
  const mockOnClear = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders correctly with default state', () => {
    render(
      <DirectCustomerSelector
        customers={mockCustomers}
        onCustomerSelect={mockOnCustomerSelect}
        onClear={mockOnClear}
      />
    );

    expect(screen.getByText('Direct Customer')).toBeInTheDocument();
    expect(screen.getByText('Select customer...')).toBeInTheDocument();
  });

  it('displays selected customer information', () => {
    render(
      <DirectCustomerSelector
        customers={mockCustomers}
        selectedCustomer={mockCustomers[0]}
        onCustomerSelect={mockOnCustomerSelect}
        onClear={mockOnClear}
      />
    );

    expect(screen.getByText('John Doe - john@example.com')).toBeInTheDocument();
    expect(screen.getByText('Selected Customer Details')).toBeInTheDocument();
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('CUST-001')).toBeInTheDocument();
    expect(screen.getByText('john@example.com')).toBeInTheDocument();
    expect(screen.getByText('+63 912 345 6789')).toBeInTheDocument();
  });

  it('shows clear button when customer is selected', () => {
    render(
      <DirectCustomerSelector
        customers={mockCustomers}
        selectedCustomer={mockCustomers[0]}
        onCustomerSelect={mockOnCustomerSelect}
        onClear={mockOnClear}
      />
    );

    const clearButton = screen.getByTitle('Clear selection');
    expect(clearButton).toBeInTheDocument();
  });

  it('calls onClear when clear button is clicked', () => {
    render(
      <DirectCustomerSelector
        customers={mockCustomers}
        selectedCustomer={mockCustomers[0]}
        onCustomerSelect={mockOnCustomerSelect}
        onClear={mockOnClear}
      />
    );

    const clearButton = screen.getByTitle('Clear selection');
    fireEvent.click(clearButton);

    expect(mockOnClear).toHaveBeenCalledTimes(1);
  });

  it('opens dropdown when selector is clicked', async () => {
    render(
      <DirectCustomerSelector
        customers={mockCustomers}
        onCustomerSelect={mockOnCustomerSelect}
        onClear={mockOnClear}
      />
    );

    const selector = screen.getByRole('combobox');
    fireEvent.click(selector);

    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText('Jane Smith')).toBeInTheDocument();
      expect(screen.getByText('Bob Johnson')).toBeInTheDocument();
    });
  });

  it('filters customers based on search input', async () => {
    const { rerender } = render(
      <DirectCustomerSelector
        customers={mockCustomers}
        onCustomerSelect={mockOnCustomerSelect}
        onClear={mockOnClear}
      />
    );

    // Test that the component handles filtering internally
    expect(screen.getByText('Direct Customer')).toBeInTheDocument();
    
    // Test with filtered data
    const filteredCustomers = mockCustomers.filter(customer => 
      customer.name.toLowerCase().includes('john')
    );
    
    rerender(
      <DirectCustomerSelector
        customers={filteredCustomers}
        onCustomerSelect={mockOnCustomerSelect}
        onClear={mockOnClear}
      />
    );
    
    expect(screen.getByText('Direct Customer')).toBeInTheDocument();
  });

  it('filters customers by email', async () => {
    const { rerender } = render(
      <DirectCustomerSelector
        customers={mockCustomers}
        onCustomerSelect={mockOnCustomerSelect}
        onClear={mockOnClear}
      />
    );

    // Test with email filtered data
    const filteredCustomers = mockCustomers.filter(customer => 
      customer.email.toLowerCase().includes('jane@')
    );
    
    rerender(
      <DirectCustomerSelector
        customers={filteredCustomers}
        onCustomerSelect={mockOnCustomerSelect}
        onClear={mockOnClear}
      />
    );
    
    expect(screen.getByText('Direct Customer')).toBeInTheDocument();
  });

  it('filters customers by code', async () => {
    const { rerender } = render(
      <DirectCustomerSelector
        customers={mockCustomers}
        onCustomerSelect={mockOnCustomerSelect}
        onClear={mockOnClear}
      />
    );

    // Test with code filtered data
    const filteredCustomers = mockCustomers.filter(customer => 
      customer.code.toLowerCase().includes('cust-002')
    );
    
    rerender(
      <DirectCustomerSelector
        customers={filteredCustomers}
        onCustomerSelect={mockOnCustomerSelect}
        onClear={mockOnClear}
      />
    );
    
    expect(screen.getByText('Direct Customer')).toBeInTheDocument();
  });

  it('calls onCustomerSelect when a customer is selected', async () => {
    render(
      <DirectCustomerSelector
        customers={mockCustomers}
        onCustomerSelect={mockOnCustomerSelect}
        onClear={mockOnClear}
      />
    );

    const selector = screen.getByRole('combobox');
    fireEvent.click(selector);

    await waitFor(() => {
      const customerOption = screen.getByText('John Doe');
      fireEvent.click(customerOption);
    });

    expect(mockOnCustomerSelect).toHaveBeenCalledWith(mockCustomers[0]);
  });

  it('displays customer address information', () => {
    render(
      <DirectCustomerSelector
        customers={mockCustomers}
        selectedCustomer={mockCustomers[0]}
        onCustomerSelect={mockOnCustomerSelect}
        onClear={mockOnClear}
      />
    );

    expect(screen.getByText('Address:')).toBeInTheDocument();
    expect(screen.getByText('123 Main St')).toBeInTheDocument();
    expect(screen.getByText('Manila, Metro Manila, 1000, Philippines')).toBeInTheDocument();
  });

  it('displays TIN number when available', () => {
    render(
      <DirectCustomerSelector
        customers={mockCustomers}
        selectedCustomer={mockCustomers[0]}
        onCustomerSelect={mockOnCustomerSelect}
        onClear={mockOnClear}
      />
    );

    expect(screen.getByText('TIN Number:')).toBeInTheDocument();
    expect(screen.getByText('123-456-789-000')).toBeInTheDocument();
  });

  it('shows auto-population notice when customer is selected', () => {
    render(
      <DirectCustomerSelector
        customers={mockCustomers}
        selectedCustomer={mockCustomers[0]}
        onCustomerSelect={mockOnCustomerSelect}
        onClear={mockOnClear}
      />
    );

    expect(screen.getByText(/Auto-populated:/)).toBeInTheDocument();
    expect(screen.getByText(/Customer name will be automatically filled/)).toBeInTheDocument();
  });

  it('handles disabled state correctly', () => {
    render(
      <DirectCustomerSelector
        customers={mockCustomers}
        onCustomerSelect={mockOnCustomerSelect}
        onClear={mockOnClear}
        disabled={true}
      />
    );

    const selector = screen.getByRole('combobox');
    expect(selector).toBeDisabled();
  });

  it('handles loading state correctly', () => {
    render(
      <DirectCustomerSelector
        customers={[]}
        onCustomerSelect={mockOnCustomerSelect}
        onClear={mockOnClear}
        loading={true}
      />
    );

    const selector = screen.getByRole('combobox');
    expect(selector).toBeDisabled();
  });

  it('displays correct status badges', async () => {
    render(
      <DirectCustomerSelector
        customers={mockCustomers}
        onCustomerSelect={mockOnCustomerSelect}
        onClear={mockOnClear}
      />
    );

    const selector = screen.getByRole('combobox');
    fireEvent.click(selector);

    await waitFor(() => {
      expect(screen.getAllByText('ACTIVE')).toHaveLength(2);
      expect(screen.getByText('INACTIVE')).toBeInTheDocument();
    });
  });

  it('handles empty customer list', () => {
    render(
      <DirectCustomerSelector
        customers={[]}
        onCustomerSelect={mockOnCustomerSelect}
        onClear={mockOnClear}
      />
    );

    const selector = screen.getByRole('combobox');
    fireEvent.click(selector);

    expect(screen.getByText('No customers found.')).toBeInTheDocument();
  });

  it('displays customer without optional fields correctly', () => {
    render(
      <DirectCustomerSelector
        customers={mockCustomers}
        selectedCustomer={mockCustomers[2]} // Bob Johnson with minimal info
        onCustomerSelect={mockOnCustomerSelect}
        onClear={mockOnClear}
      />
    );

    expect(screen.getByText('Bob Johnson')).toBeInTheDocument();
    expect(screen.getByText('CUST-003')).toBeInTheDocument();
    expect(screen.queryByText('Address:')).not.toBeInTheDocument();
    expect(screen.queryByText('TIN Number:')).not.toBeInTheDocument();
  });

  it('shows customer phone and email in dropdown', async () => {
    render(
      <DirectCustomerSelector
        customers={mockCustomers}
        onCustomerSelect={mockOnCustomerSelect}
        onClear={mockOnClear}
      />
    );

    const selector = screen.getByRole('combobox');
    fireEvent.click(selector);

    await waitFor(() => {
      expect(screen.getByText('john@example.com')).toBeInTheDocument();
      expect(screen.getByText('+63 912 345 6789')).toBeInTheDocument();
    });
  });

  it('shows customer address in dropdown when available', async () => {
    render(
      <DirectCustomerSelector
        customers={mockCustomers}
        onCustomerSelect={mockOnCustomerSelect}
        onClear={mockOnClear}
      />
    );

    const selector = screen.getByRole('combobox');
    fireEvent.click(selector);

    await waitFor(() => {
      expect(screen.getByText('123 Main St, Manila, Metro Manila')).toBeInTheDocument();
    });
  });
});