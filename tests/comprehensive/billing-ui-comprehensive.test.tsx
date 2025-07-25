import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BillingStatementForm } from '@/components/module/admin/billing/enhanced-billing-statement-form';
import { BillingTypeSelector } from '@/components/module/admin/billing/billing-type-selector';
import { ManualCustomerEntry } from '@/components/module/admin/billing/customer-selection/manual-customer-entry';
import { EnhancedDirectCustomerSelector } from '@/components/module/admin/billing/customer-selection/enhanced-direct-customer-selector';
import { EnhancedCustomerOrderSelector } from '@/components/module/admin/billing/customer-selection/enhanced-customer-order-selector';

// Mock data
const mockCustomers = [
  {
    id: 'customer-1',
    name: 'Test Customer 1',
    email: 'test1@example.com',
    phone: '+1234567890',
    code: 'CUST001'
  },
  {
    id: 'customer-2', 
    name: 'Test Customer 2',
    email: 'test2@example.com',
    phone: '+1234567891',
    code: 'CUST002'
  }
];

const mockCustomerOrders = [
  {
    id: 'order-1',
    orderNumber: 'ORD-001',
    customer: mockCustomers[0],
    totalAmount: 1000,
    status: 'CONFIRMED',
    orderDate: new Date('2024-01-01'),
    orderLines: [
      {
        id: 'line-1',
        product: { name: 'Test Product 1' },
        quantity: 2,
        unitPrice: 500
      }
    ]
  }
];

// Mock functions
const mockGetCustomers = vi.fn();
const mockGetCustomerOrders = vi.fn();
const mockCreateBillingStatement = vi.fn();

vi.mock('@/lib/actions/customers', () => ({
  getAllCustomers: () => mockGetCustomers()
}));

vi.mock('@/lib/actions/customer-order', () => ({
  getCustomerOrders: () => mockGetCustomerOrders()
}));

vi.mock('@/lib/actions/billing-statements', () => ({
  createBillingStatement: (data: any) => mockCreateBillingStatement(data)
}));

