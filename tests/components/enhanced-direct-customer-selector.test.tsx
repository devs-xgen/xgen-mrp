import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { EnhancedDirectCustomerSelector } from '@/components/module/admin/billing/customer-selection/enhanced-direct-customer-selector';
import { Customer } from '@/types/admin/billing';

// Mock the customer actions
vi.mock('@/lib/actions/customers', () => ({
  getAllCustomers: vi.fn(),
  validateCustomerForBilling: vi.fn(),
}));

// Mock lucide-react icons
vi.mock('lucide-react', async (importOriginal) => {
  const actual = await importOriginal() as any;
  return {
    ...actual,
    Search: () => <div data-testid="search-icon" />,
    User: () => <div data-testid="user-icon" />,
    Mail: () => <div data-testid="mail-icon" />,
    Phone: () => <div data-testid="phone-icon" />,
    MapPin: () => <div data-testid="mappin-icon" />,
    CreditCard: () => <div data-testid="creditcard-icon" />,
    X: () => <div data-testid="x-icon" />,
    AlertTriangle: () => <div data-testid="alerttriangle-icon" />,
    Building: () => <div data-testid="building-icon" />,
    CheckCircle: () => <div data-testid="checkcircle-icon" />,
    XCircle: () => <div data-testid="xcircle-icon" />,
  };
});

import { getAllCustomers, validateCustomerForBilling } from '@/lib/actions/customers';

const mockCustomers: Customer[] = [
  {
    id: '1',
    name: 'Acme Corporation',
    code: 'ACME-001',
    contactPerson: 'John Smith',
    email: 'john@acme.com',
    phone: '+63 912 345 6789',
    address: '123 Business St',
    city: 'Manila',
    state: 'Metro Manila',
    country: 'Philippines',
    postalCode: '1000',
    tinNumber: '123-456-789-000',
    creditLimit: 100000,
    paymentTerms: 'Net 30',
    status: 'ACTIVE',
    notes: 'Premium customer',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
    orders: [
      {
        id: 'order-1',
        orderNumber: 'ORD-001',
        customerId: '1',
        orderDate: new Date('2024-01-15'),
        requiredDate: new Date('2024-01-20'),
        status: 'COMPLETED',
        totalAmount: 25000,
      },
    ],
    billingStatements: [
      {
        id: 'bill-1',
        statementNumber: 'BILL-001',
        customerId: '1',
        customerOrderId: null,
        customerName: 'Acme Corporation',
        productionOrderId: null,
        totalAmount: 25000,
        taxAmount: 3000,
        discountAmount: 0,
        netAmount: 28000,
        status: 'PAID' as any,
        billingDate: new Date('2024-01-16'),
        dueDate: new Date('2024-02-15'),
        paidDate: new Date('2024-01-20'),
        notes: null,
        createdAt: new Date('2024-01-16'),
        updatedAt: new Date('2024-01-20'),
        createdBy: null,
        modifiedBy: null,
      },
    ],
  },
  {
    id: '2',
    name: 'Tech Solutions Inc',
    code: 'TECH-002',
    contactPerson: 'Jane Doe',
    email: 'jane@techsolutions.com',
    phone: '+63 917 123 4567',
    address: '456 Tech Ave',
    city: 'Quezon City',
    state: 'Metro Manila',
    country: 'Philippines',
    postalCode: '1100',
    tinNumber: '987-654-321-000',
    creditLimit: 50000,
    paymentTerms: 'Net 15',
    status: 'ACTIVE',
    notes: null,
    createdAt: new Date('2024-01-02'),
    updatedAt: new Date('2024-01-02'),
  },
  {
    id: '3',
    name: 'Inactive Corp',
    code: 'INACT-003',
    contactPerson: 'Bob Johnson',
    email: 'bob@inactive.com',
    phone: '+63 918 987 6543',
    status: 'INACTIVE',
    createdAt: new Date('2024-01-03'),
    updatedAt: new Date('2024-01-03'),
  },
];

const mockValidationSuccess = {
  isValid: true,
  customer: mockCustomers[0],
  warnings: [],
  errors: [],
};

