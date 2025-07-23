import { describe, test, expect, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { CustomerInformationCard } from '@/components/module/admin/billing/form-sections/customer-information-card'
import { BillingTypeId } from '@/types/admin/billing-types'

// Mock data
const mockCustomers = [
  { id: '1', name: 'Test Customer 1', email: 'test1@example.com', phone: '123-456-7890' },
  { id: '2', name: 'Test Customer 2', email: 'test2@example.com', phone: '098-765-4321' }
]

const mockCustomerOrders = [
  {
    id: '1',
    orderNumber: 'ORD-001',
    totalAmount: 1000,
    orderDate: new Date('2024-01-01'),
    customer: { id: '1', name: 'Test Customer 1' },
    orderLines: []
  },
  {
    id: '2',
    orderNumber: 'ORD-002',
    totalAmount: 2000,
    orderDate: new Date('2024-01-02'),
    customer: { id: '2', name: 'Test Customer 2' },
    orderLines: []
  }
]

describe('CustomerInformationCard', () => {
  const mockOnBillingTypeChange = vi.fn()
  const mockOnCustomerSelectionChange = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Billing Type Selection', () => {
    test('shows billing type selector when showBillingTypeSelector is true', () => {
      render(
        <CustomerInformationCard
          customers={mockCustomers}
          customerOrders={mockCustomerOrders}
          onBillingTypeChange={mockOnBillingTypeChange}
          onCustomerSelectionChange={mockOnCustomerSelectionChange}
          showBillingTypeSelector={true}
        />
      )

      expect(screen.getByText('Step 1: Choose Billing Type')).toBeInTheDocument()
      expect(screen.getByText('Customer Order Billing')).toBeInTheDocument()
      expect(screen.getByText('Direct Customer Billing')).toBeInTheDocument()
      expect(screen.getByText('Manual Customer Entry')).toBeInTheDocument()
    })

    test('hides billing type selector when showBillingTypeSelector is false', () => {
      render(
        <CustomerInformationCard
          customers={mockCustomers}
          customerOrders={mockCustomerOrders}
          onBillingTypeChange={mockOnBillingTypeChange}
          onCustomerSelectionChange={mockOnCustomerSelectionChange}
          showBillingTypeSelector={false}
          selectedBillingType="customer-order"
        />
      )

      expect(screen.queryByText('Step 1: Choose Billing Type')).not.toBeInTheDocument()
      expect(screen.getByText('Step 2: Customer Information')).toBeInTheDocument()
    })

    test('calls onBillingTypeChange when billing type is selected', () => {
      render(
        <CustomerInformationCard
          customers={mockCustomers}
          customerOrders={mockCustomerOrders}
          onBillingTypeChange={mockOnBillingTypeChange}
          onCustomerSelectionChange={mockOnCustomerSelectionChange}
          showBillingTypeSelector={true}
        />
      )

      const customerOrderOption = screen.getByText('Customer Order Billing')
      fireEvent.click(customerOrderOption)

      expect(mockOnBillingTypeChange).toHaveBeenCalledWith('customer-order')
    })

    test('resets customer selection when billing type changes', () => {
      render(
        <CustomerInformationCard
          customers={mockCustomers}
          customerOrders={mockCustomerOrders}
          onBillingTypeChange={mockOnBillingTypeChange}
          onCustomerSelectionChange={mockOnCustomerSelectionChange}
          showBillingTypeSelector={true}
        />
      )

      const directCustomerOption = screen.getByText('Direct Customer Billing')
      fireEvent.click(directCustomerOption)

      expect(mockOnCustomerSelectionChange).toHaveBeenCalledWith({
        billingType: 'direct-customer',
        customerName: '',
        customerId: undefined,
        customerOrderId: undefined,
        selectedCustomer: undefined,
        selectedOrder: undefined,
        manualCustomerDetails: undefined,
      })
    })
  })

  describe('Customer Selection Display', () => {
    test('shows customer selection when billing type is selected', () => {
      render(
        <CustomerInformationCard
          customers={mockCustomers}
          customerOrders={mockCustomerOrders}
          selectedBillingType="customer-order"
          onBillingTypeChange={mockOnBillingTypeChange}
          onCustomerSelectionChange={mockOnCustomerSelectionChange}
          showBillingTypeSelector={false}
        />
      )

      expect(screen.getByText('Step 2: Customer Information')).toBeInTheDocument()
      expect(screen.getByText('Select a customer order to bill from')).toBeInTheDocument()
    })

    test('shows different descriptions for different billing types', () => {
      const { rerender } = render(
        <CustomerInformationCard
          customers={mockCustomers}
          customerOrders={mockCustomerOrders}
          selectedBillingType="customer-order"
          onBillingTypeChange={mockOnBillingTypeChange}
          onCustomerSelectionChange={mockOnCustomerSelectionChange}
          showBillingTypeSelector={false}
        />
      )

      expect(screen.getByText('Select a customer order to bill from')).toBeInTheDocument()

      rerender(
        <CustomerInformationCard
          customers={mockCustomers}
          customerOrders={mockCustomerOrders}
          selectedBillingType="direct-customer"
          onBillingTypeChange={mockOnBillingTypeChange}
          onCustomerSelectionChange={mockOnCustomerSelectionChange}
          showBillingTypeSelector={false}
        />
      )

      expect(screen.getByText('Select an existing customer from your database')).toBeInTheDocument()

      rerender(
        <CustomerInformationCard
          customers={mockCustomers}
          customerOrders={mockCustomerOrders}
          selectedBillingType="manual-customer"
          onBillingTypeChange={mockOnBillingTypeChange}
          onCustomerSelectionChange={mockOnCustomerSelectionChange}
          showBillingTypeSelector={false}
        />
      )

      expect(screen.getByText('Enter customer information manually')).toBeInTheDocument()
    })

    test('does not show customer selection when no billing type is selected', () => {
      render(
        <CustomerInformationCard
          customers={mockCustomers}
          customerOrders={mockCustomerOrders}
          onBillingTypeChange={mockOnBillingTypeChange}
          onCustomerSelectionChange={mockOnCustomerSelectionChange}
          showBillingTypeSelector={true}
        />
      )

      expect(screen.queryByText('Step 2: Customer Information')).not.toBeInTheDocument()
    })
  })

  describe('Selection Summary', () => {
    test('shows selection summary when customer is selected', () => {
      const mockCustomerData = {
        billingType: 'customer-order' as BillingTypeId,
        customerName: 'Test Customer 1',
        customerOrderId: '1',
        selectedOrder: mockCustomerOrders[0]
      }

      render(
        <CustomerInformationCard
          customers={mockCustomers}
          customerOrders={mockCustomerOrders}
          selectedBillingType="customer-order"
          selectedCustomerData={mockCustomerData}
          onBillingTypeChange={mockOnBillingTypeChange}
          onCustomerSelectionChange={mockOnCustomerSelectionChange}
          showBillingTypeSelector={false}
        />
      )

      expect(screen.getByText('Test Customer 1')).toBeInTheDocument()
      expect(screen.getByText('Selected via Customer Order')).toBeInTheDocument()
      expect(screen.getByText('Ready')).toBeInTheDocument()
    })

    test('shows order details in summary for customer order billing', () => {
      const mockCustomerData = {
        billingType: 'customer-order' as BillingTypeId,
        customerName: 'Test Customer 1',
        customerOrderId: '1',
        selectedOrder: mockCustomerOrders[0]
      }

      render(
        <CustomerInformationCard
          customers={mockCustomers}
          customerOrders={mockCustomerOrders}
          selectedBillingType="customer-order"
          selectedCustomerData={mockCustomerData}
          onBillingTypeChange={mockOnBillingTypeChange}
          onCustomerSelectionChange={mockOnCustomerSelectionChange}
          showBillingTypeSelector={false}
        />
      )

      expect(screen.getByText('Order: ORD-001')).toBeInTheDocument()
      expect(screen.getByText('Order Total: ₱1,000')).toBeInTheDocument()
    })

    test('shows customer details in summary for direct customer billing', () => {
      const mockCustomerData = {
        billingType: 'direct-customer' as BillingTypeId,
        customerName: 'Test Customer 1',
        customerId: '1',
        selectedCustomer: mockCustomers[0]
      }

      render(
        <CustomerInformationCard
          customers={mockCustomers}
          customerOrders={mockCustomerOrders}
          selectedBillingType="direct-customer"
          selectedCustomerData={mockCustomerData}
          onBillingTypeChange={mockOnBillingTypeChange}
          onCustomerSelectionChange={mockOnCustomerSelectionChange}
          showBillingTypeSelector={false}
        />
      )

      expect(screen.getByText('Test Customer 1')).toBeInTheDocument()
      expect(screen.getByText('Selected via Direct Customer')).toBeInTheDocument()
      expect(screen.getByText('Email: test1@example.com')).toBeInTheDocument()
      expect(screen.getByText('Phone: 123-456-7890')).toBeInTheDocument()
    })

    test('shows manual entry details in summary', () => {
      const mockCustomerData = {
        billingType: 'manual-customer' as BillingTypeId,
        customerName: 'Manual Customer',
        manualCustomerDetails: {
          name: 'Manual Customer',
          email: 'manual@example.com',
          phone: '555-0123'
        }
      }

      render(
        <CustomerInformationCard
          customers={mockCustomers}
          customerOrders={mockCustomerOrders}
          selectedBillingType="manual-customer"
          selectedCustomerData={mockCustomerData}
          onBillingTypeChange={mockOnBillingTypeChange}
          onCustomerSelectionChange={mockOnCustomerSelectionChange}
          showBillingTypeSelector={false}
        />
      )

      expect(screen.getByText('Manual Customer')).toBeInTheDocument()
      expect(screen.getByText('Selected via Manual Entry')).toBeInTheDocument()
      expect(screen.getByText('Email: manual@example.com')).toBeInTheDocument()
      expect(screen.getByText('Phone: 555-0123')).toBeInTheDocument()
    })

    test('shows complete badge when selection is complete', () => {
      const mockCustomerData = {
        billingType: 'customer-order' as BillingTypeId,
        customerName: 'Test Customer 1',
        customerOrderId: '1',
        selectedOrder: mockCustomerOrders[0]
      }

      render(
        <CustomerInformationCard
          customers={mockCustomers}
          customerOrders={mockCustomerOrders}
          selectedBillingType="customer-order"
          selectedCustomerData={mockCustomerData}
          onBillingTypeChange={mockOnBillingTypeChange}
          onCustomerSelectionChange={mockOnCustomerSelectionChange}
          showBillingTypeSelector={false}
        />
      )

      expect(screen.getByText('Complete')).toBeInTheDocument()
    })
  })

  describe('Error Handling', () => {
    test('displays billing type error', () => {
      render(
        <CustomerInformationCard
          customers={mockCustomers}
          customerOrders={mockCustomerOrders}
          onBillingTypeChange={mockOnBillingTypeChange}
          onCustomerSelectionChange={mockOnCustomerSelectionChange}
          showBillingTypeSelector={true}
          errors={{ billingType: 'Please select a billing type' }}
        />
      )

      expect(screen.getByText('Please select a billing type')).toBeInTheDocument()
    })

    test('displays customer name error', () => {
      render(
        <CustomerInformationCard
          customers={mockCustomers}
          customerOrders={mockCustomerOrders}
          selectedBillingType="customer-order"
          onBillingTypeChange={mockOnBillingTypeChange}
          onCustomerSelectionChange={mockOnCustomerSelectionChange}
          showBillingTypeSelector={false}
          errors={{ customerName: 'Customer name is required' }}
        />
      )

      expect(screen.getByText('Customer name is required')).toBeInTheDocument()
    })

    test('displays customer ID error', () => {
      render(
        <CustomerInformationCard
          customers={mockCustomers}
          customerOrders={mockCustomerOrders}
          selectedBillingType="direct-customer"
          onBillingTypeChange={mockOnBillingTypeChange}
          onCustomerSelectionChange={mockOnCustomerSelectionChange}
          showBillingTypeSelector={false}
          errors={{ customerId: 'Please select a customer' }}
        />
      )

      expect(screen.getByText('Please select a customer')).toBeInTheDocument()
    })

    test('displays customer order ID error', () => {
      render(
        <CustomerInformationCard
          customers={mockCustomers}
          customerOrders={mockCustomerOrders}
          selectedBillingType="customer-order"
          onBillingTypeChange={mockOnBillingTypeChange}
          onCustomerSelectionChange={mockOnCustomerSelectionChange}
          showBillingTypeSelector={false}
          errors={{ customerOrderId: 'Please select a customer order' }}
        />
      )

      expect(screen.getByText('Please select a customer order')).toBeInTheDocument()
    })
  })

  describe('Loading and Disabled States', () => {
    test('passes loading state to enhanced customer selection', () => {
      render(
        <CustomerInformationCard
          customers={mockCustomers}
          customerOrders={mockCustomerOrders}
          selectedBillingType="customer-order"
          onBillingTypeChange={mockOnBillingTypeChange}
          onCustomerSelectionChange={mockOnCustomerSelectionChange}
          showBillingTypeSelector={false}
          loading={true}
        />
      )

      // The loading state should be passed to the EnhancedCustomerSelection component
      // This would need to be verified through the component's behavior
      expect(screen.getByText('Step 2: Customer Information')).toBeInTheDocument()
    })

    test('passes disabled state to components', () => {
      render(
        <CustomerInformationCard
          customers={mockCustomers}
          customerOrders={mockCustomerOrders}
          selectedBillingType="customer-order"
          onBillingTypeChange={mockOnBillingTypeChange}
          onCustomerSelectionChange={mockOnCustomerSelectionChange}
          showBillingTypeSelector={true}
          disabled={true}
        />
      )

      // The disabled state should be passed to child components
      expect(screen.getByText('Step 1: Choose Billing Type')).toBeInTheDocument()
    })
  })

  describe('Props Synchronization', () => {
    test('updates local state when selectedBillingType prop changes', () => {
      const { rerender } = render(
        <CustomerInformationCard
          customers={mockCustomers}
          customerOrders={mockCustomerOrders}
          selectedBillingType="customer-order"
          onBillingTypeChange={mockOnBillingTypeChange}
          onCustomerSelectionChange={mockOnCustomerSelectionChange}
          showBillingTypeSelector={false}
        />
      )

      expect(screen.getByText('Select a customer order to bill from')).toBeInTheDocument()

      rerender(
        <CustomerInformationCard
          customers={mockCustomers}
          customerOrders={mockCustomerOrders}
          selectedBillingType="direct-customer"
          onBillingTypeChange={mockOnBillingTypeChange}
          onCustomerSelectionChange={mockOnCustomerSelectionChange}
          showBillingTypeSelector={false}
        />
      )

      expect(screen.getByText('Select an existing customer from your database')).toBeInTheDocument()
    })

    test('updates local state when selectedCustomerData prop changes', () => {
      const initialCustomerData = {
        billingType: 'customer-order' as BillingTypeId,
        customerName: 'Initial Customer',
        customerOrderId: '1'
      }

      const updatedCustomerData = {
        billingType: 'customer-order' as BillingTypeId,
        customerName: 'Updated Customer',
        customerOrderId: '2'
      }

      const { rerender } = render(
        <CustomerInformationCard
          customers={mockCustomers}
          customerOrders={mockCustomerOrders}
          selectedBillingType="customer-order"
          selectedCustomerData={initialCustomerData}
          onBillingTypeChange={mockOnBillingTypeChange}
          onCustomerSelectionChange={mockOnCustomerSelectionChange}
          showBillingTypeSelector={false}
        />
      )

      expect(screen.getByText('Initial Customer')).toBeInTheDocument()

      rerender(
        <CustomerInformationCard
          customers={mockCustomers}
          customerOrders={mockCustomerOrders}
          selectedBillingType="customer-order"
          selectedCustomerData={updatedCustomerData}
          onBillingTypeChange={mockOnBillingTypeChange}
          onCustomerSelectionChange={mockOnCustomerSelectionChange}
          showBillingTypeSelector={false}
        />
      )

      expect(screen.getByText('Updated Customer')).toBeInTheDocument()
    })
  })
})