describe('Comprehensive Billing UI Testing', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetCustomers.mockResolvedValue(mockCustomers);
    mockGetCustomerOrders.mockResolvedValue(mockCustomerOrders);
    mockCreateBillingStatement.mockResolvedValue({ id: 'billing-1', success: true });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Billing Type Selection Flow', () => {
    it('should display all three billing type options', () => {
      render(<BillingTypeSelector onTypeSelect={vi.fn()} />);
      
      expect(screen.getByText('Customer Order Billing')).toBeInTheDocument();
      expect(screen.getByText('Direct Customer Billing')).toBeInTheDocument();
      expect(screen.getByText('Manual Customer Entry')).toBeInTheDocument();
    });

    it('should highlight selected billing type', async () => {
      const user = userEvent.setup();
      const onTypeSelect = vi.fn();
      
      render(<BillingTypeSelector onTypeSelect={onTypeSelect} />);
      
      const customerOrderCard = screen.getByText('Customer Order Billing').closest('div');
      await user.click(customerOrderCard!);
      
      expect(onTypeSelect).toHaveBeenCalledWith('customer-order');
      expect(customerOrderCard).toHaveClass('ring-2', 'ring-primary');
    });

    it('should show appropriate descriptions for each billing type', () => {
      render(<BillingTypeSelector onTypeSelect={vi.fn()} />);
      
      expect(screen.getByText(/Create billing from an existing customer order/)).toBeInTheDocument();
      expect(screen.getByText(/Create billing for an existing customer from your database/)).toBeInTheDocument();
      expect(screen.getByText(/Create billing with manually entered customer information/)).toBeInTheDocument();
    });
  });

  describe('Customer Order Billing Flow', () => {
    it('should load and display customer orders', async () => {
      render(
        <EnhancedCustomerOrderSelector
          onOrderSelect={vi.fn()}
          onClear={vi.fn()}
        />
      );

      await waitFor(() => {
        expect(mockGetCustomerOrders).toHaveBeenCalled();
      });

      expect(screen.getByText('ORD-001')).toBeInTheDocument();
      expect(screen.getByText('Test Customer 1')).toBeInTheDocument();
    });

    it('should auto-populate customer information when order is selected', async () => {
      const user = userEvent.setup();
      const onOrderSelect = vi.fn();
      
      render(
        <EnhancedCustomerOrderSelector
          onOrderSelect={onOrderSelect}
          onClear={vi.fn()}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('ORD-001')).toBeInTheDocument();
      });

      const orderOption = screen.getByText('ORD-001');
      await user.click(orderOption);

      expect(onOrderSelect).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'order-1',
          customer: expect.objectContaining({
            name: 'Test Customer 1'
          })
        })
      );
    });

    it('should show order preview with financial information', async () => {
      render(
        <EnhancedCustomerOrderSelector
          onOrderSelect={vi.fn()}
          onClear={vi.fn()}
          selectedOrder={mockCustomerOrders[0]}
        />
      );

      expect(screen.getByText('$1,000.00')).toBeInTheDocument();
      expect(screen.getByText('CONFIRMED')).toBeInTheDocument();
    });
  });

  describe('Direct Customer Billing Flow', () => {
    it('should load and display customers', async () => {
      render(
        <EnhancedDirectCustomerSelector
          onCustomerSelect={vi.fn()}
          onClear={vi.fn()}
        />
      );

      await waitFor(() => {
        expect(mockGetCustomers).toHaveBeenCalled();
      });

      expect(screen.getByText('Test Customer 1')).toBeInTheDocument();
      expect(screen.getByText('CUST001')).toBeInTheDocument();
    });

    it('should filter customers based on search input', async () => {
      const user = userEvent.setup();
      
      render(
        <EnhancedDirectCustomerSelector
          onCustomerSelect={vi.fn()}
          onClear={vi.fn()}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('Test Customer 1')).toBeInTheDocument();
      });

      const searchInput = screen.getByPlaceholderText(/Search customers/);
      await user.type(searchInput, 'Customer 2');

      await waitFor(() => {
        expect(screen.getByText('Test Customer 2')).toBeInTheDocument();
        expect(screen.queryByText('Test Customer 1')).not.toBeInTheDocument();
      });
    });

    it('should show customer preview with contact information', async () => {
      render(
        <EnhancedDirectCustomerSelector
          onCustomerSelect={vi.fn()}
          onClear={vi.fn()}
          selectedCustomer={mockCustomers[0]}
        />
      );

      expect(screen.getByText('test1@example.com')).toBeInTheDocument();
      expect(screen.getByText('+1234567890')).toBeInTheDocument();
    });
  });

  describe('Manual Customer Entry Flow', () => {
    it('should validate customer name input', async () => {
      const user = userEvent.setup();
      
      render(
        <ManualCustomerEntry
          customerName=""
          onCustomerNameChange={vi.fn()}
        />
      );

      const nameInput = screen.getByPlaceholderText('Enter customer name...');
      await user.type(nameInput, 'a'); // Too short
      
      await waitFor(() => {
        expect(screen.getByText(/Customer name must be at least 2 characters/)).toBeInTheDocument();
      });
    });

    it('should show validation success for valid customer name', async () => {
      const user = userEvent.setup();
      
      render(
        <ManualCustomerEntry
          customerName=""
          onCustomerNameChange={vi.fn()}
        />
      );

      const nameInput = screen.getByPlaceholderText('Enter customer name...');
      await user.type(nameInput, 'Valid Customer Name');
      
      await waitFor(() => {
        expect(screen.getByText('Customer name is valid')).toBeInTheDocument();
      });
    });

    it('should provide suggestions for better record keeping', () => {
      render(
        <ManualCustomerEntry
          customerName="Test Customer"
          onCustomerNameChange={vi.fn()}
        />
      );

      expect(screen.getByText(/Consider adding contact information/)).toBeInTheDocument();
    });

    it('should allow saving customer entry for future use', async () => {
      const user = userEvent.setup();
      const mockSetItem = vi.fn();
      
      Object.defineProperty(window, 'localStorage', {
        value: { ...window.localStorage, setItem: mockSetItem },
        writable: true,
      });

      render(
        <ManualCustomerEntry
          customerName="Test Customer"
          onCustomerNameChange={vi.fn()}
        />
      );

      const saveButton = screen.getByLabelText('Save customer entry for future use');
      await user.click(saveButton);

      expect(mockSetItem).toHaveBeenCalledWith(
        'manual-customers',
        expect.stringContaining('Test Customer')
      );
    });
  });

  describe('Form Validation and Error Handling', () => {
    it('should validate required fields before submission', async () => {
      const user = userEvent.setup();
      
      render(<BillingStatementForm />);

      const submitButton = screen.getByRole('button', { name: /create billing statement/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/Please select a billing type/)).toBeInTheDocument();
      });
    });

    it('should show conditional validation based on billing type', async () => {
      const user = userEvent.setup();
      
      render(<BillingStatementForm />);

      // Select customer order billing
      const customerOrderCard = screen.getByText('Customer Order Billing').closest('div');
      await user.click(customerOrderCard!);

      const submitButton = screen.getByRole('button', { name: /create billing statement/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/Please select a customer order/)).toBeInTheDocument();
      });
    });

    it('should display inline error messages for invalid inputs', async () => {
      const user = userEvent.setup();
      
      render(<BillingStatementForm />);

      // Select manual customer entry
      const manualEntryCard = screen.getByText('Manual Customer Entry').closest('div');
      await user.click(manualEntryCard!);

      const nameInput = screen.getByPlaceholderText('Enter customer name...');
      await user.type(nameInput, 'a');
      await user.tab(); // Trigger blur event

      await waitFor(() => {
        expect(screen.getByText(/Customer name must be at least 2 characters/)).toBeInTheDocument();
      });
    });

    it('should handle network errors gracefully', async () => {
      mockCreateBillingStatement.mockRejectedValue(new Error('Network error'));
      
      const user = userEvent.setup();
      render(<BillingStatementForm />);

      // Fill out form with valid data
      const manualEntryCard = screen.getByText('Manual Customer Entry').closest('div');
      await user.click(manualEntryCard!);

      const nameInput = screen.getByPlaceholderText('Enter customer name...');
      await user.type(nameInput, 'Valid Customer');

      const submitButton = screen.getByRole('button', { name: /create billing statement/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/Failed to create billing statement/)).toBeInTheDocument();
      });
    });
  });

  describe('Real-time Calculations', () => {
    it('should update totals when invoice items change', async () => {
      const user = userEvent.setup();
      
      render(<BillingStatementForm />);

      // Set up form with manual customer
      const manualEntryCard = screen.getByText('Manual Customer Entry').closest('div');
      await user.click(manualEntryCard!);

      const nameInput = screen.getByPlaceholderText('Enter customer name...');
      await user.type(nameInput, 'Test Customer');

      // Add invoice item
      const addItemButton = screen.getByRole('button', { name: /add item/i });
      await user.click(addItemButton);

      const descriptionInput = screen.getByPlaceholderText(/Enter item description/);
      const quantityInput = screen.getByPlaceholderText(/Quantity/);
      const priceInput = screen.getByPlaceholderText(/Unit price/);

      await user.type(descriptionInput, 'Test Item');
      await user.type(quantityInput, '2');
      await user.type(priceInput, '100');

      await waitFor(() => {
        expect(screen.getByText('$200.00')).toBeInTheDocument(); // 2 * 100
      });
    });

    it('should calculate tax and discounts correctly', async () => {
      const user = userEvent.setup();
      
      render(<BillingStatementForm />);

      // Set up form
      const manualEntryCard = screen.getByText('Manual Customer Entry').closest('div');
      await user.click(manualEntryCard!);

      const nameInput = screen.getByPlaceholderText('Enter customer name...');
      await user.type(nameInput, 'Test Customer');

      // Add invoice item
      const addItemButton = screen.getByRole('button', { name: /add item/i });
      await user.click(addItemButton);

      const quantityInput = screen.getByPlaceholderText(/Quantity/);
      const priceInput = screen.getByPlaceholderText(/Unit price/);

      await user.type(quantityInput, '1');
      await user.type(priceInput, '100');

      // Set tax rate
      const taxRateInput = screen.getByLabelText(/Tax Rate/);
      await user.clear(taxRateInput);
      await user.type(taxRateInput, '10');

      await waitFor(() => {
        expect(screen.getByText('$10.00')).toBeInTheDocument(); // Tax amount
        expect(screen.getByText('$110.00')).toBeInTheDocument(); // Total with tax
      });
    });
  });

  describe('Responsive Design', () => {
    it('should adapt layout for mobile screens', () => {
      // Mock mobile viewport
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375,
      });

      render(<BillingStatementForm />);

      const formContainer = screen.getByRole('main') || screen.getByRole('form');
      expect(formContainer).toHaveClass('grid-cols-1');
    });

    it('should show desktop layout for larger screens', () => {
      // Mock desktop viewport
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 1024,
      });

      render(<BillingStatementForm />);

      const formContainer = screen.getByRole('main') || screen.getByRole('form');
      expect(formContainer).toHaveClass('lg:grid-cols-4');
    });
  });

  describe('Accessibility Compliance', () => {
    it('should have proper ARIA labels for all form elements', () => {
      render(<BillingStatementForm />);

      const billingTypeSection = screen.getByRole('region', { name: /billing type selection/i });
      expect(billingTypeSection).toBeInTheDocument();

      const customerSection = screen.getByRole('region', { name: /customer information/i });
      expect(customerSection).toBeInTheDocument();
    });

    it('should support keyboard navigation', async () => {
      const user = userEvent.setup();
      
      render(<BillingTypeSelector onTypeSelect={vi.fn()} />);

      const firstCard = screen.getByText('Customer Order Billing').closest('div');
      firstCard?.focus();

      await user.keyboard('{Tab}');
      
      const secondCard = screen.getByText('Direct Customer Billing').closest('div');
      expect(secondCard).toHaveFocus();
    });

    it('should announce dynamic content changes to screen readers', async () => {
      const user = userEvent.setup();
      
      render(
        <ManualCustomerEntry
          customerName=""
          onCustomerNameChange={vi.fn()}
        />
      );

      const nameInput = screen.getByPlaceholderText('Enter customer name...');
      await user.type(nameInput, 'Valid Customer Name');

      const liveRegion = screen.getByRole('status');
      expect(liveRegion).toHaveTextContent('Customer name is valid');
    });
  });

  describe('Performance Testing', () => {
    it('should handle large customer datasets efficiently', async () => {
      const largeCustomerList = Array.from({ length: 1000 }, (_, i) => ({
        id: `customer-${i}`,
        name: `Customer ${i}`,
        email: `customer${i}@example.com`,
        code: `CUST${i.toString().padStart(3, '0')}`
      }));

      mockGetCustomers.mockResolvedValue(largeCustomerList);

      const startTime = performance.now();
      
      render(
        <EnhancedDirectCustomerSelector
          onCustomerSelect={vi.fn()}
          onClear={vi.fn()}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('Customer 0')).toBeInTheDocument();
      });

      const endTime = performance.now();
      const renderTime = endTime - startTime;

      // Should render within reasonable time (less than 1 second)
      expect(renderTime).toBeLessThan(1000);
    });

    it('should debounce search input to prevent excessive API calls', async () => {
      const user = userEvent.setup();
      
      render(
        <EnhancedDirectCustomerSelector
          onCustomerSelect={vi.fn()}
          onClear={vi.fn()}
        />
      );

      const searchInput = screen.getByPlaceholderText(/Search customers/);
      
      // Type quickly
      await user.type(searchInput, 'test', { delay: 50 });

      // Should only make one API call after debounce
      await waitFor(() => {
        expect(mockGetCustomers).toHaveBeenCalledTimes(1);
      });
    });
  });
});