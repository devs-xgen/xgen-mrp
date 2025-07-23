import { describe, test, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { EnhancedCustomerSelection } from '@/components/module/admin/billing/enhanced-customer-selection'
import { Customer } from '@/types/admin/billing'
import { CustomerOrder } from '@/types/admin/customer-order'
import { BillingTypeId } from '@/types/admin/billing-types'

// Mock the formatCurrencyPHP function
vi.mock('@/lib/constant', () => ({
  formatCurrencyPHP: (amount: number) => `₱${amount.toLocaleString()}`
}))

describe('EnhancedCustomerSelection', () => {
  const mockOnCustomerSelect = vi.fn()
  const mockOnCustomerOrderSelect = vi.fn()
  const mockOnManualCustomerChange = vi.fn()
  const mockOnClearSelection = vi.fn()

  const mockCustomers: Customer[] = [
    {
      id: '1',
      name: 'John Doe',
      code: 'CUST-001',
      email: 'john@example.com',
      phone: '+63 912 345 6789',
      address: '123 Main St',
      city: 'Manila',
      state: 'NCR',
      country: 'Philippines',
      postalCode: '1000',
      tinNumber: '123-456-789-000',
      status: 'ACTIVE'
    }
  ]

  const mockCustomerOrders: CustomerOrder[] = [
    {
      id: '1',
      orderNumber: 'CO-2024-0001',
      customerId: 'customer-1',
      orderDate: new Date('2024-01-15'),
      requiredDate: new Date('2024-02-15'),
      status: 'PENDING',
      totalAmount: 15000,
      notes: null,
      customer: {
        id: 'customer-1',
        name: 'John Doe',
        email: 'john@example.com'
      },
      orderLines: []
    }
  ]

  beforeEach(() => {
    mockOnCustomerSelect.mockClear()
    mockOnCustomerOrderSelect.mockClear()
    mockOnManualCustomerChange.mockClear()
    mockOnClearSelection.mockClear()
  })

  test('renders customer information header', () => {
    render(
      <EnhancedCustomerSelection
        customers={mockCustomers}
        customerOrders={mockCustomerOrders}
        onCustomerSelect={mockOnCustomerSelect}
        onCustomerOrderSelect={mockOnCustomerOrderSelect}
        onManualCustomerChange={mockOnManualCustomerChange}
        onClearSelection={mockOnClearSelection}
      />
    )

    expect(screen.getByText('Customer Information')).toBeInTheDocument()
    expect(screen.getByText('Choose how you want to specify the customer for this billing statement')).toBeInTheDocument()
  })

  test('renders all three tab options', () => {
    render(
      <EnhancedCustomerSelection
        customers={mockCustomers}
        customerOrders={mockCustomerOrders}
        onCustomerSelect={mockOnCustomerSelect}
        onCustomerOrderSelect={mockOnCustomerOrderSelect}
        onManualCustomerChange={mockOnManualCustomerChange}
        onClearSelection={mockOnClearSelection}
      />
    )

    expect(screen.getByText('Customer Order')).toBeInTheDocument()
    expect(screen.getByText('Direct Customer')).toBeInTheDocument()
    expect(screen.getByText('Manual Entry')).toBeInTheDocument()
  })

  test('shows customer order tab content by default', () => {
    render(
      <EnhancedCustomerSelection
        customers={mockCustomers}
        customerOrders={mockCustomerOrders}
        onCustomerSelect={mockOnCustomerSelect}
        onCustomerOrderSelect={mockOnCustomerOrderSelect}
        onManualCustomerChange={mockOnManualCustomerChange}
        onClearSelection={mockOnClearSelection}
      />
    )

    expect(screen.getByText('Select from Customer Orders')).toBeInTheDocument()
    expect(screen.getByText('Choose an existing customer order to automatically populate customer details and order items.')).toBeInTheDocument()
  })

  test('switches to direct customer tab when clicked', async () => {
    render(
      <EnhancedCustomerSelection
        customers={mockCustomers}
        customerOrders={mockCustomerOrders}
        onCustomerSelect={mockOnCustomerSelect}
        onCustomerOrderSelect={mockOnCustomerOrderSelect}
        onManualCustomerChange={mockOnManualCustomerChange}
        onClearSelection={mockOnClearSelection}
      />
    )

    const directCustomerTab = screen.getByText('Direct Customer')
    fireEvent.click(directCustomerTab)

    await waitFor(() => {
      expect(screen.getByText('Select from Customer Database')).toBeInTheDocument()
      expect(screen.getByText('Choose an existing customer from your database to automatically populate their information.')).toBeInTheDocument()
    })
  })

  test('switches to manual entry tab when clicked', async () => {
    render(
      <EnhancedCustomerSelection
        customers={mockCustomers}
        customerOrders={mockCustomerOrders}
        onCustomerSelect={mockOnCustomerSelect}
        onCustomerOrderSelect={mockOnCustomerOrderSelect}
        onManualCustomerChange={mockOnManualCustomerChange}
        onClearSelection={mockOnClearSelection}
      />
    )

    const manualEntryTab = screen.getByText('Manual Entry')
    fireEvent.click(manualEntryTab)

    await waitFor(() => {
      expect(screen.getByText('Manual Customer Entry')).toBeInTheDocument()
      expect(screen.getByText('Enter customer information manually. This won\'t create a permanent customer record.')).toBeInTheDocument()
    })
  })

  test('updates active tab based on selectedBillingType prop', () => {
    const { rerender } = render(
      <EnhancedCustomerSelection
        customers={mockCustomers}
        customerOrders={mockCustomerOrders}
        selectedBillingType="direct-customer"
        onCustomerSelect={mockOnCustomerSelect}
        onCustomerOrderSelect={mockOnCustomerOrderSelect}
        onManualCustomerChange={mockOnManualCustomerChange}
        onClearSelection={mockOnClearSelection}
      />
    )

    expect(screen.getByText('Select from Customer Database')).toBeInTheDocument()

    rerender(
      <EnhancedCustomerSelection
        customers={mockCustomers}
        customerOrders={mockCustomerOrders}
        selectedBillingType="manual-customer"
        onCustomerSelect={mockOnCustomerSelect}
        onCustomerOrderSelect={mockOnCustomerOrderSelect}
        onManualCustomerChange={mockOnManualCustomerChange}
        onClearSelection={mockOnClearSelection}
      />
    )

    expect(screen.getByText('Manual Customer Entry')).toBeInTheDocument()
  })

  test('shows selection alert when customer is selected', () => {
    render(
      <EnhancedCustomerSelection
        customers={mockCustomers}
        customerOrders={mockCustomerOrders}
        selectedCustomer={mockCustomers[0]}
        onCustomerSelect={mockOnCustomerSelect}
        onCustomerOrderSelect={mockOnCustomerOrderSelect}
        onManualCustomerChange={mockOnManualCustomerChange}
        onClearSelection={mockOnClearSelection}
      />
    )

    expect(screen.getByText('Customer Selected:')).toBeInTheDocument()
    expect(screen.getByText('John Doe')).toBeInTheDocument()
    expect(screen.getByText('From Database')).toBeInTheDocument()
  })

  test('shows selection alert when customer order is selected', () => {
    render(
      <EnhancedCustomerSelection
        customers={mockCustomers}
        customerOrders={mockCustomerOrders}
        selectedCustomerOrder={mockCustomerOrders[0]}
        onCustomerSelect={mockOnCustomerSelect}
        onCustomerOrderSelect={mockOnCustomerOrderSelect}
        onManualCustomerChange={mockOnManualCustomerChange}
        onClearSelection={mockOnClearSelection}
      />
    )

    expect(screen.getByText('Customer Selected:')).toBeInTheDocument()
    expect(screen.getByText('John Doe')).toBeInTheDocument()
    expect(screen.getByText('From Order')).toBeInTheDocument()
  })

  test('shows selection alert when manual customer is entered', () => {
    render(
      <EnhancedCustomerSelection
        customers={mockCustomers}
        customerOrders={mockCustomerOrders}
        manualCustomerName="Jane Smith"
        onCustomerSelect={mockOnCustomerSelect}
        onCustomerOrderSelect={mockOnCustomerOrderSelect}
        onManualCustomerChange={mockOnManualCustomerChange}
        onClearSelection={mockOnClearSelection}
      />
    )

    expect(screen.getByText('Customer Selected:')).toBeInTheDocument()
    expect(screen.getByText('Jane Smith')).toBeInTheDocument()
    expect(screen.getByText('Manual Entry')).toBeInTheDocument()
  })

  test('calls onClearSelection when tab is changed', async () => {
    render(
      <EnhancedCustomerSelection
        customers={mockCustomers}
        customerOrders={mockCustomerOrders}
        selectedCustomer={mockCustomers[0]}
        onCustomerSelect={mockOnCustomerSelect}
        onCustomerOrderSelect={mockOnCustomerOrderSelect}
        onManualCustomerChange={mockOnManualCustomerChange}
        onClearSelection={mockOnClearSelection}
      />
    )

    const manualEntryTab = screen.getByText('Manual Entry')
    fireEvent.click(manualEntryTab)

    expect(mockOnClearSelection).toHaveBeenCalled()
  })

  test('passes props correctly to CustomerOrderSelector', async () => {
    render(
      <EnhancedCustomerSelection
        customers={mockCustomers}
        customerOrders={mockCustomerOrders}
        selectedCustomerOrder={mockCustomerOrders[0]}
        onCustomerSelect={mockOnCustomerSelect}
        onCustomerOrderSelect={mockOnCustomerOrderSelect}
        onManualCustomerChange={mockOnManualCustomerChange}
        onClearSelection={mockOnClearSelection}
      />
    )

    // Should show the selected order in the customer order selector
    expect(screen.getByText('Selected Order')).toBeInTheDocument()
    expect(screen.getByText('CO-2024-0001')).toBeInTheDocument()
  })

  test('passes props correctly to DirectCustomerSelector', async () => {
    render(
      <EnhancedCustomerSelection
        customers={mockCustomers}
        customerOrders={mockCustomerOrders}
        selectedCustomer={mockCustomers[0]}
        selectedBillingType="direct-customer"
        onCustomerSelect={mockOnCustomerSelect}
        onCustomerOrderSelect={mockOnCustomerOrderSelect}
        onManualCustomerChange={mockOnManualCustomerChange}
        onClearSelection={mockOnClearSelection}
      />
    )

    // Should show the selected customer in the direct customer selector
    expect(screen.getByText('Selected Customer')).toBeInTheDocument()
    expect(screen.getByText('CUST-001')).toBeInTheDocument()
  })

  test('passes props correctly to ManualCustomerEntry', async () => {
    render(
      <EnhancedCustomerSelection
        customers={mockCustomers}
        customerOrders={mockCustomerOrders}
        manualCustomerName="Jane Smith"
        selectedBillingType="manual-customer"
        onCustomerSelect={mockOnCustomerSelect}
        onCustomerOrderSelect={mockOnCustomerOrderSelect}
        onManualCustomerChange={mockOnManualCustomerChange}
        onClearSelection={mockOnClearSelection}
      />
    )

    // Should show the manual customer entry with the name
    expect(screen.getByDisplayValue('Jane Smith')).toBeInTheDocument()
  })

  test('disables all components when disabled prop is true', () => {
    render(
      <EnhancedCustomerSelection
        customers={mockCustomers}
        customerOrders={mockCustomerOrders}
        disabled={true}
        onCustomerSelect={mockOnCustomerSelect}
        onCustomerOrderSelect={mockOnCustomerOrderSelect}
        onManualCustomerChange={mockOnManualCustomerChange}
        onClearSelection={mockOnClearSelection}
      />
    )

    const searchInput = screen.getByPlaceholderText('Search by order number, customer name, or amount...')
    expect(searchInput).toBeDisabled()
  })

  test('applies custom className', () => {
    const { container } = render(
      <EnhancedCustomerSelection
        customers={mockCustomers}
        customerOrders={mockCustomerOrders}
        className="custom-class"
        onCustomerSelect={mockOnCustomerSelect}
        onCustomerOrderSelect={mockOnCustomerOrderSelect}
        onManualCustomerChange={mockOnManualCustomerChange}
        onClearSelection={mockOnClearSelection}
      />
    )

    expect(container.firstChild).toHaveClass('custom-class')
  })

  test('handles manual customer details change correctly', async () => {
    render(
      <EnhancedCustomerSelection
        customers={mockCustomers}
        customerOrders={mockCustomerOrders}
        selectedBillingType="manual-customer"
        onCustomerSelect={mockOnCustomerSelect}
        onCustomerOrderSelect={mockOnCustomerOrderSelect}
        onManualCustomerChange={mockOnManualCustomerChange}
        onClearSelection={mockOnClearSelection}
      />
    )

    const nameInput = screen.getByPlaceholderText('Enter customer name...')
    fireEvent.change(nameInput, { target: { value: 'Test Customer' } })

    expect(mockOnManualCustomerChange).toHaveBeenCalledWith('Test Customer', undefined)
  })

  test('shows no selection alert when no customer is selected', () => {
    render(
      <EnhancedCustomerSelection
        customers={mockCustomers}
        customerOrders={mockCustomerOrders}
        onCustomerSelect={mockOnCustomerSelect}
        onCustomerOrderSelect={mockOnCustomerOrderSelect}
        onManualCustomerChange={mockOnManualCustomerChange}
        onClearSelection={mockOnClearSelection}
      />
    )

    expect(screen.queryByText('Customer Selected:')).not.toBeInTheDocument()
  })

  test('renders tab icons correctly', () => {
    render(
      <EnhancedCustomerSelection
        customers={mockCustomers}
        customerOrders={mockCustomerOrders}
        onCustomerSelect={mockOnCustomerSelect}
        onCustomerOrderSelect={mockOnCustomerOrderSelect}
        onManualCustomerChange={mockOnManualCustomerChange}
        onClearSelection={mockOnClearSelection}
      />
    )

    expect(screen.getByTestId('shopping-cart-icon')).toBeInTheDocument()
    expect(screen.getByTestId('users-icon')).toBeInTheDocument()
    expect(screen.getByTestId('edit-icon')).toBeInTheDocument()
  })
})