const mockValidationWithWarnings = {
  isValid: true,
  customer: mockCustomers[0],
  warnings: ['Customer has reached credit limit of ₱100,000. Outstanding: ₱95,000'],
  errors: [],
};

const mockValidationWithErrors = {
  isValid: false,
  customer: mockCustomers[2],
  warnings: [],
  errors: ['Customer status is INACTIVE. Only active customers can be billed.'],
};

describe('EnhancedDirectCustomerSelector', () => {
  const mockOnCustomerSelect = vi.fn();
  const mockOnClear = vi.fn();
  const mockOnValidationChange = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    (getAllCustomers as any).mockResolvedValue(mockCustomers.filter(c => c.status === 'ACTIVE'));
    (validateCustomerForBilling as any).mockResolvedValue(mockValidationSuccess);
  });

  it('renders correctly with default state', async () => {
    render(
      <EnhancedDirectCustomerSelector
        onCustomerSelect={mockOnCustomerSelect}
        onClear={mockOnClear}
        onValidationChange={mockOnValidationChange}
      />
    );

    expect(screen.getByText('Direct Customer')).toBeInTheDocument();
    expect(screen.getByText('Select customer...')).toBeInTheDocument();

    // Wait for customers to load
    await waitFor(() => {
      expect(getAllCustomers).toHaveBeenCalledWith({
        status: 'ACTIVE',
        limit: 100,
      });
    });
  });

  it('displays selected customer information with enhanced details', async () => {
    render(
      <EnhancedDirectCustomerSelector
        selectedCustomer={mockCustomers[0]}
        onCustomerSelect={mockOnCustomerSelect}
        onClear={mockOnClear}
        onValidationChange={mockOnValidationChange}
      />
    );

    expect(screen.getByText('Acme Corporation - john@acme.com')).toBeInTheDocument();
    expect(screen.getByText('Selected Customer Details')).toBeInTheDocument();
    expect(screen.getByText('Acme Corporation')).toBeInTheDocument();
    expect(screen.getByText('ACME-001')).toBeInTheDocument();
    expect(screen.getByText('john@acme.com')).toBeInTheDocument();
    expect(screen.getByText('+63 912 345 6789')).toBeInTheDocument();

    // Check for enhanced fields
    expect(screen.getByText('Contact Person:')).toBeInTheDocument();
    expect(screen.getByText('John Smith')).toBeInTheDocument();
    expect(screen.getByText('Payment Information:')).toBeInTheDocument();
    expect(screen.getByText('Net 30')).toBeInTheDocument();
    expect(screen.getByText('₱100,000')).toBeInTheDocument();

    // Check for recent activity
    expect(screen.getByText('Recent Activity:')).toBeInTheDocument();
    expect(screen.getByText('ORD-001 - ₱25,000')).toBeInTheDocument();
    expect(screen.getByText('BILL-001 - ₱25,000')).toBeInTheDocument();
  });

  it('validates customer when selected', async () => {
    render(
      <EnhancedDirectCustomerSelector
        selectedCustomer={mockCustomers[0]}
        onCustomerSelect={mockOnCustomerSelect}
        onClear={mockOnClear}
        onValidationChange={mockOnValidationChange}
      />
    );

    await waitFor(() => {
      expect(validateCustomerForBilling).toHaveBeenCalledWith('1');
      expect(mockOnValidationChange).toHaveBeenCalledWith(mockValidationSuccess);
    });

    expect(screen.getByText('Customer validation passed. Ready for billing.')).toBeInTheDocument();
  });

  it('displays validation warnings', async () => {
    (validateCustomerForBilling as any).mockResolvedValue(mockValidationWithWarnings);

    render(
      <EnhancedDirectCustomerSelector
        selectedCustomer={mockCustomers[0]}
        onCustomerSelect={mockOnCustomerSelect}
        onClear={mockOnClear}
        onValidationChange={mockOnValidationChange}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Warnings:')).toBeInTheDocument();
      expect(screen.getByText(/Customer has reached credit limit/)).toBeInTheDocument();
    });
  });

  it('displays validation errors', async () => {
    (validateCustomerForBilling as any).mockResolvedValue(mockValidationWithErrors);

    render(
      <EnhancedDirectCustomerSelector
        selectedCustomer={mockCustomers[2]}
        onCustomerSelect={mockOnCustomerSelect}
        onClear={mockOnClear}
        onValidationChange={mockOnValidationChange}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Billing Blocked:')).toBeInTheDocument();
      expect(screen.getByText(/Customer status is INACTIVE/)).toBeInTheDocument();
    });
  });

  it('shows credit status for customers with credit limits', async () => {
    const customerWithOutstanding = {
      ...mockCustomers[0],
      billingStatements: [
        {
          ...mockCustomers[0].billingStatements![0],
          status: 'SENT' as any, // Outstanding
          totalAmount: 80000,
        },
      ],
    };

    render(
      <EnhancedDirectCustomerSelector
        selectedCustomer={customerWithOutstanding}
        onCustomerSelect={mockOnCustomerSelect}
        onClear={mockOnClear}
        onValidationChange={mockOnValidationChange}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Credit Status:')).toBeInTheDocument();
      expect(screen.getByText('Near Credit Limit')).toBeInTheDocument();
      expect(screen.getByText(/Outstanding: ₱80,000 \/ ₱100,000/)).toBeInTheDocument();
    });
  });

  it('opens dropdown and shows enhanced customer information', async () => {
    render(
      <EnhancedDirectCustomerSelector
        onCustomerSelect={mockOnCustomerSelect}
        onClear={mockOnClear}
        onValidationChange={mockOnValidationChange}
      />
    );

    // Wait for customers to load
    await waitFor(() => {
      expect(getAllCustomers).toHaveBeenCalled();
    });

    const selector = screen.getByRole('combobox');
    fireEvent.click(selector);

    await waitFor(() => {
      expect(screen.getByText('Acme Corporation')).toBeInTheDocument();
      expect(screen.getByText('Tech Solutions Inc')).toBeInTheDocument();
      
      // Check for enhanced dropdown information
      expect(screen.getByText('John Smith')).toBeInTheDocument(); // Contact person
      expect(screen.getByText('Jane Doe')).toBeInTheDocument(); // Contact person
      expect(screen.getByText('Credit Limit: ₱100,000')).toBeInTheDocument();
      expect(screen.getByText('Credit Limit: ₱50,000')).toBeInTheDocument();
    });
  });

  it('filters customers by contact person', async () => {
    render(
      <EnhancedDirectCustomerSelector
        onCustomerSelect={mockOnCustomerSelect}
        onClear={mockOnClear}
        onValidationChange={mockOnValidationChange}
      />
    );

    await waitFor(() => {
      expect(getAllCustomers).toHaveBeenCalled();
    });

    const selector = screen.getByRole('combobox');
    fireEvent.click(selector);

    const searchInput = screen.getByPlaceholderText(/Search customers by name, email, code, or contact person/);
    fireEvent.change(searchInput, { target: { value: 'John Smith' } });

    await waitFor(() => {
      expect(screen.getByText('Acme Corporation')).toBeInTheDocument();
      expect(screen.queryByText('Tech Solutions Inc')).not.toBeInTheDocument();
    });
  });

  it('calls onCustomerSelect when a customer is selected from dropdown', async () => {
    render(
      <EnhancedDirectCustomerSelector
        onCustomerSelect={mockOnCustomerSelect}
        onClear={mockOnClear}
        onValidationChange={mockOnValidationChange}
      />
    );

    await waitFor(() => {
      expect(getAllCustomers).toHaveBeenCalled();
    });

    const selector = screen.getByRole('combobox');
    fireEvent.click(selector);

    await waitFor(() => {
      const customerOption = screen.getByText('Acme Corporation');
      fireEvent.click(customerOption);
    });

    expect(mockOnCustomerSelect).toHaveBeenCalledWith(mockCustomers[0]);
  });

  it('clears validation when customer is cleared', async () => {
    render(
      <EnhancedDirectCustomerSelector
        selectedCustomer={mockCustomers[0]}
        onCustomerSelect={mockOnCustomerSelect}
        onClear={mockOnClear}
        onValidationChange={mockOnValidationChange}
      />
    );

    const clearButton = screen.getByTitle('Clear selection');
    fireEvent.click(clearButton);

    expect(mockOnClear).toHaveBeenCalledTimes(1);
    expect(mockOnValidationChange).toHaveBeenCalledWith({
      isValid: true,
      customer: null,
      warnings: [],
      errors: [],
    });
  });

  it('handles customer loading errors gracefully', async () => {
    (getAllCustomers as any).mockRejectedValue(new Error('Failed to load customers'));

    render(
      <EnhancedDirectCustomerSelector
        onCustomerSelect={mockOnCustomerSelect}
        onClear={mockOnClear}
        onValidationChange={mockOnValidationChange}
      />
    );

    await waitFor(() => {
      expect(getAllCustomers).toHaveBeenCalled();
    });

    // Component should still render without crashing
    expect(screen.getByText('Direct Customer')).toBeInTheDocument();
  });

  it('handles validation errors gracefully', async () => {
    (validateCustomerForBilling as any).mockRejectedValue(new Error('Validation failed'));

    render(
      <EnhancedDirectCustomerSelector
        selectedCustomer={mockCustomers[0]}
        onCustomerSelect={mockOnCustomerSelect}
        onClear={mockOnClear}
        onValidationChange={mockOnValidationChange}
      />
    );

    await waitFor(() => {
      expect(mockOnValidationChange).toHaveBeenCalledWith({
        isValid: false,
        customer: null,
        warnings: [],
        errors: ['Failed to validate customer'],
      });
    });
  });

  it('shows auto-population notice only for valid customers', async () => {
    render(
      <EnhancedDirectCustomerSelector
        selectedCustomer={mockCustomers[0]}
        onCustomerSelect={mockOnCustomerSelect}
        onClear={mockOnClear}
        onValidationChange={mockOnValidationChange}
      />
    );

    await waitFor(() => {
      expect(screen.getByText(/Auto-populated:/)).toBeInTheDocument();
      expect(screen.getByText(/Customer name and details will be automatically filled/)).toBeInTheDocument();
    });
  });

  it('hides auto-population notice for invalid customers', async () => {
    (validateCustomerForBilling as any).mockResolvedValue(mockValidationWithErrors);

    render(
      <EnhancedDirectCustomerSelector
        selectedCustomer={mockCustomers[2]}
        onCustomerSelect={mockOnCustomerSelect}
        onClear={mockOnClear}
        onValidationChange={mockOnValidationChange}
      />
    );

    await waitFor(() => {
      expect(screen.queryByText(/Auto-populated:/)).not.toBeInTheDocument();
    });
  });

  it('handles disabled state correctly', () => {
    render(
      <EnhancedDirectCustomerSelector
        onCustomerSelect={mockOnCustomerSelect}
        onClear={mockOnClear}
        onValidationChange={mockOnValidationChange}
        disabled={true}
      />
    );

    const selector = screen.getByRole('combobox');
    expect(selector).toBeDisabled();
  });

  it('handles loading state correctly', () => {
    render(
      <EnhancedDirectCustomerSelector
        onCustomerSelect={mockOnCustomerSelect}
        onClear={mockOnClear}
        onValidationChange={mockOnValidationChange}
        loading={true}
      />
    );

    const selector = screen.getByRole('combobox');
    expect(selector).toBeDisabled();
  });

  it('displays customer without optional fields correctly', async () => {
    const minimalCustomer = {
      ...mockCustomers[2],
      status: 'ACTIVE',
      address: undefined,
      creditLimit: undefined,
      paymentTerms: undefined,
      orders: undefined,
      billingStatements: undefined,
    };

    render(
      <EnhancedDirectCustomerSelector
        selectedCustomer={minimalCustomer}
        onCustomerSelect={mockOnCustomerSelect}
        onClear={mockOnClear}
        onValidationChange={mockOnValidationChange}
      />
    );

    expect(screen.getByText('Inactive Corp')).toBeInTheDocument();
    expect(screen.getByText('INACT-003')).toBeInTheDocument();
    expect(screen.queryByText('Address:')).not.toBeInTheDocument();
    expect(screen.queryByText('Payment Information:')).not.toBeInTheDocument();
    expect(screen.queryByText('Recent Activity:')).not.toBeInTheDocument();
  });
});